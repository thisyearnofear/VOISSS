"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface CatalogVoice {
  id: string;
  title?: string;
  tone?: string;
  accent?: string;
}

interface MatchResult {
  scores: Record<string, number>;
  briefInsights: {
    emotion: { choice: string; confidence: number | null } | null;
    useCase: { choice: string; confidence: number | null } | null;
    urgency: {
      score: number;
      legend?: Record<string, string>;
      confidence: number | null;
    } | null;
  } | null;
  meta: {
    latencyMs?: number;
    questionCount?: number;
    model?: string;
    provider?: string;
    usage?: { input_tokens?: number; output_tokens?: number } | null;
  };
  rawOutput?: string;
}

interface SideState {
  result: MatchResult | null;
  loading: boolean;
  error: string | null;
}

const IDLE: SideState = { result: null, loading: false, error: null };

/** Live elapsed timer — ticks while loading, freezes on server latency. */
function Elapsed({
  loading,
  finalMs,
  accent,
}: {
  loading: boolean;
  finalMs?: number;
  accent: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const t0 = performance.now();
    const iv = setInterval(() => setElapsed(performance.now() - t0), 50);
    return () => clearInterval(iv);
  }, [loading]);

  const shown = finalMs != null ? finalMs : elapsed;
  return (
    <span
      className={`font-mono text-2xl font-bold tabular-nums ${
        finalMs != null ? accent : "text-zinc-500"
      }`}
    >
      {finalMs != null
        ? `${(finalMs / 1000).toFixed(2)}s`
        : `${(shown / 1000).toFixed(1)}s`}
    </span>
  );
}

function VoiceRows({
  voices,
  scores,
  accentBar,
  topClasses,
}: {
  voices: CatalogVoice[];
  scores: Record<string, number> | undefined;
  accentBar: string;
  topClasses: string;
}) {
  const sorted = useMemo(() => {
    if (!scores || Object.keys(scores).length === 0) return voices;
    return [...voices].sort(
      (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)
    );
  }, [voices, scores]);

  const topId = useMemo(() => {
    if (!scores) return null;
    let best: string | null = null;
    let bestScore = 0.5;
    for (const v of voices) {
      const s = scores[v.id] ?? 0;
      if (s > bestScore) {
        bestScore = s;
        best = v.id;
      }
    }
    return best;
  }, [voices, scores]);

  return (
    <div className="flex flex-col gap-1">
      {sorted.map((v) => {
        const fit = scores?.[v.id];
        const isTop = v.id === topId;
        return (
          <motion.div
            key={v.id}
            layout
            transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
            className={`flex items-center gap-2 rounded-md px-2 py-1 border text-[11px] ${
              isTop ? topClasses : "border-white/5 bg-white/[0.02]"
            }`}
          >
            <span
              className={`w-40 truncate font-medium ${
                isTop ? "text-white" : "text-zinc-300"
              }`}
            >
              {v.title || v.id}
            </span>
            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  isTop ? accentBar : "bg-zinc-600"
                }`}
                initial={false}
                animate={{ width: `${Math.round((fit ?? 0) * 100)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span
              className={`w-9 text-right font-mono font-bold ${
                fit != null ? "text-white" : "text-zinc-700"
              }`}
            >
              {fit != null ? `${Math.round(fit * 100)}%` : "—"}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function JevComparePage() {
  const [voices, setVoices] = useState<CatalogVoice[]>([]);
  const [brief, setBrief] = useState("");
  const [jev, setJev] = useState<SideState>(IDLE);
  const [gpt, setGpt] = useState<SideState>(IDLE);
  const runId = useRef(0);

  // Display labels come from the live marketplace catalog; both evaluators
  // resolve the same catalog server-side so the comparison is apples-to-apples.
  useEffect(() => {
    fetch("/api/marketplace/voices")
      .then((r) => r.json())
      .then((d) => {
        const list = d?.data?.voices ?? [];
        setVoices(
          list.map((v: any) => ({
            id: v.id,
            title: v.metadata?.title,
            tone: v.voiceProfile?.tone,
            accent: v.voiceProfile?.accent,
          }))
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const text = brief.trim();
    if (text.length < 3 || voices.length === 0) {
      setJev(IDLE);
      setGpt(IDLE);
      return;
    }
    const id = ++runId.current;
    const timer = setTimeout(() => {
      setJev({ result: null, loading: true, error: null });
      setGpt({ result: null, loading: true, error: null });
      const body = JSON.stringify({ brief: text });

      const run = (
        url: string,
        set: React.Dispatch<React.SetStateAction<SideState>>
      ) =>
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        })
          .then((r) => r.json())
          .then((d) => {
            if (runId.current !== id) return;
            set(
              d.success
                ? { result: d.data, loading: false, error: null }
                : { result: null, loading: false, error: d.error }
            );
          })
          .catch(() => {
            if (runId.current === id)
              set({ result: null, loading: false, error: "request failed" });
          });

      run("/api/marketplace/voice-match", setJev);
      run("/api/marketplace/voice-match-gpt", setGpt);
    }, 500);
    return () => clearTimeout(timer);
  }, [brief, voices]);

  const jevTokens =
    (jev.result?.meta?.usage?.input_tokens ?? 0) +
    (jev.result?.meta?.usage?.output_tokens ?? 0);
  const gptTokens =
    (gpt.result?.meta?.usage?.input_tokens ?? 0) +
    (gpt.result?.meta?.usage?.output_tokens ?? 0);
  const jevMs = jev.result?.meta?.latencyMs;
  const gptMs = gpt.result?.meta?.latencyMs;
  const bothDone = jevMs != null && gptMs != null && gptMs > 0;

  const panel = (
    state: SideState,
    label: string,
    sub: string,
    accentText: string,
    accentBar: string,
    topClasses: string,
    rawPeek?: string
  ) => (
    <div className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#0d0d0d] p-4 min-w-0">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-base font-bold">{label}</h2>
          <p className="text-[11px] text-zinc-500">{sub}</p>
        </div>
        <Elapsed
          loading={state.loading}
          finalMs={state.result?.meta?.latencyMs}
          accent={accentText}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[10px] min-h-[22px] mb-3">
        {state.loading && (
          <span className="text-zinc-400 animate-pulse">evaluating…</span>
        )}
        {state.error && (
          <span className="text-red-400">error: {state.error}</span>
        )}
        {state.result?.briefInsights?.emotion && (
          <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25">
            {state.result.briefInsights.emotion.choice}
          </span>
        )}
        {state.result?.briefInsights?.useCase && (
          <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25">
            {state.result.briefInsights.useCase.choice}
          </span>
        )}
        {state.result?.meta && state.result.meta.usage != null && (
          <span className="ml-auto font-mono text-zinc-500">
            {(state.result.meta.usage.input_tokens ?? 0) +
              (state.result.meta.usage.output_tokens ?? 0)}{" "}
            tokens · {state.result.meta.questionCount} questions
          </span>
        )}
      </div>

      <VoiceRows
        voices={voices}
        scores={state.result?.scores}
        accentBar={accentBar}
        topClasses={topClasses}
      />

      {rawPeek && (
        <div className="mt-3 rounded-md bg-black/50 border border-white/5 p-2">
          <p className="text-[9px] uppercase tracking-widest text-zinc-600 mb-1">
            raw model output — you parse this
          </p>
          <pre className="text-[9px] leading-relaxed text-zinc-500 font-mono whitespace-pre-wrap break-all max-h-24 overflow-hidden">
            {rawPeek.slice(0, 600)}
          </pre>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-bold">Jev vs GPT-4o-mini</h1>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm bg-[#7C5DFA]/20 text-[#9C88FF] border border-[#7C5DFA]/30">
            Same brief · same catalog
          </span>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
          Scoring {voices.length || "…"} live voices from the VOISSS
          marketplace
        </p>

        <input
          type="text"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder='e.g. "calm meditation narrator for a sleep app"'
          autoFocus
          className="w-full bg-[#111111] border border-[#2A2A2A] text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[#7C5DFA] focus:ring-2 focus:ring-[#7C5DFA]/30 transition-all placeholder:text-zinc-600 mb-4"
        />

        {bothDone && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg border border-[#7C5DFA]/40 bg-[#7C5DFA]/10 px-4 py-2.5 flex items-center gap-3"
          >
            <Zap className="w-4 h-4 text-[#9C88FF]" />
            <span className="text-sm font-bold text-white">
              Jev finished {(gptMs / Math.max(jevMs, 1)).toFixed(1)}× faster
            </span>
            <span className="text-xs text-zinc-400">
              {jevMs}ms vs {gptMs}ms
              {jevTokens > 0 &&
                gptTokens > 0 &&
                ` · ${jevTokens.toLocaleString()} vs ${gptTokens.toLocaleString()} tokens`}
            </span>
          </motion.div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {panel(
            jev,
            "Jev",
            "typesafe-ai/jev · 1 evaluate call · Vercel AI Gateway",
            "text-[#9C88FF]",
            "bg-[#7C5DFA]",
            "border-[#7C5DFA] bg-[#7C5DFA]/10"
          )}
          {panel(
            gpt,
            "GPT-4o-mini",
            "openai · chat completions · JSON mode",
            "text-emerald-400",
            "bg-emerald-500",
            "border-emerald-500 bg-emerald-500/10",
            gpt.result?.rawOutput
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600 flex items-center justify-center gap-1.5">
          <Zap className="w-3 h-3 text-[#7C5DFA]" />
          Live on the VOISSS marketplace — try it yourself at{" "}
          <a href="/marketplace" className="text-[#9C88FF] hover:underline">
            /marketplace
          </a>
        </p>
      </div>
    </div>
  );
}
