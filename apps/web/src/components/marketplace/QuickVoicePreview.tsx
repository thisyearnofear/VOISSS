"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Square, Loader2, Sparkles, MessageSquare } from "lucide-react";

interface MarketplaceVoice {
  id: string;
  contractVoiceId: string;
  voiceProfile: {
    tone?: string;
    language?: string;
    accent?: string;
  };
  sampleUrl?: string;
}

export default function QuickVoicePreview() {
  const [text, setText] = useState("License authentic human voices for your AI agents. Instant API access. Built on Base.");
  const [voices, setVoices] = useState<MarketplaceVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<MarketplaceVoice | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Fetch top 3 featured voices for the preview
    const fetchFeaturedVoices = async () => {
      try {
        const response = await fetch("/api/marketplace/voices?limit=3");
        const data = await response.json();
        if (data.success && data.data.voices?.length > 0) {
          setVoices(data.data.voices.slice(0, 3));
          setSelectedVoice(data.data.voices[0]);
        }
      } catch (error) {
        console.error("Failed to fetch featured voices:", error);
      }
    };
    fetchFeaturedVoices();
  }, []);

  const handlePreview = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (!selectedVoice) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/agents/vocalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text || "Hello from VOISSS.",
          voiceId: selectedVoice.contractVoiceId || selectedVoice.id,
          preview: true,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.audioUrl) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(data.data.audioUrl);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        await audio.play();
        setIsPlaying(true);
      } else {
        alert("Failed to generate preview. Please try another voice or wait a moment.");
      }
    } catch (error) {
      console.error("Error playing sample:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#141414]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-2 mb-6 text-blue-400 font-bold uppercase tracking-widest text-xs">
        <Sparkles className="w-4 h-4" />
        Instant Synthesis Playground
      </div>

      <div className="space-y-6">
        {/* Voice Selection */}
        <div className="grid grid-cols-3 gap-3">
          {voices.length > 0 ? (
            voices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => {
                  setSelectedVoice(voice);
                  if (isPlaying) {
                    audioRef.current?.pause();
                    setIsPlaying(false);
                  }
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 ${
                  selectedVoice?.id === voice.id
                    ? "bg-blue-600/20 border-blue-500 text-white"
                    : "bg-[#0A0A0A] border-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                <span className="text-xs font-bold truncate w-full text-center">
                  {voice.voiceProfile.tone || "Voice"}
                </span>
                <span className="text-[10px] opacity-60">
                  {voice.voiceProfile.accent || "Neutral"}
                </span>
              </button>
            ))
          ) : (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))
          )}
        </div>

        {/* Text Input */}
        <div className="relative group">
          <div className="absolute left-4 top-4 text-gray-500">
            <MessageSquare className="w-5 h-5" />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type anything to hear it in the selected voice..."
            className="w-full bg-[#0A0A0A] border border-white/5 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all min-h-[100px] resize-none"
            maxLength={200}
          />
          <div className="absolute bottom-3 right-3 text-[10px] text-gray-600 font-mono">
            {text.length}/200
          </div>
        </div>

        {/* Play Button */}
        <div className="relative group">
          {isPlaying && (
            <div className="absolute -inset-2 bg-blue-500/10 rounded-2xl blur-xl animate-pulse -z-10" />
          )}
          
          <button
            onClick={handlePreview}
            disabled={isLoading || !selectedVoice}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
              isPlaying
                ? "bg-white text-black ring-4 ring-blue-500/20"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Synthesizing...
              </>
            ) : isPlaying ? (
              <>
                <div className="flex items-center gap-1 mr-2">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-black rounded-full animate-bounce" 
                      style={{ 
                        height: `${Math.random() * 16 + 8}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '0.6s'
                      }} 
                    />
                  ))}
                </div>
                Stop Playing
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                Try this voice
              </>
            )}
          </button>
        </div>

        <p className="text-center text-[10px] text-gray-500 uppercase tracking-widest font-medium">
          Powered by VOISSS x402 Protocol • Gasless Preview
        </p>
      </div>
    </div>
  );
}
