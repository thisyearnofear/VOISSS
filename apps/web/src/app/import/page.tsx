"use client";

import { useState } from "react";
import { ArrowLeft, Check, Mic, Shield, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ElevenLabsVoice {
  voiceId: string;
  name: string;
  elevenlabsVoiceId: string;
  previewUrl?: string;
}

type Step = "connect" | "api-key" | "select" | "done";

export default function ImportVoicePage() {
  const { isAuthenticated, address } = useAuth();
  const [step, setStep] = useState<Step>(isAuthenticated ? "api-key" : "connect");
  const [apiKey, setApiKey] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pricing, setPricing] = useState("70");

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

  function handleImport() {
    setStep("done");
  }

  if (step === "connect") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mic className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Import Your Voice</h1>
          <p className="text-gray-400 mb-8">
            Connect your wallet to list your ElevenLabs voices on VOISSS and earn 70% of every license.
          </p>
          <div className="p-6 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A]">
            <p className="text-sm text-gray-400 mb-4">Connect your wallet to continue</p>
            <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (step === "api-key") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <button onClick={() => setStep("connect")} className="text-gray-400 hover:text-white mb-8 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-center mb-8">
            <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Enter ElevenLabs API Key</h1>
            <p className="text-gray-400 text-sm">
              Your key is sent directly to ElevenLabs and never stored. It&apos;s used once to verify ownership of your voices.
            </p>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk_..."
            className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-4"
          />
          {apiError && (
            <p className="text-red-400 text-sm mb-4">{apiError}</p>
          )}
          <button
            onClick={handleFetchVoices}
            disabled={!apiKey.startsWith("sk_") || loading}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Fetching voices..." : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "select") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <button onClick={() => setStep("api-key")} className="text-gray-400 hover:text-white mb-8 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-bold mb-2">Select Voices to Import</h1>
          <p className="text-gray-400 mb-8">
            Choose which voices to list on the VOISSS marketplace. You earn 70% of all licensing revenue.
          </p>
          <div className="space-y-3 mb-8">
            {voices.map((voice) => (
              <button
                key={voice.voiceId}
                onClick={() => toggleVoice(voice.voiceId)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  selected.has(voice.voiceId)
                    ? "bg-purple-500/10 border-purple-500/40"
                    : "bg-[#1A1A1A] border-[#2A2A2A] hover:border-gray-600"
                }`}
              >
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                  selected.has(voice.voiceId)
                    ? "bg-purple-500 border-purple-500"
                    : "border-gray-600"
                }`}>
                  {selected.has(voice.voiceId) && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{voice.name}</p>
                  <p className="text-sm text-gray-400">{voice.voiceId}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="p-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] mb-8">
            <label className="text-sm text-gray-400 mb-2 block">Revenue Share</label>
            <p className="text-lg font-semibold">You earn <span className="text-green-400">70%</span> of every license</p>
            <p className="text-xs text-gray-500 mt-1">Platform fee: 30%. Set your own per-character pricing after import.</p>
          </div>
          <button
            onClick={handleImport}
            disabled={selected.size === 0}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Import {selected.size} Voice{selected.size !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Voices Imported!</h1>
        <p className="text-gray-400 mb-2">
          {selected.size} voice{selected.size !== 1 ? "s" : ""} listed on the VOISSS marketplace.
        </p>
        <p className="text-gray-400 mb-8">
          You&apos;ll earn 70% every time an AI agent uses your voice.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href="/marketplace/dashboard"
            className="py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
          >
            View Dashboard
          </a>
          <a
            href="/studio"
            className="py-3 border border-gray-600 rounded-xl text-gray-300 font-semibold hover:border-gray-400 transition-all"
          >
            Record More Voices
          </a>
        </div>
      </div>
    </div>
  );
}
