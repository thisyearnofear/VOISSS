"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useBaseAccount } from "../hooks/useBaseAccount";
import { useWebAudioRecording } from "../hooks/useWebAudioRecording";
import { useFreemiumStore } from "../store/freemiumStore";
import {
  createIPFSService,
  createBaseRecordingService,
  crossPlatformStorage,
} from "@voisss/shared";
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
import TranscriptComposer from "./RecordingStudio/TranscriptComposer";
import ActionButtons from "./RecordingStudio/ActionButtons";
import RecordingTitle from "./RecordingStudio/RecordingTitle";
import GeminiInsightsPanel from "./RecordingStudio/GeminiInsightsPanel";
import {
  getBlobDuration,
  saveForgeBlob,
  getForgeBlob,
  clearForgeBlob
} from "../lib/studio-db";

interface RecordingStudioProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
  initialTranscriptTemplateId?: string;
  initialMode?: "transcript" | string;
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
  initialTranscriptTemplateId,
  initialMode,
}: RecordingStudioProps) {
  // Core recording state
  const {
    isRecording,
    isLoading,
    duration,
    audioBlob,
    error,
    waveformData,
    maxDurationReached,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  } = useWebAudioRecording();

  // Basic UI state
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordingDescription, setRecordingDescription] = useState("");
  const [recordingTags, setRecordingTags] = useState<string[]>([]);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // AI Voice state
  const [voicesFree, setVoicesFree] = useState<
    { voiceId: string; name?: string }[]
  >([]);
  const [selectedVoiceFree, setSelectedVoiceFree] = useState("");
  const [variantBlobFree, setVariantBlobFree] = useState<Blob | null>(null);
  const [isLoadingVoicesFree, setLoadingVoicesFree] = useState(false);
  const [isGeneratingFree, setGeneratingFree] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("error");

  // Gas saving fallback
  const [isDirectSaving, setIsDirectSaving] = useState(false);
  const contractAddress = process.env
    .NEXT_PUBLIC_VOICE_RECORDS_CONTRACT as `0x${string}`;

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
  const [savedRecordings, setSavedRecordings] = useState<ShareableRecording[]>(
    []
  );
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

  // Studio workflow phases
  type StudioPhase = 'recording' | 'laboratory' | 'forge';
  const [studioPhase, setStudioPhase] = useState<StudioPhase>('recording');

  // Track which version is active for the Forge phase
  const [activeForgeBlob, setActiveForgeBlob] = useState<Blob | null>(null);
  const [activeForgeUrl, setActiveForgeUrl] = useState<string | null>(null);
  const [forgeDuration, setForgeDuration] = useState(0);
  const [activeForgeLanguage, setActiveForgeLanguage] = useState('en');

  useEffect(() => {
    const initForge = async () => {
      if (activeForgeBlob) {
        const url = URL.createObjectURL(activeForgeBlob);
        setActiveForgeUrl(url);

        // Accurate duration recalculation
        const dur = await getBlobDuration(activeForgeBlob);
        if (dur > 0) setForgeDuration(dur);
        else setForgeDuration(duration / 1000); // Fallback to original

        // Persist to indexedDB
        saveForgeBlob(activeForgeBlob).catch(console.error);

        return () => URL.revokeObjectURL(url);
      }
    };
    initForge();
  }, [activeForgeBlob, duration]);

  // Restore persistence on mount
  useEffect(() => {
    const restore = async () => {
      const savedBlob = await getForgeBlob();
      if (savedBlob) {
        setActiveForgeBlob(savedBlob);
        setStudioPhase('forge');
      }
    };
    restore();
  }, []);

  // Core recording state

  // Services
  const ipfsService = React.useMemo(() => createIPFSService(), []);

  const baseRecordingService = React.useMemo(() => {
    if (!universalAddress) return null;
    try {
      return createBaseRecordingService(universalAddress, {
        contractAddress: contractAddress,
        permissionRetriever: () => {
          // Note: This is sync, but we're calling an async storage getter
          // For now, return null - the async value would need to be fetched separately
          return null;
        },
      });
    } catch (error) {
      console.warn("Base recording service not available:", error);
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
      setUserTier("free");
    } else {
      setUserTier("guest");
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

  // Show toast when max recording duration is reached
  useEffect(() => {
    if (maxDurationReached) {
      setToastType("success");
      setToastMessage("Maximum 60 second recording limit reached. Recording saved automatically!");
    }
  }, [maxDurationReached]);

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
        setStudioPhase('laboratory');
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
    setStudioPhase('recording');
    setRecordingTitle("");
    setRecordingDescription("");
    setRecordingTags([]);
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
    setActiveForgeBlob(null);
    setForgeDuration(0);
    clearForgeBlob().catch(console.error);
    if (activeForgeUrl) {
      URL.revokeObjectURL(activeForgeUrl);
      setActiveForgeUrl(null);
    }
  };

  const handleApplyInsights = useCallback(
    (data: { title: string; summary: string; tags: string[] }) => {
      setRecordingTitle(data.title);
      setRecordingDescription(data.summary);
      setRecordingTags(data.tags);
      setToastType("success");
      setToastMessage("AI Insights applied!");
    },
    []
  );

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
      a.download =
        recordingTitle || `recording-${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [audioBlob, recordingTitle]);

  // Core save functions
  const saveRecordingToBase = useCallback(
    async (audioBlob: Blob, metadata: any) => {
      if (!baseRecordingService) {
        throw new Error(
          "Base recording contract not configured. Please deploy the contract first."
        );
      }

      if (!isConnected || !permissionActive) {
        throw new Error(
          "Base Account not connected or permission not granted."
        );
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${metadata.title.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_${timestamp}.mp3`;

      const ipfsResult = await ipfsService.uploadAudio(audioBlob, {
        filename,
        mimeType: audioBlob.type || "audio/mpeg",
        duration: duration,
      });

      const txId = await baseRecordingService.saveRecording(ipfsResult.hash, {
        title: metadata.title,
        description: metadata.description,
        isPublic: metadata.isPublic,
        tags: metadata.tags,
      });

      return { ipfsHash: ipfsResult.hash, txId };
    },
    [baseRecordingService, isConnected, permissionActive, ipfsService, duration]
  );

  const saveRecordingWithGas = useCallback(
    async (
      audioBlob: Blob,
      metadata: {
        title: string;
        description: string;
        isPublic: boolean;
        tags: string[];
      }
    ) => {
      if (!window.ethereum) {
        throw new Error(
          "No wallet detected. Please install a wallet like MetaMask."
        );
      }

      if (!contractAddress) {
        throw new Error("Contract not deployed. Please contact support.");
      }

      setIsDirectSaving(true);

      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `${metadata.title.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )}_${timestamp}.mp3`;

        const ipfsResult = await ipfsService.uploadAudio(audioBlob, {
          filename,
          mimeType: audioBlob.type || "audio/mpeg",
          duration: duration,
        });

        const walletClient = createWalletClient({
          chain: base,
          transport: custom(window.ethereum as any),
        });

        const [account] = await walletClient.getAddresses();

        const data = encodeFunctionData({
          abi: VoiceRecordsABI,
          functionName: "saveRecording",
          args: [ipfsResult.hash, metadata.title, metadata.isPublic],
        });

        const txHash = await walletClient.sendTransaction({
          account,
          to: contractAddress,
          data,
        });

        setToastType("success");
        setToastMessage(
          `Recording saved to blockchain! Tx: ${txHash.slice(0, 10)}...`
        );

        return { ipfsHash: ipfsResult.hash, txHash };
      } finally {
        setIsDirectSaving(false);
      }
    },
    [contractAddress, ipfsService, duration, setToastType, setToastMessage]
  );

  // Main save handler
  const handleSaveSelectedVersions = useCallback(async () => {
    if (!audioBlob) return;

    const versionsToSave =
      Object.values(selectedVersions).filter(Boolean).length;
    if (versionsToSave === 0) {
      setToastType("error");
      setToastMessage("Please select at least one version to save");
      return;
    }

    // Validation checks
    if (!canSaveRecording()) {
      if (userTier === "guest") {
        try {
          await signIn();
        } catch (error) {
          setToastType("error");
          setToastMessage("Sign-in failed. Please try again.");
          return;
        }
      } else {
        setToastType("error");
        setToastMessage(
          "Weekly save limit reached. Upgrade for unlimited saves!"
        );
        return;
      }
    }

    if (!isConnected) {
      setToastType("error");
      setToastMessage("Please connect your Base Account first.");
      return;
    }

    if (!permissionActive) {
      setToastType("error");
      setToastMessage("Please grant spend permission first for gasless saves.");
      return;
    }

    if (userTier === "free" && versionsToSave > remainingQuota.saves) {
      setToastType("error");
      setToastMessage(
        `Not enough saves remaining. You have ${remainingQuota.saves} saves left but selected ${versionsToSave} versions.`
      );
      return;
    }

    try {
      const baseTitle =
        recordingTitle || `Recording ${new Date().toLocaleString()}`;
      const results: SaveResult[] = [];

      if (selectedVersions.original && audioBlob) {
        const result = await saveRecordingToBase(audioBlob, {
          title: baseTitle,
          description: recordingDescription || "Original recording",
          isPublic: true,
          tags:
            recordingTags.length > 0
              ? [...recordingTags, "original"]
              : ["original"],
        });
        results.push({
          type: "original",
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
          description: `AI voice transformation using ${selectedVoiceFree}\n${recordingDescription}`,
          isPublic: true,
          tags: ["ai-voice", selectedVoiceFree, ...recordingTags],
        });
        results.push({
          type: "ai-voice",
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
          description: `Dubbed to ${dubbedLanguage}\n${recordingDescription}`,
          isPublic: true,
          tags: ["dubbed", dubbedLanguage, ...recordingTags],
        });
        results.push({
          type: "dubbed",
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

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (successCount > 0) {
        setToastType("success");
        setToastMessage(
          `${successCount} version${successCount > 1 ? "s" : ""
          } saved successfully!`
        );

        const newSavedRecordings = results
          .filter((r) => r.success)
          .map((r) => r.recording);
        setSavedRecordings(newSavedRecordings);
        setShowSharing(true);

        if (onRecordingComplete && audioBlob) {
          onRecordingComplete(audioBlob, duration);
        }
      }

      if (failCount > 0) {
        setToastType("error");
        setToastMessage(
          `${failCount} version${failCount > 1 ? "s" : ""} failed to save`
        );
      }

      if (successCount === versionsToSave) {
        // Prioritize: Dubbed > AI Voice > Original for the subsequent Forge phase
        let forgeBlob = audioBlob;
        let forgeLang = 'en';
        if (selectedVersions.dubbed && dubbedBlob) {
          forgeBlob = dubbedBlob;
          forgeLang = dubbedLanguage;
        } else if (selectedVersions.aiVoice && variantBlobFree) {
          forgeBlob = variantBlobFree;
        }

        handleSelectForForge(forgeBlob, forgeLang);
      }
    } catch (error) {
      console.error("Error saving recordings:", error);
      setToastType("error");
      setToastMessage("Error saving recordings");
    }
  }, [
    audioBlob,
    variantBlobFree,
    dubbedBlob,
    selectedVersions,
    recordingTitle,
    duration,
    selectedVoiceFree,
    dubbedLanguage,
    canSaveRecording,
    userTier,
    remainingQuota.saves,
    incrementSaveUsage,
    onRecordingComplete,
    saveRecordingToBase,
    recordingDescription,
    recordingTags,
    setToastType,
    setToastMessage,
    isConnected,
    permissionActive,
    signIn,
  ]);

  const handleSelectForForge = useCallback(async (blob: Blob, lang?: string) => {
    setActiveForgeBlob(blob);
    setStudioPhase('forge');
    setActiveForgeLanguage(lang || 'en');
    const dur = await getBlobDuration(blob);
    if (dur > 0) setForgeDuration(dur);
    else setForgeDuration(duration / 1000);
  }, [duration]);

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
      <DurationDisplay duration={duration} isRecording={isRecording} />
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

      {/* PHASE 2: LABORATORY (Alchemy & Anchor) */}
      {studioPhase === 'laboratory' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center py-4 border-b border-[#2A2A2A]">
            <h3 className="text-xl font-bold text-white">Laboratory</h3>
            <p className="text-xs text-gray-400">Transform your audio and anchor to the blockchain</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Input/Preview & Metadata */}
            <div className="space-y-6">
              <AudioPreview
                previewUrl={previewUrl}
                audioBlob={audioBlob}
                formatFileSize={formatFileSize}
              />

              <GeminiInsightsPanel
                audioBlob={audioBlob}
                onApplyInsights={handleApplyInsights}
                isVisible={true}
              />

              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 space-y-4">
                <RecordingTitle
                  recordingTitle={recordingTitle}
                  onTitleChange={setRecordingTitle}
                />

                <PermissionStatus
                  isConnected={isConnected}
                  permissionActive={permissionActive}
                  isLoadingPermissions={isLoadingPermissions}
                  requestPermission={requestPermission}
                  setToastType={setToastType}
                  setToastMessage={setToastMessage}
                />
              </div>
            </div>

            {/* Right: Alchemy Hub */}
            <div className="space-y-6">
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
                WEEKLY_AI_VOICE_LIMIT={
                  useFreemiumStore.getState().WEEKLY_AI_VOICE_LIMIT
                }
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
                  setSelectedVersions((prev) => ({ ...prev, dubbed: true }));
                }}
              />
            </div>
          </div>

          <div className="border-t border-[#2A2A2A] pt-6">
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
              onSelectForForge={handleSelectForForge}
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

            <button
              onClick={() => {
                setActiveForgeBlob(audioBlob);
                setStudioPhase('forge');
              }}
              className="w-full mt-4 py-3 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Skip to Studio (Forge) without saving
            </button>
          </div>
        </div>
      )}

      {/* PHASE 3: FORGE (Transcription & Export) */}
      {studioPhase === 'forge' && activeForgeBlob && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
            <div>
              <h3 className="text-xl font-bold text-white">Studio Forge</h3>
              <p className="text-xs text-gray-400">Design and export your final assets</p>
            </div>
            <button
              onClick={() => setStudioPhase('laboratory')}
              className="px-3 py-1.5 rounded-lg bg-[#2A2A2A] text-xs text-gray-300 hover:bg-[#3A3A3A] transition-colors"
            >
              ← Back to Lab
            </button>
          </div>

          <TranscriptComposer
            previewUrl={activeForgeUrl || ""}
            durationSeconds={forgeDuration || duration / 1000}
            audioBlob={activeForgeBlob}
            initialTemplateId={initialTranscriptTemplateId}
            autoFocus={initialMode === "transcript"}
            languageHint={activeForgeLanguage}
          />

          <div className="p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl flex items-center justify-between">
            <p className="text-sm text-gray-400">Ready to start fresh?</p>
            <button
              onClick={() => {
                setStudioPhase('recording');
                cancelRecording();
              }}
              className="px-4 py-2 rounded-lg bg-red-900/20 text-red-400 text-sm border border-red-900/30 hover:bg-red-900/30 transition-all"
            >
              New Project
            </button>
          </div>
        </div>
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
