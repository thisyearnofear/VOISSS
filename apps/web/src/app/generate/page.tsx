"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Mic, Pause, Play, Share2, Check, Zap } from "lucide-react";
import { BuyCreditsModal } from "../../components/payment/BuyCreditsModal";
import { MascotEvents, publishAppEvent } from "@/lib/mascot-events";
import type { MarketplaceVoice } from "@/lib/marketplace-indexer";
import { useListeningRoom, useListeningPlayback } from "@/contexts/ListeningRoomContext";
import { useVoiceCatalog } from "@/hooks/useVoiceCatalog";
import { pickInitialVoice } from "@/lib/listening-room";
import { parsePreviewAllowance, readPreviewResponse } from "@/lib/listening-preview";
import { VoiceAuditionRow, voiceDisplayName, voiceMetaLine } from "@/components/listening/VoiceAuditionRow";

const DEMO_GENERATIONS_KEY = "voisss_demo_generations";
const MAX_GENERATIONS = 3;

const SAMPLE_TEXTS = [
  {
    label: "Welcome",
    text: "Welcome back. Today we are looking at a small idea that grew into something much bigger — and the people who made it happen.",
  },
  {
    label: "Story opening",
    text: "The train was already moving when she reached the platform. She watched it go, then sat down on the bench and opened her notebook.",
  },
  {
    label: "Explainer",
    text: "Here is how it works. You describe the voice you need, listen to real samples, and then try the winning voice on your own words.",
  },
  {
    label: "Outro",
    text: "That is all for this week. Thanks for listening — and if this helped, share it with someone who would enjoy it too.",
  },
];

function GeneratePageInner() {
  const searchParams = useSearchParams();
  const { draft, ready, updateDraft, player } = useListeningRoom();
  const playback = useListeningPlayback();
  const { query, voices } = useVoiceCatalog();

  const [selectedVoice, setSelectedVoice] = useState<MarketplaceVoice | null>(null);
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioIsBlob, setAudioIsBlob] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationsLeft, setGenerationsLeft] = useState(MAX_GENERATIONS);
  const [allowanceReady, setAllowanceReady] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [archetype, setArchetype] = useState<string | undefined>(undefined);
  const generationToken = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const lastAppliedParams = useRef<string | null>(null);

  const text = draft.script;
  const brief = draft.brief;

  const releaseResultUrl = useCallback(() => {
    if (resultUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(resultUrlRef.current);
    }
    resultUrlRef.current = null;
  }, []);

  const clearResult = useCallback(() => {
    const snap = player.getSnapshot();
    if (
      snap.track?.kind === "generation" &&
      resultUrlRef.current &&
      snap.track.url === resultUrlRef.current
    ) {
      player.stop();
    }
    releaseResultUrl();
    setAudioUrl(null);
    setAudioIsBlob(false);
    setError(null);
    setCopied(false);
    setCopyError(false);
  }, [player, releaseResultUrl]);

  // Load the real marketplace catalog — same voices buyers see.
  // Seed brief from deep link — e.g. /generate?brief=calm meditation narrator
  useEffect(() => {
    if (!ready || !query.isSuccess || !voices.length) return;
    const key = searchParams.toString();
    if (lastAppliedParams.current === key) return;
    lastAppliedParams.current = key;

    generationToken.current += 1;
    abortRef.current?.abort();
    setGenerating(false);
    clearResult();

    const requested = searchParams.get("voiceId");
    const { voice, requestedInvalid } = pickInitialVoice(
      voices,
      requested,
      draft.voiceId
    );
    if (requested && requestedInvalid) {
      setVoiceUnavailable(true);
      setSelectedVoice(null);
      updateDraft({ voiceId: "" });
    } else {
      setVoiceUnavailable(false);
      setSelectedVoice(voice);
      if (voice) updateDraft({ voiceId: voice.id });
    }
    const paramBrief = searchParams.get("brief");
    if (paramBrief !== null) updateDraft({ brief: paramBrief.slice(0, 500) });
  }, [searchParams, ready, query.isSuccess, voices, draft.voiceId, updateDraft, clearResult]);

  // Persist free generation count in localStorage
  useEffect(() => {
    try {
      setGenerationsLeft(
        parsePreviewAllowance(localStorage.getItem(DEMO_GENERATIONS_KEY))
      );
    } catch {
      // localStorage unavailable — use default
    }
    setAllowanceReady(true);
  }, []);

  useEffect(() => {
    if (!allowanceReady) return;
    try {
      localStorage.setItem(DEMO_GENERATIONS_KEY, String(generationsLeft));
    } catch {
      // silent
    }
  }, [generationsLeft, allowanceReady]);

  // Optional intent matching — reorders the picker and shows fit + reasons.
  useEffect(() => {
    setArchetype(undefined);
    if (brief.trim().length < 3) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/marketplace/voice-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief: brief.trim() }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!controller.signal.aborted && data.success) {
          setArchetype(data.data.archetype);
        }
      } catch (e) {
        if (!controller.signal.aborted) console.error("Voice match failed:", e);
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [brief]);

  useEffect(() => {
    return () => {
      generationToken.current += 1;
      abortRef.current?.abort();
      const snap = player.getSnapshot();
      if (
        snap.track?.kind === "generation" &&
        resultUrlRef.current &&
        snap.track.url === resultUrlRef.current
      ) {
        player.stop();
      }
      releaseResultUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScriptChange = (value: string) => {
    updateDraft({ script: value.slice(0, 500) });
    clearResult();
  };

  const handleVoiceChange = (id: string) => {
    const voice = voices.find((v) => v.id === id) || null;
    setSelectedVoice(voice);
    setVoiceUnavailable(false);
    updateDraft({ voiceId: voice?.id ?? "" });
    clearResult();
  };

  const handleGenerate = async () => {
    if (
      !ready ||
      !allowanceReady ||
      generating ||
      !selectedVoice ||
      generationsLeft <= 0 ||
      !text.trim()
    ) {
      return;
    }

    const myToken = ++generationToken.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    clearResult();
    player.stop();
    publishAppEvent({
      type: "voice:generate",
      voiceId: selectedVoice.contractVoiceId || selectedVoice.id,
    });

    try {
      const response = await fetch("/api/agents/vocalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Demo-Mode": "true",
        },
        body: JSON.stringify({
          text: text.trim().slice(0, 500),
          voiceId: selectedVoice.contractVoiceId || selectedVoice.id,
          agentAddress: "0xDEMO0000000000000000000000000000000000001",
          preview: true,
          archetype,
        }),
        signal: controller.signal,
      });

      // Preview responses stream audio/mpeg directly; errors stay JSON.
      const result = await readPreviewResponse(response, controller.signal);
      if (generationToken.current !== myToken) {
        if (result.isBlob) URL.revokeObjectURL(result.url);
        return;
      }
      resultUrlRef.current = result.url;
      setAudioUrl(result.url);
      setAudioIsBlob(result.isBlob);
      setGenerationsLeft((prev) => Math.max(0, prev - 1));
      publishAppEvent({
        type: "voice:complete",
        voiceId: selectedVoice.contractVoiceId || selectedVoice.id,
      });
      // Outcome telemetry — a completed generation is the strongest signal in
      // the match funnel (brief → shown → previewed → vocalized).
      fetch("/api/marketplace/match-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "voice_vocalize",
          voiceId: selectedVoice.id,
          brief: brief.trim(),
        }),
        keepalive: true,
      }).catch(() => {});
    } catch (err) {
      if (generationToken.current !== myToken) return;
      if (err instanceof Error && err.name === "AbortError") return;
      const errMsg = err instanceof Error ? err.message : "Generation failed";
      setError(errMsg);
      publishAppEvent({ type: "error", message: `voice generation: ${errMsg}` });
    } finally {
      if (generationToken.current === myToken) {
        setGenerating(false);
      }
    }
  };

  const generationTrack = audioUrl && selectedVoice
    ? {
        id: `generation:${selectedVoice.id}:${audioUrl.slice(-24)}`,
        url: audioUrl,
        title: voiceDisplayName(selectedVoice),
        subtitle: "Your words",
        kind: "generation" as const,
      }
    : null;
  const generationPlaying =
    generationTrack &&
    playback.track?.id === generationTrack.id &&
    playback.status === "playing";

  const shareVoiceLink = useCallback(async () => {
    if (!selectedVoice) return;
    const link = `${window.location.origin}/generate?voiceId=${encodeURIComponent(selectedVoice.contractVoiceId || selectedVoice.id)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  }, [selectedVoice]);

  const voicePicker = (
    <div>
      <label htmlFor="voice-select" className="lr-label">
        Choose a voice
      </label>
      <select
        id="voice-select"
        className="lr-select"
        value={selectedVoice?.id ?? ""}
        onChange={(e) => handleVoiceChange(e.target.value)}
        disabled={generating || query.isLoading}
      >
        {query.isLoading && <option value="">Loading voices…</option>}
        {!query.isLoading && voices.length === 0 && (
          <option value="">No voices available</option>
        )}
        {!selectedVoice && !query.isLoading && voices.length > 0 && (
          <option value="">Select a voice</option>
        )}
        {voices.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voiceDisplayName(voice)}
            {voiceMetaLine(voice) ? ` — ${voiceMetaLine(voice)}` : ""}
          </option>
        ))}
      </select>

      {selectedVoice && (
        <div style={{ marginTop: "0.75rem" }}>
          <VoiceAuditionRow voice={selectedVoice} showUse={false} />
          <p className="lr-quiet" style={{ marginTop: "0.5rem" }}>
            <Link href={`/marketplace/voices/${encodeURIComponent(selectedVoice.id)}`} style={{ color: "var(--lr-night-accent)" }}>
              Source &amp; rights details →
            </Link>
          </p>
        </div>
      )}

      {/* Brief → suggested voices */}
      <div style={{ marginTop: "1rem" }}>
        <label htmlFor="workspace-brief" className="lr-label">
          Brief (optional — guides matching)
        </label>
        <input
          id="workspace-brief"
          type="text"
          className="lr-input"
          value={brief}
          onChange={(e) => updateDraft({ brief: e.target.value.slice(0, 500) })}
          placeholder="calm meditation narrator"
          maxLength={500}
          disabled={generating}
        />
      </div>
    </div>
  );

  return (
    <main id="listening-main">
      <MascotEvents />
      <div className="lr-wrap">
        {/* Header */}
        <nav className="lr-breadcrumb" aria-label="Breadcrumb">
          <Link href="/marketplace">Discover voices</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">Workspace</span>
        </nav>

        <h1 className="lr-h1" style={{ marginTop: "1rem", fontSize: "clamp(2.2rem, 4vw, 3.4rem)" }}>
          Give your words a voice.
        </h1>
        <p className="lr-quiet" role="status">
          {allowanceReady && generationsLeft > 0
            ? `${generationsLeft} preview generation${generationsLeft !== 1 ? "s" : ""} remaining in this browser`
            : allowanceReady
              ? "Preview limit reached in this browser"
              : "…"}
        </p>

        {query.isError && (
          <p className="lr-notice lr-error-text" role="status" style={{ marginTop: "1rem" }}>
            Voices could not be loaded.{" "}
            <button type="button" className="lr-chip" onClick={() => void query.refetch()}>
              Retry
            </button>
          </p>
        )}

        {voiceUnavailable && (
          <p className="lr-notice lr-error-text" role="status" style={{ marginTop: "1rem" }}>
            This voice is unavailable. Choose another voice.
          </p>
        )}

        {/* Main card */}
        <div className="lr-workspace-grid" style={{ marginTop: "1.5rem" }}>
          {/* Text */}
          <section className="lr-panel" aria-label="Script">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <label htmlFor="script-editor" className="lr-label" style={{ marginBottom: 0 }}>
                Your script
              </label>
              <span className="lr-quiet" style={{ margin: 0 }}>{text.length}/500</span>
            </div>
            <div className="lr-examples" style={{ marginTop: 0, marginBottom: "0.75rem" }}>
              {SAMPLE_TEXTS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  className="lr-chip"
                  onClick={() => handleScriptChange(sample.text)}
                  disabled={generating}
                >
                  {sample.label}
                </button>
              ))}
            </div>
            <textarea
              id="script-editor"
              className="lr-textarea"
              value={text}
              onChange={(e) => handleScriptChange(e.target.value)}
              rows={10}
              maxLength={500}
              placeholder="Type or paste your text here…"
              disabled={generating}
            />

            {error && (
              <p className="lr-error-text" role="status" style={{ marginTop: "0.75rem" }}>
                {error}
              </p>
            )}

            {/* Actions */}
            <div style={{ marginTop: "1rem" }}>
              {generationsLeft > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!ready || !allowanceReady || generating || !text.trim() || !selectedVoice}
                    id="generate-btn"
                    className="lr-btn lr-btn-primary"
                    style={{ width: "100%" }}
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
                  </button>
                  <p className="lr-quiet" style={{ textAlign: "center" }}>
                    Free preview · up to 500 characters
                  </p>
                </>
              ) : (
                <div className="lr-notice">
                  {/* Conversion */}
                  <p style={{ margin: 0, fontWeight: 600 }}>Preview limit reached</p>
                  <p style={{ margin: "0.4rem 0 0.75rem" }}>
                    Browser previews are used up. Credits are for API usage.
                  </p>
                  {/* API teaser */}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <Link href="/developers" className="lr-btn lr-btn-ghost">Developers</Link>
                    <button
                      type="button"
                      className="lr-btn lr-btn-primary"
                      onClick={() => setShowBuyCredits(true)}
                    >
                      <Zap className="w-4 h-4" aria-hidden /> Buy API credits
                    </button>
                  </div>
                </div>
              )}
            </div>

            {audioUrl && generationTrack && (
              <div className="lr-result">
                <p style={{ margin: 0, fontWeight: 600 }}>Your preview is ready</p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                  <button
                    type="button"
                    className="lr-btn lr-btn-ghost"
                    onClick={() => void player.toggle(generationTrack)}
                  >
                    {generationPlaying ? (
                      <><Pause className="w-4 h-4" aria-hidden /> Pause</>
                    ) : (
                      <><Play className="w-4 h-4" aria-hidden /> Play</>
                    )}
                  </button>
                  <a
                    className="lr-btn lr-btn-ghost"
                    href={audioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={audioIsBlob ? "voisss-preview.mp3" : undefined}
                  >
                    Open audio
                  </a>
                  <button
                    type="button"
                    className="lr-btn lr-btn-ghost"
                    onClick={() => void shareVoiceLink()}
                  >
                    {copied ? (
                      <><Check className="w-4 h-4" aria-hidden /> Copied</>
                    ) : (
                      <><Share2 className="w-4 h-4" aria-hidden /> Copy voice link</>
                    )}
                  </button>
                </div>
                {copyError && (
                  <p className="lr-error-text" role="status" style={{ marginTop: "0.5rem" }}>
                    Could not copy the link.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Voice picker — real catalog, match-ordered when a brief is set */}
          <details className="lr-panel" open>
            <summary style={{ cursor: "pointer", fontFamily: "var(--lr-font-display)", fontWeight: 700 }}>
              Voice
            </summary>
            <div style={{ marginTop: "0.75rem" }}>{voicePicker}</div>
          </details>
        </div>

        <BuyCreditsModal
          isOpen={showBuyCredits}
          onClose={() => setShowBuyCredits(false)}
        />
      </div>
    </main>
  );
}

export default function GeneratePage() {
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
      <GeneratePageInner />
    </Suspense>
  );
}
