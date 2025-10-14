"use client";

import React, { useState, useCallback } from 'react';
import LanguageSelector from './LanguageSelector';
import ProgressVisualizer from './ProgressVisualizer';
import AudioComparison from './AudioComparison';
import { isDubbingEnabled } from '@voisss/shared';
import type { LanguageInfo } from '@voisss/shared/src/constants/languages';
import type { DubbingLanguage } from '@voisss/shared/src/types/audio';
import { useDubbingLanguages, useAudioDubbing, useAIServiceStatus } from '../../hooks/queries/useAI';
import { getPopularLanguages } from '@voisss/shared/src/constants/languages';

// Use shared popular languages to avoid duplication
const POPULAR_LANGUAGES = getPopularLanguages().map(lang => ({
  code: lang.code,
  name: lang.name,
  flag: lang.flag,
}));

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
  const [isDubbing, setIsDubbing] = useState(false);
  const [dubbingProgress, setDubbingProgress] = useState<string>("");
  const [dubbingStage, setDubbingStage] = useState<'preparing' | 'translating' | 'generating' | 'finalizing' | 'complete' | 'error'>('preparing');
  const [dubbedBlob, setDubbedBlob] = useState<Blob | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<LanguageInfo[]>([]);
  const [transcript, setTranscript] = useState<string>("");
  const [translatedTranscript, setTranslatedTranscript] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [detectedSourceLanguage, setDetectedSourceLanguage] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('error');

  const { data: languagesData, isLoading: isLoadingLangs } = useDubbingLanguages();
  const { mutateAsync: dubAudio } = useAudioDubbing();
  const { data: aiStatus } = useAIServiceStatus();

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

  const loadLanguages = useCallback(() => {
    if (!languagesData || languagesData.length === 0) return;

    // Use shared, pre-sorted languages
    setAvailableLanguages(languagesData);

    // Auto-select Spanish (most popular) for better UX
    const spanish = languagesData.find((lang: LanguageInfo) => lang.code === 'es');
    if (spanish && !selectedTargetLanguage) {
      setSelectedTargetLanguage(spanish.code);
    }
  }, [languagesData, selectedTargetLanguage]);

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

      const result = await dubAudio({
        audioBlob,
        targetLanguage: selectedTargetLanguage,
        sourceLanguage: selectedSourceLanguage !== 'auto' ? selectedSourceLanguage : undefined,
        preserveBackgroundAudio: true,
      });
      const dubbedAudioBlob = result.blob;

      setDubbingStage('complete');
      setDubbingProgress("Translation complete! Ready to download.");
      setDubbedBlob(dubbedAudioBlob);
      // Use transcripts when available
      setTranscript(result.transcript || "");
      setTranslatedTranscript(result.translatedTranscript || "");

      if (onDubbingComplete) {
        onDubbingComplete(dubbedAudioBlob);
      }
    } catch (e) {
      console.error("Dubbing failed:", e);
      const errorMessage = e instanceof Error ? e.message : 'Dubbing failed. Please try again.';
      setError(errorMessage);
      setDubbingStage('error');
      setDubbingProgress("An error occurred during translation.");
      setToastType('error');
      setToastMessage(errorMessage);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      // Keep progress visible for a moment before clearing
      setTimeout(() => {
        setIsDubbing(false);
        setDubbingProgress("");
        setDubbingStage('preparing');
      }, 2000);
    }
  }, [audioBlob, selectedTargetLanguage, selectedSourceLanguage, freeDubbingCounter, onDubbingComplete, dubAudio]);

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
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-[#3A3A3A] rounded-2xl p-8">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">AI Voice Dubbing</h3>
          <p className="text-gray-400 mb-6">Record audio first to unlock language transformation</p>
          
          {/* Preview of available languages */}
          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto mb-6">
            {POPULAR_LANGUAGES.slice(0, 8).map((lang) => (
              <div key={lang.code} className="p-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg opacity-50">
                <div className="text-lg mb-1">{lang.flag}</div>
                <div className="text-xs text-gray-500">{lang.name}</div>
              </div>
            ))}
          </div>
          
          <div className="text-sm text-gray-500">
            Transform your voice into 8+ languages with AI
          </div>
        </div>
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
          {/* Service status badge */}
          <div className="mt-1 text-xs">
            {aiStatus?.isAvailable ? (
              <span className="inline-flex items-center gap-1 text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Service online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-yellow-400">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                Service unreachable
              </span>
            )}
          </div>
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
          disabled={freeDubbingCounter < 1 || isLoadingLangs || availableLanguages.length > 0}
          className="w-full px-3 py-2 bg-[#2A2A2A] rounded-lg text-gray-300 hover:bg-[#3A3A3A] disabled:opacity-50 transition-colors"
          onClick={loadLanguages}
        >
          {isLoadingLangs ? (
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

            <div className="space-y-4">
              <label className="block text-lg font-semibold text-white">
                🌍 Choose Target Language
              </label>
              
              {/* Enhanced Visual Language Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {POPULAR_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedTargetLanguage(lang.code)}
                    disabled={disabled || isDubbing}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      selectedTargetLanguage === lang.code
                        ? 'border-purple-500 bg-purple-500/20 shadow-lg'
                        : 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700'
                    } ${disabled || isDubbing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="text-2xl mb-2">{lang.flag}</div>
                    <div className="text-sm font-medium text-white mb-1">{lang.name}</div>
                    <div className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-purple-500/15 text-purple-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                      Popular
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Fallback to original selector for other languages */}
              <details className="mt-4">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-white transition-colors">
                  More languages available...
                </summary>
                <div className="mt-3">
                  <LanguageSelector
                    selectedLanguage={selectedTargetLanguage}
                    onLanguageChange={setSelectedTargetLanguage}
                    languages={availableLanguages}
                    placeholder="Select other language..."
                    disabled={disabled || isDubbing}
                    className="w-full"
                    viewMode="cards"
                  />
                </div>
              </details>
              
              <p className="text-xs text-gray-400">
                Popular languages shown above. Content will be translated while preserving emotion and tone.
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

            {/* Lightweight Toast */}
            {toastMessage && (
              <div className="fixed bottom-4 right-4 z-50">
                <div className={`min-w-[240px] px-4 py-3 rounded-xl shadow-lg border ${
                  toastType === 'error'
                    ? 'bg-red-900/30 border-red-500/30 text-red-200'
                    : 'bg-green-900/30 border-green-500/30 text-green-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 ${toastType === 'error' ? 'text-red-400' : 'text-green-400'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <p className="text-sm font-medium">{toastType === 'error' ? 'Dubbing Error' : 'Success'}</p>
                  </div>
                  <p className="text-xs mt-1 opacity-90">{toastMessage}</p>
                </div>
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