"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Copy,
  Check,
  Gift,
} from "lucide-react";
import { BuyCreditsModal } from "../../components/payment/BuyCreditsModal";

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

const VOICE_OPTIONS = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", description: "Professional Female • American" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni", description: "Warm Male • American" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", description: "Soft Female • American" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", description: "Deep Male • American" },
];

type DemoStep = "idle" | "generating" | "ready" | "playing";

export default function DemoPage() {
  const [text, setText] = useState(SAMPLE_TEXTS[0].text);
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0]);
  const [step, setStep] = useState<DemoStep>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationsLeft, setGenerationsLeft] = useState(3);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [charCount, setCharCount] = useState(SAMPLE_TEXTS[0].text.length);
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  useEffect(() => {
    setCharCount(text.length);
  }, [text]);

  // Generate a stable referral link once on mount
  const [referralLink] = useState(() => {
    if (typeof window === "undefined") return "";
    const existingRef = sessionStorage.getItem("voisss_referral_code");
    const code = existingRef || `demo-${Date.now().toString(36)}`;
    if (!existingRef) {
      sessionStorage.setItem("voisss_referral_code", code);
    }
    return `${window.location.origin}/demo?ref=${code}`;
  });

  const copyReferralLink = useCallback(() => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Clipboard unavailable
    });
  }, [referralLink]);

  // Share the generated audio
  const shareAudio = useCallback(() => {
    if (!audioUrl) return;
    const shareText = `I just generated this voice on VOISSS using the "${selectedVoice.name}" voice: "${text.slice(0, 100)}${text.length > 100 ? "..." : ""}"\n\nTry it free: ${referralLink}`;
    navigator.clipboard.writeText(shareText).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch(() => {
      // Clipboard unavailable
    });
  }, [audioUrl, selectedVoice.name, text, referralLink]);

  const handleGenerate = async () => {
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

    try {
      const response = await fetch("/api/agents/vocalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Demo-Mode": "true",
        },
        body: JSON.stringify({
          text: text.trim().slice(0, 500),
          voiceId: selectedVoice.id,
          agentAddress: "0xDEMO0000000000000000000000000000000000001",
          demo: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Generation failed. Please try again."
        );
      }

      const url = data.data?.audioUrl || data.data?.url;
      if (!url) throw new Error("No audio URL returned");

      setAudioUrl(url);
      setGenerationsLeft((prev) => prev - 1);
      setStep("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
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

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setStep("ready");
  };

  const estimatedCost =
    charCount > 0 ? (charCount * 0.000001).toFixed(6) : "0.000000";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-purple-300">
              Live Demo — No account needed
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-white">Hear the difference.</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Real human voices.
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Type any text. Choose a voice. Get studio-quality audio in seconds.
            Powered by licensed human voices and AI synthesis.
          </p>

          {/* Free generation counter — persisted across visits */}
          <div className="inline-flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>
              {generationsLeft > 0
                ? `${generationsLeft} free generation${generationsLeft !== 1 ? "s" : ""} remaining`
                : "Free generations used — buy credits to continue"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Demo Card */}
      <div className="max-w-3xl mx-auto px-4 pb-24">
        <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden shadow-2xl">
          {/* Voice Picker */}
          <div className="p-5 border-b border-[#1E1E1E]">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Choose a Voice
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {VOICE_OPTIONS.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                    selectedVoice.id === voice.id
                      ? "bg-purple-600/20 border-purple-500/60 shadow-sm shadow-purple-500/10"
                      : "bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3A3A3A]"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      selectedVoice.id === voice.id
                        ? "text-purple-200"
                        : "text-white"
                    }`}
                  >
                    {voice.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {voice.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Text area */}
          <div className="p-5 border-b border-[#1E1E1E]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                Your Text
              </p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600">
                  {charCount}/500 chars
                </span>
                <span className="text-xs text-gray-600">
                  Est. cost:{" "}
                  <span className="text-green-400 font-mono">
                    ${estimatedCost}
                  </span>
                </span>
              </div>
            </div>

            {/* Quick sample buttons */}
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
              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={step === "generating" || !text.trim()}
                id="demo-generate-btn"
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

              {/* Play button — visible once audio is ready */}
              {audioUrl && (
                <button
                  onClick={togglePlay}
                  id="demo-play-btn"
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

            {/* Audio element */}
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={handleAudioEnded}
                className="hidden"
              />
            )}

            {/* Success state with share */}
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
                        href={audioUrl!}
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

                {/* Share button */}
                <button
                  onClick={shareAudio}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-purple-500/40 rounded-xl text-sm text-gray-300 hover:text-white transition-all"
                >
                  {shareCopied ? (
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

            {step === "playing" && (
              <div className="mt-4 flex items-center gap-2 justify-center">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-purple-500 rounded-full animate-bounce"
                    style={{
                      height: `${12 + Math.random() * 20}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
                <span className="text-sm text-purple-300 ml-2">Playing…</span>
              </div>
            )}
          </div>
        </div>

        {/* Referral share — show after first generation */}
        {generationsLeft < 3 && (
          <div className="mt-6 bg-gradient-to-br from-amber-900/20 to-orange-900/10 border border-amber-500/20 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white mb-1">
                  Share & Earn — 10% bonus credits
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  Share your referral link. When someone buys credits, you get
                  10% added to your account.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-black/40 border border-[#2A2A2A] rounded-lg text-xs text-gray-300 font-mono truncate">
                    {referralLink}
                  </code>
                  <button
                    onClick={copyReferralLink}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs text-white font-semibold transition-colors whitespace-nowrap"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conversion section — shown after first generation or when out of credits */}
        {(generationsLeft < 3 || generationsLeft === 0) && (
          <div className="mt-8 bg-gradient-to-br from-purple-900/20 to-pink-900/10 border border-purple-500/20 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Ready to use voices in your app?
                </h3>
                <p className="text-gray-400 text-sm">
                  $5 gets you 5 million characters (~6,600 full articles).
                  No monthly fees. 70% to voice creators.
                </p>
              </div>
              <button
                onClick={() => setShowBuyCredits(true)}
                id="demo-buy-credits-btn"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl whitespace-nowrap transition-all duration-200 shadow-lg shadow-purple-500/20"
              >
                <Zap className="w-4 h-4" />
                Start for $5
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
              {[
                { label: "Characters", value: "5M+", sub: "per $5 pack" },
                { label: "Revenue Share", value: "70%", sub: "to creators" },
                { label: "Setup Time", value: "< 1 min", sub: "API ready" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.sub}</p>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works — for developers */}
        <div className="mt-8 p-6 bg-[#111111] border border-[#222222] rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Use in your project — 3 lines of code
          </h3>
          <pre className="bg-[#0A0A0A] rounded-xl p-4 text-sm font-mono overflow-x-auto text-gray-300 leading-relaxed border border-[#1E1E1E]">
            <code>{`const res = await fetch("https://voisss.netlify.app/api/agents/vocalize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Hello world", voiceId: "${selectedVoice.id}", agentAddress: "0x..." }),
});

const { audioUrl } = (await res.json()).data; // IPFS URL, ready instantly`}</code>
          </pre>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <a
              href="/for-agents"
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

      {/* Buy Credits Modal */}
      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
      />
    </div>
  );
}
