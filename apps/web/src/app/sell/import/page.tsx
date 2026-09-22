"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Pause, Play, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useListeningPlayback,
  useListeningRoom,
} from "@/contexts/ListeningRoomContext";
import { Button, Chip, Notice } from "@/components/ui";

interface ElevenLabsVoice {
  voiceId: string;
  name: string;
  elevenlabsVoiceId: string;
  previewUrl?: string;
}

type Step = "connect" | "api-key" | "select" | "done";

/** Shared-player preview button for an imported voice's ElevenLabs sample. */
function ImportPreviewButton({ voice }: { voice: ElevenLabsVoice }) {
  const { player } = useListeningRoom();
  const playback = useListeningPlayback();
  if (!voice.previewUrl) return null;
  const track = {
    id: `import:${voice.voiceId}`,
    url: voice.previewUrl,
    title: voice.name,
    subtitle: "ElevenLabs preview",
    kind: "sample" as const,
  };
  const isCurrent = playback.track?.id === track.id;
  const playing = isCurrent && playback.status === "playing";
  const loading = isCurrent && playback.status === "loading";
  return (
    <button
      type="button"
      className="lr-play"
      onClick={() => void player.toggle(track)}
      aria-label={
        loading
          ? `Cancel loading ${voice.name}`
          : playing
            ? `Pause ${voice.name}`
            : `Play ${voice.name}`
      }
    >
      {playing || loading ? (
        <Pause className="w-4 h-4" aria-hidden />
      ) : (
        <Play className="w-4 h-4" aria-hidden />
      )}
    </button>
  );
}

export default function ImportVoicePage() {
  const { isAuthenticated, signIn, isAuthenticating } = useAuth();
  const [step, setStep] = useState<Step>(isAuthenticated ? "api-key" : "connect");
  const [apiKey, setApiKey] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function handleFetchVoices() {
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("/api/elevenlabs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const json = await res.json();
      if (!json.success) {
        setApiError(json.error || "Failed to fetch voices");
        return;
      }
      setVoices(json.data.voices);
      setSelected(new Set(json.data.voices.map((v: ElevenLabsVoice) => v.voiceId)));
      setStep("select");
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleVoice(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleImport() {
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch("/api/elevenlabs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          selectedVoiceIds: Array.from(selected),
          mode: "import",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setApiError(json.error || "Unable to import voices. Please try again.");
        return;
      }
      setStep("done");
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "connect") {
    return (
      <main id="listening-main">
        <div className="lr-wrap" style={{ paddingBottom: "var(--lr-space-2xl)" }}>
          <header className="lr-discover-head">
            <h1 className="lr-h1" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Import your voice.
            </h1>
            <p className="lr-lede">
              List your ElevenLabs voices on VOISSS and earn 70% of every
              license.
            </p>
          </header>
          <Notice>
            <p style={{ margin: "0 0 0.75rem" }}>
              Connect your wallet to continue.
            </p>
            <Button
              onClick={() => {
                void signIn().catch((error: unknown) => {
                  setApiError(
                    error instanceof Error
                      ? error.message
                      : "Wallet connection failed.",
                  );
                });
              }}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? "Connecting wallet…" : "Connect wallet"}
            </Button>
            {apiError && (
              <p className="lr-error-text" role="status" style={{ margin: "0.75rem 0 0" }}>
                {apiError}
              </p>
            )}
          </Notice>
        </div>
      </main>
    );
  }

  if (step === "api-key") {
    return (
      <main id="listening-main">
        <div
          className="lr-wrap"
          style={{ maxWidth: "40rem", paddingBottom: "var(--lr-space-2xl)" }}
        >
          <header className="lr-discover-head">
            <Chip onClick={() => setStep("connect")}>&larr; Back</Chip>
            <h1
              className="lr-h1"
              style={{ marginTop: "1rem", fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
            >
              Enter your ElevenLabs API key
            </h1>
            <p className="lr-lede" style={{ fontSize: "1rem" }}>
              Your key is sent directly to ElevenLabs and never stored. It&apos;s
              used once to verify ownership of your voices.
            </p>
          </header>
          <label htmlFor="el-api-key" className="lr-label">
            API key
          </label>
          <input
            id="el-api-key"
            type="password"
            className="lr-input"
            style={{ width: "100%" }}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk_..."
          />
          {apiError && (
            <p className="lr-error-text" role="status" style={{ margin: "0.75rem 0 0" }}>
              {apiError}
            </p>
          )}
          <div style={{ marginTop: "1rem" }}>
            <Button
              onClick={handleFetchVoices}
              disabled={!apiKey.startsWith("sk_") || loading}
              style={{ width: "100%" }}
            >
              {loading ? "Fetching voices…" : "Continue"}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (step === "select") {
    return (
      <main id="listening-main">
        <div
          className="lr-wrap"
          style={{ maxWidth: "48rem", paddingBottom: "var(--lr-space-2xl)" }}
        >
          <header className="lr-discover-head">
            <Chip onClick={() => setStep("api-key")}>&larr; Back</Chip>
            <h1
              className="lr-h1"
              style={{ marginTop: "1rem", fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
            >
              Select voices to import
            </h1>
            <p className="lr-lede" style={{ fontSize: "1rem" }}>
              Listen first, then choose which voices to list. You earn 70% of
              all licensing revenue.
            </p>
          </header>

          <div>
            {voices.map((voice) => (
              <div className="lr-vrow" key={voice.voiceId}>
                {voice.previewUrl ? (
                  <ImportPreviewButton voice={voice} />
                ) : (
                  <span style={{ width: 44, height: 44 }} aria-hidden />
                )}
                <div className="lr-vrow-main">
                  <div className="lr-vrow-title">{voice.name}</div>
                  <div className="lr-vrow-meta">{voice.voiceId}</div>
                </div>
                <div className="lr-vrow-actions">
                  <Chip
                    aria-pressed={selected.has(voice.voiceId)}
                    onClick={() => toggleVoice(voice.voiceId)}
                  >
                    {selected.has(voice.voiceId) ? (
                      <>
                        <Check className="w-4 h-4" aria-hidden /> Selected
                      </>
                    ) : (
                      "Select"
                    )}
                  </Chip>
                </div>
              </div>
            ))}
          </div>

          <Notice style={{ marginTop: "var(--lr-space-lg)" }}>
            <p style={{ margin: 0 }}>
              You earn <strong>70%</strong> of every license.
            </p>
            <p style={{ margin: "0.25rem 0 0" }}>
              Platform fee: 30%. Set your own per-character pricing after
              import.
            </p>
          </Notice>

          <div style={{ marginTop: "1rem" }}>
            <Button
              onClick={() => void handleImport()}
              disabled={selected.size === 0 || loading}
              style={{ width: "100%" }}
            >
              <Upload className="w-4 h-4" aria-hidden />
              {loading
                ? "Saving import…"
                : `Import ${selected.size} voice${selected.size !== 1 ? "s" : ""}`}
            </Button>
          </div>
          {apiError && (
            <p className="lr-error-text" role="status" style={{ margin: "0.75rem 0 0" }}>
              {apiError}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main id="listening-main">
      <div className="lr-wrap" style={{ paddingBottom: "var(--lr-space-2xl)" }}>
        <header className="lr-discover-head">
          <h1 className="lr-h1" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Voices imported.
          </h1>
          <p className="lr-lede">
            {selected.size} voice{selected.size !== 1 ? "s" : ""} saved and
            queued for marketplace publishing.
          </p>
        </header>
        <Notice>
          <p style={{ margin: "0 0 0.75rem" }}>
            We&apos;ll show each listing in your dashboard once publishing is
            complete.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Link href="/sell/dashboard" className="lr-btn lr-btn-primary">
              View dashboard
            </Link>
            <Link href="/sell" className="lr-btn lr-btn-ghost">
              Record more voices
            </Link>
          </div>
        </Notice>
      </div>
    </main>
  );
}

