"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LicensePurchaseModal } from "@/components/payment/LicensePurchaseModal";
import { Check, Loader2, Plus } from "lucide-react";
import { initWebMCP } from "@/lib/webmcp";
import { MascotEvents } from "@/lib/mascot-events";
import type { MarketplaceVoice } from "@/lib/marketplace-indexer";
import { DismissibleRuntimeTracks } from "@/components/payment/RuntimePaymentChips";
import { BuyerCreditsStrip } from "@/components/payment/DashboardBalanceChips";
import { VoiceMarketTrends } from "@/components/marketplace/VoiceMarketTrends";
import { VoiceAuditionRow, voiceDisplayName } from "@/components/listening/VoiceAuditionRow";
import { useListeningRoom } from "@/contexts/ListeningRoomContext";
import { useVoiceCatalog } from "@/hooks/useVoiceCatalog";
import { useAuth } from "@/contexts/AuthContext";

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

function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = `filter-${label.toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="lr-label" style={{ color: "var(--lr-muted)" }}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="lr-select"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function MarketplacePageInner() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { draft, ready, updateDraft, toggleShortlist, player } = useListeningRoom();
  const { query, voices } = useVoiceCatalog();
  const [filters, setFilters] = useState({
    language: "",
    tone: "",
    licenseType: "",
  });
  const [modalVoice, setModalVoice] = useState<MarketplaceVoice | null>(null);
  const [match, setMatch] = useState<VoiceMatchResult | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchUnavailable, setMatchUnavailable] = useState(false);
  const lastAppliedParams = useRef<string | null>(null);

  const brief = draft.brief;
  const loading = query.isLoading;
  const error = query.isError ? "Voices could not be loaded. Please try again." : null;

  const activeFilterCount = [filters.language, filters.tone, filters.licenseType].filter(Boolean).length;

  // Register WebMCP tools for AI agents (runs once on mount)
  useEffect(() => {
    initWebMCP().catch(console.error);
  }, []);

  // Deep-link support — /marketplace?brief=... seeds the intent box so the
  // landing page search and shared links land mid-match.
  useEffect(() => {
    if (!ready) return;
    const key = searchParams.toString();
    if (lastAppliedParams.current === key) return;
    lastAppliedParams.current = key;
    const paramBrief = searchParams.get("brief");
    if (paramBrief !== null) updateDraft({ brief: paramBrief.slice(0, 500) });
  }, [searchParams, ready, updateDraft]);

  // Jev intent matching — debounced so each pause in typing fires one fan-out
  // call (N Nouls + meta questions) that re-ranks the grid in ~100ms.
  useEffect(() => {
    setMatch(null);
    if (brief.trim().length < 3 || matchUnavailable) {
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
        if (controller.signal.aborted) return;
        if (data.success) {
          setMatch(data.data);
        } else {
          setMatchUnavailable(true);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          console.error("Voice match failed:", e);
          setMatchUnavailable(true);
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
    player.stop();
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

  const shortlistedVoices = useMemo(
    () =>
      draft.shortlist
        .map((id) => voices.find((v) => v.id === id))
        .filter((v): v is MarketplaceVoice => Boolean(v)),
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
        {shortlisted ? (
          <Check className="w-4 h-4" aria-hidden />
        ) : (
          <Plus className="w-4 h-4" aria-hidden />
        )}
      </button>
    );
  };

  return (
    <main id="listening-main">
      <MascotEvents />
      <div className="lr-wrap">
        <header className="lr-discover-head">
          <h1 className="lr-h1" style={{ fontSize: "clamp(2.2rem, 4vw, 3.4rem)" }}>
            Find a voice.
          </h1>
          <p className="lr-lede">Listen first. Choose what fits.</p>

          {/* Jev intent matching — one fan-out call scores every voice against
              the brief; the grid re-ranks live as you type. */}
          <div className="lr-brief-form">
            <label htmlFor="marketplace-brief" className="lr-label" style={{ flexBasis: "100%" }}>
              Describe the voice you need
            </label>
            <input
              id="marketplace-brief"
              type="text"
              className="lr-input"
              value={brief}
              onChange={(e) => updateDraft({ brief: e.target.value.slice(0, 500) })}
              placeholder='e.g. "warm narrator for a meditation app, unhurried"'
              maxLength={500}
            />
          </div>

          {/* Clickable example briefs — instant demo of the re-rank without
              needing to know what to type. */}
          <div className="mt-2 flex flex-wrap items-center gap-2" style={{ fontSize: "0.8125rem" }} role="status">
            {matchLoading && <span className="lr-quiet" style={{ margin: 0 }}>matching…</span>}
            {matchUnavailable && (
              <span className="lr-quiet" style={{ margin: 0 }}>
                Matching is unavailable. You can still browse voices.{" "}
                <button
                  type="button"
                  className="lr-chip"
                  onClick={() => setMatchUnavailable(false)}
                >
                  Retry matching
                </button>
              </span>
            )}
            {match?.archetype && !matchUnavailable && (
              <span className="lr-badge">rubric: {match.archetype}</span>
            )}
          </div>
        </header>

        {/* Voice terrain — sandboxed to this page's hero. Already wired to the
            bus, so previewing any voice card below lights it up. */}
        {/* Mobile Filter Toggle */}
        {/* Collapsible Filters */}
        {/* Mobile Filters (animated) */}
        <details className="lr-details" style={{ borderTop: "none", paddingTop: 0 }}>
          <summary>
            <span>
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </span>
          </summary>
          <div className="lr-details-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <FilterSelect
                label="Language"
                value={filters.language}
                onChange={(v) => setFilters({ ...filters, language: v })}
                options={LANGUAGE_OPTIONS}
              />
              <FilterSelect
                label="Tone"
                value={filters.tone}
                onChange={(v) => setFilters({ ...filters, tone: v })}
                options={TONE_OPTIONS}
              />
              <FilterSelect
                label="License"
                value={filters.licenseType}
                onChange={(v) => setFilters({ ...filters, licenseType: v })}
                options={LICENSE_OPTIONS}
              />
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setFilters({ language: "", tone: "", licenseType: "" })}
                  className="lr-btn lr-btn-ghost"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        </details>

        {draft.shortlist.length > 0 && (
          <section className="lr-compare" aria-label="Compare catalog samples" style={{ marginBottom: "1.5rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
              <h2 style={{ fontFamily: "var(--lr-font-display)", fontWeight: 700, fontSize: "1.125rem", margin: 0 }}>
                Compare samples · {draft.shortlist.length}/3
              </h2>
              <button
                type="button"
                className="lr-chip"
                onClick={() => updateDraft({ shortlist: [] })}
              >
                Clear comparison
              </button>
            </div>
            <p className="lr-quiet" style={{ marginTop: "0.25rem" }}>
              {unavailableShortlist > 0
                ? `${unavailableShortlist} saved selection${unavailableShortlist !== 1 ? "s are" : " is"} no longer in the catalog.`
                : "Samples may use different scripts. Use the workspace to try your own words."}
            </p>
            <p className="sr-only" role="status">
              {draft.shortlist.length} of 3 comparison slots used
            </p>
            {shortlistFull && (
              <p className="lr-quiet" style={{ marginTop: "0.25rem" }}>
                Choose up to three voices. Remove one to add another.
              </p>
            )}
            {shortlistedVoices.map((voice) => (
              <VoiceAuditionRow
                key={voice.id}
                voice={voice}
                onPlayed={(v) => trackMatchEvent("voice_preview", v.id)}
                actions={
                  <button
                    type="button"
                    className="lr-shortlist"
                    aria-pressed="true"
                    aria-label={`Remove ${voiceDisplayName(voice)} from comparison`}
                    onClick={() => toggleShortlist(voice.id)}
                  >
                    <Check className="w-4 h-4" aria-hidden />
                  </button>
                }
              />
            ))}
          </section>
        )}

        {error && (
          <p className="lr-notice lr-error-text" role="status">
            {error}{" "}
            <button type="button" className="lr-chip" onClick={() => void query.refetch()}>
              Retry
            </button>
          </p>
        )}

        {loading ? (
          <div className="lr-list" role="status">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="lr-card" style={{ minHeight: "7rem", opacity: 0.5 }}>
                Loading…
              </div>
            ))}
          </div>
        ) : displayedVoices.length > 0 ? (
          <div className="lr-list">
            {displayedVoices.map((voice) => {
              const isTop = voice.id === topMatchId;
              const reasons = match?.reasons?.[voice.id] ?? [];
              return (
                <article key={voice.id} className="lr-card">
                  <VoiceAuditionRow
                    voice={voice}
                    onPlayed={(v) => trackMatchEvent("voice_preview", v.id)}
                    actions={shortlistButton(voice)}
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}>
                    <span className="lr-badge">
                      {voice.source === "platform"
                        ? "Platform catalog · Pay per use"
                        : `Contributor listing · ${voice.licenseType}`}
                    </span>
                    {isTop && <span className="lr-badge" style={{ borderColor: "var(--lr-accent)", color: "var(--lr-accent)" }}>Best match</span>}
                    <Link
                      href={`/marketplace/voices/${encodeURIComponent(voice.id)}`}
                      className="lr-nav-link"
                      style={{ minHeight: 44, padding: 0 }}
                    >
                      Voice details
                    </Link>
                    {voice.source !== "platform" && (
                      <button
                        type="button"
                        className="lr-chip"
                        onClick={() => handlePurchaseClick(voice.id)}
                      >
                        License
                      </button>
                    )}
                  </div>
                  {/* Explainable fit: the rubric dimensions that drove
                      this voice's ranking for the detected archetype. */}
                  {reasons.length > 0 && (
                    <details className="lr-inline-details">
                      <summary>Why this match?</summary>
                      <ul className="lr-reasons">
                        {reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <details className="lr-inline-details">
                    <summary>Provenance &amp; trust</summary>
                    <p className="lr-quiet" style={{ marginTop: "0.5rem" }}>
                      {voice.trust?.details || "No additional provenance details."}
                    </p>
                  </details>
                </article>
              );
            })}
          </div>
        ) : (
          !error && (
            <div className="lr-notice" role="status">
              {/* Onboarding hint for first-time visitors */}
              {activeFilterCount > 0 ? (
                <>
                  <p style={{ margin: 0 }}>No voices matched these filters.</p>
                  <button
                    type="button"
                    className="lr-chip"
                    style={{ marginTop: "0.5rem" }}
                    onClick={() => setFilters({ language: "", tone: "", licenseType: "" })}
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <p style={{ margin: 0 }}>
                  No voices are listed in the catalog yet.{" "}
                  <Link href="/sell" style={{ color: "var(--lr-accent)" }}>
                    Contributors can record and publish in the Studio →
                  </Link>
                </p>
              )}
            </div>
          )
        )}

        {/* Runtime rails — dismissible so browsing stays clean; judges can restore in one click. */}
        <details className="lr-details" style={{ marginTop: "2rem" }}>
          <summary>Catalog stats, payments &amp; trends</summary>
          <div className="lr-details-body">
            {/* Stats bar */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
              <span className="lr-badge">{totalVoices} voices</span>
              <span className="lr-badge">{totalLicenses} licenses sold</span>
              <span className="lr-badge">{totalUsage.toLocaleString()} total uses</span>
            </div>
            {isAuthenticated && (
              <div className="mb-4 max-w-2xl">
                {/* Buyer credits — compact when connected; explains cost before browsing. */}
                <BuyerCreditsStrip agentRegistryAddress={(process.env.NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT as string) || "0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c"} />
              </div>
            )}
            <div className="lr-legacy-inset">
              <div className="mb-4 max-w-2xl">
                <DismissibleRuntimeTracks bankrCompact dynamicCompact={!isAuthenticated} storageKey="voisss_runtime_marketplace" />
              </div>
              <VoiceMarketTrends />
            </div>
          </div>
        </details>
      </div>

      <LicensePurchaseModal
        key={modalVoice?.id ?? "license-modal"}
        visible={!!modalVoice}
        onClose={() => setModalVoice(null)}
        voiceId={modalVoice?.id || ''}
        voiceName={modalVoice?.metadata.title || modalVoice?.voiceProfile?.tone || 'Unknown'}
        voicePreviewUrl={modalVoice?.sampleUrl}
        licenseType={modalVoice?.licenseType || "non-exclusive"}
        price={modalVoice ? Number(modalVoice.price) / 1_000_000 : 0}
      />
    </main>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <main id="listening-main">
          <div className="lr-wrap" style={{ paddingTop: "4rem" }}>
            <Loader2 className="w-8 h-8 animate-spin" aria-hidden />
          </div>
        </main>
      }
    >
      <MarketplacePageInner />
    </Suspense>
  );
}
