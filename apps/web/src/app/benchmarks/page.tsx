"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { Badge } from "@/components/ui";

interface CatalogVoice {
  id: string;
  title?: string;
  tone?: string;
  accent?: string;
}

interface MatchResult {
  scores: Record<string, number>;
  archetype?: string;
  reasons?: Record<string, string[]>;
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
      className="font-mono text-2xl font-bold tabular-nums"
      style={{ color: finalMs != null ? accent : "var(--lr-night-muted)" }}
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
  reasons,
  accent,
}: {
  voices: CatalogVoice[];
  scores: Record<string, number> | undefined;
  reasons?: Record<string, string[]>;
  accent: string;
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
    <div style={{ display: "grid", gap: "0.25rem" }}>
      {sorted.map((v) => {
        const fit = scores?.[v.id];
        const isTop = v.id === topId;
        return (
          <div
            key={v.id}
            className="lr-bench-row"
            style={isTop ? { borderColor: accent } : undefined}
          >
            <span className="lr-bench-row-name">
              {v.title || v.id}
              {isTop && reasons?.[v.id]?.length ? (
                <span className="lr-bench-row-reasons" style={{ color: accent }}>
                  {reasons[v.id].join(" · ")}
                </span>
              ) : null}
            </span>
            <div className="lr-bench-bar">
              <div
                className="lr-bench-bar-fill"
                style={{
                  width: `${Math.round((fit ?? 0) * 100)}%`,
                  background: isTop ? accent : "var(--lr-night-line)",
                }}
              />
            </div>
            <span className="lr-bench-score">
              {fit != null ? `${Math.round(fit * 100)}%` : "—"}
            </span>
          </div>
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
        const list = (d?.data?.voices ?? []) as Array<{
          id: string;
          metadata?: { title?: string };
          voiceProfile?: { tone?: string; accent?: string };
        }>;
        setVoices(
          list.map((v) => ({
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
    accent: string,
    rawPeek?: string
  ) => (
    <div className="lr-card" style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--lr-font-display)",
              fontSize: "1.125rem",
              fontWeight: 700,
              margin: 0,
            }}
          >
            {label}
          </h2>
          <p className="lr-bench-meta" style={{ margin: "0.125rem 0 0" }}>
            {sub}
          </p>
        </div>
        <Elapsed
          loading={state.loading}
          finalMs={state.result?.meta?.latencyMs}
          accent={accent}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.375rem",
          minHeight: "1.375rem",
          marginBottom: "0.75rem",
          fontSize: "0.625rem",
        }}
      >
        {state.loading && (
          <span style={{ color: "var(--lr-night-muted)" }}>evaluating…</span>
        )}
        {state.error && (
          <span className="lr-error-text" role="status">
            error: {state.error}
          </span>
        )}
        {state.result?.briefInsights?.emotion && (
          <Badge>{state.result.briefInsights.emotion.choice}</Badge>
        )}
        {state.result?.briefInsights?.useCase && (
          <Badge>{state.result.briefInsights.useCase.choice}</Badge>
        )}
        {state.result?.archetype && (
          <Badge>rubric: {state.result.archetype}</Badge>
        )}
        {state.result?.meta && state.result.meta.usage != null && (
          <span className="lr-bench-meta" style={{ marginLeft: "auto" }}>
            {(state.result.meta.usage.input_tokens ?? 0) +
              (state.result.meta.usage.output_tokens ?? 0)}{" "}
            tokens · {state.result.meta.questionCount} questions
          </span>
        )}
      </div>

      <VoiceRows
        voices={voices}
        scores={state.result?.scores}
        reasons={state.result?.reasons}
        accent={accent}
      />

      {rawPeek && (
        <div
          className="lr-code"
          style={{ marginTop: "0.75rem", maxHeight: "7rem", overflow: "hidden" }}
        >
          <div className="lr-code-head">
            <span>raw model output — you parse this</span>
          </div>
          <pre style={{ fontSize: "0.625rem", maxHeight: "5rem" }}>
            {rawPeek.slice(0, 600)}
          </pre>
        </div>
      )}
    </div>
  );

  return (
    <main id="listening-main">
      <div
        className="lr-wrap"
        style={{ paddingTop: "var(--lr-space-lg)", maxWidth: "1400px" }}
      >
        <nav className="lr-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">Benchmark</span>
        </nav>

        <header style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", flexWrap: "wrap", marginTop: "var(--lr-space-lg)" }}>
          <h1
            className="lr-h1"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", margin: 0 }}
          >
            Matching engine benchmark
          </h1>
          <Badge style={{ borderColor: "var(--lr-bench-jev)", color: "var(--lr-bench-jev-soft)" }}>
            Live · reproducible
          </Badge>
        </header>
        <p className="lr-quiet" style={{ marginBottom: "var(--lr-space-md)" }}>
          Jev vs GPT-4o-mini — same brief, same {voices.length || "…"}-voice
          live marketplace catalog, same gateway. Measured, not marketing.
        </p>

        <input
          type="text"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder='e.g. "calm meditation narrator for a sleep app"'
          aria-label="Brief to rank the catalog against"
          className="lr-bench-brief"
          style={{ marginBottom: "var(--lr-space-md)" }}
        />

        {bothDone && (
          <div
            className="lr-bench-win"
            role="status"
            style={{
              marginBottom: "var(--lr-space-md)",
              background: "color-mix(in oklab, var(--lr-bench-jev) 12%, transparent)",
              border: "1px solid color-mix(in oklab, var(--lr-bench-jev) 45%, transparent)",
            }}
          >
            <Zap
              className="w-4 h-4"
              aria-hidden
              style={{ color: "var(--lr-bench-jev-soft)" }}
            />
            <span style={{ fontWeight: 700 }}>
              Jev finished {(gptMs / Math.max(jevMs, 1)).toFixed(1)}× faster
            </span>
            <span className="lr-quiet" style={{ margin: 0 }}>
              {jevMs}ms vs {gptMs}ms
              {jevTokens > 0 &&
                gptTokens > 0 &&
                ` · ${jevTokens.toLocaleString()} vs ${gptTokens.toLocaleString()} tokens`}
            </span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--lr-space-md)",
            alignItems: "stretch",
          }}
          className="lg:flex-row lg:items-start"
        >
          {panel(
            jev,
            "Jev",
            "typesafe-ai/jev · typed probabilities + rubric reasons · Vercel AI Gateway",
            "var(--lr-bench-jev-soft)"
          )}
          {panel(
            gpt,
            "GPT-4o-mini",
            "openai · chat completions · JSON mode",
            "var(--lr-bench-gpt)",
            gpt.result?.rawOutput
          )}
        </div>

        <p
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.375rem",
            flexWrap: "wrap",
            marginTop: "var(--lr-space-lg)",
            color: "var(--lr-night-muted)",
            fontSize: "0.75rem",
          }}
        >
          <Zap className="w-3 h-3" aria-hidden style={{ color: "var(--lr-bench-jev)" }} />
          This is the same engine ranking voices in production —{" "}
          <Link
            href="/marketplace"
            style={{
              color: "var(--lr-bench-jev-soft)",
              textDecoration: "none",
            }}
          >
            try it on the marketplace
          </Link>
        </p>
      </div>
    </main>
  );
}
