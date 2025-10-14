"use client";

import React, { useState, useCallback, useRef } from 'react';
import LanguageSelector from './LanguageSelector';
import ProgressVisualizer from './ProgressVisualizer';
import AudioComparison from './AudioComparison';
import { isDubbingEnabled } from '@voisss/shared';
import type { LanguageInfo } from '@voisss/shared/src/constants/languages';
import type { DubbingLanguage } from '@voisss/shared/src/types/audio';
import { useDubbingLanguages, useAudioDubbing, useAIServiceStatus } from '../../hooks/queries/useAI';
import { useProcessRecording } from '../../hooks/queries/useStarknetRecording';
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
  const { mutateAsync: processRecording } = useProcessRecording();
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

    // Use a ref to track if we're still dubbing to avoid stale closures in timeouts
    const stillDubbingRef = useRef(true);
    
    // Cultural insights and interesting facts for user engagement
    const culturalFacts = [
      "Did you know? In Japan, the phrase 'Omotenashi' represents the art of selfless hospitality, anticipating guests' needs before they ask.",
      "In Finland, there's a concept called 'sisu' - a special kind of courage and determination in the face of adversity.",
      "The Danish concept of 'hygge' (pronounced 'hoo-ga') encompasses a feeling of cozy contentment and well-being through enjoying simple pleasures.",
      "In India, the greeting 'Namaste' literally means 'I bow to you,' acknowledging the divine in another person.",
      "The German word 'Fernweh' describes the feeling of wanting to travel far away, literally 'farsickness' - the opposite of homesickness.",
      "In Portuguese, there's an untranslatable word 'Saudade' - a deep emotional state of nostalgic longing for an absent something or someone.",
      "The Arabic word 'Sukkar' (sugar) entered many European languages, highlighting the rich cultural exchange of the Islamic Golden Age.",
      "In Swahili, 'Ubuntu' means 'I am because we are' - emphasizing the connection between individuals and their community.",
      "The French phrase 'Savoir-faire' literally means 'to know how to do' and represents practical knowledge or expertise.",
      "In Mandarin, the word 'Guanxi' refers to the social network of relationships that facilitate business and other dealings.",
      "The Spanish concept of 'Sobremesa' is the time spent lingering at the table after a meal, enjoying conversation with fellow diners.",
      "In Korean, 'Nunchi' is the ability to understand others' feelings and thoughts through observation and intuition."
    ];

    try {
      // Get random cultural facts for each stage
      const getRandomFact = () => culturalFacts[Math.floor(Math.random() * culturalFacts.length)];
      
      // Simulate initial preparation with cultural insight
      setTimeout(() => {
        if (stillDubbingRef.current) {
          setDubbingStage('translating');
          setDubbingProgress("AI is analyzing speech patterns and emotions...");
          // Update UI with a cultural fact
          setDubbingProgress(`AI is analyzing speech patterns and emotions... Fun fact: ${getRandomFact()}`);
        }
      }, 15000); // 15 seconds for preparing stage

      setTimeout(() => {
        if (stillDubbingRef.current) {
          setDubbingStage('generating');
          // Update UI with a cultural fact
          setDubbingProgress(`Generating natural-sounding translation... Fun fact: ${getRandomFact()}`);
        }
      }, 30000); // 30 seconds total (15 more for translating stage)

      setTimeout(() => {
        if (stillDubbingRef.current) {
          setDubbingStage('finalizing');
          // Update UI with a cultural fact
          setDubbingProgress(`Finalizing translation with emotional accuracy... Fun fact: ${getRandomFact()}`);
        }
      }, 45000); // 45 seconds total (15 more for generating stage)

      // Start the dubbing process (this will now actually call the API which may take time)
      const result = await dubAudio({
        audioBlob,
        targetLanguage: selectedTargetLanguage,
        sourceLanguage: selectedSourceLanguage !== 'auto' ? selectedSourceLanguage : undefined,
        preserveBackgroundAudio: true,
      });
      const dubbedAudioBlob = result.blob;

      // Make sure we don't override the finalizing state if it's already set
      if (stillDubbingRef.current) {
        setDubbingStage('complete');
        setDubbingProgress("Translation complete! Ready to download.");
        setDubbedBlob(dubbedAudioBlob);
        // Use transcripts when available
        setTranscript(result.transcript || "");
        setTranslatedTranscript(result.translatedTranscript || "");
      }

      if (onDubbingComplete && stillDubbingRef.current) {
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
      stillDubbingRef.current = false;
      setIsDubbing(false);
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
              <div className="mt-4 p-4 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-[#7C5DFA] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">AI Dubbing in Progress</h4>
                    <p className="text-gray-400 text-sm">{dubbingProgress}</p>
                  </div>
                </div>

                {/* Progress stages */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${dubbingStage === 'preparing' || dubbingStage === 'translating' || dubbingStage === 'generating' || dubbingStage === 'finalizing' || dubbingStage === 'complete' ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                    <span className={`text-sm ${dubbingStage === 'preparing' ? 'text-white' : 'text-gray-400'}`}>Preparing audio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${dubbingStage === 'translating' || dubbingStage === 'generating' || dubbingStage === 'finalizing' || dubbingStage === 'complete' ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                    <span className={`text-sm ${dubbingStage === 'translating' ? 'text-white' : 'text-gray-400'}`}>AI translation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${dubbingStage === 'generating' || dubbingStage === 'finalizing' || dubbingStage === 'complete' ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                    <span className={`text-sm ${dubbingStage === 'generating' ? 'text-white' : 'text-gray-400'}`}>Voice synthesis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${dubbingStage === 'finalizing' || dubbingStage === 'complete' ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                    <span className={`text-sm ${dubbingStage === 'finalizing' ? 'text-white' : 'text-gray-400'}`}>Finalizing</span>
                  </div>
                </div>


              </div>
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

                {/* Save Options Section */}
                <div className="p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
                  <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V7h10v2z"/>
                    </svg>
                    Save Your Audio
                  </h5>
                  <div className="space-y-3">
                    {/* Original Audio Options */}
                    <div className="p-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg">
                      <h6 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Original Recording
                      </h6>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Download original audio
                            const url = URL.createObjectURL(audioBlob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `original-${new Date().toISOString()}.webm`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                          className="flex-1 px-3 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg text-white text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1"
                        >
                          📥 Download
                        </button>
                        <button
                          onClick={async () => {
                            if (!audioBlob) return;

                            try {
                              // Save original audio to Starknet
                              const result = await processRecording({
                                blob: audioBlob,
                                metadata: {
                                  title: `Original Recording`,
                                  description: `Original audio recording before dubbing`,
                                  ipfsHash: '', // Will be filled by the pipeline
                                  duration: 0, // Will be calculated by the pipeline
                                  fileSize: audioBlob.size,
                                  isPublic: false,
                                  tags: ['original', 'recording'],
                                },
                                onProgress: (progress: any) => {
                                  // Progress tracking for original audio save
                                }
                              });

                              if (result.success) {
                                console.log('Original audio saved successfully:', result);
                                setToastType('success');
                                setToastMessage('Original audio saved!');
                                setTimeout(() => setToastMessage(null), 4000);
                              } else {
                                console.error('Failed to save original audio:', result.error);
                                setToastType('error');
                                setToastMessage(result.error || 'Failed to save original audio');
                                setTimeout(() => setToastMessage(null), 4000);
                              }
                            } catch (error) {
                              console.error('Error saving original audio:', error);
                              setToastType('error');
                              setToastMessage('Error saving original audio');
                              setTimeout(() => setToastMessage(null), 4000);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-white text-xs font-medium hover:from-blue-500 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-1"
                        >
                          💾 Save
                        </button>
                      </div>
                    </div>

                    {/* Dubbed Audio Options */}
                    <div className="p-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg">
                      <h6 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Dubbed (in {availableLanguages.find(l => l.code === selectedTargetLanguage)?.name || selectedTargetLanguage})
                      </h6>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDownload}
                          className="flex-1 px-3 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg text-white text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1"
                        >
                          📥 Download
                        </button>
                        <button
                          onClick={async () => {
                            if (!dubbedBlob) return;

                            try {
                              // Use the existing recording pipeline
                              const result = await processRecording({
                                blob: dubbedBlob,
                                metadata: {
                                  title: `Dubbed - ${selectedTargetLanguage}`,
                                  description: `AI dubbed version in ${selectedTargetLanguage}`,
                                  ipfsHash: '', // Will be filled by the pipeline
                                  duration: 0, // Will be calculated by the pipeline
                                  fileSize: dubbedBlob.size,
                                  isPublic: false,
                                  tags: ['dubbed', selectedTargetLanguage],
                                },
                                onProgress: (progress: any) => {
                                  // Progress tracking for dubbed audio save
                                }
                              });

                              if (result.success) {
                                console.log('Dubbed audio saved successfully:', result);
                                setToastType('success');
                                setToastMessage('Dubbed audio saved!');
                                setTimeout(() => setToastMessage(null), 4000);
                              } else {
                                console.error('Failed to save dubbed audio:', result.error);
                                setToastType('error');
                                setToastMessage(result.error || 'Failed to save dubbed audio');
                                setTimeout(() => setToastMessage(null), 4000);
                              }
                            } catch (error) {
                              console.error('Error saving dubbed audio:', error);
                              setToastType('error');
                              setToastMessage('Error saving dubbed audio');
                              setTimeout(() => setToastMessage(null), 4000);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 rounded-lg text-white text-xs font-medium hover:from-green-500 hover:to-green-600 transition-all duration-200 flex items-center justify-center gap-1"
                        >
                          💾 Save
                        </button>
                      </div>
                    </div>

                    {/* Unlimited Option */}
                    <button
                      onClick={onWalletModalOpen}
                      className="w-full px-4 py-2 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white text-sm font-medium rounded-lg hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-200"
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