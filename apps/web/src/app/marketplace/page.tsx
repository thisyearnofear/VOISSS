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
import VoiceTerrain from "@/components/VoiceTerrain";
import { UnwovenGrid } from "@/components/marketplace/UnwovenGrid";
import { Badge, Button, Chip, Disclosure, Notice } from "@/components/ui";
import { useListeningRoom } from "@/contexts/ListeningRoomContext";
import { useVoiceCatalog } from "@/hooks/useVoiceCatalog";
import { useAuth } from "@/contexts/AuthContext";
import { pulseVoice } from "@/lib/terrain-bus";

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

  // Match ceremony — when the brief resolves to a winner, the terrain takes
  // a wavefront, the hero names the voice, and the winning card plays a
  // one-shot ring. Re-fires only when the winner actually changes.
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

  const topVoice = useMemo(
    () => (topMatchId ? voices.find((v) => v.id === topMatchId) ?? null : null),
    [topMatchId, voices]
  );

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

      {/* Voice terrain — the signature field behind the discover headline.
          Wired to the bus: previewing any voice card below lifts off up here. */}
      <section className="lr-discover-hero lr-dark voisss-frame voisss-terrain-bg">
        <VoiceTerrain />
        <div className="lr-hero-scrim" aria-hidden />
        <div className="lr-hero-inner lr-hero-inner--stack">
          <header className="lr-discover-head">
            <h1 className="lr-h1 lr-discover-h1 voisss-masked-reveal">Find a voice.</h1>
            <p className="lr-lede voisss-masked-reveal voisss-masked-reveal-delay-1">
              Listen first. Choose what fits.
            </p>

            {/* Jev intent matching — one fan-out call scores every voice against
                the brief; the grid re-ranks live as you type. */}
            <div className="lr-hero-console voisss-masked-reveal voisss-masked-reveal-delay-2 voisss-specular">
              <label htmlFor="marketplace-brief" className="lr-label">
                Describe the voice you need
              </label>
              <div className="lr-hero-console-row">
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
            </div>

            <div className="lr-discover-status" role="status">
              {matchLoading && <span className="lr-quiet">matching…</span>}
              {matchUnavailable && (
                <span className="lr-quiet">
                  Matching is unavailable. You can still browse voices.{" "}
                  <Chip onClick={() => setMatchUnavailable(false)}>
                    Retry matching
                  </Chip>
                </span>
              )}
              {match?.archetype && !matchUnavailable && (
                <Badge>rubric: {match.archetype}</Badge>
              )}
              {ceremonyId && topVoice && (
                <span className="lr-match-live">
                  <span className="lr-match-live-dot" aria-hidden />
                  Best match: <strong>{voiceDisplayName(topVoice)}</strong>
                </span>
              )}
            </div>
          </header>
        </div>
      </section>

      <div className="lr-wrap">
        {/* Collapsible Filters */}
        {/* Mobile Filters (animated) */}
        <Disclosure
          title={<span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</span>}
          style={{ borderTop: "none", paddingTop: 0 }}
        >
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
              <Button
                variant="ghost"
                onClick={() => setFilters({ language: "", tone: "", licenseType: "" })}
              >
                Clear all
              </Button>
            </div>
          </div>
        </Disclosure>

        {draft.shortlist.length > 0 && (
          <section className="lr-compare" aria-label="Compare catalog samples" style={{ marginBottom: "1.5rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
              <h2 style={{ fontFamily: "var(--lr-font-display)", fontWeight: 700, fontSize: "1.125rem", margin: 0 }}>
                Compare samples · {draft.shortlist.length}/3
              </h2>
              <Chip onClick={() => updateDraft({ shortlist: [] })}>
                Clear comparison
              </Chip>
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
          <Notice tone="error">
            {error}{" "}
            <Chip onClick={() => void query.refetch()}>Retry</Chip>
          </Notice>
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
          <UnwovenGrid
            voices={displayedVoices}
            topMatchId={topMatchId}
            ceremonyId={ceremonyId}
            reasonsById={match?.reasons ?? {}}
            shortlistButton={shortlistButton}
            onPlayed={(v) => trackMatchEvent("voice_preview", v.id)}
          />
        ) : (
          !error && (
            <Notice>
              {/* Onboarding hint for first-time visitors */}
              {activeFilterCount > 0 ? (
                <>
                  <p style={{ margin: 0 }}>No voices matched these filters.</p>
                  <Chip
                    style={{ marginTop: "0.5rem" }}
                    onClick={() => setFilters({ language: "", tone: "", licenseType: "" })}
                  >
                    Clear filters
                  </Chip>
                </>
              ) : (
                <p style={{ margin: 0 }}>
                  No voices are listed in the catalog yet.{" "}
                  <Link href="/sell" style={{ color: "var(--lr-accent)" }}>
                    Contributors can record and publish in the Studio →
                  </Link>
                </p>
              )}
            </Notice>
          )
        )}

        {/* Runtime rails — dismissible so browsing stays clean; judges can restore in one click. */}
        <Disclosure title="Catalog stats, payments & trends" style={{ marginTop: "2rem" }}>
            {/* Stats bar */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
              <Badge>{totalVoices} voices</Badge>
              <Badge>{totalLicenses} licenses sold</Badge>
              <Badge>{totalUsage.toLocaleString()} total uses</Badge>
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
        </Disclosure>
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
