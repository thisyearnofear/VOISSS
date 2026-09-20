"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mic,
  Play,
  Pause,
  Loader2,
  Sparkles,
  Zap,
  CheckCircle,
  ArrowRight,
  Volume2,
  Share2,
  Check,
} from "lucide-react";
import { BuyCreditsModal } from "../../components/payment/BuyCreditsModal";
import { MascotEvents, publishAppEvent } from "@/lib/mascot-events";
import type { MarketplaceVoice } from "@/lib/marketplace-indexer";

const DEMO_GENERATIONS_KEY = "voisss_demo_generations";

const SAMPLE_TEXTS = [
  {
    label: "Podcast Intro",
    text: "Welcome to the future of voice. Today we're exploring how AI agents are reshaping the creator economy — and why authentic human voices still matter more than ever.",
  },
  {
    label: "Product Ad",
    text: "Introducing VOISSS — the voice marketplace where AI agents pay humans for their most uniquely valuable asset. Real voices. Real income. Zero middlemen.",
  },
  {
    label: "Tech Explainer",
    text: "Every time an AI agent needs to speak, it searches our marketplace, finds a licensed human voice, pays in USDC, and receives studio-quality audio in milliseconds.",
  },
  {
    label: "YouTube Narration",
    text: "In the next ninety seconds, you'll hear why over twenty voice contributors are already earning passive income on VOISSS — and how you can too.",
  },
];

type GenerateStep = "idle" | "generating" | "ready" | "playing";

function voiceName(v: MarketplaceVoice): string {
  return v.metadata?.title || v.id;
}

function voiceDesc(v: MarketplaceVoice): string {
  const parts = [
    v.voiceProfile?.tone,
    v.voiceProfile?.accent,
    v.voiceProfile?.language,
  ].filter(Boolean);
  return parts.join(" • ") || "Marketplace voice";
}

function GeneratePageInner() {
  const searchParams = useSearchParams();
  const [voices, setVoices] = useState<MarketplaceVoice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<MarketplaceVoice | null>(null);
  const [text, setText] = useState(SAMPLE_TEXTS[0].text);
  const [step, setStep] = useState<GenerateStep>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationsLeft, setGenerationsLeft] = useState(3);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [brief, setBrief] = useState("");
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const [matchReasons, setMatchReasons] = useState<Record<string, string[]>>({});
  const [archetype, setArchetype] = useState<string | undefined>(undefined);
  const [matching, setMatching] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Load the real marketplace catalog — same voices buyers see.
  useEffect(() => {
    fetch("/api/marketplace/voices")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const list: MarketplaceVoice[] = data.data.voices || [];
          setVoices(list);
          const wanted = searchParams.get("voiceId");
          const pre = wanted
            ? list.find(
                (v) => v.id === wanted || v.contractVoiceId === wanted
              )
            : undefined;
          setSelectedVoice(pre || list[0] || null);
        }
      })
      .catch(() => {})
      .finally(() => setVoicesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist free generation count in localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEMO_GENERATIONS_KEY);
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 3) {
          setGenerationsLeft(parsed);
        }
      }
    } catch {
      // localStorage unavailable — use default
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DEMO_GENERATIONS_KEY, String(generationsLeft));
    } catch {
      // silent
    }
  }, [generationsLeft]);

  // Seed brief from deep link — e.g. /generate?brief=calm meditation narrator
  useEffect(() => {
    const b = searchParams.get("brief");
    if (b) setBrief(b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optional intent matching — reorders the picker and shows fit + reasons.
  useEffect(() => {
    if (brief.trim().length < 3) {
      setMatchScores({});
      setMatchReasons({});
      setArchetype(undefined);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setMatching(true);
      try {
        const res = await fetch("/api/marketplace/voice-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief: brief.trim() }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.success) {
          setMatchScores(data.data.scores || {});
          setMatchReasons(data.data.reasons || {});
          setArchetype(data.data.archetype);
        }
      } catch (e) {
        if (!controller.signal.aborted) console.error("Voice match failed:", e);
      } finally {
        if (!controller.signal.aborted) setMatching(false);
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [brief]);

  const orderedVoices = React.useMemo(() => {
    if (Object.keys(matchScores).length === 0) return voices;
    return [...voices].sort(
      (a, b) => (matchScores[b.id] ?? 0) - (matchScores[a.id] ?? 0)
    );
  }, [voices, matchScores]);

  const topMatchId = React.useMemo(() => {
    let best: string | null = null;
    let bestScore = 0.5;
    for (const [id, s] of Object.entries(matchScores)) {
      if (s > bestScore) {
        bestScore = s;
        best = id;
      }
    }
    return best;
  }, [matchScores]);

  const handleGenerate = async () => {
    if (!selectedVoice) return;
    if (generationsLeft <= 0) {
      setShowBuyCredits(true);
      return;
    }
    if (!text.trim()) {
      setError("Please enter some text to convert");
      return;
    }

    setStep("generating");
    setError(null);
    setAudioUrl(null);
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
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Generation failed. Please try again.");
      }

      const url = data.data?.audioUrl || data.data?.url;
      if (!url) throw new Error("No audio URL returned");

      setAudioUrl(url);
      setGenerationsLeft((prev) => prev - 1);
      setStep("ready");
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
      const errMsg = err instanceof Error ? err.message : "Generation failed";
      setError(errMsg);
      publishAppEvent({ type: "error", message: `voice generation: ${errMsg}` });
      setStep("idle");
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setStep("ready");
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      setStep("playing");
    }
  };

  const togglePreview = (voice: MarketplaceVoice) => {
    if (previewingId === voice.id) {
      previewAudioRef.current?.pause();
      previewAudioRef.current = null;
      setPreviewingId(null);
      return;
    }
    if (!voice.sampleUrl) return;
    previewAudioRef.current?.pause();
    const audio = new Audio(voice.sampleUrl);
    previewAudioRef.current = audio;
    audio.onended = () => setPreviewingId(null);
    audio.play().then(() => setPreviewingId(voice.id)).catch(() => {});
    fetch("/api/marketplace/match-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "voice_preview",
        voiceId: voice.id,
        brief: brief.trim(),
      }),
      keepalive: true,
    }).catch(() => {});
  };

  const shareAudio = useCallback(() => {
    if (!audioUrl || !selectedVoice) return;
    const shareText = `I just generated this voice on VOISSS using the "${voiceName(selectedVoice)}" voice: "${text.slice(0, 100)}${text.length > 100 ? "..." : ""}"\n\nTry it free: ${window.location.origin}/generate?voiceId=${encodeURIComponent(selectedVoice.contractVoiceId || selectedVoice.id)}`;
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [audioUrl, selectedVoice, text]);

  const estimatedCost =
    text.length > 0 ? (text.length * 0.000001).toFixed(6) : "0.000000";

  return (
    <>
      <MascotEvents />
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="text-white">Generate speech.</span>{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Real voices.
              </span>
            </h1>
            <p className="text-lg text-gray-400 mb-6 max-w-2xl mx-auto">
              Every voice below is live marketplace inventory — matched, previewed,
              and licensed through the same flow agents use.
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-gray-400">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>
                {generationsLeft > 0
                  ? `${generationsLeft} free generation${generationsLeft !== 1 ? "s" : ""} remaining`
                  : "Free generations used — buy credits to continue"}
              </span>
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className="max-w-3xl mx-auto px-4 pb-24">
          <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden shadow-2xl">
            {/* Brief → suggested voices */}
            <div className="p-5 border-b border-[#1E1E1E]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Find a voice by intent
                </p>
                {matching && (
                  <span className="text-[11px] text-zinc-400 animate-pulse">
                    matching…
                  </span>
                )}
              </div>
              <input
                type="text"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder='Describe it — e.g. "calm meditation narrator"'
                className="w-full bg-[#0F0F0F] border border-[#2A2A2A] focus:border-purple-500/60 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm outline-none transition-colors"
              />
            </div>

            {/* Voice picker — real catalog, match-ordered when a brief is set */}
            <div className="p-5 border-b border-[#1E1E1E]">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                Choose a Voice
              </p>
              {voicesLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading marketplace voices…
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {orderedVoices.map((voice) => {
                    const fit = matchScores[voice.id];
                    const isTop = voice.id === topMatchId;
                    return (
                      <button
                        key={voice.id}
                        onClick={() => setSelectedVoice(voice)}
                        className={`relative p-3 rounded-xl border text-left transition-all duration-200 ${
                          selectedVoice?.id === voice.id
                            ? "bg-purple-600/20 border-purple-500/60 shadow-sm shadow-purple-500/10"
                            : isTop
                              ? "bg-[#1A1A1A] border-[#7C5DFA]/50 hover:border-[#7C5DFA]/70"
                              : "bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3A3A3A]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p
                            className={`text-sm font-semibold truncate ${
                              selectedVoice?.id === voice.id
                                ? "text-purple-200"
                                : "text-white"
                            }`}
                          >
                            {voiceName(voice)}
                          </p>
                          {voice.sampleUrl && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePreview(voice);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.stopPropagation();
                                  togglePreview(voice);
                                }
                              }}
                              className="shrink-0 p-1 rounded-md text-gray-500 hover:text-purple-300 transition-colors"
                              title="Preview sample"
                            >
                              {previewingId === voice.id ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5" />
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {voiceDesc(voice)}
                        </p>
                        {fit !== undefined && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <div className="h-1 flex-1 rounded-full bg-[#2A2A2A] overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF]"
                                style={{ width: `${Math.round(fit * 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-[#9C88FF]">
                              {Math.round(fit * 100)}%
                            </span>
                          </div>
                        )}
                        {isTop && matchReasons[voice.id]?.length ? (
                          <p className="mt-1 text-[10px] text-[#9C88FF]">
                            {matchReasons[voice.id].join(" · ")}
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Text */}
            <div className="p-5 border-b border-[#1E1E1E]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Your Text
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-600">
                    {text.length}/500 chars
                  </span>
                  <span className="text-xs text-gray-600">
                    Est. cost:{" "}
                    <span className="text-green-400 font-mono">
                      ${estimatedCost}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {SAMPLE_TEXTS.map((sample) => (
                  <button
                    key={sample.label}
                    onClick={() => {
                      setText(sample.text);
                      setStep("idle");
                      setAudioUrl(null);
                    }}
                    className="px-3 py-1.5 text-xs bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#3A3A3A] rounded-lg text-gray-400 hover:text-white transition-all"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value.slice(0, 500));
                  setStep("idle");
                  setAudioUrl(null);
                }}
                rows={4}
                placeholder="Type or paste your text here…"
                className="w-full bg-[#0F0F0F] border border-[#2A2A2A] focus:border-purple-500/60 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm resize-none outline-none transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="p-5">
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
                  {error}
                </p>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={step === "generating" || !text.trim() || !selectedVoice}
                  id="generate-btn"
                  className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  {step === "generating" ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating…</span>
                    </>
                  ) : generationsLeft <= 0 ? (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Buy Credits to Continue</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>Generate Voice</span>
                      <span className="text-xs opacity-60 font-normal ml-1">
                        (free)
                      </span>
                    </>
                  )}
                </button>

                {audioUrl && (
                  <button
                    onClick={togglePlay}
                    id="generate-play-btn"
                    className="p-4 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-purple-500/50 rounded-xl text-white transition-all duration-200"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>

              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => {
                    setIsPlaying(false);
                    setStep("ready");
                  }}
                  className="hidden"
                />
              )}

              {step === "ready" && (
                <div className="mt-4 space-y-3">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-300">
                        Audio ready! Hit play ▶
                      </p>
                      <p className="text-xs text-green-400/60 truncate">
                        Stored on IPFS •{" "}
                        <a
                          href={audioUrl ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-green-300 transition-colors"
                        >
                          View file
                        </a>
                      </p>
                    </div>
                    <Volume2 className="w-4 h-4 text-green-400 shrink-0" />
                  </div>

                  <button
                    onClick={shareAudio}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-purple-500/40 rounded-xl text-sm text-gray-300 hover:text-white transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Copied to clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        <span>Share this voice — copy text + link</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Conversion */}
          {(generationsLeft < 3 || generationsLeft === 0) && (
            <div className="mt-8 bg-gradient-to-br from-purple-900/20 to-pink-900/10 border border-purple-500/20 rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Ready to use voices in your app?
                  </h3>
                  <p className="text-gray-400 text-sm">
                    $5 gets you 5 million characters (~6,600 full articles). No
                    monthly fees. 70% to voice creators.
                  </p>
                </div>
                <button
                  onClick={() => setShowBuyCredits(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl whitespace-nowrap transition-all duration-200 shadow-lg shadow-purple-500/20 shrink-0"
                >
                  <Zap className="w-4 h-4" />
                  Buy credits — $5
                </button>
              </div>
            </div>
          )}

          {/* API teaser */}
          <div className="mt-8 p-6 bg-[#111111] border border-[#222222] rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Use in your project — 3 lines of code
            </h3>
            <pre className="bg-[#0A0A0A] rounded-xl p-4 text-sm font-mono overflow-x-auto text-gray-300 leading-relaxed border border-[#1E1E1E]">
              <code>{`const res = await fetch("https://voisss.netlify.app/api/agents/vocalize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Hello world", voiceId: "${selectedVoice?.contractVoiceId || selectedVoice?.id || "…"}", agentAddress: "0x..." }),
});

const { audioUrl } = (await res.json()).data; // IPFS URL, ready instantly`}</code>
            </pre>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <a
                href="/developers"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#3A3A3A] rounded-xl text-sm text-gray-300 hover:text-white transition-all"
              >
                Read API Docs
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => setShowBuyCredits(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm text-white font-semibold transition-all"
              >
                Get API Credits
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <BuyCreditsModal
          isOpen={showBuyCredits}
          onClose={() => setShowBuyCredits(false)}
        />
      </div>
    </>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      }
    >
      <GeneratePageInner />
    </Suspense>
  );
}
