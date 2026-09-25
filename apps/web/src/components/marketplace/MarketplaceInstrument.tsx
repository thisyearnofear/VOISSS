"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { initWebMCP } from "@/lib/webmcp";
import type { MarketplaceVoice } from "@/lib/marketplace-indexer";
import { BuyerCreditsStrip } from "@/components/payment/DashboardBalanceChips";
import { VoiceMarketTrends } from "@/components/marketplace/VoiceMarketTrends";
import { VoiceAuditionRow, voiceDisplayName } from "@/components/listening/VoiceAuditionRow";
import { LicensePurchaseModal } from "@/components/payment/LicensePurchaseModal";
import VoiceTerrain from "@/components/VoiceTerrain";
import { UnwovenGrid } from "@/components/marketplace/UnwovenGrid";
import { Badge, Chip, Notice } from "@/components/ui";
import { useListeningRoom } from "@/contexts/ListeningRoomContext";
import { useVoiceCatalog } from "@/hooks/useVoiceCatalog";
import { useAuth } from "@/contexts/AuthContext";
import { getSettleSplit, pulseVoice, setSettleSplit } from "@/lib/terrain-bus";
import { DismissibleRuntimeTracks } from "@/components/payment/RuntimePaymentChips";
import ThinkingState from "@/components/ui/agentic/ThinkingState";
import rubric from "@/lib/matching/rubric.v1.json";

type VoiceMatchResult = {
  scores: Record<string, number>;
  holisticScores?: Record<string, number>;
  archetype?: string;
  dimensionLevels?: Record<string, Record<string, number>>;
  reasons?: Record<string, string[]>;
  briefInsights: {
    emotion: { choice: string; confidence: number | null } | null;
    useCase: { choice: string; confidence: number | null } | null;
    urgency: { score: number; legend?: Record<string, string>; confidence: number | null } | null;
  } | null;
  meta: {
    rubric?: string;
    latencyMs?: number;
    questionCount?: number;
    model?: string;
    provider?: string;
    usage?: { input_tokens?: number; output_tokens?: number } | null;
  };
};

const LANGUAGE_OPTIONS = [
  { value: "", label: "All Languages" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Spanish" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
];
const TONE_OPTIONS = [
  { value: "", label: "All Tones" },
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "energetic", label: "Energetic" },
  { value: "calm", label: "Calm" },
  { value: "warm", label: "Warm" },
  { value: "authoritative", label: "Authoritative" },
];
const LICENSE_OPTIONS = [
  { value: "", label: "All License Types" },
  { value: "non-exclusive", label: "Non-exclusive" },
  { value: "exclusive", label: "Exclusive" },
];

const DIM_ORDER: [keyof typeof rubric.dimensions, string][] = [
  ["arousal", "energy"],
  ["pace", "pace"],
  ["expressiveness", "express"],
  ["warmth", "warmth"],
  ["authority", "authority"],
  ["intimacy", "intimacy"],
];

function PillSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 pr-7 font-mono text-[11px] font-medium text-white/70 focus:border-[#D6FF2A]/40 focus:outline-none focus:ring-1 focus:ring-[#D6FF2A]/20"
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#0A0E1A] text-white">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Warp HUD — the 6 dims drawn as thread vs target, like MatchConsole but loom-compact. */
function WarpHUD({ levels, archetypeKey }: { levels: Record<string, number>; archetypeKey: string }) {
  const def = (rubric.archetypes as Record<string, { label: string; outcome: string; targets: Record<string, number>; weights: Record<string, number> }>)[archetypeKey];
  if (!def) return null;
  return (
    <div className="grid gap-[7px] sm:grid-cols-2" role="img" aria-label={`Six warp threads vs ${archetypeKey} target`}>
      {DIM_ORDER.map(([dim, short]) => {
        const v = levels[dim as string];
        if (v == null) return null;
        const target = def.targets[dim as string] ?? 0.5;
        const weight = def.weights[dim as string] ?? 0;
        const pct = Math.round(v * 100);
        return (
          <div key={dim} className="flex items-center gap-2">
            <span className="w-[56px] shrink-0 truncate font-mono text-[10px] uppercase tracking-[0.1em] text-white/45">{short}</span>
            <div className="relative h-[5px] flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-[#D6FF2A] to-[#EAFF6A]"
                style={{ transform: `scaleX(${v})`, opacity: 0.32 + weight * 1.9 }}
              />
              <span className="absolute inset-y-[-3px] w-px bg-white/55" style={{ left: `${target * 100}%` }} aria-hidden />
            </div>
            <span className="w-7 shrink-0 text-right font-mono text-[10px] tabular-nums text-white/60">{pct}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function MarketplaceInstrument() {
  const { isAuthenticated } = useAuth();
  const { draft, ready, updateDraft, toggleShortlist } = useListeningRoom();
  const { query, voices } = useVoiceCatalog();
  const [filters, setFilters] = useState({ language: "", tone: "", licenseType: "" });
  const [modalVoice, setModalVoice] = useState<MarketplaceVoice | null>(null);
  const [match, setMatch] = useState<VoiceMatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchUnavailable, setMatchUnavailable] = useState(false);
  const brief = draft.brief;
  const loading = query.isLoading;
  const [showTrends, setShowTrends] = useState(false);
  const [thinkingKey, setThinkingKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  // Settlement is a draggable object — the bar *is* the contract constant made visible
  const [split, setSplit] = useState(() => getSettleSplit());
  const splitRef = useRef<HTMLDivElement | null>(null);
  const draggingSplit = useRef(false);
  const ghostHint = useRef<number | null>(null);
  const [ghostSeen, setGhostSeen] = useState(() => {
    if (typeof window === "undefined") return true;
    try { return localStorage.getItem("voisss_ghost_seen") === "1"; } catch { return true; }
  });
  useEffect(() => {
    if (brief.trim().length >= 3) return;
    if (ghostSeen) return;
    ghostHint.current = window.setTimeout(() => {
      const el = document.getElementById("voisss-ghost-hint");
      if (el) { el.style.opacity = "1"; window.setTimeout(() => { el.style.opacity = "0"; }, 4200); }
      try { localStorage.setItem("voisss_ghost_seen", "1"); } catch {}
      setGhostSeen(true);
    }, 900);
    return () => { if (ghostHint.current) window.clearTimeout(ghostHint.current); };
  }, [brief, ghostSeen]);
  const commitSplit = (clientX: number) => {
    const el = splitRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const clamped = t <= 0.15 ? 0.15 : t >= 0.85 ? 0.85 : t;
    setSplit(clamped);
    setSettleSplit(clamped);
    if (Math.abs(clamped - split) > 0.04) pulseVoice("settle");
  };
  const error = query.isError ? "Voices could not be loaded. Please try again." : null;
  const activeFilterCount = [filters.language, filters.tone, filters.licenseType].filter(Boolean).length;

  useEffect(() => {
    initWebMCP().catch(console.error);
  }, []);

  const hydratedFromParams = useRef(false);
  useEffect(() => {
    if (!ready || hydratedFromParams.current) return;
    try {
      const paramBrief = new URLSearchParams(window.location.search).get("brief");
      if (paramBrief !== null) {
        hydratedFromParams.current = true;
        updateDraft({ brief: paramBrief.slice(0, 500) });
        return;
      }
    } catch {}
    hydratedFromParams.current = true;
  }, [ready, updateDraft]);

  useEffect(() => {
    if (!hydratedFromParams.current) return;
    const q = brief.trim();
    const url = q ? `/marketplace?brief=${encodeURIComponent(q)}` : "/marketplace";
    window.history.replaceState(null, "", url);
  }, [brief]);

  useEffect(() => {
    setMatch(null);
    if (brief.trim().length < 3 || matchUnavailable) {
      setMatchLoading(false);
      return;
    }
    setThinkingKey((k) => k + 1);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setMatchLoading(true);
      try {
        const res = await fetch("/api/marketplace/voice-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief: brief.trim() }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (controller.signal.aborted) return;
        if (data.success) setMatch(data.data);
        else setMatchUnavailable(true);
      } catch (e) {
        if (!controller.signal.aborted) {
          console.error("Voice match failed:", e);
          setMatchUnavailable(true);
        }
      } finally {
        if (!controller.signal.aborted) setMatchLoading(false);
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [brief, matchUnavailable]);

  const trackMatchEvent = (event: string, voiceId: string) => {
    fetch("/api/marketplace/match-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, voiceId, archetype: match?.archetype, brief: brief.trim() }),
      keepalive: true,
    }).catch(() => {});
    // outcome-learning toast — visible proof that preview → reweights rubric over time
    if (event === "voice_preview") {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      setToast(`previewed → tuning loom · ${match?.archetype ?? rubric.fallback_archetype} · rubric v${rubric.version}`);
      toastTimer.current = window.setTimeout(() => setToast(null), 2800);
    }
  };

  const totalVoices = voices.length;
  const totalLicenses = voices.reduce((sum, v) => sum + (v.stats?.purchases || 0), 0);
  const totalUsage = voices.reduce((sum, v) => sum + (v.stats?.usageCount || 0), 0);

  const filteredVoices = voices.filter((voice) => {
    if (filters.language && voice.voiceProfile?.language !== filters.language) return false;
    if (filters.tone && voice.voiceProfile?.tone?.toLowerCase() !== filters.tone.toLowerCase()) return false;
    if (filters.licenseType && voice.licenseType !== filters.licenseType) return false;
    return true;
  });

  const displayedVoices = useMemo(() => {
    if (!match?.scores || Object.keys(match.scores).length === 0) return filteredVoices;
    return [...filteredVoices].sort((a, b) => (match.scores[b.id] ?? 0) - (match.scores[a.id] ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voices, filters, match]);

  const topMatchId = useMemo(() => {
    if (!match?.scores) return null;
    let best: string | null = null;
    let bestScore = 0.5;
    for (const voice of displayedVoices) {
      const s = match.scores[voice.id] ?? 0;
      if (s > bestScore) {
        bestScore = s;
        best = voice.id;
      }
    }
    return best;
  }, [displayedVoices, match]);

  const [ceremonyId, setCeremonyId] = useState<string | null>(null);
  const lastCeremony = useRef<string | null>(null);
  useEffect(() => {
    if (!topMatchId) {
      lastCeremony.current = null;
      setCeremonyId(null);
      return;
    }
    if (lastCeremony.current === topMatchId) return;
    lastCeremony.current = topMatchId;
    pulseVoice("lift");
    setCeremonyId(topMatchId);
    const t = window.setTimeout(() => setCeremonyId(null), 4200);
    return () => window.clearTimeout(t);
  }, [topMatchId]);

  const topVoice = useMemo(() => (topMatchId ? voices.find((v) => v.id === topMatchId) ?? null : null), [topMatchId, voices]);
  const topReasons = topMatchId ? match?.reasons?.[topMatchId] ?? [] : [];
  const topLevels = topMatchId ? match?.dimensionLevels?.[topMatchId] : undefined;
  const topRubric = topMatchId ? match?.scores?.[topMatchId] : undefined;
  const topHolistic = topMatchId ? match?.holisticScores?.[topMatchId] : undefined;
  const archetypeDef = match?.archetype
    ? (rubric.archetypes as Record<string, { label: string; outcome: string; targets: Record<string, number>; weights: Record<string, number> }>)[match.archetype]
    : null;
  const tokens = (match?.meta?.usage?.input_tokens ?? 0) + (match?.meta?.usage?.output_tokens ?? 0);

  const shortlistedVoices = useMemo(
    () => draft.shortlist.map((id) => voices.find((v) => v.id === id)).filter((v): v is MarketplaceVoice => Boolean(v)),
    [draft.shortlist, voices]
  );
  const unavailableShortlist = draft.shortlist.length - shortlistedVoices.length;
  const shortlistFull = draft.shortlist.length >= 3;

  const shortlistButton = (voice: MarketplaceVoice) => {
    const shortlisted = draft.shortlist.includes(voice.id);
    const name = voiceDisplayName(voice);
    return (
      <button
        type="button"
        className="lr-shortlist"
        aria-pressed={shortlisted}
        aria-label={shortlisted ? `Remove ${name} from comparison` : `Add ${name} to comparison`}
        disabled={!shortlisted && shortlistFull}
        onClick={() => toggleShortlist(voice.id)}
      >
        {shortlisted ? <Check className="w-4 h-4" aria-hidden /> : <Plus className="w-4 h-4" aria-hidden />}
      </button>
    );
  };

  return (
    <main id="listening-main" className="bg-[#0A0E1A] text-white overflow-x-clip">
      {/* ── Loom — the only header. Single frame, single scanline. ──────── */}
      <section className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0A0E1A]/96 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D6FF2A]/30 to-transparent" aria-hidden />
        <div className="lr-wrap relative flex flex-col gap-3 py-3 sm:py-4">
          {/* meta row — not a frame, just type */}
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6FF2A]/20 bg-[#D6FF2A]/10 px-2 py-1 text-[10px] font-bold tracking-[0.14em] text-[#0A0E1A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0A0E1A] animate-pulse" /> LOOM · LIVE
              </span>
              <span className="hidden sm:inline text-white/40">brief is the filter · drag a card past 60% to inspect</span>
            </span>
            <span className="inline-flex items-center gap-2 text-white/40">
              <span className="hidden sm:inline">rubric v{rubric.version} · 6 dims · s/01–04</span>
              <span className="voisss-phosphor text-white">{totalVoices} VOICES</span>
            </span>
          </div>

          {/* single honest instrument — input + filters + twin strip in one frame */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 sm:px-4 sm:py-4">
            <label htmlFor="marketplace-brief" className="block font-mono text-[10px] tracking-[0.14em] text-white/40 mb-1.5">
              DESCRIBE THE VOICE YOU NEED
            </label>
            <div className="flex gap-2">
              <input
                id="marketplace-brief"
                type="text"
                className="lr-input flex-1 min-w-0 text-sm"
                value={brief}
                onChange={(e) => updateDraft({ brief: e.target.value.slice(0, 500) })}
                placeholder='e.g. "warm narrator for a meditation app, unhurried"'
                maxLength={500}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setThinkingKey((k) => k + 1)}
                className="hidden sm:inline-flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-3 font-mono text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Re-run match"
              >
                Match
              </button>
            </div>

            {/* inline loom controls — filter is the brief, these are refinements */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PillSelect label="Language" value={filters.language} onChange={(v) => setFilters({ ...filters, language: v })} options={LANGUAGE_OPTIONS} />
              <PillSelect label="Tone" value={filters.tone} onChange={(v) => setFilters({ ...filters, tone: v })} options={TONE_OPTIONS} />
              <PillSelect label="License" value={filters.licenseType} onChange={(v) => setFilters({ ...filters, licenseType: v })} options={LICENSE_OPTIONS} />
              {activeFilterCount > 0 ? (
                <span className="inline-flex items-center gap-2">
                  <span className="font-mono text-[11px] text-white/35">{activeFilterCount} refined</span>
                  <button type="button" onClick={() => setFilters({ language: "", tone: "", licenseType: "" })} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-white/60 hover:text-white hover:border-white/15 transition-colors">
                    Clear
                  </button>
                </span>
              ) : (
                <span className="font-mono text-[11px] text-white/25">filters refine the loom</span>
              )}
              <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] text-white/30">
                <span className="h-1 w-1 rounded-full bg-white/20" aria-hidden /> {displayedVoices.length} woven
              </span>
            </div>

            {/* twin strip — Jev-forward HUD: archetype warp threads + proof */}
            <div className="mt-3 border-t border-white/[0.06] pt-3">
              {matchLoading ? (
                <div className="flex items-center gap-2">
                  <ThinkingState key={`thinking-${thinkingKey}`} variant="Steps" />
                  <span className="hidden sm:inline font-mono text-xs text-white/30">scoring 6 dims · Jev fan-out…</span>
                </div>
              ) : topLevels && topVoice && match?.archetype ? (
                <div className="flex flex-col gap-3">
                  {/* row 1: archetype + brief insights + proof */}
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                    <span className="inline-flex items-center gap-1.5 text-white/35 tracking-[0.12em] text-[10px]">JEV · SYSTEM ONE</span>
                    <Badge className="border-[#D6FF2A]/30 text-[#EAFF6A]">rubric: {match.archetype}</Badge>
                    {archetypeDef && (
                      <span className="hidden sm:inline text-white/30">· {archetypeDef.label} · {archetypeDef.outcome}</span>
                    )}
                    {match.briefInsights?.emotion && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/60">
                        {match.briefInsights.emotion.choice}
                        {match.briefInsights.emotion.confidence != null && (
                          <span className="text-white/30">{Math.round(match.briefInsights.emotion.confidence * 100)}%</span>
                        )}
                      </span>
                    )}
                    {match.briefInsights?.useCase && (
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/60">{match.briefInsights.useCase.choice}</span>
                    )}
                    {match.briefInsights?.urgency && (
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/45">
                        urgency {match.briefInsights.urgency.score.toFixed(1)}/2
                      </span>
                    )}
                    <span className="voisss-phosphor ml-auto inline-flex items-center gap-1.5 text-[11px] text-white">
                      {match.meta?.latencyMs != null ? `${match.meta.latencyMs}ms` : "—"} · {match.meta?.questionCount ?? "—"}q
                      {tokens > 0 && <> · {tokens.toLocaleString()} tok</>}
                      {match.meta?.model && <span className="hidden sm:inline text-white/40">· {match.meta.model}</span>}
                    </span>
                  </div>
                  {/* row 2: warp threads — 6 dims target vs actual */}
                  <WarpHUD levels={topLevels} archetypeKey={match.archetype} />
                  {/* row 3: top reason labels + rubric vs holistic */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {topReasons.length > 0 ? (
                      topReasons.map((r) => (
                        <span key={r} className="inline-flex items-center rounded-full border border-[#D6FF2A]/20 bg-[#D6FF2A]/10 px-2 py-0.5 font-mono text-[11px] font-medium text-[#0A0E1A]">
                          {r}
                        </span>
                      ))
                    ) : (
                      <span className="font-mono text-[11px] text-white/35">partial fit — no strong reason labels</span>
                    )}
                    <span className="ml-auto inline-flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                      {topRubric != null && (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/70">
                          rubric <span className="voisss-phosphor text-white">{Math.round(topRubric * 100)}%</span>
                        </span>
                      )}
                      {topHolistic != null && (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/50">
                          holistic <span className="tabular-nums text-white/70">{Math.round(topHolistic * 100)}%</span>
                          {topRubric != null && (
                            <span className={`ml-1 ${Math.abs(topHolistic - topRubric) < 0.08 ? "text-white/30" : "text-amber-200/70"}`}>
                              Δ {((topHolistic - topRubric) * 100).toFixed(0)}pp
                            </span>
                          )}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#D6FF2A]/30 bg-[#D6FF2A]/10 px-2 py-0.5 text-[11px] font-bold text-[#0A0E1A]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0A0E1A] animate-pulse" /> {voiceDisplayName(topVoice)}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.04] pt-2 font-mono text-[10px] tracking-wide text-white/25">
                    <span>rubric v{rubric.version} · {match.meta?.rubric ?? rubric.version} · cites Rodero 2022 · Belin 2017 · Klofstad 2012</span>
                    <span className="hidden sm:inline">· outcome-learning: preview → vocalize → license reweights</span>
                    <Link href="/benchmarks" className="ml-auto rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/50 hover:text-white transition-colors">Jev vs GPT →</Link>
                  </div>
                </div>
              ) : matchUnavailable ? (
                <p className="font-mono text-xs text-white/50">
                  Matching unavailable · browsing only ·{" "}
                  <button type="button" onClick={() => setMatchUnavailable(false)} className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/70 hover:text-white">
                    Retry
                  </button>
                  <span className="ml-2 hidden sm:inline text-white/25">rubric v{rubric.version} · 6 neutral dims · gender/accent never encoded</span>
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs text-white/30">Type a brief — Jev reads intent, rubric explains fit · try</span>
                    {["Calm narration", "A warm welcome", "An energetic ad"].map((s) => (
                      <Chip key={s} onClick={() => updateDraft({ brief: s })}>
                        {s}
                      </Chip>
                    ))}
                    <Link href="/benchmarks" className="ml-auto hidden sm:inline-flex rounded-full border border-[#D6FF2A]/20 bg-[#D6FF2A]/10 px-2 py-0.5 font-mono text-[11px] font-medium text-[#0A0E1A]">See Jev vs GPT →</Link>
                  </div>
                  <div className="hidden sm:flex flex-wrap items-center gap-1.5 font-mono text-[10px] tracking-wide text-white/20">
                    <span>rubric v{rubric.version} · 6 dims: energy · pace · express · warmth · authority · intimacy</span>
                    <span>· neutral acoustic priors · excluded: gender / accent hierarchy / vocal fry</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Field — edge-to-edge warp, loom was the filter ─────────────── */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[780px] overflow-hidden opacity-[0.28]" aria-hidden>
          <VoiceTerrain />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E1A] via-transparent to-[#0A0E1A]" />
        </div>
        {/* ghost hint — 4s, s/01, then gone */}
        {!ghostSeen && brief.trim().length < 3 && (
          <div id="voisss-ghost-hint" className="pointer-events-none absolute left-1/2 top-[18px] z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#D6FF2A]/20 bg-[#D6FF2A]/10 px-3 py-1 font-mono text-[11px] text-[#0A0E1A] opacity-0 transition-opacity duration-700" style={{ transition: "opacity 700ms ease" }}>
            s/01 — type any brief — pull any thread past 60%
          </div>
        )}
        {/* outcome toast — brief → shown → previewed funnel */}
        {toast && (
          <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#D6FF2A]/30 bg-[#0A0E1A]/90 px-3 py-1.5 font-mono text-[11px] text-[#EAFF6A] shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <span className="voisss-phosphor">{toast}</span>
          </div>
        )}
        <div className="relative py-5 sm:py-6">
          <div className="mx-auto max-w-[1200px] px-[clamp(12px,2.5vw,24px)] sm:px-[clamp(20px,4vw,64px)]">
          {draft.shortlist.length > 0 && (
            <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4" aria-label="Compare catalog samples">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-sm font-bold">Compare · {draft.shortlist.length}/3</h2>
                <Chip onClick={() => updateDraft({ shortlist: [] })}>Clear</Chip>
                <span className="ml-auto font-mono text-[11px] text-white/30">{shortlistFull ? "Remove one to add another" : "Samples may use different scripts"}</span>
              </div>
              {unavailableShortlist > 0 && <p className="mt-1 font-mono text-xs text-white/40">{unavailableShortlist} saved selection{unavailableShortlist !== 1 ? "s are" : " is"} no longer in catalog.</p>}
              <div className="mt-3 grid gap-2">
                {shortlistedVoices.map((voice) => (
                  <VoiceAuditionRow key={voice.id} voice={voice} onPlayed={(v) => trackMatchEvent("voice_preview", v.id)} actions={<button type="button" className="lr-shortlist" aria-pressed="true" onClick={() => toggleShortlist(voice.id)}><Check className="w-4 h-4" aria-hidden /></button>} />
                ))}
              </div>
            </section>
          )}

          {error && <Notice tone="error">{error} <Chip onClick={() => void query.refetch()}>Retry</Chip></Notice>}

          {loading ? (
            <div className="lr-list" role="status">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="lr-card" style={{ minHeight: "7rem", opacity: 0.5 }}>Loading…</div>
              ))}
            </div>
          ) : displayedVoices.length > 0 ? (
            <UnwovenGrid
              voices={displayedVoices}
              topMatchId={topMatchId}
              ceremonyId={ceremonyId}
              reasonsById={match?.reasons ?? {}}
              dimensionLevelsById={match?.dimensionLevels ?? {}}
              scoresById={match?.scores ?? {}}
              holisticScoresById={match?.holisticScores ?? {}}
              archetype={match?.archetype}
              onPlayed={(v) => trackMatchEvent("voice_preview", v.id)}
              shortlistButton={shortlistButton}
            />
          ) : (
            !error && (
              <Notice>
                {activeFilterCount > 0 ? (
                  <>
                    <p style={{ margin: 0 }}>No voices matched these refinements — the brief still holds.</p>
                    <Chip style={{ marginTop: "0.5rem" }} onClick={() => setFilters({ language: "", tone: "", licenseType: "" })}>Clear refinements</Chip>
                  </>
                ) : (
                  <p style={{ margin: 0 }}>
                    No voices are listed in the catalog yet. <Link href="/sell" style={{ color: "var(--lr-accent)" }}>Contributors can record and publish in the Studio →</Link>
                  </p>
                )}
              </Notice>
            )
          )}

          {/* ── Single mono rule — the only footer. No disclosures. ───────── */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-4 font-mono text-[11px] text-white/30">
            <span className="inline-flex flex-wrap gap-2">
              <span className="text-white/50">{totalVoices} voices</span> · {totalLicenses} licenses · {totalUsage.toLocaleString()} uses
              <span className="hidden sm:inline">· 70% contributor / 30% protocol · <span className="voisss-phosphor text-[11px]">platformFeeBps 3000</span> · VoiceLicenseMarket.sol · Base 8453</span>
            </span>
            <span className="ml-auto inline-flex items-center gap-2">
              <span className="hidden sm:inline text-white/20">inspect on-card: source · trust · TxHash →</span>
              <button type="button" onClick={() => setShowTrends((v) => !v)} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/50 hover:text-white hover:border-white/15 transition-colors">
                {showTrends ? "Hide" : "Market"} intelligence {showTrends ? "↑" : "→"}
              </button>
              <Link href="/developers" className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-white/50 hover:text-white transition-colors">API →</Link>
            </span>
          </div>

          {/* inline intelligence — one block, toggle, not a Disclosure */}
          {showTrends && (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <VoiceMarketTrends />
            </div>
          )}

          {isAuthenticated && (
            <div className="mt-4 max-w-2xl">
              <BuyerCreditsStrip agentRegistryAddress={(process.env.NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT as string) || "0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c"} />
            </div>
          )}
          <div className="mt-4 max-w-2xl">
            <DismissibleRuntimeTracks bankrCompact dynamicCompact={!isAuthenticated} storageKey="voisss_runtime_marketplace" />
          </div>

          {/* settlement — draggable object, field follows */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="font-mono text-[10px] tracking-[0.14em] text-white/40">SETTLEMENT OBJECT — drag the split</div>
              <p className="mt-2 font-mono text-xs leading-relaxed text-white/60">
                <span className="text-white">License purchase</span> → {Math.round(split * 100)}% contributor / {Math.round((1 - split) * 100)}% protocol · <span className="voisss-phosphor">platformFeeBps {Math.round(split * 10000)}</span> · VoiceLicenseMarket.sol
              </p>
              <p className="mt-1 font-mono text-xs leading-relaxed text-white/60">
                <span className="text-white">Per-use vocalize</span> → 95% creator / 5% platform · <span className="voisss-phosphor">platformFeePercent 5</span> · VoiceRecords.sol
              </p>
              <div
                ref={splitRef}
                role="slider"
                aria-label="Settlement split"
                aria-valuemin={15}
                aria-valuemax={85}
                aria-valuenow={Math.round(split * 100)}
                tabIndex={0}
                onKeyDown={(e) => { const s = e.key === "ArrowRight" ? 0.02 : e.key === "ArrowLeft" ? -0.02 : 0; if (s) { e.preventDefault(); const n = Math.max(0.15, Math.min(0.85, split + s)); setSplit(n); setSettleSplit(n); pulseVoice("settle"); }}}
                onPointerDown={(e) => { draggingSplit.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); commitSplit(e.clientX); }}
                onPointerMove={(e) => { if (draggingSplit.current) commitSplit(e.clientX); }}
                onPointerUp={() => { draggingSplit.current = false; }}
                onPointerCancel={() => { draggingSplit.current = false; }}
                className="mt-3 relative h-6 flex items-center cursor-ew-resize select-none touch-none outline-none focus-visible:ring-2 focus-visible:ring-[#D6FF2A]/40 rounded-full"
              >
                <div className="absolute inset-y-[7px] inset-x-0 overflow-hidden rounded-full bg-white/10 flex" aria-hidden>
                  <div className="h-full bg-[#D6FF2A]" style={{ width: `${split * 100}%` }} />
                  <div className="h-full bg-[#22D3EE] flex-1" />
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 h-5 w-[2px] -translate-x-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]" style={{ left: `${split * 100}%` }} aria-hidden />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 grid h-6 w-6 place-items-center rounded-full border border-white/20 bg-[#0A0E1A] shadow-lg" style={{ left: `${split * 100}%` }} aria-hidden>
                  <span className="h-2 w-[1px] bg-white/50" /><span className="ml-[2px] h-2 w-[1px] bg-white/50" />
                </div>
              </div>
              <p className="mt-1 font-mono text-[10px] text-white/30">on-chain constant is 70/30 — drag to inspect, field sweep follows</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="font-mono text-[10px] tracking-[0.14em] text-white/40">PROVENANCE · ON-CARD</div>
              <p className="mt-2 font-mono text-xs leading-relaxed text-white/60">
                Every thread exposes <span className="text-white">source</span>, <span className="text-white">trust badge</span>, and <span className="voisss-phosphor">TxHash</span> → Basescan. Pull past 60% or tap ↔ · scores explain via rubric, not vibes.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[11px]">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/50">source: envio / rpc / catalog</span>
                <span className="rounded-full border border-[#D6FF2A]/20 bg-[#D6FF2A]/10 px-2 py-0.5 text-[#0A0E1A]">verified</span>
                <span className="voisss-phosphor rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px]">0xBE85…85c</span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <LicensePurchaseModal
        key={modalVoice?.id ?? "license-modal"}
        visible={!!modalVoice}
        onClose={() => setModalVoice(null)}
        voiceId={modalVoice?.id || ""}
        voiceName={modalVoice?.metadata.title || modalVoice?.voiceProfile?.tone || "Unknown"}
        voicePreviewUrl={modalVoice?.sampleUrl}
        licenseType={modalVoice?.licenseType || "non-exclusive"}
        price={modalVoice ? Number(modalVoice.price) / 1_000_000 : 0}
      />
    </main>
  );
}
