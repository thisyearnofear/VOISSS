import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { AudioVersion } from '@voisss/shared';

interface AIVoicePanelProps {
  voicesFree: { voiceId: string; name?: string }[];
  selectedVoiceFree: string;
  isLoadingVoicesFree: boolean;
  isGeneratingFree: boolean;
  canUseAIVoice: () => boolean;
  versions: AudioVersion[];
  activeVersionId: string;
  userTier: string;
  remainingQuota: { aiVoice: number };
  WEEKLY_AI_VOICE_LIMIT: number;
  onVoicesFreeChange: (voices: { voiceId: string; name?: string }[]) => void;
  onSelectedVoiceFreeChange: (voiceId: string) => void;
  onLoadingVoicesFreeChange: (loading: boolean) => void;
  onGeneratingFreeChange: (generating: boolean) => void;
  onIncrementAIVoiceUsage: () => void;
  onToastMessage: (message: string | null) => void;
  onToastType: (type: 'success' | 'error') => void;
  onAddVersion: (blob: Blob, source: string, parentVersionId: string, metadata: any) => void;
  onSetSelectedVersionIds: (updater: (prev: Set<string>) => Set<string>) => void;
}

export default function AIVoicePanel({
  voicesFree,
  selectedVoiceFree,
  isLoadingVoicesFree,
  isGeneratingFree,
  canUseAIVoice,
  versions,
  activeVersionId,
  userTier,
  remainingQuota,
  WEEKLY_AI_VOICE_LIMIT,
  onVoicesFreeChange,
  onSelectedVoiceFreeChange,
  onLoadingVoicesFreeChange,
  onGeneratingFreeChange,
  onIncrementAIVoiceUsage,
  onToastMessage,
  onToastType,
  onAddVersion,
  onSetSelectedVersionIds,
}: AIVoicePanelProps) {
  const [selectedVoiceId, setSelectedVoiceId] = useState('');

  // Find the generated AI voice version for playback
  const generatedAIVersion = versions.find(v => 
    v.parentVersionId === activeVersionId && v.source.startsWith('aiVoice-')
  );

  const handleLoadVoices = async () => {
    if (!isLoadingVoicesFree && voicesFree.length === 0) {
      onLoadingVoicesFreeChange(true);
      try {
        const res = await fetch("/api/elevenlabs/list-voices", { 
          method: "POST",
          credentials: 'include' 
        });
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
    const activeVersion = versions.find(v => v.id === activeVersionId);
    const hasExistingTransform = versions.some(v => v.parentVersionId === activeVersionId && v.source.startsWith('aiVoice-'));
    
    if (!hasExistingTransform && canUseAIVoice() && selectedVoiceFree && activeVersion) {
      onGeneratingFreeChange(true);
      try {
        const form = new FormData();
        form.append("audio", activeVersion.blob, "input.webm");
        form.append("voiceId", selectedVoiceFree);
        form.append("sourceVersionId", activeVersionId);
        const res = await fetch("/api/elevenlabs/transform-voice", {
          method: "POST",
          body: form,
          credentials: 'include'
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Transform failed');
        }
        const buf = await res.arrayBuffer();
        const blob = new Blob([buf], { type: "audio/mpeg" });
        
        // Get voice name for label
        const voiceName = voicesFree.find(v => v.voiceId === selectedVoiceFree)?.name || selectedVoiceFree;
        
        // Add to version ledger
        onAddVersion(blob, `aiVoice-${selectedVoiceFree}`, activeVersionId, {
          voiceId: selectedVoiceFree,
          voiceName,
          duration: activeVersion.metadata.duration,
        });
        
        onIncrementAIVoiceUsage();
        
        // Auto-select new AI voice version for saving
        onSetSelectedVersionIds((prev) => {
          const updated = new Set(prev);
          // Add the most recent version (will be the newly created one)
          const newVersionId = versions[versions.length - 1]?.id;
          if (newVersionId) updated.add(newVersionId);
          return updated;
        });
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
    <div className="p-6 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] shadow-xl space-y-6">
      <div className="flex justify-between items-center bg-[#0F0F0F] -mx-6 -mt-6 p-6 rounded-t-2xl border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7C5DFA]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#7C5DFA]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            </svg>
          </div>
          <div>
            <h4 className="text-white font-bold text-lg">Voice Morphing</h4>
            <p className="text-gray-400 text-xs">AI-powered voice transformation</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Weekly Logic</div>
          <span className="text-sm font-medium text-[#7C5DFA]">
            {userTier === 'premium' ? '∞ unlimited' : `${remainingQuota.aiVoice}/${WEEKLY_AI_VOICE_LIMIT} free`}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <button
          disabled={!canUseAIVoice() || isLoadingVoicesFree || voicesFree.length > 0}
          className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl text-gray-300 hover:border-[#3A3A3A] hover:bg-[#1A1A1A] disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-3 font-medium"
          onClick={handleLoadVoices}
        >
          {isLoadingVoicesFree ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
              Igniting Alchemy Engine...
            </>
          ) : voicesFree.length > 0 ? (
            <>
              <div className="w-5 h-5 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-green-500">Voices Initialized</span>
            </>
          ) : (
            "Initialize AI Voices"
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
              disabled={!selectedVoiceFree || !canUseAIVoice() || isGeneratingFree || versions.some(v => v.parentVersionId === activeVersionId && v.source.startsWith('aiVoice-'))}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] rounded-lg text-white disabled:opacity-50 font-medium transition-all duration-200"
              onClick={handleTransformVoice}
            >
              {isGeneratingFree ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Transforming...
                </div>
              ) : versions.some(v => v.parentVersionId === activeVersionId && v.source.startsWith('aiVoice-')) ? (
                "✨ Transformation Complete!"
              ) : (
                "Transform Voice"
              )}
            </button>

            {versions.some(v => v.parentVersionId === activeVersionId && v.source.startsWith('aiVoice-')) && (
              <div className="mt-3 p-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <p className="text-green-400 text-sm font-medium">AI Voice Ready!</p>
                </div>
                <audio
                   src={generatedAIVersion ? URL.createObjectURL(generatedAIVersion.blob) : undefined}
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