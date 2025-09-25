"use client";

import React, { useState, useCallback } from "react";
import { useWebAudioRecording } from "../hooks/useWebAudioRecording";
import WalletModal from "./WalletModal";

interface RecordingStudioProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
}

export default function RecordingStudio({
  onRecordingComplete,
}: RecordingStudioProps) {
  const {
    isRecording,
    isLoading,
    duration,
    audioBlob,
    error,
    waveformData,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  } = useWebAudioRecording();

  const [isPaused, setIsPaused] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  // Freemium AI state
  const [freeAICounter, setFreeAICounter] = useState(1);
  const [voicesFree, setVoicesFree] = useState<{ voiceId: string; name?: string }[]>([]);
  const [selectedVoiceFree, setSelectedVoiceFree] = useState("");
  const [variantBlobFree, setVariantBlobFree] = useState<Blob | null>(null);
  const [isLoadingVoicesFree, setLoadingVoicesFree] = useState(false);
  const [isGeneratingFree, setGeneratingFree] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
      setIsPaused(false);
      setShowSaveOptions(false);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    try {
      const blob = await stopRecording();
      if (blob) {
        setShowSaveOptions(true);
        // Reset freemium AI state for new recording
        setFreeAICounter(1);
        setVoicesFree([]);
        setSelectedVoiceFree("");
        setVariantBlobFree(null);
        setLoadingVoicesFree(false);
        setGeneratingFree(false);
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  }, [stopRecording]);

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      resumeRecording();
      setIsPaused(false);
    } else {
      pauseRecording();
      setIsPaused(true);
    }
  }, [isPaused, pauseRecording, resumeRecording]);

  const handleSaveRecording = useCallback(() => {
    if (audioBlob && onRecordingComplete) {
      onRecordingComplete(audioBlob, duration);
      setShowSaveOptions(false);
      setRecordingTitle("");
    }
  }, [audioBlob, duration, onRecordingComplete]);

  const handleCancelRecording = useCallback(() => {
    cancelRecording();
    setShowSaveOptions(false);
    setRecordingTitle("");
    setIsPaused(false);
    // Reset freemium AI state
    setFreeAICounter(1);
    setVoicesFree([]);
    setSelectedVoiceFree("");
    setVariantBlobFree(null);
    setLoadingVoicesFree(false);
    setGeneratingFree(false);
    setShowWalletModal(false);
  }, [cancelRecording]);

  const handleDownload = useCallback(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        recordingTitle || `recording-${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [audioBlob, recordingTitle]);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const renderWaveform = () => {
    if (waveformData.length === 0) {
      return (
        <div className="h-24 bg-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-gray-400">
            {isRecording ? "🎵 Recording audio..." : "🎤 Ready to record"}
          </span>
        </div>
      );
    }

    return (
      <div className="h-24 bg-[#2A2A2A] rounded-lg flex items-end justify-center gap-1 p-2">
        {waveformData.map((value, index) => (
          <div
            key={index}
            className="voisss-waveform-bar"
            style={{
              height: `${Math.max(2, value * 80)}px`,
              width: "3px",
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto voisss-card shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Voice Recording Studio
        </h2>
        <p className="text-gray-400">
          {isRecording
            ? isPaused
              ? "Recording paused"
              : "Recording in progress..."
            : showSaveOptions
            ? "Recording complete"
            : "Ready to start recording"}
        </p>
      </div>

      {/* Duration Display */}
      <div className="text-center mb-8">
        <div className="text-6xl font-mono text-white mb-2">
          {formatDuration(duration)}
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="mb-8">{renderWaveform()}</div>

      {/* Recording Controls */}
      <div className="flex justify-center items-center gap-4 mb-8">
        {!isRecording && !showSaveOptions && (
          <button
            onClick={handleStartRecording}
            disabled={isLoading}
            className="voisss-recording-button idle disabled:bg-gray-600"
          >
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        {isRecording && (
          <>
            <button
              onClick={handlePauseResume}
              className="w-16 h-16 bg-yellow-600 hover:bg-yellow-700 rounded-full flex items-center justify-center transition-colors"
            >
              {isPaused ? (
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            <button
              onClick={handleStopRecording}
              className="voisss-recording-button recording"
            >
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </>
        )}

        {(isRecording || showSaveOptions) && (
          <button
            onClick={handleCancelRecording}
            className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Save Options */}
      {showSaveOptions && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Save Recording
          </h3>

          {/* Freemium AI Panel */}
          <div className="p-4 mb-6 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h4 className="text-white font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#7C5DFA]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                  </svg>
                  Try AI Voice (Free)
                </h4>
                <p className="text-gray-400 text-sm">Transform your voice with AI</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-400">{freeAICounter}/1 free</span>
                {freeAICounter < 1 && (
                  <div className="mt-1">
                    <p className="text-xs text-yellow-400">Free sample used!</p>
                    <button
                      onClick={() => setShowWalletModal(true)}
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
                disabled={freeAICounter < 1 || isLoadingVoicesFree || voicesFree.length > 0}
                className="w-full px-3 py-2 bg-[#2A2A2A] rounded-lg text-gray-300 hover:bg-[#3A3A3A] disabled:opacity-50 transition-colors"
                onClick={async () => {
                  if (!isLoadingVoicesFree && voicesFree.length === 0) {
                    setLoadingVoicesFree(true);
                    try {
                      const res = await fetch("/api/elevenlabs/list-voices", { method: "POST" });
                      const data = await res.json();
                      // Limit to 3 voices for freemium
                      setVoicesFree((data.voices || []).slice(0, 3));
                      if (data.voices?.[0]?.voiceId) {
                        setSelectedVoiceFree(data.voices[0].voiceId);
                      }
                    } catch (e) {
                      console.error("Failed to load voices:", e);
                      alert("Failed to load voices. Please check your connection.");
                    } finally {
                      setLoadingVoicesFree(false);
                    }
                  }
                }}
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
                    onChange={(e) => setSelectedVoiceFree(e.target.value)}
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
                    disabled={!selectedVoiceFree || freeAICounter < 1 || isGeneratingFree || !!variantBlobFree}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] rounded-lg text-white disabled:opacity-50 font-medium transition-all duration-200"
                    onClick={async () => {
                      if (!variantBlobFree && freeAICounter > 0 && selectedVoiceFree && audioBlob) {
                        setGeneratingFree(true);
                        try {
                          const form = new FormData();
                          form.append("audio", audioBlob, "input.webm");
                          form.append("voiceId", selectedVoiceFree);
                          const res = await fetch("/api/elevenlabs/transform-voice", {
                            method: "POST",
                            body: form,
                          });
                          if (!res.ok) throw new Error("Transform failed");
                          const buf = await res.arrayBuffer();
                          setVariantBlobFree(new Blob([buf], { type: "audio/mpeg" }));
                          setFreeAICounter(0);
                        } catch (e) {
                          console.error("Variant generation failed:", e);
                          alert("AI transformation failed. Please try again.");
                        } finally {
                          setGeneratingFree(false);
                        }
                      }
                    }}
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
                        className="w-full mb-3"
                        style={{ height: '32px' }}
                      />
                      <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-blue-300 text-sm font-medium mb-2">
                          🎉 Love your AI voice?
                        </p>
                        <p className="text-gray-300 text-xs mb-3">
                          Connect your wallet to unlock unlimited AI transformations and save to the blockchain permanently.
                        </p>
                        <button
                          onClick={() => setShowWalletModal(true)}
                          className="w-full px-3 py-2 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white text-xs font-medium rounded-lg hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-200"
                        >
                          Connect Wallet & Unlock Premium
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Recording Title
            </label>
            <input
              type="text"
              id="title"
              value={recordingTitle}
              onChange={(e) => setRecordingTitle(e.target.value)}
              placeholder="Enter recording title..."
              className="voisss-input w-full"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveRecording}
              className="voisss-btn-secondary flex-1"
            >
              Save Recording
            </button>
            <button
              onClick={handleDownload}
              className="voisss-btn-primary flex-1"
            >
              Download
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded-md">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Wallet Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        title="Unlock Unlimited AI Voices"
        subtitle="Connect your wallet to save unlimited AI variants and access premium features"
      />
    </div>
  );
}
