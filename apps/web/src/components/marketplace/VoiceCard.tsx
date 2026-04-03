"use client";

import { useRef, useState } from "react";
import { generateVoiceFingerprint } from "@/utils/voice-fingerprint";

interface VoiceCardProps {
  voice: {
    id: string;
    contractVoiceId?: string;
    contributorAddress: string;
    price: string;
    licenseType: "exclusive" | "non-exclusive";
    voiceProfile: {
      tone?: string;
      pitch?: string;
      language?: string;
      accent?: string;
      tags?: string[];
    };
    stats: {
      views: number;
      purchases: number;
      usageCount: number;
    };
    reputation?: {
      trustScore: number;
      reputation: number;
      threatLevel: "green" | "yellow" | "orange" | "red";
    };
    metadata?: {
      title?: string;
    };
    sampleUrl?: string;
    trust?: {
      badge: string;
      status: "verified" | "review" | "provenance";
      details: string;
    };
  };
  onPurchase?: (voiceId: string) => void;
}

export function VoiceCard({ voice, onPurchase }: VoiceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const priceUSDC = (parseInt(voice.price, 10) / 1_000_000).toFixed(2);
  const fingerprintSvg = generateVoiceFingerprint(voice.id);

  const handlePlaySample = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    if (voice.sampleUrl) {
      const audio = new Audio(voice.sampleUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      await audio.play();
      setIsPlaying(true);
      return;
    }

    try {
      setIsLoadingSample(true);

      const response = await fetch("/api/agents/vocalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Hello, this is a preview of the ${
            voice.voiceProfile.tone || "VOISSS"
          } voice. Secure, licensed, and ready for your AI agent.`,
          voiceId: voice.contractVoiceId || voice.id,
          preview: true,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.audioUrl) {
        const audio = new Audio(data.data.audioUrl);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        await audio.play();
        setIsPlaying(true);
      } else {
        console.error("Failed to generate preview:", data.error);
        alert(
          "Preview generation requires a playable sample URL or a valid synthesis voice ID."
        );
      }
    } catch (error) {
      console.error("Error playing sample:", error);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase(voice.id);
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#3A3A3A] transition-all group">
      <div
        className="mb-4 rounded-lg overflow-hidden flex items-center justify-center bg-black/40 border border-white/5 py-6"
        dangerouslySetInnerHTML={{ __html: fingerprintSvg }}
      />

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">
            {voice.metadata?.title || `${voice.voiceProfile.tone || "Professional"} Voice`}
          </h3>
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
              voice.licenseType === "exclusive"
                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            }`}
          >
            {voice.licenseType}
          </span>
        </div>

        <div className="text-sm text-zinc-500 space-y-2 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
            {voice.voiceProfile.language || "English"} •{" "}
            {voice.voiceProfile.accent || "Neutral"}
          </div>
          {voice.trust && (
            <div className="flex items-start gap-2">
              <span
                className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  voice.trust.status === "verified"
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                    : voice.trust.status === "review"
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                    : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20"
                }`}
              >
                {voice.trust.badge}
              </span>
              <span className="text-xs leading-relaxed text-zinc-500">
                {voice.trust.details}
              </span>
            </div>
          )}
        </div>

        {voice.voiceProfile.tags && voice.voiceProfile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {voice.voiceProfile.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] uppercase tracking-tighter bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-white/5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 bg-black/20 rounded-lg p-2 border border-white/5">
        <div className="flex flex-col items-center justify-center py-1 border-r border-white/5">
          <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest leading-none mb-1">Trust Score</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              voice.reputation?.threatLevel === 'green' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
              voice.reputation?.threatLevel === 'yellow' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
              'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
            }`} />
            <span className="text-sm font-black text-white">{voice.reputation?.trustScore || 85}%</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-1">
          <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest leading-none mb-1">Reputation</span>
          <span className="text-sm font-black text-blue-400">{voice.reputation?.reputation || 920}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5 py-3 border-y border-white/5">
        <div className="text-center">
          <div className="text-xs font-bold text-white">
            {voice.stats.usageCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-600 uppercase">Uses</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold text-white">
            {voice.stats.purchases}
          </div>
          <div className="text-[10px] text-zinc-600 uppercase">Sales</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold text-white">
            {voice.stats.views}
          </div>
          <div className="text-[10px] text-zinc-600 uppercase">Views</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xl font-bold text-white">
          <span className="text-zinc-500 text-xs font-normal mr-1">$</span>
          {priceUSDC}
          <span className="text-[10px] font-normal text-zinc-600 ml-1">/mo</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePlaySample}
            disabled={isLoadingSample}
            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border rounded-lg transition-all ${
              isPlaying
                ? "bg-white text-black border-white"
                : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
            } disabled:opacity-50`}
          >
            {isLoadingSample ? (
              <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              "Stop"
            ) : (
              "Preview"
            )}
          </button>

          <button
            onClick={handlePurchase}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-blue-600 text-white rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all"
          >
            License
          </button>
        </div>
      </div>
    </div>
  );
}
