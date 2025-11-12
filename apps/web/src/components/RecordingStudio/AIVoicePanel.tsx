import React, { useState } from 'react';

interface AIVoicePanelProps {
  voicesFree: { voiceId: string; name?: string }[];
  selectedVoiceFree: string;
  variantBlobFree: Blob | null;
  isLoadingVoicesFree: boolean;
  isGeneratingFree: boolean;
  canUseAIVoice: () => boolean;
  audioBlob: Blob | null;
  userTier: string;
  remainingQuota: { aiVoice: number };
  WEEKLY_AI_VOICE_LIMIT: number;
  onVoicesFreeChange: (voices: { voiceId: string; name?: string }[]) => void;
  onSelectedVoiceFreeChange: (voiceId: string) => void;
  onVariantBlobFreeChange: (blob: Blob | null) => void;
  onLoadingVoicesFreeChange: (loading: boolean) => void;
  onGeneratingFreeChange: (generating: boolean) => void;
  onIncrementAIVoiceUsage: () => void;
  onToastMessage: (message: string | null) => void;
  onToastType: (type: 'success' | 'error') => void;
  onSetSelectedVersions: (versionsOrUpdater: { original: boolean; aiVoice: boolean; dubbed: boolean } | ((prev: { original: boolean; aiVoice: boolean; dubbed: boolean }) => { original: boolean; aiVoice: boolean; dubbed: boolean })) => void;
}

export default function AIVoicePanel({
  voicesFree,
  selectedVoiceFree,
  variantBlobFree,
  isLoadingVoicesFree,
  isGeneratingFree,
  canUseAIVoice,
  audioBlob,
  userTier,
  remainingQuota,
  WEEKLY_AI_VOICE_LIMIT,
  onVoicesFreeChange,
  onSelectedVoiceFreeChange,
  onVariantBlobFreeChange,
  onLoadingVoicesFreeChange,
  onGeneratingFreeChange,
  onIncrementAIVoiceUsage,
  onToastMessage,
  onToastType,
  onSetSelectedVersions,
}: AIVoicePanelProps) {
  const [selectedVoiceId, setSelectedVoiceId] = useState('');

  const handleLoadVoices = async () => {
    if (!isLoadingVoicesFree && voicesFree.length === 0) {
      onLoadingVoicesFreeChange(true);
      try {
        const res = await fetch("/api/elevenlabs/list-voices", { method: "POST" });
        const data = await res.json();
        onVoicesFreeChange((data.voices || []).slice(0, 3));
        if (data.voices?.[0]?.voiceId) {
          onSelectedVoiceFreeChange(data.voices[0].voiceId);
        }
      } catch (e) {
        console.error("Failed to load voices:", e);
        onToastType('error');
        onToastMessage('Failed to load voices');
      } finally {
        onLoadingVoicesFreeChange(false);
      }
    }
  };

  const handleTransformVoice = async () => {
    if (!variantBlobFree && canUseAIVoice() && selectedVoiceFree && audioBlob) {
      onGeneratingFreeChange(true);
      try {
        const form = new FormData();
        form.append("audio", audioBlob, "input.webm");
        form.append("voiceId", selectedVoiceFree);
        const res = await fetch("/api/elevenlabs/transform-voice", {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Transform failed');
        }
        const buf = await res.arrayBuffer();
        const blob = new Blob([buf], { type: "audio/mpeg" });
        onVariantBlobFreeChange(blob);
        onIncrementAIVoiceUsage();
        // Auto-select AI voice version for saving
        onSetSelectedVersions((prev: { original: boolean; aiVoice: boolean; dubbed: boolean }) => ({ ...prev, aiVoice: true }));
      } catch (e) {
        console.error("Variant generation failed:", e);
        onToastType('error');
        onToastMessage('AI transformation failed');
      } finally {
        onGeneratingFreeChange(false);
      }
    }
  };

  return (
    <div className="p-4 mb-6 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h4 className="text-white font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 text-[#7C5DFA]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
            </svg>
            AI Voice Transform
          </h4>
          <p className="text-gray-400 text-sm">Transform your voice with AI</p>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-400">
            {userTier === 'premium' ? '∞ unlimited' : `${remainingQuota.aiVoice}/${WEEKLY_AI_VOICE_LIMIT} free`}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          disabled={!canUseAIVoice() || isLoadingVoicesFree || voicesFree.length > 0}
          className="w-full px-3 py-2 bg-[#2A2A2A] rounded-lg text-gray-300 hover:bg-[#3A3A3A] disabled:opacity-50 transition-colors"
          onClick={handleLoadVoices}
        >
          {isLoadingVoicesFree ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
              Loading Voices...
            </div>
          ) : voicesFree.length > 0 ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              Voices Ready
            </div>
          ) : (
            "Load AI Voices"
          )}
        </button>

        {voicesFree.length > 0 && (
          <>
            <select
              className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-white"
              onChange={(e) => {
                setSelectedVoiceId(e.target.value);
                onSelectedVoiceFreeChange(e.target.value);
              }}
              value={selectedVoiceFree}
            >
              <option value="" disabled>Select voice style...</option>
              {voicesFree.map((v) => (
                <option key={v.voiceId} value={v.voiceId}>
                  {v.name || v.voiceId}
                </option>
              ))}
            </select>

            <button
              disabled={!selectedVoiceFree || !canUseAIVoice() || isGeneratingFree || !!variantBlobFree}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] rounded-lg text-white disabled:opacity-50 font-medium transition-all duration-200"
              onClick={handleTransformVoice}
            >
              {isGeneratingFree ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Transforming...
                </div>
              ) : variantBlobFree ? (
                "✨ Transformation Complete!"
              ) : (
                "Transform Voice"
              )}
            </button>

            {variantBlobFree && (
              <div className="mt-3 p-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  <p className="text-green-400 text-sm font-medium">AI Voice Ready!</p>
                </div>
                <audio
                  src={URL.createObjectURL(variantBlobFree)}
                  controls
                  className="w-full"
                  style={{ height: '32px' }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}