import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Fingerprint,
  Loader2,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

interface ReferenceSample {
  hash: string;
  url: string;
  filename: string;
  size?: number;
}

interface ContributorClonePanelProps {
  audioBlob: Blob | null;
  durationSeconds: number;
  defaultName?: string;
  contributorAddress?: string | null;
  onToastMessage: (message: string | null) => void;
  onToastType: (type: "success" | "error") => void;
}

interface CloneResult {
  voiceId: string;
  contributor: string;
  requiresVerification: boolean;
  referenceSamples: ReferenceSample[];
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  const rounded = Math.round(seconds);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatFileSize(bytes: number) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ContributorClonePanel({
  audioBlob,
  durationSeconds,
  defaultName,
  contributorAddress,
  onToastMessage,
  onToastType,
}: ContributorClonePanelProps) {
  const [voiceName, setVoiceName] = useState(defaultName || "");
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CloneResult | null>(null);

  const quality = useMemo(() => {
    if (durationSeconds >= 30) {
      return { label: "Strong", color: "text-emerald-300" };
    }
    if (durationSeconds >= 10) {
      return { label: "Usable", color: "text-amber-300" };
    }
    return { label: "Short", color: "text-red-300" };
  }, [durationSeconds]);

  const canSubmit =
    Boolean(audioBlob) &&
    voiceName.trim().length >= 2 &&
    consent &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!audioBlob || !canSubmit) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const form = new FormData();
      form.append("name", voiceName.trim());
      if (description.trim()) form.append("description", description.trim());
      form.append("consent", "true");
      form.append(
        "labels",
        JSON.stringify({
          studioVersion: "recording-studio",
          durationSeconds: Math.round(durationSeconds).toString(),
        })
      );
      form.append("samples", audioBlob, "voisss-reference.webm");

      const response = await fetch("/api/elevenlabs/clone-voice", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || "Voice cloning failed");
      }

      setResult(payload.data);
      onToastType("success");
      onToastMessage("Voice clone created and reference sample archived.");
    } catch (error) {
      console.error("Contributor voice clone failed:", error);
      onToastType("error");
      onToastMessage(
        error instanceof Error ? error.message : "Voice cloning failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-[#171717] rounded-xl border border-[#2A2A2A] shadow-xl space-y-6">
      <div className="flex items-start justify-between gap-4 bg-[#0F0F0F] -mx-6 -mt-6 p-6 rounded-t-xl border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Fingerprint className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="min-w-0">
            <h4 className="text-white font-bold text-lg">Contributor Clone</h4>
            <p className="text-gray-400 text-xs">
              IPFS archived reference sample + ElevenLabs voice ID
            </p>
          </div>
        </div>
        <div className="text-right text-xs shrink-0">
          <div className="text-gray-500 uppercase font-bold tracking-widest">
            Sample
          </div>
          <div className={`font-semibold ${quality.color}`}>{quality.label}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-3">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            Duration
          </div>
          <div className="text-white font-semibold">
            {formatDuration(durationSeconds)}
          </div>
        </div>
        <div className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-3">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            Size
          </div>
          <div className="text-white font-semibold">
            {audioBlob ? formatFileSize(audioBlob.size) : "0 KB"}
          </div>
        </div>
        <div className="rounded-lg border border-[#2A2A2A] bg-[#0F0F0F] p-3">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            Owner
          </div>
          <div className="text-white font-semibold truncate">
            {contributorAddress
              ? `${contributorAddress.slice(0, 6)}...${contributorAddress.slice(
                  -4
                )}`
              : "Signed in"}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
            Voice Name
          </span>
          <input
            value={voiceName}
            onChange={(event) => setVoiceName(event.target.value)}
            placeholder="e.g. Founder Warm Read"
            className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/60"
          />
        </label>

        <label className="block">
          <span className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
            Description
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder="Tone, allowed use, or contributor context"
            className="w-full px-3 py-2.5 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/60 resize-none"
          />
        </label>

        <label className="flex items-start gap-3 p-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg cursor-pointer hover:border-emerald-500/30 transition-colors">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900"
          />
          <span className="text-sm text-gray-300 leading-relaxed">
            I own or control this voice and consent to creating a clone for VOISSS
            licensing workflows.
          </span>
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            canSubmit
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/30"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Archiving + cloning
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              Create Voice Clone
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Clone Ready
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <div>
              <span className="text-gray-500">Voice ID:</span>{" "}
              <span className="text-gray-200 break-all">{result.voiceId}</span>
            </div>
            {result.referenceSamples.map((sample) => (
              <a
                key={sample.hash}
                href={sample.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-emerald-300 hover:text-emerald-200 break-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                {sample.hash}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
