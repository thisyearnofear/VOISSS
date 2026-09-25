"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  Loader2,
  Mic,
  Pause,
  Play,
  Plus,
  Share2,
} from "lucide-react";
import type { MarketplaceVoice } from "@/lib/marketplace-indexer";
import { workspaceHref } from "@/lib/listening-room";
import { SAMPLE_SCRIPTS } from "@/lib/listening-preview";
import { useVoicePreview } from "@/hooks/useVoicePreview";
import {
  formatMonthlyPriceUsdc,
  isEvmAddress,
  voiceDisplayName,
  voiceSpecRows,
} from "@/lib/voice-detail";
import {
  useListeningPlayback,
  useListeningRoom,
} from "@/contexts/ListeningRoomContext";
import { Badge, Button, Chip, Disclosure, Notice } from "@/components/ui";
import { voiceMetaLine } from "./VoiceAuditionRow";
import { pulseVoice } from "@/lib/terrain-bus";

/**
 * Single-voice listening room — the detail surface buyers land on from a
 * marketplace row. Tier 0: audition the sample, try your own script, use the
 * voice. Tier 1: specs/provenance behind disclosures. All audio goes through
 * the shared Listening Room player; the preview allowance is the same
 * browser-wide budget the workspace uses.
 */
export function VoiceListeningRoom({ voice }: { voice: MarketplaceVoice }) {
  const { draft, updateDraft, toggleShortlist, player } = useListeningRoom();
  const playback = useListeningPlayback();

  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const name = voiceDisplayName(voice);
  const metaLine = voiceMetaLine(voice);
  const script = draft.script;

  // Outcome events feed rubric reweighting — fire-and-forget, never blocks UI.
  const trackMatchEvent = (event: "voice_preview" | "voice_vocalize") => {
    fetch("/api/marketplace/match-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        voiceId: voice.id,
        brief: draft.brief.trim(),
      }),
      keepalive: true,
    }).catch(() => {});
  };

  // Free preview lifecycle (allowance, request, race guards, result track)
  // lives in the shared hook — same browser-wide budget as the workspace.
  const {
    generate,
    clearResult,
    generating,
    error,
    audioUrl,
    audioIsBlob,
    generationsLeft,
    allowanceReady,
    resultTrack: generationTrack,
  } = useVoicePreview(voice, name, {
    onVocalized: () => trackMatchEvent("voice_vocalize"),
  });

  const sampleTrack = voice.sampleUrl
    ? {
        id: `sample:${voice.id}`,
        url: voice.sampleUrl,
        title: name,
        subtitle: metaLine || undefined,
        kind: "sample" as const,
      }
    : null;
  const sampleCurrent = sampleTrack !== null && playback.track?.id === sampleTrack.id;
  const samplePlaying = sampleCurrent && playback.status === "playing";
  const sampleLoading = sampleCurrent && playback.status === "loading";

  const handleGenerate = () => {
    setCopied(false);
    setCopyError(false);
    void generate(script);
  };

  const generationPlaying =
    generationTrack !== null &&
    playback.track?.id === generationTrack.id &&
    playback.status === "playing";

  const shareVoiceLink = async () => {
    const link = `${window.location.origin}/marketplace/voices/${encodeURIComponent(voice.id)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };

  const shortlisted = draft.shortlist.includes(voice.id);
  const shortlistFull = draft.shortlist.length >= 3;
  const specRows = voiceSpecRows(voice);
  const sampleLabel = !sampleTrack
    ? `${name} — sample unavailable`
    : sampleLoading
      ? `Cancel loading ${name}`
      : samplePlaying
        ? `Pause ${name}`
        : `Play ${name}`;

  const handlePlaySample = () => {
    if (!sampleTrack) return;
    void player.toggle(sampleTrack).then((started) => {
      if (started && !sampleCurrent) {
        pulseVoice("lift");
        trackMatchEvent("voice_preview");
      }
    });
  };

  const handleScriptChange = (value: string) => {
    updateDraft({ script: value.slice(0, 500) });
    clearResult();
    setCopied(false);
    setCopyError(false);
  };

  return (
    <main id="listening-main">
      <div className="lr-wrap">
        <nav className="lr-breadcrumb" aria-label="Breadcrumb">
          <Link href="/marketplace">Discover voices</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">{name}</span>
        </nav>

        <header
          className="lr-discover-head"
          style={{ paddingTop: "var(--lr-space-md)" }}
        >
          <h1
            className="lr-h1"
            style={{ fontSize: "clamp(2.2rem, 4vw, 3.4rem)" }}
          >
            {name}
          </h1>
          <p className="lr-lede">
            {metaLine ? `${metaLine}.` : "Marketplace voice."}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginTop: "1rem",
            }}
          >
            <Badge>
              {voice.licenseType === "exclusive"
                ? "Exclusive license"
                : "Non-exclusive license"}
            </Badge>
            <Badge>${formatMonthlyPriceUsdc(voice.price)}/mo</Badge>
            {voice.trust?.badge && <Badge>{voice.trust.badge}</Badge>}
            <Badge>{voice.stats.usageCount.toLocaleString()} uses</Badge>
            <Badge>{voice.stats.purchases.toLocaleString()} sales</Badge>
          </div>
        </header>

        {/* Tier 0 — audition the voice, then act on it. */}
        <section className="lr-hero-audition" aria-label={`Audition ${name}`}>
          <button
            type="button"
            className="lr-play lr-play-lg"
            onClick={handlePlaySample}
            disabled={!sampleTrack}
            aria-label={sampleLabel}
            title={sampleTrack ? undefined : "Sample unavailable"}
          >
            {samplePlaying || sampleLoading ? (
              <Pause className="w-6 h-6" aria-hidden />
            ) : (
              <Play className="w-6 h-6" aria-hidden />
            )}
          </button>
          <div className="lr-hero-audition-main">
            <div className="lr-vrow-title" style={{ fontSize: "1.125rem" }}>
              {sampleTrack ? "Audition sample" : "No uploaded sample"}
            </div>
            <div className="lr-vrow-meta">
              {sampleTrack
                ? metaLine || "Catalog voice"
                : "Hear this voice on your own script below."}
            </div>
            <div className="lr-hero-audition-actions">
              <Link
                className="lr-btn lr-btn-primary"
                href={workspaceHref(voice.id, draft.brief)}
                onClick={() => updateDraft({ voiceId: voice.id })}
              >
                Use this voice
              </Link>
              <button
                type="button"
                className="lr-shortlist"
                aria-pressed={shortlisted}
                aria-label={
                  shortlisted
                    ? `Remove ${name} from comparison`
                    : `Add ${name} to comparison`
                }
                disabled={!shortlisted && shortlistFull}
                onClick={() => toggleShortlist(voice.id)}
                title={
                  shortlisted ? "Remove from comparison" : "Add to comparison"
                }
              >
                {shortlisted ? (
                  <Check className="w-4 h-4" aria-hidden />
                ) : (
                  <Plus className="w-4 h-4" aria-hidden />
                )}
              </button>
            </div>
          </div>
        </section>
        {/* Tier 0 — hear your own words. Preview allowance is the same
            browser-wide budget the workspace uses. */}
        <section
          className="lr-audition"
          style={{ marginTop: "var(--lr-space-lg)" }}
          aria-label="Try your script"
        >
          <div className="lr-audition-head">
            <h2>Try your script</h2>
            <span role="status">
              {allowanceReady && generationsLeft > 0
                ? `${generationsLeft} preview${generationsLeft !== 1 ? "s" : ""} left`
                : allowanceReady
                  ? "Preview limit reached"
                  : "…"}
            </span>
          </div>
          <div
            className="lr-examples"
            style={{ marginTop: 0, marginBottom: "0.75rem" }}
          >
            {SAMPLE_SCRIPTS.map((sample) => (
              <Chip
                key={sample.label}
                onClick={() => handleScriptChange(sample.text)}
                disabled={generating}
              >
                {sample.label}
              </Chip>
            ))}
          </div>
          <textarea
            id="voice-script"
            className="lr-textarea"
            aria-label="Script to preview"
            value={script}
            onChange={(e) => handleScriptChange(e.target.value)}
            rows={6}
            maxLength={500}
            placeholder="Type or paste your text here…"
            disabled={generating}
          />

          {error && (
            <p
              className="lr-error-text"
              role="status"
              style={{ marginTop: "0.75rem" }}
            >
              {error}
            </p>
          )}

          {generationsLeft > 0 ? (
            <>
              <div style={{ marginTop: "1rem" }}>
                <Button
                  onClick={handleGenerate}
                  disabled={!allowanceReady || generating || !script.trim()}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                      <span>Generating…</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" aria-hidden />
                      <span>Generate preview</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="lr-quiet">
                Free preview · up to 500 characters · shared with the workspace
              </p>
            </>
          ) : (
            <Notice style={{ marginTop: "1rem" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Preview limit reached</p>
              <p style={{ margin: "0.4rem 0 0.75rem" }}>
                Browser previews are used up. Credits are for API usage.
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Link
                  href={workspaceHref(voice.id, draft.brief)}
                  className="lr-btn lr-btn-ghost"
                  onClick={() => updateDraft({ voiceId: voice.id })}
                >
                  Open the workspace
                </Link>
                <Link href="/developers" className="lr-btn lr-btn-ghost">
                  Developers
                </Link>
              </div>
            </Notice>
          )}

          {audioUrl && generationTrack && (
            <div className="lr-result">
              <p style={{ margin: 0, fontWeight: 600 }}>Your preview is ready</p>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  marginTop: "0.75rem",
                }}
              >
                <Button
                  variant="ghost"
                  onClick={() => void player.toggle(generationTrack)}
                >
                  {generationPlaying ? (
                    <>
                      <Pause className="w-4 h-4" aria-hidden /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" aria-hidden /> Play
                    </>
                  )}
                </Button>
                <a
                  className="lr-btn lr-btn-ghost"
                  href={audioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={audioIsBlob ? "voisss-preview.mp3" : undefined}
                >
                  Open audio
                </a>
                <Button variant="ghost" onClick={() => void shareVoiceLink()}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden /> Copied
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" aria-hidden /> Copy voice link
                    </>
                  )}
                </Button>
              </div>
              {copyError && (
                <p
                  className="lr-error-text"
                  role="status"
                  style={{ marginTop: "0.5rem" }}
                >
                  Could not copy the link.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Tier 1 — specs, rights, and provenance behind disclosures.
            Shared `name` makes the two an exclusive accordion; `id`s allow
            hash deep-links (browsers auto-open targeted details). */}
        <div style={{ paddingBottom: "var(--lr-space-2xl)" }}>
          <Disclosure
            title="Specs & licensing"
            variant="section"
            name="voice-detail"
            id="specs"
            style={{ marginTop: "var(--lr-space-xl)" }}
          >
            <dl className="lr-specs">
              {specRows.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
            {voice.voiceProfile?.tags && voice.voiceProfile.tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  marginTop: "1rem",
                }}
              >
                {voice.voiceProfile.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            )}
          </Disclosure>

          <Disclosure
            title="Provenance & trust — inspectable chain"
            variant="section"
            name="voice-detail"
            id="provenance"
          >
            {/* HUD provenance rail — TxHash → chain → settle */}
            <div className="voisss-hud-frame p-4 mb-4">
              <div className="absolute inset-0 rounded-[16px] opacity-[0.035]" style={{ background: "repeating-linear-gradient(to bottom, transparent 0 2px, rgba(255,255,255,0.9) 2px 3px)" }} aria-hidden />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] mb-3">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/50">source: {voice.provenance?.source ?? "catalog"}</span>
                  {voice.trust?.badge && <span className="rounded-full border border-[#D6FF2A]/20 bg-[#D6FF2A]/10 px-2 py-0.5 text-[#0A0E1A] font-bold">{voice.trust.badge}</span>}
                  {voice.reputation && <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/50">threat: {voice.reputation.threatLevel}</span>}
                  {voice.provenance?.listingTxHash && (
                    <a href={`https://basescan.org/tx/${voice.provenance.listingTxHash}`} target="_blank" rel="noopener noreferrer" className="voisss-phosphor rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 hover:bg-amber-500/15 transition-colors">
                      Tx {voice.provenance.listingTxHash.slice(0, 10)}…{voice.provenance.listingTxHash.slice(-4)} ↗
                    </a>
                  )}
                  {voice.provenance?.contractAddress && !voice.provenance?.listingTxHash && (
                    <a href={`https://basescan.org/address/${voice.provenance.contractAddress}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/60 hover:text-white transition-colors">
                      Contract ↗
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-white/40">
                  <span className="h-px flex-1 bg-gradient-to-r from-[#D6FF2A]/50 via-[#D6FF2A]/20 to-transparent" aria-hidden />
                  <span className="voisss-phosphor text-[10px]">70%</span>
                  <span className="h-2 w-px bg-white/20" aria-hidden />
                  <span className="text-cyan-400/70">30%</span>
                  <span className="h-px flex-1 bg-gradient-to-l from-cyan-500/30 via-cyan-500/10 to-transparent" aria-hidden />
                </div>
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-white/45">
                  contributor → <span className="text-white/70">70%</span> · protocol → 30% · <span className="voisss-phosphor">platformFeeBps 3000</span> · VoiceLicenseMarket.sol · Base 8453
                </p>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "0.9375rem" }}>
              {voice.trust?.details || "No additional provenance details."}
            </p>
            <p style={{ margin: "0.75rem 0 0", overflowWrap: "anywhere", fontFamily: "var(--lr-font-mono)", fontSize: "0.8125rem", color: "var(--lr-muted)" }}>
              Contributor <code className="voisss-phosphor text-xs">{voice.contributorAddress}</code>
            </p>
            {isEvmAddress(voice.contributorAddress) && (
              <p style={{ margin: 0 }}>
                <a
                  href={`https://basescan.org/address/${voice.contributorAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--lr-accent)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    minHeight: "44px",
                    fontFamily: "var(--lr-font-mono)",
                    fontSize: "0.8125rem",
                  }}
                >
                  View on Basescan <ExternalLink className="w-3 h-3" aria-hidden />
                </a>
              </p>
            )}
          </Disclosure>
        </div>
      </div>
    </main>
  );
}

