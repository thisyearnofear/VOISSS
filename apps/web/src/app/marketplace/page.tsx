"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceCard } from "@/components/marketplace/VoiceCard";
import { VoiceMarketTrends } from "@/components/marketplace/VoiceMarketTrends";
import { LicensePurchaseModal } from "@/components/payment/LicensePurchaseModal";
import { BuyCreditsModal } from "@/components/payment/BuyCreditsModal";
import MascotEmptyState from "@/components/MascotEmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronDown, Sparkles, Zap } from "lucide-react";
import { initWebMCP } from "@/lib/webmcp";
import { MascotEvents } from "@/lib/mascot-events";
import type { MarketplaceVoice } from "@/lib/marketplace-indexer";
import { DismissibleRuntimeTracks } from "@/components/payment/RuntimePaymentChips";
import { BuyerCreditsStrip } from "@/components/payment/DashboardBalanceChips";
import MarketplaceTerrain from "@/components/marketplace/MarketplaceTerrain";

interface VoiceMatchResult {
  scores: Record<string, number>;
  holisticScores?: Record<string, number>;
  archetype?: string;
  dimensionLevels?: Record<string, Record<string, number>>;
  reasons?: Record<string, string[]>;
  briefInsights: {
    emotion: { choice: string; confidence: number } | null;
    useCase: { choice: string; confidence: number } | null;
    urgency: {
      score: number;
      legend?: Record<string, string>;
      confidence: number;
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

export default function MarketplacePage() {
  const { isAuthenticated } = useAuth();
  const [voices, setVoices] = useState<MarketplaceVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    language: "",
    tone: "",
    licenseType: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [modalVoice, setModalVoice] = useState<MarketplaceVoice | null>(null);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [brief, setBrief] = useState("");
  const [match, setMatch] = useState<VoiceMatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchUnavailable, setMatchUnavailable] = useState(false);

  const activeFilterCount = [filters.language, filters.tone, filters.licenseType].filter(Boolean).length;

  // Register WebMCP tools for AI agents (runs once on mount)
  useEffect(() => {
    initWebMCP().catch(console.error);
  }, []);

  const fetchVoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.language) params.append("language", filters.language);
      if (filters.tone) params.append("tone", filters.tone);
      if (filters.licenseType) {
        params.append("licenseType", filters.licenseType);
      }

      const response = await fetch(`/api/marketplace/voices?${params}`);
      const data = await response.json();

      if (data.success) {
        setVoices(data.data.voices || []);
      } else {
        setVoices([]);
        setError(data.error || "Failed to fetch live marketplace listings.");
      }
    } catch (fetchError) {
      console.error("Failed to fetch voices:", fetchError);
      setVoices([]);
      setError("Failed to fetch live marketplace listings.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchVoices();
  }, [fetchVoices]);

  // Jev intent matching — debounced so each pause in typing fires one fan-out
  // call (N Nouls + meta questions) that re-ranks the grid in ~100ms.
  useEffect(() => {
    if (brief.trim().length < 3 || matchUnavailable) {
      setMatch(null);
      setMatchLoading(false);
      return;
    }

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
        if (data.success) {
          setMatch(data.data);
        } else if (res.status === 503 && data.error === "jev_not_configured") {
          setMatchUnavailable(true);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          console.error("Voice match failed:", e);
        }
      } finally {
        if (!controller.signal.aborted) {
          setMatchLoading(false);
        }
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [brief, matchUnavailable]);

  const handlePurchaseClick = (voiceId: string) => {
    const voice = voices.find((v) => v.id === voiceId) || null;
    setModalVoice(voice);
  };

  // Outcome events feed rubric reweighting — fire-and-forget, never blocks UI.
  const trackMatchEvent = (event: string, voiceId: string) => {
    fetch("/api/marketplace/match-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        voiceId,
        archetype: match?.archetype,
        brief: brief.trim(),
      }),
      keepalive: true,
    }).catch(() => {});
  };


  const totalVoices = voices.length;
  const totalLicenses = voices.reduce(
    (sum, voice) => sum + (voice.stats?.purchases || 0),
    0
  );
  const totalUsage = voices.reduce(
    (sum, voice) => sum + (voice.stats?.usageCount || 0),
    0
  );

  const filteredVoices = voices.filter((voice) => {
    if (filters.language && voice.voiceProfile?.language !== filters.language) {
      return false;
    }
    if (
      filters.tone &&
      voice.voiceProfile?.tone?.toLowerCase() !== filters.tone.toLowerCase()
    ) {
      return false;
    }
    if (filters.licenseType && voice.licenseType !== filters.licenseType) {
      return false;
    }
    return true;
  });

  const displayedVoices = useMemo(() => {
    if (!match?.scores || Object.keys(match.scores).length === 0) {
      return filteredVoices;
    }
    return [...filteredVoices].sort(
      (a, b) => (match.scores[b.id] ?? 0) - (match.scores[a.id] ?? 0)
    );
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

  const FilterSelect = ({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C5DFA] focus:ring-1 focus:ring-[#7C5DFA]/30 transition-all"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <MascotEvents />
      <div className="min-h-screen bg-[#0A0A0A] voisss-bg-grid voisss-bg-noise">
      <div className="border-b border-[#2A2A2A] voisss-bg-mesh">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Voice Marketplace</h1>
            <span className="text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-sm w-fit uppercase tracking-wider">
              LIVE ON BASE
            </span>
          </div>
          <p className="text-base sm:text-lg text-gray-400 mb-6">
            License authentic human voices for your AI agents
          </p>

          {/* Stats bar */}
          <div className="flex items-center gap-0 border border-[#2A2A2A] rounded-sm overflow-hidden w-fit">
            <div className="px-4 sm:px-5 py-3 border-r border-[#2A2A2A] bg-[#0A0A0A]/80">
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">{totalVoices}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Voices</div>
            </div>
            <div className="px-4 sm:px-5 py-3 border-r border-[#2A2A2A] bg-[#0A0A0A]/80">
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">{totalLicenses}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Licenses Sold</div>
            </div>
            <div className="px-4 sm:px-5 py-3 bg-[#0A0A0A]/80">
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">{totalUsage.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Total Uses</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Voice terrain — sandboxed to this page's hero. Already wired to the
            bus, so previewing any voice card below lights it up. */}
        <MarketplaceTerrain />

        {/* Buyer credits — compact when connected; explains cost before browsing. */}
        {isAuthenticated ? (
          <div className="mb-4 max-w-2xl">
            <BuyerCreditsStrip agentRegistryAddress={(process.env.NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT as string) || "0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c"} />
          </div>
        ) : null}
        {/* Runtime rails — dismissible so browsing stays clean; judges can restore in one click. */}
        <div className="mb-6 max-w-2xl">
          <DismissibleRuntimeTracks bankrCompact dynamicCompact={!isAuthenticated} storageKey="voisss_runtime_marketplace" />
        </div>
        <VoiceMarketTrends />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </motion.div>
        )}

        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Collapsible Filters */}
        <AnimatePresence>
          <motion.div
            initial={false}
            animate={{ opacity: 1, height: 'auto' }}
            className="hidden md:block"
          >
            <div className="border border-[#2A2A2A] rounded-sm p-4 mb-6 bg-[#0A0A0A]/60 backdrop-blur-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <FilterSelect
                  label="Language"
                  value={filters.language}
                  onChange={(v) => setFilters({ ...filters, language: v })}
                  options={[
                    { value: "", label: "All Languages" },
                    { value: "en-US", label: "English (US)" },
                    { value: "en-GB", label: "English (UK)" },
                    { value: "es-ES", label: "Spanish" },
                    { value: "fr-FR", label: "French" },
                    { value: "de-DE", label: "German" },
                  ]}
                />
                <FilterSelect
                  label="Tone"
                  value={filters.tone}
                  onChange={(v) => setFilters({ ...filters, tone: v })}
                  options={[
                    { value: "", label: "All Tones" },
                    { value: "professional", label: "Professional" },
                    { value: "friendly", label: "Friendly" },
                    { value: "energetic", label: "Energetic" },
                    { value: "calm", label: "Calm" },
                    { value: "warm", label: "Warm" },
                    { value: "authoritative", label: "Authoritative" },
                  ]}
                />
                <FilterSelect
                  label="License"
                  value={filters.licenseType}
                  onChange={(v) => setFilters({ ...filters, licenseType: v })}
                  options={[
                    { value: "", label: "All License Types" },
                    { value: "non-exclusive", label: "Non-exclusive" },
                    { value: "exclusive", label: "Exclusive" },
                  ]}
                />
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ language: "", tone: "", licenseType: "" })}
                    className="w-full px-4 py-2.5 border border-[#2A2A2A] text-gray-400 rounded-lg hover:border-gray-600 hover:text-white transition-all text-sm"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Mobile Filters (animated) */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden md:hidden"
          >
            <div className="border border-[#2A2A2A] rounded-sm p-4 mb-6 bg-[#0A0A0A]/60 backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-4">
                <FilterSelect
                  label="Language"
                  value={filters.language}
                  onChange={(v) => setFilters({ ...filters, language: v })}
                  options={[
                    { value: "", label: "All Languages" },
                    { value: "en-US", label: "English (US)" },
                    { value: "en-GB", label: "English (UK)" },
                    { value: "es-ES", label: "Spanish" },
                    { value: "fr-FR", label: "French" },
                    { value: "de-DE", label: "German" },
                  ]}
                />
                <FilterSelect
                  label="Tone"
                  value={filters.tone}
                  onChange={(v) => setFilters({ ...filters, tone: v })}
                  options={[
                    { value: "", label: "All Tones" },
                    { value: "professional", label: "Professional" },
                    { value: "friendly", label: "Friendly" },
                    { value: "energetic", label: "Energetic" },
                    { value: "calm", label: "Calm" },
                    { value: "warm", label: "Warm" },
                    { value: "authoritative", label: "Authoritative" },
                  ]}
                />
                <FilterSelect
                  label="License"
                  value={filters.licenseType}
                  onChange={(v) => setFilters({ ...filters, licenseType: v })}
                  options={[
                    { value: "", label: "All License Types" },
                    { value: "non-exclusive", label: "Non-exclusive" },
                    { value: "exclusive", label: "Exclusive" },
                  ]}
                />
                <button
                  onClick={() => {
                    setFilters({ language: "", tone: "", licenseType: "" });
                    setShowFilters(false);
                  }}
                  className="w-full px-4 py-2.5 border border-[#2A2A2A] text-gray-400 rounded-lg hover:border-gray-600 hover:text-white transition-all text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Jev intent matching — one fan-out call scores every voice against
            the brief; the grid re-ranks live as you type. */}
        <div className="mb-6 border border-[#7C5DFA]/30 rounded-sm p-4 bg-gradient-to-r from-[#7C5DFA]/10 to-transparent">
          <label
            htmlFor="jev-brief"
            className="flex items-center gap-2 text-xs font-medium text-[#9C88FF] mb-2 uppercase tracking-wider"
          >
            <Zap className="w-3.5 h-3.5" />
            Intent match · powered by Jev
            <a
              href="/benchmarks"
              className="ml-auto normal-case tracking-normal text-zinc-500 hover:text-[#9C88FF] transition-colors"
            >
              How we match →
            </a>
          </label>
          <input
            id="jev-brief"
            type="text"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder='Describe what you need — e.g. "warm narrator for a meditation app, unhurried"'
            className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C5DFA] focus:ring-1 focus:ring-[#7C5DFA]/30 transition-all placeholder:text-zinc-600"
          />

          {/* Clickable example briefs — instant demo of the re-rank without
              needing to know what to type. */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              "calm meditation narrator",
              "urgent ad read for a product drop",
              "friendly podcast host",
            ].map((example) => (
              <button
                key={example}
                onClick={() => setBrief(example)}
                className="text-[11px] px-2 py-1 rounded-md bg-[#7C5DFA]/10 text-[#9C88FF] border border-[#7C5DFA]/20 hover:bg-[#7C5DFA]/20 hover:border-[#7C5DFA]/40 transition-all"
              >
                {example}
              </button>
            ))}
          </div>

          {matchUnavailable && (
            <p className="mt-2 text-xs text-zinc-500">
              Intent matching is off — set <code>AI_GATEWAY_API_KEY</code> or{" "}
              <code>TYPESAFE_API_KEY</code> to enable live Jev matching.
            </p>
          )}

          {(matchLoading || match?.briefInsights || match?.meta) && !matchUnavailable && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
              {matchLoading && (
                <span className="text-zinc-400 animate-pulse">matching…</span>
              )}
              {match?.briefInsights?.emotion && (
                <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/20">
                  emotion: {match.briefInsights.emotion.choice}
                </span>
              )}
              {match?.briefInsights?.useCase && (
                <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20">
                  use case: {match.briefInsights.useCase.choice}
                </span>
              )}
              {match?.briefInsights?.urgency?.legend && (
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">
                  urgency:{" "}
                  {match.briefInsights.urgency.legend[
                    String(match.briefInsights.urgency.score)
                  ] ?? match.briefInsights.urgency.score}
                </span>
              )}
              {match?.archetype && (
                <span className="px-2 py-0.5 rounded bg-[#7C5DFA]/15 text-[#9C88FF] border border-[#7C5DFA]/25">
                  rubric: {match.archetype}
                </span>
              )}
              {match?.meta?.latencyMs != null && (
                <span className="ml-auto text-zinc-500 font-mono">
                  {match.meta.questionCount ?? "?"} questions · 1 call ·{" "}
                  {match.meta.latencyMs}ms
                  {match.meta.usage?.input_tokens != null &&
                    ` · ${
                      (match.meta.usage.input_tokens ?? 0) +
                      (match.meta.usage.output_tokens ?? 0)
                    } tokens`}
                  {match.meta.provider === "vercel-ai-gateway" &&
                    " · via Vercel AI Gateway"}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Onboarding hint for first-time visitors */}
        {!loading && voices.length === 0 && !error && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-[#7C5DFA]/10 to-blue-500/10 border border-[#7C5DFA]/20 rounded-lg flex items-start gap-3"
          >
            <Sparkles className="w-5 h-5 text-[#9C88FF] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-300 font-medium">Welcome to the Voice Marketplace</p>
              <p className="text-xs text-gray-500 mt-1">
                Try voices free in the{" "}
                <a href="/demo" className="text-[#9C88FF] hover:underline">demo</a>
                {" "}first — no wallet needed. Contributors can head to the{" "}
                <a href="/studio" className="text-[#9C88FF] hover:underline">Studio</a>.
              </p>
            </div>
          </motion.div>
        )}

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-xl border border-[#2A2A2A] bg-[#111111] animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </motion.div>
        ) : displayedVoices.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {displayedVoices.map((voice, i) => {
              const fitScore = match?.scores?.[voice.id];
              const isTop = voice.id === topMatchId;
              return (
                <motion.div
                  key={voice.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3, layout: { duration: 0.25 } }}
                  className={`relative rounded-xl transition-shadow ${
                    isTop
                      ? "ring-2 ring-[#7C5DFA] shadow-lg shadow-[#7C5DFA]/20"
                      : ""
                  }`}
                >
                  {fitScore != null && (
                    <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${
                          isTop
                            ? "bg-[#7C5DFA] text-white border-[#7C5DFA]"
                            : "bg-black/70 text-[#9C88FF] border-[#7C5DFA]/40"
                        }`}
                      >
                        {isTop ? "Best match · " : ""}
                        {Math.round(fitScore * 100)}%
                      </span>
                      <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          className="h-full bg-[#7C5DFA]"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(fitScore * 100)}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      {/* Explainable fit: the rubric dimensions that drove
                          this voice's ranking for the detected archetype. */}
                      {match?.reasons?.[voice.id]?.map((reason) => (
                        <span
                          key={reason}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-[#9C88FF] border border-[#7C5DFA]/30"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                  <VoiceCard
                    voice={voice}
                    onPurchase={
                      voice.source === "platform"
                        ? undefined
                        : () => handlePurchaseClick(voice.id)
                    }
                    onPreview={(voiceId) =>
                      trackMatchEvent("voice_preview", voiceId)
                    }
                  />
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <MascotEmptyState
              title={activeFilterCount > 0 ? "No voices matched these filters" : "No voices listed yet"}
              description={
                activeFilterCount > 0
                  ? "Try adjusting your filters or clearing them to see all available voices."
                  : "Be the first to list your voice! Head to the Studio to record and publish."
              }
            />
          </motion.div>
        )}
      </div>

      <LicensePurchaseModal
        visible={!!modalVoice}
        onClose={() => setModalVoice(null)}
        voiceId={modalVoice?.id || ''}
        voiceName={modalVoice?.metadata.title || modalVoice?.voiceProfile?.tone || 'Unknown'}
        voicePreviewUrl={modalVoice?.sampleUrl}
        licenseType={modalVoice?.licenseType || "non-exclusive"}
        price={modalVoice ? Number(modalVoice.price) / 1_000_000 : 0}
      />

      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
        context={modalVoice ? { voiceId: modalVoice.id, voiceName: modalVoice.metadata.title || modalVoice.voiceProfile?.tone || 'Unknown' } : undefined}
      />
    </div>
    </>
  );
}
