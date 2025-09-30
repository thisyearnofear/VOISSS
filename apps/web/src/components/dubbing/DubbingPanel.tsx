"use client";

import React, { useState, useCallback } from 'react';
import LanguageSelector from './LanguageSelector';
import ProgressVisualizer from './ProgressVisualizer';
import AudioComparison from './AudioComparison';
import { isDubbingEnabled } from '@voisss/shared';
import type { LanguageInfo } from '@voisss/shared/src/constants/languages';
import type { DubbingLanguage } from '@voisss/shared/src/types/audio';

interface DubbingPanelProps {
  audioBlob: Blob | null;
  onDubbingComplete?: (dubbedBlob: Blob) => void;
  disabled?: boolean;
  freeDubbingCounter?: number;
  onWalletModalOpen?: () => void;
}

export default function DubbingPanel({
  audioBlob,
  onDubbingComplete,
  disabled = false,
  freeDubbingCounter = 1,
  onWalletModalOpen
}: DubbingPanelProps) {
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState("");
  const [selectedSourceLanguage, setSelectedSourceLanguage] = useState<string>('auto');
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);
  const [isDubbing, setIsDubbing] = useState(false);
  const [dubbingProgress, setDubbingProgress] = useState<string>("");
  const [dubbingStage, setDubbingStage] = useState<'preparing' | 'translating' | 'generating' | 'finalizing' | 'complete' | 'error'>('preparing');
  const [dubbedBlob, setDubbedBlob] = useState<Blob | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageInfo[]>([]);
  const [languagesCache, setLanguagesCache] = useState<LanguageInfo[]>([]);
  const [transcript, setTranscript] = useState<string>("");
  const [translatedTranscript, setTranslatedTranscript] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [detectedSourceLanguage, setDetectedSourceLanguage] = useState<string>("");

  const getSampleText = (code: string): string => {
    const samples: { [key: string]: string } = {
      'en': 'Hello, how are you?',
      'es': 'Hola, ¿cómo estás?',
      'fr': 'Bonjour, comment allez-vous?',
      'de': 'Hallo, wie geht es Ihnen?',
      'pt': 'Olá, como você está?',
      'hi': 'नमस्ते, आप कैसे हैं?',
      'zh': '你好，你怎么样？',
      'ja': 'こんにちは、お元気ですか？',
      'ar': 'مرحبا، كيف حالك؟',
      'ru': 'Привет, как дела?'
    };
    return samples[code] || 'Hello, how are you?';
  };

  const loadLanguages = useCallback(async () => {
    // Use cached languages if available
    if (languagesCache.length > 0) {
      setAvailableLanguages(languagesCache);
      const spanish = languagesCache.find((lang: DubbingLanguage) => lang.code === 'es');
      if (spanish && !selectedTargetLanguage) {
        setSelectedTargetLanguage(spanish.code);
      }
      return;
    }

    setIsLoadingLanguages(true);
    try {
      const res = await fetch("/api/elevenlabs/dub-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getLanguages" })
      });

      if (res.ok) {
        const data = await res.json();
        const rawLanguages = data.languages || [];

        // Enhance languages with flag emojis and popularity data
        const enhancedLanguages: LanguageInfo[] = rawLanguages.map((lang: any) => {
          const flagMap: { [key: string]: string } = {
            'en': '🇺🇸', 'hi': '🇮🇳', 'pt': '🇧🇷', 'zh': '🇨🇳', 'es': '🇪🇸',
            'fr': '🇫🇷', 'de': '🇩🇪', 'ja': '🇯🇵', 'ar': '🇸🇦', 'ru': '🇷🇺',
            'ko': '🇰🇷', 'id': '🇮🇩', 'it': '🇮🇹', 'nl': '🇳🇱', 'tr': '🇹🇷'
          };
          const popularCodes = ['es', 'fr', 'de', 'pt', 'hi', 'zh', 'ar', 'ru', 'ko', 'ja'];

          return {
            ...lang,
            flag: flagMap[lang.code] || '🌐',
            isPopular: popularCodes.includes(lang.code),
            sampleText: getSampleText(lang.code)
          };
        });

        // Sort languages: popular ones first, then alphabetical
        const popularCodes = ['es', 'fr', 'de', 'pt', 'hi', 'zh', 'ar', 'ru', 'ko', 'ja'];
        const sortedLanguages = enhancedLanguages.sort((a: LanguageInfo, b: LanguageInfo) => {
          const aIndex = popularCodes.indexOf(a.code);
          const bIndex = popularCodes.indexOf(b.code);

          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex; // Both popular: sort by popularity order
          }
          if (aIndex !== -1) return -1; // A is popular, B is not
          if (bIndex !== -1) return 1;  // B is popular, A is not
          return a.name.localeCompare(b.name); // Neither popular: alphabetical
        });

        setAvailableLanguages(sortedLanguages);
        setLanguagesCache(sortedLanguages);

        // Auto-select Spanish (most popular) for better UX
        const spanish = sortedLanguages.find((lang: LanguageInfo) => lang.code === 'es');
        if (spanish && !selectedTargetLanguage) {
          setSelectedTargetLanguage(spanish.code);
        }
      }
    } catch (e) {
      console.error("Failed to load dubbing languages:", e);
      // Show user-friendly error message
      alert("Failed to load languages. Please check your connection and try again.");
    } finally {
      setIsLoadingLanguages(false);
    }
  }, [languagesCache.length, selectedTargetLanguage]);

  const handleDubAudio = useCallback(async () => {
    if (!audioBlob || !selectedTargetLanguage || freeDubbingCounter < 1) return;

    setIsDubbing(true);
    setError("");
    setDubbingStage('preparing');
    setDubbingProgress("Preparing your audio for translation...");

    try {
      // Create form data
      const form = new FormData();
      form.append("audio", audioBlob, "input.webm");
      form.append("targetLanguage", selectedTargetLanguage);
      
      // Only append source language if it's not auto-detect
      if (selectedSourceLanguage && selectedSourceLanguage !== 'auto') {
        form.append('sourceLanguage', selectedSourceLanguage);
      }

      // Simulate progress stages
      const progressStages = [
        { stage: 'preparing' as const, message: 'Preparing your audio for translation...', duration: 800 },
        { stage: 'translating' as const, message: 'AI is analyzing speech patterns and emotions...', duration: 1200 },
        { stage: 'generating' as const, message: 'Generating natural-sounding translation...', duration: 1000 },
        { stage: 'finalizing' as const, message: 'Finalizing translation with emotional accuracy...', duration: 500 }
      ];

      for (const { stage, message, duration } of progressStages) {
        setDubbingStage(stage);
        setDubbingProgress(message);
        await new Promise(resolve => setTimeout(resolve, duration));
      }

      const res = await fetch("/api/elevenlabs/dub-audio", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Dubbing failed');
      }

      const data = await res.json();
      const dubbedAudioBlob = new Blob(
        [Buffer.from(data.audio_base64, 'base64')],
        { type: data.content_type || 'audio/mpeg' }
      );

      setDubbingStage('complete');
      setDubbingProgress("Translation complete! Ready to download.");
      setDubbedBlob(dubbedAudioBlob);
      setTranscript(data.transcript || "");
      setTranslatedTranscript(data.translated_transcript || "");

      if (onDubbingComplete) {
        onDubbingComplete(dubbedAudioBlob);
      }
    } catch (e) {
      console.error("Dubbing failed:", e);
      const errorMessage = e instanceof Error ? e.message : 'Dubbing failed. Please try again.';
      setError(errorMessage);
      setDubbingStage('error');
      setDubbingProgress("An error occurred during translation.");
    } finally {
      // Keep progress visible for a moment before clearing
      setTimeout(() => {
        setIsDubbing(false);
        setDubbingProgress("");
        setDubbingStage('preparing');
      }, 2000);
    }
  }, [audioBlob, selectedTargetLanguage, freeDubbingCounter, onDubbingComplete]);

  const handleDownload = useCallback(() => {
    if (dubbedBlob) {
      const url = URL.createObjectURL(dubbedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dubbed-${selectedTargetLanguage}-${new Date().toISOString()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [dubbedBlob, selectedTargetLanguage]);

  if (!audioBlob) {
    return (
      <div className="p-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
        <p className="text-gray-400 text-center">
          Record audio first to enable dubbing
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-white font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 text-[#7C5DFA]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Global Dubbing (Free)
          </h4>
          <p className="text-gray-400 text-sm">Translate your recording to another language</p>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-400">{freeDubbingCounter}/1 free</span>
          {freeDubbingCounter < 1 && (
            <div className="mt-1">
              <p className="text-xs text-yellow-400">Free sample used!</p>
              <button
                onClick={onWalletModalOpen}
                className="text-xs text-[#7C5DFA] hover:text-[#9C88FF] underline"
              >
                Unlock unlimited →
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <button
          disabled={freeDubbingCounter < 1 || isLoadingLanguages || availableLanguages.length > 0}
          className="w-full px-3 py-2 bg-[#2A2A2A] rounded-lg text-gray-300 hover:bg-[#3A3A3A] disabled:opacity-50 transition-colors"
          onClick={loadLanguages}
        >
          {isLoadingLanguages ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
              Loading Languages...
            </div>
          ) : availableLanguages.length > 0 ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              Languages Ready
            </div>
          ) : (
            "Load Languages"
          )}
        </button>

        {availableLanguages.length > 0 && (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                🌐 Source Language
              </label>
              <LanguageSelector
                selectedLanguage={selectedSourceLanguage}
                onLanguageChange={setSelectedSourceLanguage}
                languages={[
                  { code: 'auto', name: 'Auto-detect', nativeName: 'Automatic Detection', flag: '🤖', isPopular: true },
                  ...availableLanguages
                ]}
                placeholder="Select source language..."
                disabled={disabled || isDubbing}
                className="w-full"
                viewMode="cards"
              />
              <p className="text-xs text-gray-400">
                💡 ElevenLabs can automatically detect the source language, or you can specify it for better accuracy.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                🌍 Target Language
              </label>
              <LanguageSelector
                selectedLanguage={selectedTargetLanguage}
                onLanguageChange={setSelectedTargetLanguage}
                languages={availableLanguages}
                placeholder="Select target language..."
                disabled={disabled || isDubbing}
                className="w-full"
                viewMode="cards"
              />
              <p className="text-xs text-gray-400">
                💡 Popular languages are shown first. Your content will be translated while preserving the original emotion and tone.
              </p>
            </div>

            <button
              disabled={!selectedTargetLanguage || freeDubbingCounter < 1 || isDubbing || !!dubbedBlob}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] rounded-lg text-white disabled:opacity-50 font-medium transition-all duration-200 hover:from-[#6B4CE6] hover:to-[#8B7AFF]"
              onClick={handleDubAudio}
            >
              {isDubbing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Dubbing in Progress...</span>
                </div>
              ) : dubbedBlob ? (
                "✨ Dubbing Complete!"
              ) : (
                `🎭 Dub ${selectedSourceLanguage === 'auto' ? 'Audio' : `from ${availableLanguages.find(l => l.code === selectedSourceLanguage)?.name || selectedSourceLanguage}`} to ${availableLanguages.find(l => l.code === selectedTargetLanguage)?.name || selectedTargetLanguage}`
              )}
            </button>

            {/* Enhanced Progress Visualization */}
            {isDubbing && (
              <ProgressVisualizer
                isVisible={isDubbing}
                progress={dubbingProgress}
                stage={dubbingStage}
                className="mt-4"
              />
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <p className="text-red-400 text-sm font-medium">Dubbing Error</p>
                </div>
                <p className="text-red-300 text-xs">{error}</p>
              </div>
            )}

            {dubbedBlob && (
              <div className="mt-3 space-y-4">
                {/* Audio Comparison Component */}
                <AudioComparison
                  originalAudio={audioBlob}
                  dubbedAudio={dubbedBlob}
                  originalTranscript={transcript}
                  translatedTranscript={translatedTranscript}
                  targetLanguage={selectedTargetLanguage}
                />

                {/* Download Section */}
                <div className="p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
                  <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    Download Your Dubbed Audio
                  </h5>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownload}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 rounded-lg text-white text-sm font-medium hover:from-green-500 hover:to-green-600 transition-all duration-200"
                    >
                      📥 Download Audio
                    </button>
                    <button
                      onClick={onWalletModalOpen}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white text-sm font-medium rounded-lg hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-200"
                    >
                      ✨ Unlock Unlimited
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}