"use client";

import React, { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useWebAudioRecording } from "../hooks/useWebAudioRecording";
import {
  useProcessRecording,
  useUserRecordings,
  useDeleteRecording,
  useToggleRecordingVisibility,
  useRecordingStats
} from "../hooks/queries/useStarknetRecording";
import { useFreemiumStore } from "../store/freemiumStore";
import { RecordingCard, type Recording } from "@voisss/ui";
import WalletModal from "./WalletModal";
import DubbingPanel from "./dubbing/DubbingPanel";

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
  
  // Recording list state (for connected users)
  const [editingRecording, setEditingRecording] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showHidden, setShowHidden] = useState(false);

  // AI Voice state
  const [voicesFree, setVoicesFree] = useState<{ voiceId: string; name?: string }[]>([]);
  const [selectedVoiceFree, setSelectedVoiceFree] = useState("");
  const [variantBlobFree, setVariantBlobFree] = useState<Blob | null>(null);
  const [isLoadingVoicesFree, setLoadingVoicesFree] = useState(false);
  const [isGeneratingFree, setGeneratingFree] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('error');
  
  // Dubbing state
  const [dubbedBlob, setDubbedBlob] = useState<Blob | null>(null);
  const [dubbedLanguage, setDubbedLanguage] = useState<string>("");
  
  // Version selection state for unified save
  const [selectedVersions, setSelectedVersions] = useState({
    original: true,
    aiVoice: false,
    dubbed: false,
  });

  const { mutateAsync: processRecording } = useProcessRecording();
  const { address, isConnected } = useAccount();
  
  // Starknet recording hooks (only active when connected)
  const { data: recordings = [], isLoading: isLoadingRecordings } = useUserRecordings();
  const deleteRecordingMutation = useDeleteRecording();
  const toggleVisibilityMutation = useToggleRecordingVisibility();
  const { data: recordingStats } = useRecordingStats();
  
  // Freemium state from global store
  const {
    userTier,
    canSaveRecording,
    canUseAIVoice,
    canUseDubbing,
    incrementSaveUsage,
    incrementAIVoiceUsage,
    incrementDubbingUsage,
    getRemainingQuota,
    setUserTier,
  } = useFreemiumStore();
  
  // Sync user tier with wallet connection
  React.useEffect(() => {
    if (address) {
      // TODO: Check if user has premium subscription
      setUserTier('free'); // For now, connected users are free tier
    } else {
      setUserTier('guest');
    }
  }, [address, setUserTier]);
  
  const remainingQuota = getRemainingQuota();

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
        // Reset AI state for new recording
        setVoicesFree([]);
        setSelectedVoiceFree("");
        setVariantBlobFree(null);
        setLoadingVoicesFree(false);
        setGeneratingFree(false);
        // Reset dubbing state
        setDubbedBlob(null);
        setDubbedLanguage("");
        // Reset version selection
        setSelectedVersions({
          original: true,
          aiVoice: false,
          dubbed: false,
        });
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

  // Unified save handler for all selected versions
  const handleSaveSelectedVersions = useCallback(async () => {
    if (!audioBlob) return;
    
    // Count selected versions
    const versionsToSave = Object.values(selectedVersions).filter(Boolean).length;
    if (versionsToSave === 0) {
      setToastType('error');
      setToastMessage('Please select at least one version to save');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    
    // Check if user can save (check against number of versions)
    if (!canSaveRecording()) {
      if (userTier === 'guest') {
        setShowWalletModal(true);
        return;
      }
      // Free tier hit limit
      setToastType('error');
      setToastMessage('Weekly save limit reached. Upgrade for unlimited saves!');
      setTimeout(() => setToastMessage(null), 4000);
      setShowWalletModal(true);
      return;
    }
    
    // Check if user has enough quota for all selected versions
    if (userTier === 'free' && versionsToSave > remainingQuota.saves) {
      setToastType('error');
      setToastMessage(`Not enough saves remaining. You have ${remainingQuota.saves} saves left but selected ${versionsToSave} versions.`);
      setTimeout(() => setToastMessage(null), 4000);
      setShowWalletModal(true);
      return;
    }
    
    try {
      // Shorten title to fit felt252 (31 chars max)
      const baseTitle = recordingTitle.slice(0, 20) || `Rec-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}`;
      const results = [];
      
      // Save original if selected
      if (selectedVersions.original && audioBlob) {
        const result = await processRecording({
          blob: audioBlob,
          metadata: {
            title: baseTitle,
            description: 'Original Recording',
            ipfsHash: '', // Will be populated by processRecording
            duration: duration / 1000,
            fileSize: audioBlob.size,
            isPublic: false,
            tags: ['recording', 'original'],
          },
          onProgress: (progress: any) => console.log('Original save progress:', progress)
        });
        results.push({
          type: 'original',
          success: result.success,
          error: result.error,
          ipfsHash: result.ipfsHash, // ✅ Store full IPFS hash from result
        });
        if (result.success) incrementSaveUsage();
      }
      
      // Save AI voice if selected
      if (selectedVersions.aiVoice && variantBlobFree) {
        const result = await processRecording({
          blob: variantBlobFree,
          metadata: {
            title: `${baseTitle}-AI`,
            description: 'AI voice',
            ipfsHash: '', // Will be populated by processRecording
            duration: 0,
            fileSize: variantBlobFree.size,
            isPublic: false,
            tags: ['recording', 'ai-voice', selectedVoiceFree],
          },
          onProgress: (progress: any) => console.log('AI Voice save progress:', progress)
        });
        results.push({
          type: 'ai-voice',
          success: result.success,
          error: result.error,
          ipfsHash: result.ipfsHash, // ✅ Store full IPFS hash from result
        });
        if (result.success) incrementSaveUsage();
      }
      
      // Save dubbed if selected
      if (selectedVersions.dubbed && dubbedBlob) {
        const result = await processRecording({
          blob: dubbedBlob,
          metadata: {
            title: `${baseTitle}-Dub`,
            description: `Dubbed: ${dubbedLanguage}`,
            ipfsHash: '', // Will be populated by processRecording
            duration: 0,
            fileSize: dubbedBlob.size,
            isPublic: false,
            tags: ['recording', 'dubbed', dubbedLanguage],
          },
          onProgress: (progress: any) => console.log('Dubbed save progress:', progress)
        });
        results.push({
          type: 'dubbed',
          success: result.success,
          error: result.error,
          ipfsHash: result.ipfsHash, // ✅ Store full IPFS hash from result
        });
        if (result.success) incrementSaveUsage();
      }
      
      // Show results
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        setToastType('success');
        setToastMessage(`${successCount} version${successCount > 1 ? 's' : ''} saved successfully!`);
        setTimeout(() => setToastMessage(null), 4000);
        
        if (onRecordingComplete && audioBlob) {
          onRecordingComplete(audioBlob, duration);
        }
      }
      
      if (failCount > 0) {
        setToastType('error');
        setToastMessage(`${failCount} version${failCount > 1 ? 's' : ''} failed to save`);
        setTimeout(() => setToastMessage(null), 4000);
      }
      
      if (successCount === versionsToSave) {
        // All saved successfully, can close
        setShowSaveOptions(false);
        setRecordingTitle("");
      }
    } catch (error) {
      console.error('Error saving recordings:', error);
      setToastType('error');
      setToastMessage('Error saving recordings');
      setTimeout(() => setToastMessage(null), 4000);
    }
  }, [audioBlob, variantBlobFree, dubbedBlob, selectedVersions, recordingTitle, duration, selectedVoiceFree, dubbedLanguage, canSaveRecording, userTier, remainingQuota.saves, processRecording, incrementSaveUsage, onRecordingComplete]);

  const handleCancelRecording = useCallback(() => {
    cancelRecording();
    setShowSaveOptions(false);
    setRecordingTitle("");
    setIsPaused(false);
    // Reset AI state
    setVoicesFree([]);
    setSelectedVoiceFree("");
    setVariantBlobFree(null);
    setLoadingVoicesFree(false);
    setGeneratingFree(false);
    setShowWalletModal(false);
    // Reset dubbing state
    setDubbedBlob(null);
    setDubbedLanguage("");
    // Reset version selection
    setSelectedVersions({
      original: true,
      aiVoice: false,
      dubbed: false,
    });
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

  // Recording list management functions
  const toggleRecordingVisibility = (id: string) => {
    const recording = recordings.find((r: any) => r.id === id);
    if (recording) {
      toggleVisibilityMutation.mutate({
        recordingId: id,
        isHidden: !recording.isHidden
      });
    }
  };

  const startEditingTitle = (recording: any) => {
    setEditingRecording(recording.id);
    setEditTitle(recording.customTitle || recording.title);
  };

  const saveEditedTitle = () => {
    if (editingRecording && editTitle.trim()) {
      const recording = recordings.find((r: any) => r.id === editingRecording);
      if (recording) {
        // Update via mutation - this would need to be added to useStarknetRecording
        const updatedRecording = { ...recording, customTitle: editTitle.trim() };
        // For now, just update localStorage directly
        const stored = localStorage.getItem(`recordings_${address}`);
        if (stored) {
          const recs = JSON.parse(stored);
          const updated = recs.map((r: any) =>
            r.id === editingRecording ? updatedRecording : r
          );
          localStorage.setItem(`recordings_${address}`, JSON.stringify(updated));
        }
      }
      setEditingRecording(null);
      setEditTitle("");
    }
  };

  const cancelEditingTitle = () => {
    setEditingRecording(null);
    setEditTitle("");
  };

  const getDisplayTitle = (recording: any): string => {
    if (recording.customTitle) return recording.customTitle;
    if (recording.title && recording.title !== recording.id)
      return recording.title;
    return `Recording ${recording.timestamp ? new Date(recording.timestamp).toLocaleTimeString() : 'Unknown time'}`;
  };

  const deleteRecording = (id: string) => {
    if (confirm("Are you sure you want to delete this recording?")) {
      deleteRecordingMutation.mutate(id);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Filter recordings based on visibility
  const visibleRecordings = recordings.filter(
    (recording: any) => showHidden || !recording.isHidden
  );

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

          {/* AI Voice Panel */}
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
                  {userTier === 'premium' ? '∞ unlimited' : `${remainingQuota.aiVoice}/${useFreemiumStore.getState().WEEKLY_AI_VOICE_LIMIT} free`}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                disabled={!canUseAIVoice() || isLoadingVoicesFree || voicesFree.length > 0}
                className="w-full px-3 py-2 bg-[#2A2A2A] rounded-lg text-gray-300 hover:bg-[#3A3A3A] disabled:opacity-50 transition-colors"
                onClick={async () => {
                  if (!isLoadingVoicesFree && voicesFree.length === 0) {
                    setLoadingVoicesFree(true);
                    try {
                      const res = await fetch("/api/elevenlabs/list-voices", { method: "POST" });
                      const data = await res.json();
                      setVoicesFree((data.voices || []).slice(0, 3));
                      if (data.voices?.[0]?.voiceId) {
                        setSelectedVoiceFree(data.voices[0].voiceId);
                      }
                    } catch (e) {
                      console.error("Failed to load voices:", e);
                      setToastType('error');
                      setToastMessage('Failed to load voices');
                      setTimeout(() => setToastMessage(null), 4000);
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
                    disabled={!selectedVoiceFree || !canUseAIVoice() || isGeneratingFree || !!variantBlobFree}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] rounded-lg text-white disabled:opacity-50 font-medium transition-all duration-200"
                    onClick={async () => {
                      if (!variantBlobFree && canUseAIVoice() && selectedVoiceFree && audioBlob) {
                        setGeneratingFree(true);
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
                          setVariantBlobFree(blob);
                          incrementAIVoiceUsage();
                          // Auto-select AI voice version for saving
                          setSelectedVersions(prev => ({ ...prev, aiVoice: true }));
                        } catch (e) {
                          console.error("Variant generation failed:", e);
                          setToastType('error');
                          setToastMessage('AI transformation failed');
                          setTimeout(() => setToastMessage(null), 4000);
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
                        className="w-full"
                        style={{ height: '32px' }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

         {/* Dubbing Panel */}
         <DubbingPanel
           audioBlob={audioBlob}
           onDubbingComplete={(dubbedBlob, language) => {
             setDubbedBlob(dubbedBlob);
             setDubbedLanguage(language);
             // Auto-select dubbed version for saving
             setSelectedVersions(prev => ({ ...prev, dubbed: true }));
           }}
           onWalletModalOpen={() => setShowWalletModal(true)}
           recordingTitle={recordingTitle}
         />

          {/* Version Selection Checkboxes */}
          <div className="mb-6 p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#7C5DFA]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              Select Versions to Save
            </h4>
            <p className="text-gray-400 text-xs mb-4">
              Choose which versions you want to save to Starknet/IPFS
            </p>
            
            <div className="space-y-3">
              {/* Original Version */}
              <label className="flex items-center gap-3 p-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg cursor-pointer hover:border-[#3A3A3A] transition-colors">
                <input
                  type="checkbox"
                  checked={selectedVersions.original}
                  onChange={(e) => setSelectedVersions(prev => ({ ...prev, original: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-600 text-[#7C5DFA] focus:ring-[#7C5DFA] focus:ring-offset-gray-900"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-white font-medium">Original Recording</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Your original voice recording</p>
                </div>
                {audioBlob && (
                  <span className="text-xs text-gray-500">{(audioBlob.size / 1024).toFixed(0)} KB</span>
                )}
              </label>

              {/* AI Voice Version */}
              <label className={`flex items-center gap-3 p-3 bg-[#0F0F0F] border rounded-lg transition-colors ${
                variantBlobFree
                  ? 'border-[#2A2A2A] cursor-pointer hover:border-[#3A3A3A]'
                  : 'border-[#1A1A1A] opacity-50 cursor-not-allowed'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedVersions.aiVoice}
                  onChange={(e) => setSelectedVersions(prev => ({ ...prev, aiVoice: e.target.checked }))}
                  disabled={!variantBlobFree}
                  className="w-5 h-5 rounded border-gray-600 text-[#7C5DFA] focus:ring-[#7C5DFA] focus:ring-offset-gray-900 disabled:opacity-50"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span className="text-white font-medium">AI Voice Transform</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {variantBlobFree ? `AI voice using ${selectedVoiceFree}` : 'Generate AI voice first'}
                  </p>
                </div>
                {variantBlobFree && (
                  <span className="text-xs text-gray-500">{(variantBlobFree.size / 1024).toFixed(0)} KB</span>
                )}
              </label>

              {/* Dubbed Version */}
              <label className={`flex items-center gap-3 p-3 bg-[#0F0F0F] border rounded-lg transition-colors ${
                dubbedBlob
                  ? 'border-[#2A2A2A] cursor-pointer hover:border-[#3A3A3A]'
                  : 'border-[#1A1A1A] opacity-50 cursor-not-allowed'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedVersions.dubbed}
                  onChange={(e) => setSelectedVersions(prev => ({ ...prev, dubbed: e.target.checked }))}
                  disabled={!dubbedBlob}
                  className="w-5 h-5 rounded border-gray-600 text-[#7C5DFA] focus:ring-[#7C5DFA] focus:ring-offset-gray-900 disabled:opacity-50"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-white font-medium">Dubbed Version</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {dubbedBlob ? `Dubbed in ${dubbedLanguage}` : 'Generate dubbed version first'}
                  </p>
                </div>
                {dubbedBlob && (
                  <span className="text-xs text-gray-500">{(dubbedBlob.size / 1024).toFixed(0)} KB</span>
                )}
              </label>
            </div>

            {/* Selection Summary */}
            <div className="mt-4 p-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Selected versions:</span>
                <span className="text-white font-medium">
                  {Object.values(selectedVersions).filter(Boolean).length} of {[audioBlob, variantBlobFree, dubbedBlob].filter(Boolean).length} available
                </span>
              </div>
              {userTier === 'free' && (
                <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-[#2A2A2A]">
                  <span className="text-gray-400">Will use:</span>
                  <span className={`font-medium ${
                    Object.values(selectedVersions).filter(Boolean).length > remainingQuota.saves
                      ? 'text-red-400'
                      : 'text-green-400'
                  }`}>
                    {Object.values(selectedVersions).filter(Boolean).length} of {remainingQuota.saves} saves remaining
                  </span>
                </div>
              )}
            </div>
          </div>

         {/* Recording Title */}
         <div className="mb-6">
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
              placeholder="Give your recording a memorable name..."
              className="voisss-input w-full border-purple-500 focus:ring-purple-500 placeholder-gray-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="voisss-btn-primary flex-1"
            >
              📥 Download (Free)
            </button>
            <button
              onClick={handleSaveSelectedVersions}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                userTier === 'guest'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600'
                  : userTier === 'premium'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600'
              }`}
            >
              {userTier === 'guest' ? (
                '🔒 Connect to Save'
              ) : userTier === 'premium' ? (
                `💾 Save Selected (∞)`
              ) : (
                `💾 Save Selected (${remainingQuota.saves} free)`
              )}
            </button>
          </div>
          {userTier === 'free' && remainingQuota.saves <= 2 && (
            <p className="text-xs text-yellow-400 text-center mt-2">
              ⚠️ {remainingQuota.saves} free saves remaining this week
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded-md">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Toast Notification */}
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
              <p className="text-sm font-medium">{toastType === 'error' ? 'Save Error' : 'Success'}</p>
            </div>
            <p className="text-xs mt-1 opacity-90">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        title="Unlock Unlimited AI Voices"
        subtitle="Connect your wallet to save unlimited AI variants and access premium features"
      />

      {/* Recordings List - Only show when wallet is connected */}
      {isConnected && (
        <div className="mt-8 voisss-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Your Recordings</h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowHidden(!showHidden)}
                className="text-sm text-purple-300 hover:text-purple-100 transition-colors"
              >
                {showHidden ? "Hide Hidden" : "Show Hidden"}
              </button>
              {recordingStats && (
                <div className="text-sm text-gray-300">
                  Total: {recordingStats.total} | Public: {recordingStats.public} | Private: {recordingStats.private}
                </div>
              )}
            </div>
          </div>

          {isLoadingRecordings ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
              <p className="mt-2 text-gray-300">Loading recordings...</p>
            </div>
          ) : visibleRecordings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No recordings found.</p>
              <p className="text-sm mt-2">Start recording to see your voice recordings here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleRecordings.map((recording: any) => (
                <RecordingCard
                  key={recording.id}
                  recording={{
                    id: recording.id,
                    title: getDisplayTitle(recording),
                    duration: recording.duration || 0,
                    createdAt: recording.timestamp ? new Date(recording.timestamp).toISOString() : new Date().toISOString(),
                    tags: recording.tags,
                    isPlaying: false, // We'll handle playback separately
                    fileSize: recording.fileSize,
                    onChain: recording.onChain,
                  } as Recording}
                  className={recording.isHidden ? "opacity-50" : ""}
                  onDelete={() => deleteRecording(recording.id)}
                  onPlay={(id) => console.log('Play recording', id)}
                  onPause={(id) => console.log('Pause recording', id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
