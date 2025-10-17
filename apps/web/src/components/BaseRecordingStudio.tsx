"use client";

import React, { useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useBaseAccount } from "../hooks/useBaseAccount";
import { useWebAudioRecording } from "../hooks/useWebAudioRecording";
import { useFreemiumStore } from "../store/freemiumStore";
import { createIPFSService } from "@voisss/shared";
import { createBaseRecordingService } from "../services/baseRecordingService";
import { useAIVoices, useAIModels, useVoiceTransform, useAIServiceStatus } from "../hooks/queries/useAI";
import DubbingPanel from "./dubbing/DubbingPanel";
import AudioComparison from "./dubbing/AudioComparison";
import RealTimeWaveform from "./RealTimeWaveform";

interface BaseRecordingStudioProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
}

export default function BaseRecordingStudio({
  onRecordingComplete,
}: BaseRecordingStudioProps) {
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('error');
  
  // AI Voice state
  const [voicesFree, setVoicesFree] = useState<{ voiceId: string; name?: string }[]>([]);
  const [selectedVoiceFree, setSelectedVoiceFree] = useState("");
  const [variantBlobFree, setVariantBlobFree] = useState<Blob | null>(null);
  const [isLoadingVoicesFree, setLoadingVoicesFree] = useState(false);
  const [isGeneratingFree, setGeneratingFree] = useState(false);
  
  // Dubbing state
  const [dubbedBlob, setDubbedBlob] = useState<Blob | null>(null);
  const [dubbedLanguage, setDubbedLanguage] = useState<string>("");
  
  // Version selection state for unified save
  const [selectedVersions, setSelectedVersions] = useState({
    original: true,
    aiVoice: false,
    dubbed: false,
  });

  const { isAuthenticated, address, signIn } = useAuth();
  const { subAccount, sendCalls, status, isConnected, universalAddress, connect } = useBaseAccount();
  
  // Create services
  const ipfsService = React.useMemo(() => createIPFSService(), []);
  const baseRecordingService = React.useMemo(() => 
    createBaseRecordingService(sendCalls), [sendCalls]
  );
  
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
  
  // AI Voice transformation state
  const { data: voices = [], isLoading: isLoadingVoices } = useAIVoices();
  const { data: models = [] } = useAIModels();
  const { mutateAsync: transformVoice, isPending: isTransforming } = useVoiceTransform();
  const { data: aiStatus } = useAIServiceStatus();
  
  const [selectedModel, setSelectedModel] = useState("eleven_multilingual_sts_v2");
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.5);
  const [showAIPanel, setShowAIPanel] = useState(false);
  
  // Sync user tier with wallet connection
  React.useEffect(() => {
    if (address) {
      setUserTier('free');
    } else {
      setUserTier('guest');
    }
  }, [address, setUserTier]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
      setIsPaused(false);
      setShowSaveOptions(false);
      setShowAIPanel(false);
      // Reset AI and dubbing state for new recording
      setVariantBlobFree(null);
      setSelectedVoiceFree("");
      setDubbedBlob(null);
      setDubbedLanguage("");
      setSelectedVersions({ original: true, aiVoice: false, dubbed: false });
    } catch (error) {
      console.error("Failed to start recording:", error);
      showToast("Failed to start recording", "error");
    }
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    try {
      const blob = await stopRecording();
      if (blob) {
        if (onRecordingComplete) {
          onRecordingComplete(blob, duration / 1000);
        }
        setShowSaveOptions(true);
        setShowAIPanel(true);
        setIsPaused(false);
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      showToast("Failed to stop recording", "error");
    }
  }, [stopRecording, duration, onRecordingComplete]);

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      resumeRecording();
      setIsPaused(false);
    } else {
      pauseRecording();
      setIsPaused(true);
    }
  }, [isPaused, pauseRecording, resumeRecording]);

  const handlePlayPreview = useCallback(() => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.play();
    }
  }, [audioBlob]);

  const handleSaveSelectedVersions = async () => {
    if (!audioBlob) {
      showToast("No recording to save", "error");
      return;
    }

    if (!isAuthenticated || !subAccount) {
      await signIn();
      showToast("Please sign in to save recordings", "error");
      return;
    }

    // Count selected versions
    const selectedCount = Object.values(selectedVersions).filter(Boolean).length;
    
    if (selectedCount === 0) {
      showToast("Please select at least one version to save", "error");
      return;
    }

    // Check quota (validate each save individually)
    for (let i = 0; i < selectedCount; i++) {
      if (!canSaveRecording()) {
        const remaining = getRemainingQuota().saves;
        showToast(`Not enough saves remaining. You have ${remaining} saves left.`, "error");
        return;
      }
    }

    try {
      const savePromises: Promise<any>[] = [];

      // Save original if selected
      if (selectedVersions.original) {
        savePromises.push(
          saveRecordingToBase(audioBlob, {
            title: recordingTitle || `Recording ${new Date().toLocaleString()}`,
            description: "Original recording",
            isPublic: true,
            tags: ["original"],
          })
        );
      }

      // Save AI voice if selected and available
      if (selectedVersions.aiVoice && variantBlobFree) {
        savePromises.push(
          saveRecordingToBase(variantBlobFree, {
            title: `${recordingTitle || "Recording"} (AI Voice)`,
            description: `AI voice transformation using ${selectedVoiceFree}`,
            isPublic: true,
            tags: ["ai-voice", selectedVoiceFree],
          })
        );
      }

      // Save dubbed version if selected and available
      if (selectedVersions.dubbed && dubbedBlob) {
        savePromises.push(
          saveRecordingToBase(dubbedBlob, {
            title: `${recordingTitle || "Recording"} (${dubbedLanguage})`,
            description: `Dubbed to ${dubbedLanguage}`,
            isPublic: true,
            tags: ["dubbed", dubbedLanguage],
          })
        );
      }

      // Execute all saves
      await Promise.all(savePromises);

      // Update usage
      for (let i = 0; i < selectedCount; i++) {
        incrementSaveUsage();
      }

      showToast(`Successfully saved ${selectedCount} version${selectedCount > 1 ? 's' : ''} with gasless transactions!`, "success");
      
      // Reset state
      setShowSaveOptions(false);
      setSelectedVersions({ original: true, aiVoice: false, dubbed: false });
      setRecordingTitle("");
      
      if (onRecordingComplete && audioBlob) {
        onRecordingComplete(audioBlob, duration);
      }
      
    } catch (error) {
      console.error("Failed to save recordings:", error);
      showToast("Failed to save recordings. Please try again.", "error");
    }
  };

  const saveRecordingToBase = async (audioBlob: Blob, metadata: any) => {
    // 1. Upload to IPFS
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.mp3`;
    
    const ipfsResult = await ipfsService.uploadAudio(audioBlob, {
      filename,
      mimeType: audioBlob.type || 'audio/mpeg',
      duration: duration,
    });

    // 2. Save to Base chain (gasless!)
    const txId = await baseRecordingService.saveRecording(ipfsResult.hash, {
      title: metadata.title,
      description: metadata.description,
      isPublic: metadata.isPublic,
      tags: metadata.tags,
    });

    return { ipfsHash: ipfsResult.hash, txId };
  };

  const handleCancelRecording = useCallback(() => {
    cancelRecording();
    setShowSaveOptions(false);
    setRecordingTitle("");
  }, [cancelRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderWaveform = () => {
    if (!waveformData || waveformData.length === 0) {
      return (
        <div className="h-16 bg-gray-100 rounded-lg flex items-center justify-center">
          <span className="text-gray-500 text-sm">
            {isRecording ? "Recording..." : "No audio data"}
          </span>
        </div>
      );
    }

    return (
      <div className="h-16 bg-gray-100 rounded-lg flex items-center justify-center px-2">
        <div className="flex items-center space-x-1 h-full">
          {waveformData.slice(-50).map((amplitude, index) => (
            <div
              key={index}
              className="bg-blue-500 rounded-full"
              style={{
                width: '2px',
                height: `${Math.max(2, amplitude * 60)}px`,
                opacity: isRecording ? 1 : 0.6,
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Connection Status */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Base Account Status</h3>
            <p className="text-sm text-gray-600">{status}</p>
            {universalAddress && (
              <p className="text-xs text-gray-500 mt-1">
                Universal: {universalAddress.slice(0, 6)}...{universalAddress.slice(-4)}
              </p>
            )}
            {subAccount && (
              <p className="text-xs text-gray-500">
                Sub Account: {subAccount.address.slice(0, 6)}...{subAccount.address.slice(-4)}
              </p>
            )}
          </div>
          {!isConnected && (
            <button
              onClick={connect}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Connect Base Account
            </button>
          )}
        </div>
      </div>

      {/* Recording Interface */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-6">Gasless Voice Recording</h2>
        
        {/* Waveform */}
        {renderWaveform()}
        
        {/* Timer */}
        <div className="text-center my-4">
          <span className="text-2xl font-mono">{formatTime(duration)}</span>
        </div>
        
        {/* Recording Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={isLoading}
              className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Start Recording"}
            </button>
          ) : (
            <>
              <button
                onClick={handleStopRecording}
                className="px-6 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700"
              >
                Stop Recording
              </button>
              <button
                onClick={handleCancelRecording}
                className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700"
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
      </div>

      {/* Save Options */}
      {showSaveOptions && audioBlob && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Save Recording</h3>
          
          {/* Title Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recording Title
            </label>
            <input
              type="text"
              value={recordingTitle}
              onChange={(e) => setRecordingTitle(e.target.value)}
              placeholder="Enter recording title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Version Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Versions to Save
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedVersions.original}
                  onChange={(e) => setSelectedVersions(prev => ({ ...prev, original: e.target.checked }))}
                  className="mr-2"
                />
                Original Recording
              </label>
              {variantBlobFree && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedVersions.aiVoice}
                    onChange={(e) => setSelectedVersions(prev => ({ ...prev, aiVoice: e.target.checked }))}
                    className="mr-2"
                  />
                  AI Voice Transformation
                </label>
              )}
              {dubbedBlob && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedVersions.dubbed}
                    onChange={(e) => setSelectedVersions(prev => ({ ...prev, dubbed: e.target.checked }))}
                    className="mr-2"
                  />
                  Dubbed Version ({dubbedLanguage})
                </label>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-between">
            <button
              onClick={() => setShowSaveOptions(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSelectedVersions}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save to Base (Gasless)
            </button>
          </div>
        </div>
      )}

      {/* AI Voice Transformation */}
      {audioBlob && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">AI Voice Transformation</h3>
          <p className="text-sm text-gray-600 mb-4">
            Transform your voice using AI (requires ElevenLabs integration)
          </p>
          {/* TODO: Add AI voice transformation UI */}
          <div className="text-center py-8 text-gray-500">
            AI Voice Transformation Coming Soon
          </div>
        </div>
      )}

      {/* Dubbing Panel */}
      {audioBlob && (
        <DubbingPanel
          audioBlob={audioBlob}
          onDubbingComplete={(dubbedAudio, language) => {
            setDubbedBlob(dubbedAudio);
            setDubbedLanguage(language);
            setSelectedVersions(prev => ({ ...prev, dubbed: true }));
          }}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white ${
          toastType === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}