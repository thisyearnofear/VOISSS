"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useBase } from "../app/providers";
import { useBaseAccount } from "../hooks/useBaseAccount";
import { useWebAudioRecording } from "../hooks/useWebAudioRecording";
import { useFreemiumStore } from "../store/freemiumStore";
import { useMission, useCompleteMission } from "../hooks/queries/useMissions";
import { Mission } from "@voisss/shared/types/socialfi";
import {
  createIPFSService,
  crossPlatformStorage,
  AudioVersion,
} from "@voisss/shared";
import { useVersionLedger } from "@voisss/shared/hooks/useVersionLedger";
import { SocialShare } from "@voisss/ui";
import DubbingPanel from "./dubbing/DubbingPanel";
import { VoiceRecordsABI } from "../contracts/VoiceRecordsABI";
import { createWalletClient, custom, encodeFunctionData } from "viem";
import { base } from "viem/chains";
import { Check, Zap, UserX, Crown } from "lucide-react";

// Import modular components
import RecordingControls from "./RecordingStudio/RecordingControls";
import DurationDisplay from "./RecordingStudio/DurationDisplay";
import WaveformVisualization from "./RecordingStudio/WaveformVisualization";
import ToastNotification from "./RecordingStudio/ToastNotification";
import AIVoicePanel from "./RecordingStudio/AIVoicePanel";
import VersionSelection from "./RecordingStudio/VersionSelection";
import AlchemyModeStatus from "./RecordingStudio/AlchemyModeStatus";
import { useStudioSettings } from "../hooks/useStudioSettings";
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
  missionId?: string;
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
  error: string | null;
  ipfsHash: string;
  recording: ShareableRecording;
}

const AlchemyModeBadge = ({ mode }: { mode: 'standard' | 'ghost' | 'pro' | 'vip' }) => {
  const config = {
    standard: { label: 'Standard', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    ghost: { label: 'Ghost', icon: UserX, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
    pro: { label: 'Pro', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    vip: { label: 'VIP', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  };

  const current = config[mode] || config.standard;
  const Icon = current.icon;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${current.bg} ${current.border} shadow-sm animate-in zoom-in duration-300`}>
      <Icon className={`w-3 h-3 ${current.color}`} />
      <span className={`text-[10px] font-black uppercase tracking-tighter ${current.color}`}>
        {current.label}
      </span>
    </div>
  );
};

export default function RecordingStudio({
  onRecordingComplete,
  initialTranscriptTemplateId,
  initialMode,
  missionId,
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

  // Mission Context
  const { data: mission } = useMission(missionId || "");
  const completeMissionMutation = useCompleteMission();

  // Base provider for transactions
  const baseContext = useBase();
  const provider = baseContext?.provider;

  // Basic UI state
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordingDescription, setRecordingDescription] = useState("");
  const [recordingTags, setRecordingTags] = useState<string[]>([]);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Initialize title with mission title if available
  useEffect(() => {
    if (mission && !recordingTitle) {
      setRecordingTitle(`Response to: ${mission.title}`);
      setRecordingDescription(`Submission for mission: ${mission.title}`);
    }
  }, [mission, recordingTitle]);

  // Unified version ledger (replaces: audioBlob, variantBlobFree, dubbedBlob, activeForgeBlob)
  const {
    versions,
    activeVersion,
    activeVersionId,
    addVersion,
    getVersion,
    setActiveVersion,
    deleteVersion,
    getTransformableVersions,
  } = useVersionLedger(audioBlob, duration / 1000);

  // AI Voice state (for panel UI only)
  const [voicesFree, setVoicesFree] = useState<
    { voiceId: string; name?: string }[]
  >([]);
  const [selectedVoiceFree, setSelectedVoiceFree] = useState("");
  const [isLoadingVoicesFree, setLoadingVoicesFree] = useState(false);
  const [isGeneratingFree, setGeneratingFree] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("error");

  // Gas saving fallback
  const [isDirectSaving, setIsDirectSaving] = useState(false);
  const contractAddress = process.env
    .NEXT_PUBLIC_VOICE_RECORDS_CONTRACT as `0x${string}`;

  // Version selection state (now maps to ledger versions)
  const [selectedVersionIds, setSelectedVersionIds] = useState<Set<string>>(
    new Set(['v0'])
  );

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
    subAccountAddress,
    connect,
    hasSubAccount,
    subAccountError,
    createSubAccount,
    isCreatingSubAccount,
  } = useBaseAccount();

  // Studio Mastery Settings (Ghost / Pro / VIP)
  const { activeMode } = useStudioSettings(universalAddress);

  // Studio workflow phases
  type StudioPhase = 'recording' | 'laboratory' | 'forge';
  const [studioPhase, setStudioPhase] = useState<StudioPhase>('recording');

  // Forge phase state (derived from active version)
  const [activeForgeUrl, setActiveForgeUrl] = useState<string | null>(null);
  const [forgeDuration, setForgeDuration] = useState(0);

  useEffect(() => {
    const initForge = async () => {
      if (activeVersion?.blob) {
        const url = URL.createObjectURL(activeVersion.blob);
        setActiveForgeUrl(url);

        // Accurate duration recalculation
        const dur = await getBlobDuration(activeVersion.blob);
        if (dur > 0) setForgeDuration(dur);
        else setForgeDuration(activeVersion.metadata.duration || 0);

        // Persist to indexedDB
        saveForgeBlob(activeVersion.blob).catch(console.error);

        return () => URL.revokeObjectURL(url);
      }
    };
    initForge();
  }, [activeVersion, activeVersion?.blob]);

  // Restore persistence on mount (restore active version if in Forge)
  useEffect(() => {
    const restore = async () => {
      const savedBlob = await getForgeBlob();
      if (savedBlob && versions.length > 0) {
        // Find matching version by blob (fallback: use most recent non-original)
        const matchingVersion = versions.find(v => v.blob === savedBlob) || 
                               [...versions].reverse().find(v => v.id !== 'v0');
        if (matchingVersion) {
          setActiveVersion(matchingVersion.id);
          setStudioPhase('forge');
        }
      }
    };
    restore();
  }, [versions, setActiveVersion]);

  // Core recording state

  // Services
  const ipfsService = React.useMemo(() => createIPFSService(), []);

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
    setLoadingVoicesFree(false);
    setGeneratingFree(false);
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
      if (!subAccountAddress || !hasSubAccount) {
        throw new Error(
          "Sub Account not available. Use saveRecordingWithGas instead."
        );
      }

      if (!isConnected) {
        throw new Error("Base Account not connected.");
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

      // Prepare contract call data
      const callData = encodeFunctionData({
        abi: VoiceRecordsABI,
        functionName: "saveRecording",
        args: [
          ipfsResult.hash,
          metadata.title,
          JSON.stringify({ description: metadata.description, tags: metadata.tags }),
          metadata.isPublic,
        ],
      });

      // Send transaction from Sub Account (gasless)
      const txHash = await provider?.request({
        method: "eth_sendTransaction",
        params: [{
          from: subAccountAddress,
          to: contractAddress,
          data: callData,
        }],
      });

      return { ipfsHash: ipfsResult.hash, txId: txHash };
    },
    [subAccountAddress, hasSubAccount, isConnected, ipfsService, duration, contractAddress, provider]
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
          args: [
            ipfsResult.hash,
            metadata.title,
            JSON.stringify({ description: metadata.description, tags: metadata.tags }),
            metadata.isPublic
          ],
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

    const versionsToSave = selectedVersionIds.size;
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

    // Check if user has enough quota (for free tier)
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

      // Check for mission context and prioritize mission submission
      if (missionId && mission) {
        // First save to IPFS (we need the hash for mission submission)
        if (!audioBlob) return;
        
        // Use gasless save if available for the asset creation
        const saveMethod = hasSubAccount ? saveRecordingToBase : saveRecordingWithGas;
        
        const result = await saveMethod(audioBlob, {
          title: baseTitle,
          description: recordingDescription || `Mission submission for: ${mission.title}`,
          isPublic: true, // Missions are usually public
          tags: ["mission-submission", missionId, ...recordingTags],
        });
        
        // Submit to mission service
        await completeMissionMutation.mutateAsync({
           missionId,
           recordingId: result.ipfsHash,
           location: {
             city: "Web User", // Placeholder for geolocation if not available
             country: "Internet",
           },
           context: "Recording Studio",
           qualityScore: 85, // Placeholder - would be calculated by service
           transcription: recordingDescription, // Use summary as transcription placeholder if needed
        });

        setToastType("success");
        setToastMessage("Mission submitted successfully!");
        
        // Return early or continue based on flow? 
        // Let's treat it as a success and show sharing
        
        results.push({
          type: "mission-submission",
          success: true,
          error: null,
          ipfsHash: result.ipfsHash,
          recording: {
             id: `mission-${Date.now()}`,
             title: baseTitle,
             ipfsHash: result.ipfsHash,
             ipfsUrl: `https://ipfs.io/ipfs/${result.ipfsHash}`,
             duration,
             createdAt: new Date().toISOString(),
          }
        });
        
         const newSavedRecordings = results
          .filter((r) => r.success)
          .map((r) => r.recording);
        setSavedRecordings(newSavedRecordings);
        setShowSharing(true);
        return; // Exit here for mission flow
      }


      // Choose save method based on Sub Account availability
      const saveMethod = hasSubAccount ? saveRecordingToBase : saveRecordingWithGas;

      // Save selected versions from ledger
      for (const versionId of selectedVersionIds) {
        const version = getVersion(versionId);
        if (!version) continue;

        try {
          const result = await saveMethod(version.blob, {
            title: version.label,
            description: version.metadata.transformChain.length > 0
              ? `${version.label}\nTransformations: ${version.metadata.transformChain.join(' → ')}\n${recordingDescription}`
              : recordingDescription || version.label,
            isPublic: true,
            tags: [
              ...version.metadata.transformChain,
              version.metadata.language || '',
              version.metadata.voiceId || '',
              ...recordingTags,
            ].filter(Boolean),
          });

          results.push({
            type: version.source,
            success: true,
            error: null,
            ipfsHash: result.ipfsHash,
            recording: {
              id: `${versionId}-${Date.now()}`,
              title: version.label,
              ipfsHash: result.ipfsHash,
              ipfsUrl: `https://ipfs.io/ipfs/${result.ipfsHash}`,
              duration: version.metadata.duration,
              createdAt: new Date().toISOString(),
            },
          });
          incrementSaveUsage();
        } catch (err) {
          results.push({
            type: version.source,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
            ipfsHash: '',
            recording: {
              id: `${versionId}-${Date.now()}`,
              title: version.label,
              ipfsHash: '',
              ipfsUrl: '',
              duration: version.metadata.duration,
              createdAt: new Date().toISOString(),
            },
          });
        }
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

      if (successCount === selectedVersionIds.size) {
        // Prioritize: Most recent non-original version for Forge
        const versionToForge = [...selectedVersionIds]
          .reverse()
          .find(id => id !== 'v0') || 'v0';
        handleSelectForForge(versionToForge);
      }
    } catch (error) {
      console.error("Error saving recordings:", error);
       setToastType("error");
       setToastMessage("Error saving recordings");
      }
      }, [
    audioBlob,
    selectedVersionIds,
    recordingTitle,
    duration,
    selectedVoiceFree,
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
    hasSubAccount,
    signIn,
  ]);

  const handleSelectForForge = useCallback(async (versionId: string) => {
    const version = getVersion(versionId);
    if (!version) {
      console.error(`Version ${versionId} not found`);
      return;
    }
    setActiveVersion(versionId);
    setStudioPhase('forge');
  }, [getVersion, setActiveVersion]);

  return (
    <div className="max-w-2xl mx-auto voisss-card shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8 relative">
        <div className="absolute top-0 right-0 sm:right-4 flex justify-end">
          <AlchemyModeBadge mode={activeMode as any} />
        </div>
        
        {mission && (
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-full">
            <span className="text-indigo-400">🎯 Mission:</span>
            <span className="font-semibold text-white">{mission.title}</span>
          </div>
        )}

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center py-6 border-b border-[#2A2A2A]">
            <h3 className="text-2xl font-black text-white tracking-tight uppercase">The Laboratory</h3>
            <p className="text-sm text-gray-400">Alchemy Hub: Transform, Dub, and Secure your creation</p>
          </div>

          {/* Workflow Roadmap */}
          <div className="flex items-center justify-center gap-4 px-4 py-2 bg-[#0F0F0F] rounded-full w-fit mx-auto border border-[#2A2A2A] text-xs font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2 text-gray-500">
              <span className="w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center text-[10px]">1</span>
              Recording
            </div>
            <div className="w-4 h-[1px] bg-[#2A2A2A]" />
            <div className="flex items-center gap-2 text-[#7C5DFA]">
              <span className="w-5 h-5 rounded-full bg-[#7C5DFA] text-white flex items-center justify-center text-[10px]">2</span>
              Alchemy & Anchor
            </div>
            <div className="w-4 h-[1px] bg-[#2A2A2A]" />
            <div className="flex items-center gap-2 text-gray-500 opacity-60">
              <span className="w-5 h-5 rounded-full border border-gray-500 flex items-center justify-center text-[10px]">3</span>
              Studio Forge (Transcribe & Style)
            </div>
          </div>

          {/* Top Section: Analysis & Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-3 space-y-6">
              <AudioPreview
                previewUrl={previewUrl}
                audioBlob={audioBlob}
                formatFileSize={formatFileSize}
              />
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 space-y-6 shadow-xl">
                <RecordingTitle
                  recordingTitle={recordingTitle}
                  onTitleChange={setRecordingTitle}
                />
                <AlchemyModeStatus
                  isConnected={isConnected}
                  hasSubAccount={hasSubAccount}
                  activeMode={activeMode}
                  isCreatingSubAccount={isCreatingSubAccount}
                  createSubAccount={createSubAccount}
                  setToastType={setToastType}
                  setToastMessage={setToastMessage}
                />
              </div>
            </div>
          </div>

          {/* Main Section: Alchemy Suite (Spacious) */}
          <div className="space-y-10 py-8 border-t border-[#2A2A2A]">
            <div>
              <h4 className="text-xl font-bold text-white mb-6 px-2 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] flex items-center justify-center text-sm">1</span>
                Voice Alchemy
              </h4>
              <AIVoicePanel
                voicesFree={voicesFree}
                selectedVoiceFree={selectedVoiceFree}
                isLoadingVoicesFree={isLoadingVoicesFree}
                isGeneratingFree={isGeneratingFree}
                canUseAIVoice={canUseAIVoice}
                versions={versions}
                activeVersionId={activeVersionId}
                userTier={userTier}
                remainingQuota={remainingQuota}
                WEEKLY_AI_VOICE_LIMIT={
                  useFreemiumStore.getState().WEEKLY_AI_VOICE_LIMIT
                }
                onVoicesFreeChange={setVoicesFree}
                onSelectedVoiceFreeChange={setSelectedVoiceFree}
                onLoadingVoicesFreeChange={setLoadingVoicesFree}
                onGeneratingFreeChange={setGeneratingFree}
                onIncrementAIVoiceUsage={incrementAIVoiceUsage}
                onToastMessage={setToastMessage}
                onToastType={setToastType}
                onAddVersion={addVersion}
                onSetSelectedVersionIds={setSelectedVersionIds}
              />
            </div>

            <div>
              <h4 className="text-xl font-bold text-white mb-6 px-2 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm">2</span>
                Global Dubbing
              </h4>
              <DubbingPanel
                versions={versions}
                activeVersionId={activeVersionId}
                onDubbingComplete={(dubbedBlob, language, sourceVersionId) => {
                  const parentId = sourceVersionId || activeVersionId;
                  addVersion(dubbedBlob, `dub-${language}`, parentId, {
                    language,
                    duration: 0, // Will be calculated by metadata from file
                  });
                  setSelectedVersionIds((prev) => {
                    const updated = new Set(prev);
                    // Find the new version by checking for most recent dub version
                    const newVersionIds = versions.map(v => v.id);
                    const lastId = newVersionIds[newVersionIds.length - 1];
                    if (lastId) updated.add(lastId);
                    return updated;
                  });
                }}
              />
            </div>
          </div>

          <div className="border-t border-[#2A2A2A] pt-6">
            <VersionSelection
              versions={versions}
              selectedVersionIds={selectedVersionIds}
              userTier={userTier}
              remainingQuota={remainingQuota}
              onSelectedVersionIdsChange={setSelectedVersionIds}
              onSelectForForge={handleSelectForForge}
              onDeleteVersion={deleteVersion}
            />

            <ActionButtons
              recordingTitle={recordingTitle}
              isDirectSaving={isDirectSaving}
              userTier={userTier}
              remainingQuota={remainingQuota}
              hasSubAccount={hasSubAccount}
              handleDownload={handleDownload}
              handleSaveSelectedVersions={handleSaveSelectedVersions}
              saveRecordingWithGas={saveRecordingWithGas}
              audioBlob={audioBlob}
              setToastType={setToastType}
              setToastMessage={setToastMessage}
              activeMode={activeMode}
            />
            
            {mission && (
              <p className="text-center text-sm text-indigo-400 mt-2">
                Clicking "Save & Anchor" will also submit this recording to the mission.
              </p>
            )}

            <button
              onClick={() => {
                setActiveVersion('v0');
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

            {/* Workflow Roadmap (Small version for header) */}
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-[#0F0F0F] rounded-full border border-[#2A2A2A] text-[9px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-1.5 text-green-500">
                <Check className="w-3 h-3" /> Recording
              </div>
              <div className="w-3 h-[1px] bg-[#2A2A2A]" />
              <div className="flex items-center gap-1.5 text-green-500">
                <Check className="w-3 h-3" /> Alchemy
              </div>
              <div className="w-3 h-[1px] bg-[#2A2A2A]" />
              <div className="flex items-center gap-1.5 text-[#7C5DFA]">
                <span className="w-4 h-4 rounded-full bg-[#7C5DFA] text-white flex items-center justify-center text-[8px]">3</span>
                Forge
              </div>
            </div>
            <button
              onClick={() => setStudioPhase('laboratory')}
              className="px-3 py-1.5 rounded-lg bg-[#2A2A2A] text-xs text-gray-300 hover:bg-[#3A3A3A] transition-colors"
            >
              ← Back to Lab
            </button>
          </div>

          <GeminiInsightsPanel
            audioBlob={activeVersion?.blob || null}
            onApplyInsights={handleApplyInsights}
            isVisible={true}
          />

          {activeVersion && (
            <TranscriptComposer
              previewUrl={activeForgeUrl || ""}
              durationSeconds={forgeDuration || activeVersion.metadata.duration}
              audioBlob={activeVersion.blob}
              initialTemplateId={initialTranscriptTemplateId}
              autoFocus={initialMode === "transcript"}
              languageHint={activeVersion.metadata.language || 'en'}
            />
          )}

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
