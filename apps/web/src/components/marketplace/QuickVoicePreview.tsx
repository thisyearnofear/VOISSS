"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Play, Square, Loader2, Sparkles, MessageSquare, Share2 } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { SocialShare, type ShareableRecording } from "@voisss/ui";
import { useAuth } from "../../contexts/AuthContext";

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
  const { address } = useAuth();
  const [text, setText] = useState("License authentic human voices for your AI agents. Instant API access. Built on Base.");
  const [voices, setVoices] = useState<MarketplaceVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<MarketplaceVoice | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSynthesized, setHasSynthesized] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const shareRecording = useMemo<ShareableRecording | null>(() => {
    if (!selectedVoice) return null;
    const tone = selectedVoice.voiceProfile.tone || "Voice";
    return {
      id: selectedVoice.id,
      title: `I just synthesized speech with a ${tone} voice on VOISSS`,
      duration: 0,
      createdAt: new Date().toISOString(),
    };
  }, [selectedVoice]);

  // Fallback voices for demo/development if indexer is empty
  const FALLBACK_VOICES: MarketplaceVoice[] = [
    {
      id: "fallback_1",
      contractVoiceId: "professional_male_01",
      voiceProfile: { tone: "Professional", accent: "American", language: "English" }
    },
    {
      id: "fallback_2",
      contractVoiceId: "friendly_female_01",
      voiceProfile: { tone: "Friendly", accent: "British", language: "English" }
    },
    {
      id: "fallback_3",
      contractVoiceId: "narrator_deep_01",
      voiceProfile: { tone: "Narrator", accent: "Deep", language: "English" }
    }
  ];

  useEffect(() => {
    // Fetch top 3 featured voices for the preview
    const fetchFeaturedVoices = async () => {
      try {
        setError(null);
        const response = await fetch("/api/marketplace/voices?limit=3");
        
        if (!response.ok) {
           throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.data.voices?.length > 0) {
          setVoices(data.data.voices.slice(0, 3));
          setSelectedVoice(data.data.voices[0]);
        } else {
          // If no voices returned, use fallbacks for better UX during hackathon
          console.warn("No voices returned from marketplace API, using fallbacks.");
          setVoices(FALLBACK_VOICES);
          setSelectedVoice(FALLBACK_VOICES[0]);
        }
      } catch (error) {
        console.error("Failed to fetch featured voices, using fallbacks:", error);
        setVoices(FALLBACK_VOICES);
        setSelectedVoice(FALLBACK_VOICES[0]);
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
      setError(null);
      const response = await fetch("/api/agents/vocalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text || "Hello from VOISSS.",
          voiceId: selectedVoice.contractVoiceId || selectedVoice.id,
          agentAddress: "0x0000000000000000000000000000000000000000", // Required for validation, but ignored for previews
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

        // Trigger celebration on first successful synthesis
        if (!hasSynthesized) {
          setHasSynthesized(true);
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#3b82f6", "#8b5cf6", "#06b6d4"],
          });
        }
      } else {
        const errorMessage = data.error || "Failed to generate preview.";
        
        // Use a more user-friendly message for verification or payment errors
        if (errorMessage.includes("verification required")) {
          setError("Verification check paused. Please refresh the page and try again.");
        } else if (errorMessage.includes("payTo address is REQUIRED") || errorMessage.includes("Payment required")) {
          setError("Preview configuration is being updated. Please try again in a moment.");
        } else {
          setError(errorMessage + " Please try another voice or wait a moment.");
        }
      }
    } catch (error) {
      console.error("Error playing sample:", error);
      setError("An unexpected error occurred. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-2xl mx-auto bg-[#141414]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl"
    >
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
                    ? "bg-blue-600/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]"
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
          <div className="absolute left-4 top-4 text-gray-500 transition-colors group-focus-within:text-blue-500">
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
          <AnimatePresence>
            {isPlaying && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -inset-2 bg-blue-500/10 rounded-2xl blur-xl -z-10" 
              />
            )}
          </AnimatePresence>
          
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePreview}
            disabled={isLoading || !selectedVoice}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-lg transition-all duration-300 ${
              isPlaying
                ? "bg-white text-black ring-4 ring-blue-500/20"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="w-6 h-6 animate-spin" />
                Synthesizing...
              </motion.div>
            ) : isPlaying ? (
              <div className="flex items-center gap-1">
                {[...Array(6)].map((_, i) => (
                  <motion.div 
                    key={i} 
                    className="w-1.5 bg-black rounded-full" 
                    animate={{ 
                      height: [8, 24, 12, 32, 8],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                  />
                ))}
                <span className="ml-2">Stop Playing</span>
              </div>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                Try this voice
              </>
            )}
          </motion.button>
        </div>

        {/* Share Card — appears after first synthesis */}
        <AnimatePresence>
          {hasSynthesized && shareRecording && (
            <motion.div
              initial={{ opacity: 0, y: 16, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Share2 className="w-4 h-4 text-blue-400" />
                  Share this voice
                </div>
                <p className="text-xs text-gray-400">
                  Loved the {selectedVoice?.voiceProfile.tone || "voice"}? Share it and earn referral rewards.
                </p>
                <SocialShare
                  recording={shareRecording}
                  userId={address || undefined}
                  generateReferralCode={async (userId: string, recordingId: string) => {
                    const hash = btoa(`${userId}:${recordingId}`).slice(0, 8);
                    return hash;
                  }}
                  onShare={(platform: string, url: string) => {
                    console.log(`Shared to ${platform}:`, url);
                  }}
                  className="justify-center"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[10px] text-gray-500 uppercase tracking-widest font-medium">
          Powered by VOISSS x402 Protocol • Gasless Preview
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
