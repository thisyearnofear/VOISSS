"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { generateVoiceFingerprint } from "@/utils/voice-fingerprint";

interface DemoVoice {
  id: string;
  title: string;
  tone: string;
  pitch: string;
  language: string;
  accent: string;
  tags: string[];
  licenseType: string;
}

// Demo catalog — distinct profiles so re-ranking is legible on video.
const DEMO_VOICES: DemoVoice[] = [
  { id: "v_mara", title: "Mara — Calm Narrator", tone: "calm", pitch: "low", language: "en-US", accent: "Neutral", tags: ["meditation", "audiobook", "soothing"], licenseType: "non-exclusive" },
  { id: "v_dex", title: "Dex — Hype Announcer", tone: "energetic", pitch: "high", language: "en-US", accent: "American", tags: ["ads", "promo", "sports"], licenseType: "non-exclusive" },
  { id: "v_imogen", title: "Imogen — News Anchor", tone: "authoritative", pitch: "medium", language: "en-GB", accent: "British", tags: ["news", "documentary", "formal"], licenseType: "exclusive" },
  { id: "v_theo", title: "Theo — Friendly Guide", tone: "friendly", pitch: "medium", language: "en-US", accent: "Neutral", tags: ["onboarding", "assistant", "casual"], licenseType: "non-exclusive" },
  { id: "v_sable", title: "Sable — Trailer Voice", tone: "dramatic", pitch: "low", language: "en-US", accent: "American", tags: ["trailers", "cinematic", "gaming"], licenseType: "exclusive" },
  { id: "v_priya", title: "Priya — Podcast Host", tone: "warm", pitch: "medium", language: "en-US", accent: "Neutral", tags: ["podcast", "interviews", "conversational"], licenseType: "non-exclusive" },
  { id: "v_lucia", title: "Lucía — Español Latina", tone: "warm", pitch: "medium", language: "es-ES", accent: "Latin American", tags: ["dubbing", "ads", "social"], licenseType: "non-exclusive" },
  { id: "v_henrik", title: "Henrik — IVR Pro", tone: "professional", pitch: "medium", language: "de-DE", accent: "German", tags: ["ivr", "enterprise", "support"], licenseType: "non-exclusive" },
  { id: "v_aria", title: "Aria — Game Character", tone: "energetic", pitch: "high", language: "en-US", accent: "Neutral", tags: ["gaming", "character", "anime"], licenseType: "non-exclusive" },
  { id: "v_omar", title: "Omar — Documentary", tone: "authoritative", pitch: "low", language: "en-US", accent: "Neutral", tags: ["documentary", "education", "serious"], licenseType: "exclusive" },
  { id: "v_nina", title: "Nina — Wellness Coach", tone: "calm", pitch: "medium", language: "en-US", accent: "Neutral", tags: ["wellness", "sleep", "asmr"], licenseType: "non-exclusive" },
  { id: "v_jack", title: "Jack — Social Creator", tone: "friendly", pitch: "medium", language: "en-US", accent: "American", tags: ["tiktok", "social", "casual"], licenseType: "non-exclusive" },
];

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
}

export default function JevDemoPage() {
  const [brief, setBrief] = useState("");
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (brief.trim().length < 3 || unavailable) {
      setMatch(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/marketplace/voice-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief: brief.trim(), voices: DEMO_VOICES }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.success) setMatch(data.data);
        else if (res.status === 503) setUnavailable(true);
      } catch (e) {
        if (!controller.signal.aborted) console.error(e);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [brief, unavailable]);

  const sorted = useMemo(() => {
    if (!match?.scores || Object.keys(match.scores).length === 0) {
      return DEMO_VOICES;
    }
    return [...DEMO_VOICES].sort(
      (a, b) => (match.scores[b.id] ?? 0) - (match.scores[a.id] ?? 0)
    );
  }, [match]);

  const topId = useMemo(() => {
    if (!match?.scores) return null;
    let best: string | null = null;
    let bestScore = 0.5;
    for (const v of DEMO_VOICES) {
      const s = match.scores[v.id] ?? 0;
      if (s > bestScore) {
        bestScore = s;
        best = v.id;
      }
    }
    return best;
  }, [match]);

  const totalTokens =
    (match?.meta?.usage?.input_tokens ?? 0) +
    (match?.meta?.usage?.output_tokens ?? 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white voisss-bg-grid voisss-bg-noise">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold">VOISSS × Jev</h1>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm bg-[#7C5DFA]/20 text-[#9C88FF] border border-[#7C5DFA]/30">
            Intent matching
          </span>
        </div>
        <p className="text-sm text-zinc-500 mb-6">
          Describe the voice you need — one Jev call scores every voice in the
          catalog.
        </p>

        <input
          type="text"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder='e.g. "urgent 15s ad read for a sneaker drop" or "calm meditation narrator"'
          autoFocus
          className="w-full bg-[#111111] border border-[#2A2A2A] text-white rounded-xl px-5 py-4 text-lg focus:outline-none focus:border-[#7C5DFA] focus:ring-2 focus:ring-[#7C5DFA]/30 transition-all placeholder:text-zinc-600"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs min-h-[28px]">
          {loading && (
            <span className="text-zinc-400 animate-pulse">evaluating…</span>
          )}
          {match?.briefInsights?.emotion && (
            <span className="px-2.5 py-1 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/25">
              emotion: {match.briefInsights.emotion.choice}
            </span>
          )}
          {match?.briefInsights?.useCase && (
            <span className="px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/25">
              use case: {match.briefInsights.useCase.choice}
            </span>
          )}
          {match?.briefInsights?.urgency?.legend && (
            <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25">
              urgency:{" "}
              {match.briefInsights.urgency.legend[
                String(match.briefInsights.urgency.score)
              ] ?? match.briefInsights.urgency.score}
            </span>
          )}
          {match?.meta?.latencyMs != null && (
            <span className="ml-auto font-mono text-[#9C88FF] text-sm font-bold">
              {match.meta.questionCount} questions · 1 call ·{" "}
              {match.meta.latencyMs}ms
              {totalTokens > 0 && ` · ${totalTokens.toLocaleString()} tokens`}
              {match.meta.provider === "vercel-ai-gateway" &&
                " · via Vercel AI Gateway"}
            </span>
          )}
          {unavailable && (
            <span className="text-zinc-500">
              Set <code>AI_GATEWAY_API_KEY</code> or{" "}
              <code>TYPESAFE_API_KEY</code> to enable live matching.
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {sorted.map((voice) => {
            const fit = match?.scores?.[voice.id];
            const isTop = voice.id === topId;
            return (
              <motion.div
                key={voice.id}
                layout
                transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
                className={`relative rounded-xl border p-4 transition-colors ${
                  isTop
                    ? "border-[#7C5DFA] bg-[#7C5DFA]/10 shadow-lg shadow-[#7C5DFA]/20"
                    : "border-[#2A2A2A] bg-[#111111]"
                }`}
              >
                <div
                  className="mb-3 rounded-lg overflow-hidden flex items-center justify-center bg-black/40 border border-white/5 py-4"
                  dangerouslySetInnerHTML={{
                    __html: generateVoiceFingerprint(voice.id),
                  }}
                />
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm leading-tight">
                    {voice.title}
                  </h3>
                  {isTop && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#7C5DFA] text-white flex-shrink-0">
                      Best
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-500 mb-2">
                  {voice.tone} · {voice.pitch} · {voice.accent}
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {voice.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="text-[9px] uppercase tracking-tight bg-zinc-900 text-zinc-500 px-1.5 py-0.5 rounded border border-white/5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        isTop ? "bg-[#7C5DFA]" : "bg-zinc-600"
                      }`}
                      initial={false}
                      animate={{
                        width: `${Math.round((fit ?? 0) * 100)}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span
                    className={`text-xs font-mono font-bold w-9 text-right ${
                      fit != null ? "text-white" : "text-zinc-700"
                    }`}
                  >
                    {fit != null ? `${Math.round(fit * 100)}%` : "—"}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-zinc-600 flex items-center justify-center gap-1.5">
          <Zap className="w-3 h-3 text-[#7C5DFA]" />
          Powered by Jev (TypeSafe AI) — System One decisions for the VOISSS
          voice marketplace
        </p>
      </div>
    </div>
  );
}
