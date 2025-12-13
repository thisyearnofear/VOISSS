"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useBaseAccount } from "../hooks/useBaseAccount";
import { useWebAudioRecording } from "../hooks/useWebAudioRecording";
import { useFreemiumStore } from "../store/freemiumStore";
import { createIPFSService, createBaseRecordingService, crossPlatformStorage } from "@voisss/shared";
import { SocialShare } from "@voisss/ui";
import DubbingPanel from "./dubbing/DubbingPanel";
import { VoiceRecordsABI } from "../contracts/VoiceRecordsABI";
import { createWalletClient, custom, encodeFunctionData } from "viem";
import { base } from "viem/chains";

// Import modular components
import RecordingControls from "./RecordingStudio/RecordingControls";
import DurationDisplay from "./RecordingStudio/DurationDisplay";
import WaveformVisualization from "./RecordingStudio/WaveformVisualization";
import ToastNotification from "./RecordingStudio/ToastNotification";
import AIVoicePanel from "./RecordingStudio/AIVoicePanel";
import VersionSelection from "./RecordingStudio/VersionSelection";
import PermissionStatus from "./RecordingStudio/PermissionStatus";
import AudioPreview from "./RecordingStudio/AudioPreview";
import ActionButtons from "./RecordingStudio/ActionButtons";
import RecordingTitle from "./RecordingStudio/RecordingTitle";

interface RecordingStudioProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
}

interface ShareableRecording {
  id: string;
  title: string;
  ipfsHash?: string;
  ipfsUrl?: string;
  duration: number;
  createdAt: string;
}

interface SocialShareProps {
  recording: ShareableRecording;
  className?: string;
  onShare?: (platform: string, url: string) => void;
}

interface SaveResult {
  type: string;
  success: boolean;
  error: null;
  ipfsHash: string;
  recording: ShareableRecording;
}

export default function RecordingStudio({
  onRecordingComplete,
}: RecordingStudioProps) {
  // Core recording state
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

  // Basic UI state
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // AI Voice state
  const [voicesFree, setVoicesFree] = useState<{ voiceId: string; name?: string }[]>([]);
  const [selectedVoiceFree, setSelectedVoiceFree] = useState("");
  const [variantBlobFree, setVariantBlobFree] = useState<Blob | null>(null);
  const [isLoadingVoicesFree, setLoadingVoicesFree] = useState(false);
  const [isGeneratingFree, setGeneratingFree] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('error');
  
  // Gas saving fallback
  const [isDirectSaving, setIsDirectSaving] = useState(false);
  const contractAddress = process.env.NEXT_PUBLIC_VOICE_RECORDS_CONTRACT as `0x${string}`;

  // Dubbing state
  const [dubbedBlob, setDubbedBlob] = useState<Blob | null>(null);
  const [dubbedLanguage, setDubbedLanguage] = useState<string>("");

  // Version selection state
  const [selectedVersions, setSelectedVersions] = useState({
    original: true,
    aiVoice: false,
    dubbed: false,
  });

  // Sharing state
  const [savedRecordings, setSavedRecordings] = useState<ShareableRecording[]>([]);
  const [showSharing, setShowSharing] = useState(false);

  // Auth and wallet state
  const { isAuthenticated, address, signIn } = useAuth();
  const {
    status,
    isConnected,
    universalAddress,
    connect,
    permissionActive,
    permissionError,
    requestPermission,
    isLoadingPermissions,
  } = useBaseAccount();

  // Services
  const ipfsService = React.useMemo(() => createIPFSService(), []);

  const baseRecordingService = React.useMemo(() => {
    if (!universalAddress) return null;
    try {
      return createBaseRecordingService(universalAddress, {
        contractAddress: contractAddress,
        permissionRetriever: async () => {
          return await crossPlatformStorage.getItem('spendPermissionHash');
        }
      });
    } catch (error) {
      console.warn('Base recording service not available:', error);
      return null;
    }
  }, [universalAddress, contractAddress]);

  // Freemium state
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

  // Effects
  useEffect(() => {
    if (isAuthenticated && address) {
      setUserTier('free');
    } else {
      setUserTier('guest');
    }
  }, [isAuthenticated, address, setUserTier]);

  useEffect(() => {
    if (!audioBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(audioBlob);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [audioBlob]);

  const remainingQuota = getRemainingQuota();

  // Recording handlers
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
        resetRecordingStates();
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

  const handleCancelRecording = useCallback(() => {
    cancelRecording();
    setShowSaveOptions(false);
    setRecordingTitle("");
    setIsPaused(false);
    resetRecordingStates();
  }, [cancelRecording]);

  const resetRecordingStates = () => {
    setVoicesFree([]);
    setSelectedVoiceFree("");
    setVariantBlobFree(null);
    setLoadingVoicesFree(false);
    setGeneratingFree(false);
    setDubbedBlob(null);
    setDubbedLanguage("");
    setSelectedVersions({
      original: true,
      aiVoice: false,
      dubbed: false,
    });
  };

  // Utilities
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  const handleDownload = useCallback(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = recordingTitle || `recording-${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [audioBlob, recordingTitle]);

  // Core save functions
  const saveRecordingToBase = useCallback(async (audioBlob: Blob, metadata: any) => {
    if (!baseRecordingService) {
      throw new Error('Base recording contract not configured. Please deploy the contract first.');
    }

    if (!isConnected || !permissionActive) {
      throw new Error('Base Account not connected or permission not granted.');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.mp3`;

    const ipfsResult = await ipfsService.uploadAudio(audioBlob, {
      filename,
      mimeType: audioBlob.type || 'audio/mpeg',
      duration: duration,
    });

    const txId = await baseRecordingService.saveRecording(ipfsResult.hash, {
      title: metadata.title,
      description: metadata.description,
      isPublic: metadata.isPublic,
      tags: metadata.tags,
    });

    return { ipfsHash: ipfsResult.hash, txId };
  }, [baseRecordingService, isConnected, permissionActive, ipfsService, duration]);

  const saveRecordingWithGas = useCallback(async (
    audioBlob: Blob, 
    metadata: { title: string; description: string; isPublic: boolean; tags: string[] }
  ) => {
    if (!window.ethereum) {
      throw new Error('No wallet detected. Please install a wallet like MetaMask.');
    }

    if (!contractAddress) {
      throw new Error('Contract not deployed. Please contact support.');
    }

    setIsDirectSaving(true);

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.mp3`;

      const ipfsResult = await ipfsService.uploadAudio(audioBlob, {
        filename,
        mimeType: audioBlob.type || 'audio/mpeg',
        duration: duration,
      });

      const walletClient = createWalletClient({
        chain: base,
        transport: custom(window.ethereum),
      });

      const [account] = await walletClient.getAddresses();

      const data = encodeFunctionData({
        abi: VoiceRecordsABI,
        functionName: 'saveRecording',
        args: [ipfsResult.hash, metadata.title, metadata.isPublic],
      });

      const txHash = await walletClient.sendTransaction({
        account,
        to: contractAddress,
        data,
      });

      setToastType('success');
      setToastMessage(`Recording saved to blockchain! Tx: ${txHash.slice(0, 10)}...`);

      return { ipfsHash: ipfsResult.hash, txHash };
    } finally {
      setIsDirectSaving(false);
    }
  }, [contractAddress, ipfsService, duration, setToastType, setToastMessage]);

  // Main save handler
  const handleSaveSelectedVersions = useCallback(async () => {
    if (!audioBlob) return;

    const versionsToSave = Object.values(selectedVersions).filter(Boolean).length;
    if (versionsToSave === 0) {
      setToastType('error');
      setToastMessage('Please select at least one version to save');
      return;
    }

    // Validation checks
    if (!canSaveRecording()) {
      if (userTier === 'guest') {
        try {
          await signIn();
        } catch (error) {
          setToastType('error');
          setToastMessage('Sign-in failed. Please try again.');
          return;
        }
      } else {
        setToastType('error');
        setToastMessage('Weekly save limit reached. Upgrade for unlimited saves!');
        return;
      }
    }

    if (!isConnected) {
      setToastType('error');
      setToastMessage('Please connect your Base Account first.');
      return;
    }

    if (!permissionActive) {
      setToastType('error');
      setToastMessage('Please grant spend permission first for gasless saves.');
      return;
    }

    if (userTier === 'free' && versionsToSave > remainingQuota.saves) {
      setToastType('error');
      setToastMessage(`Not enough saves remaining. You have ${remainingQuota.saves} saves left but selected ${versionsToSave} versions.`);
      return;
    }

    try {
      const baseTitle = recordingTitle || `Recording ${new Date().toLocaleString()}`;
      const results: SaveResult[] = [];

      if (selectedVersions.original && audioBlob) {
        const result = await saveRecordingToBase(audioBlob, {
          title: baseTitle,
          description: 'Original recording',
          isPublic: true,
          tags: ['original'],
        });
        results.push({
          type: 'original',
          success: true,
          error: null,
          ipfsHash: result.ipfsHash,
          recording: {
            id: `original-${Date.now()}`,
            title: baseTitle,
            ipfsHash: result.ipfsHash,
            ipfsUrl: `https://ipfs.io/ipfs/${result.ipfsHash}`,
            duration,
            createdAt: new Date().toISOString(),
          },
        });
        incrementSaveUsage();
      }

      if (selectedVersions.aiVoice && variantBlobFree) {
        const result = await saveRecordingToBase(variantBlobFree, {
          title: `${baseTitle} (AI Voice)`,
          description: `AI voice transformation using ${selectedVoiceFree}`,
          isPublic: true,
          tags: ['ai-voice', selectedVoiceFree],
        });
        results.push({
          type: 'ai-voice',
          success: true,
          error: null,
          ipfsHash: result.ipfsHash,
          recording: {
            id: `ai-voice-${Date.now()}`,
            title: `${baseTitle} (AI Voice)`,
            ipfsHash: result.ipfsHash,
            ipfsUrl: `https://ipfs.io/ipfs/${result.ipfsHash}`,
            duration,
            createdAt: new Date().toISOString(),
          },
        });
        incrementSaveUsage();
      }

      if (selectedVersions.dubbed && dubbedBlob) {
        const result = await saveRecordingToBase(dubbedBlob, {
          title: `${baseTitle} (${dubbedLanguage})`,
          description: `Dubbed to ${dubbedLanguage}`,
          isPublic: true,
          tags: ['dubbed', dubbedLanguage],
        });
        results.push({
          type: 'dubbed',
          success: true,
          error: null,
          ipfsHash: result.ipfsHash,
          recording: {
            id: `dubbed-${Date.now()}`,
            title: `${baseTitle} (${dubbedLanguage})`,
            ipfsHash: result.ipfsHash,
            ipfsUrl: `https://ipfs.io/ipfs/${result.ipfsHash}`,
            duration,
            createdAt: new Date().toISOString(),
          },
        });
        incrementSaveUsage();
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        setToastType('success');
        setToastMessage(`${successCount} version${successCount > 1 ? 's' : ''} saved successfully!`);

        const newSavedRecordings = results
          .filter(r => r.success)
          .map(r => r.recording);
        setSavedRecordings(newSavedRecordings);
        setShowSharing(true);

        if (onRecordingComplete && audioBlob) {
          onRecordingComplete(audioBlob, duration);
        }
      }

      if (failCount > 0) {
        setToastType('error');
        setToastMessage(`${failCount} version${failCount > 1 ? 's' : ''} failed to save`);
      }

      if (successCount === versionsToSave) {
        setShowSaveOptions(false);
        setRecordingTitle("");
      }
    } catch (error) {
      console.error('Error saving recordings:', error);
      setToastType('error');
      setToastMessage('Error saving recordings');
    }
  }, [
    audioBlob, variantBlobFree, dubbedBlob, selectedVersions, recordingTitle, duration,
    selectedVoiceFree, dubbedLanguage, canSaveRecording, userTier, remainingQuota.saves,
    incrementSaveUsage, onRecordingComplete, saveRecordingToBase,
    setToastType, setToastMessage, isConnected, permissionActive, signIn
  ]);

  return (
    <div className="max-w-2xl mx-auto voisss-card shadow-2xl">
      {/* Header */}
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

      {/* Core Components */}
      <DurationDisplay duration={duration} />
      <WaveformVisualization 
        waveformData={waveformData} 
        isRecording={isRecording} 
      />
      <RecordingControls
        isRecording={isRecording}
        isLoading={isLoading}
        isPaused={isPaused}
        showSaveOptions={showSaveOptions}
        onStartRecording={handleStartRecording}
        onPauseResume={handlePauseResume}
        onStopRecording={handleStopRecording}
        onCancelRecording={handleCancelRecording}
      />

      {/* Save Options */}
      {showSaveOptions && (
        <>
          {/* Main Save Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">
              Save Recording
            </h3>

            <AudioPreview 
              previewUrl={previewUrl}
              audioBlob={audioBlob}
              formatFileSize={formatFileSize}
            />

            <PermissionStatus
              isConnected={isConnected}
              permissionActive={permissionActive}
              isLoadingPermissions={isLoadingPermissions}
              requestPermission={requestPermission}
              setToastType={setToastType}
              setToastMessage={setToastMessage}
            />

            <RecordingTitle
              recordingTitle={recordingTitle}
              onTitleChange={setRecordingTitle}
            />

            <ActionButtons
              recordingTitle={recordingTitle}
              isDirectSaving={isDirectSaving}
              userTier={userTier}
              remainingQuota={remainingQuota}
              baseRecordingService={baseRecordingService}
              permissionActive={permissionActive}
              handleDownload={handleDownload}
              handleSaveSelectedVersions={handleSaveSelectedVersions}
              saveRecordingWithGas={saveRecordingWithGas}
              audioBlob={audioBlob}
              setToastType={setToastType}
              setToastMessage={setToastMessage}
            />
          </div>

          {/* Feature Panels */}
          <AIVoicePanel
            voicesFree={voicesFree}
            selectedVoiceFree={selectedVoiceFree}
            variantBlobFree={variantBlobFree}
            isLoadingVoicesFree={isLoadingVoicesFree}
            isGeneratingFree={isGeneratingFree}
            canUseAIVoice={canUseAIVoice}
            audioBlob={audioBlob}
            userTier={userTier}
            remainingQuota={remainingQuota}
            WEEKLY_AI_VOICE_LIMIT={useFreemiumStore.getState().WEEKLY_AI_VOICE_LIMIT}
            onVoicesFreeChange={setVoicesFree}
            onSelectedVoiceFreeChange={setSelectedVoiceFree}
            onVariantBlobFreeChange={setVariantBlobFree}
            onLoadingVoicesFreeChange={setLoadingVoicesFree}
            onGeneratingFreeChange={setGeneratingFree}
            onIncrementAIVoiceUsage={incrementAIVoiceUsage}
            onToastMessage={setToastMessage}
            onToastType={setToastType}
            onSetSelectedVersions={setSelectedVersions}
          />

          <DubbingPanel
            audioBlob={audioBlob}
            onDubbingComplete={(dubbedBlob, language) => {
              setDubbedBlob(dubbedBlob);
              setDubbedLanguage(language);
              setSelectedVersions(prev => ({ ...prev, dubbed: true }));
            }}
          />

          <VersionSelection
            selectedVersions={selectedVersions}
            audioBlob={audioBlob}
            variantBlobFree={variantBlobFree}
            dubbedBlob={dubbedBlob}
            selectedVoiceFree={selectedVoiceFree}
            dubbedLanguage={dubbedLanguage}
            userTier={userTier}
            remainingQuota={remainingQuota}
            onSelectedVersionsChange={setSelectedVersions}
          />
        </>
      )}

      {/* Social Sharing */}
      {showSharing && savedRecordings.length > 0 && (
        <div className="mt-6">
          <SocialShare
            recording={savedRecordings[0]}
            className="justify-center"
            onShare={(platform: string, url: string) => {
              console.log(`Shared to ${platform}:`, url);
              // TODO: Track sharing analytics
            }}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded-md">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Toast Notification */}
      <ToastNotification
        message={toastMessage}
        type={toastType}
        onTimeout={() => setToastMessage(null)}
      />
    </div>
  );
}
