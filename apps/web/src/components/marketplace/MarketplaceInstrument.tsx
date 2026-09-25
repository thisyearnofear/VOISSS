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
import { Badge, Button, Chip, Disclosure, Notice } from "@/components/ui";
import { useListeningRoom } from "@/contexts/ListeningRoomContext";
import { useVoiceCatalog } from "@/hooks/useVoiceCatalog";
import { useAuth } from "@/contexts/AuthContext";
import { pulseVoice } from "@/lib/terrain-bus";
import { DismissibleRuntimeTracks } from "@/components/payment/RuntimePaymentChips";
import ThinkingState from "@/components/ui/agentic/ThinkingState";

type VoiceMatchResult = {
  scores: Record<string, number>;
  holisticScores?: Record<string, number>;
  archetype?: string;
  dimensionLevels?: Record<string, Record<string, number>>;
  reasons?: Record<string, string[]>;
  briefInsights: {
    emotion: { choice: string; confidence: number } | null;
    useCase: { choice: string; confidence: number } | null;
    urgency: { score: number; legend?: Record<string, string>; confidence: number } | null;
  } | null;
  meta: {
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

function DimensionStrip({ levels }: { levels?: Record<string, number> }) {
  if (!levels || Object.keys(levels).length === 0) return null;
  const order: [string, string][] = [
    ["arousal", "energy"],
    ["pace", "pace"],
    ["expressiveness", "express"],
    ["warmth", "warmth"],
    ["authority", "authority"],
    ["intimacy", "intimacy"],
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {order.map(([dim, short]) => {
        const v = levels[dim];
        if (v == null) return null;
        const pct = Math.round(v * 100);
        return (
          <span
            key={dim}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] leading-none"
          >
            <span className="tracking-wide text-white/45">{short}</span>
            <span className="tabular-nums text-white/80">{pct}</span>
            <span className="ml-0.5 h-1 w-12 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full bg-[#D6FF2A] transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </span>
          </span>
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
  const [showTrends, setShowTrends] = useState(false);
  const [thinkingKey, setThinkingKey] = useState(0);

  const brief = draft.brief;
  const loading = query.isLoading;
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
              <span className="hidden sm:inline">rubric v1.0 · 6 dims · s/01–04</span>
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

            {/* twin strip — not a second frame, just a rule + inline content */}
            <div className="mt-3 border-t border-white/[0.06] pt-3">
              {matchLoading ? (
                <div className="flex items-center gap-2">
                  <ThinkingState key={`thinking-${thinkingKey}`} variant="Steps" />
                  <span className="hidden sm:inline font-mono text-xs text-white/30">scoring 6 dims…</span>
                </div>
              ) : match?.dimensionLevels && topMatchId && topVoice ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                    <span className="text-white/35 tracking-[0.12em] text-[10px]">AGENT TWIN · 6 DIMS — {voiceDisplayName(topVoice)}</span>
                    {match.archetype && <Badge className="border-[#D6FF2A]/30 text-[#EAFF6A]">rubric: {match.archetype}</Badge>}
                    {match.meta?.latencyMs != null && <span className="text-white/25">· {match.meta.latencyMs}ms · {match.meta.questionCount ?? "—"} q</span>}
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#D6FF2A]/30 bg-[#D6FF2A]/10 px-2 py-0.5 text-[11px] font-bold text-[#0A0E1A]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0A0E1A] animate-pulse" /> {voiceDisplayName(topVoice)}
                    </span>
                  </div>
                  <DimensionStrip levels={match.dimensionLevels[topMatchId]} />
                </div>
              ) : matchUnavailable ? (
                <p className="font-mono text-xs text-white/50">
                  Matching unavailable · browsing only ·{" "}
                  <button type="button" onClick={() => setMatchUnavailable(false)} className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/70 hover:text-white">
                    Retry
                  </button>
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-xs text-white/30">Type a brief — the agent twin scores here · try</span>
                  {["Calm narration", "A warm welcome", "An energetic ad"].map((s) => (
                    <Chip key={s} onClick={() => updateDraft({ brief: s })}>
                      {s}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Field — terrain behind the loom's output, not a second hero ───── */}
      <div className="relative">
        {/* subtle terrain wash behind grid only — not a hero, just memory */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden opacity-[0.22]" aria-hidden>
          <VoiceTerrain />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E1A] via-transparent to-[#0A0E1A]" />
        </div>

        <div className="lr-wrap relative py-5 sm:py-6">
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
            <UnwovenGrid voices={displayedVoices} topMatchId={topMatchId} ceremonyId={ceremonyId} reasonsById={match?.reasons ?? {}} dimensionLevelsById={match?.dimensionLevels ?? {}} shortlistButton={shortlistButton} onPlayed={(v) => trackMatchEvent("voice_preview", v.id)} />
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

          {/* trust · settlement — not a disclosure, just two quiet cards */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="font-mono text-[10px] tracking-[0.14em] text-white/40">SETTLEMENT OBJECT</div>
              <p className="mt-2 font-mono text-xs leading-relaxed text-white/60">
                <span className="text-white">License purchase</span> → 70% contributor / 30% protocol · <span className="voisss-phosphor">platformFeeBps 3000</span> · VoiceLicenseMarket.sol
              </p>
              <p className="mt-1 font-mono text-xs leading-relaxed text-white/60">
                <span className="text-white">Per-use vocalize</span> → 95% creator / 5% platform · <span className="voisss-phosphor">platformFeePercent 5</span> · VoiceRecords.sol
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10 flex">
                <div className="h-full bg-[#D6FF2A]" style={{ width: "70%" }} />
                <div className="h-full bg-[#22D3EE] flex-1" />
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="font-mono text-[10px] tracking-[0.14em] text-white/40">PROVENANCE · ON-CARD</div>
              <p className="mt-2 font-mono text-xs leading-relaxed text-white/60">
                Every card exposes <span className="text-white">source</span>, <span className="text-white">trust badge</span>, and <span className="voisss-phosphor">TxHash</span> → Basescan. Pull the weave to reveal.
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
