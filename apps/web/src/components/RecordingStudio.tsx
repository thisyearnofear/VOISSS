"use client";

import React, { useState, useCallback, useEffect, useMemo, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBase } from "@/app/providers";
import { useBaseAccount } from "@/hooks/useBaseAccount";
import { useWebAudioRecording } from "@/hooks/useWebAudioRecording";
import { useFreemiumStore, useSyncUserTier } from "@/store/freemiumStore";
import { useMission, useCompleteMission } from "@/hooks/queries/useMissions";
import { Mission } from "@voisss/shared/types/socialfi";
import { AudioVersion, AgentCategory } from "@voisss/shared";
import { useVersionLedger } from "@voisss/shared/hooks/useVersionLedger";
import { SocialShare } from "@voisss/ui";
import { Zap, UserX, Crown } from "lucide-react";

// Core components (eager loaded)
import RecordingControls from "@/components/RecordingStudio/RecordingControls";
import DurationDisplay from "@/components/RecordingStudio/DurationDisplay";
import WaveformVisualization from "@/components/RecordingStudio/WaveformVisualization";
import ToastNotification from "@/components/RecordingStudio/ToastNotification";
import VersionSelection from "@/components/RecordingStudio/VersionSelection";
import AlchemyModeStatus from "@/components/RecordingStudio/AlchemyModeStatus";
import AudioPreview from "@/components/RecordingStudio/AudioPreview";
import ActionButtons from "@/components/RecordingStudio/ActionButtons";
import RecordingTitle from "@/components/RecordingStudio/RecordingTitle";
import { useStudioSettings } from "@/hooks/useStudioSettings";
import { useAgentVerification } from "@/hooks/useAgentVerification";
import { saveVersionLedger, getVersionLedger } from "@/lib/studio-db";
import { useAgentMode } from "@/hooks/useAgentMode";
import { useRecordingSave } from "@/hooks/useRecordingSave";

// Lazy load heavy components
const AIVoicePanel = React.lazy(() => import("@/components/RecordingStudio/AIVoicePanel"));
const DubbingPanel = React.lazy(() => import("@/components/dubbing/DubbingPanel"));
const TranscriptComposer = React.lazy(() => import("@/components/RecordingStudio/TranscriptComposer"));

// Loading fallback for lazy components
const PanelLoadingFallback = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-pulse flex flex-col items-center gap-3">
      <div className="w-8 h-8 bg-indigo-500/20 rounded-full animate-spin border-2 border-indigo-500 border-t-transparent" />
      <span className="text-sm text-gray-400">Loading tools...</span>
    </div>
  </div>
);

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

interface SaveResult {
  type: string;
  success: boolean;
  error: string | null;
  ipfsHash: string;
  recording: ShareableRecording;
}

const AlchemyModeBadge = ({
  mode,
}: {
  mode: "standard" | "ghost" | "pro" | "vip";
}) => {
  const config = {
    standard: {
      label: "Standard",
      icon: Zap,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    ghost: {
      label: "Ghost",
      icon: UserX,
      color: "text-gray-400",
      bg: "bg-gray-500/10",
      border: "border-gray-500/20",
    },
    pro: {
      label: "Pro",
      icon: Zap,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    vip: {
      label: "VIP",
      icon: Crown,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
  };

  const current = config[mode] || config.standard;
  const Icon = current.icon;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${current.bg} ${current.border} shadow-sm animate-in zoom-in duration-300`}
    >
      <Icon className={`w-3 h-3 ${current.color}`} />
      <span
        className={`text-[10px] font-black uppercase tracking-tighter ${current.color}`}
      >
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
  const [activeTool, setActiveTool] = useState<
    "voice" | "dub" | "script" | "insights" | null
  >(null);

  // Agent mode — isolated state (CLEAN/MODULAR)
  const {
    isAgentMode,
    agentCategory,
    x402Price,
    setIsAgentMode,
    setAgentCategory,
    setX402Price,
  } = useAgentMode();

  // Persistence State
  const [initialLedgerState, setInitialLedgerState] = useState<any>(null);

  // Restore session
  useEffect(() => {
    getVersionLedger().then((state) => {
      if (state) {
        setInitialLedgerState(state);
        // If restoring a session with versions, assume user wants to edit
        if (state.versions.length > 0) {
          setActiveTool("script");
        }
      }
    });
  }, []);

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
  } = useVersionLedger(
    audioBlob,
    duration / 1000,
    initialLedgerState,
    saveVersionLedger
  );

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


  // Version selection state (now maps to ledger versions)
  const [selectedVersionIds, setSelectedVersionIds] = useState<Set<string>>(
    new Set(["v0"])
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

  // Agent verification
  const { isVerifiedAgent } = useAgentVerification();

  // Studio workflow phases
  // Studio Hub State
  // activeTool moved up for persistence access

  // Memoize active version URL to prevent re-renders
  const activePreviewUrl = useMemo(() => {
    if (!activeVersion?.blob) return null;
    return URL.createObjectURL(activeVersion.blob);
  }, [activeVersion?.blob]);

  // Cleanup active version URL
  useEffect(() => {
    return () => {
      if (activePreviewUrl) {
        URL.revokeObjectURL(activePreviewUrl);
      }
    };
  }, [activePreviewUrl]);

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
  } = useFreemiumStore();

  // Sync tier via bridge — single source of truth (replaces manual setUserTier effect)
  useSyncUserTier(isAuthenticated && !!address, null);

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
      setToastMessage(
        "Maximum 60 second recording limit reached. Recording saved automatically!"
      );
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
    setActiveTool(null);
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

  // Save logic — isolated via hook (CLEAN/MODULAR)
  const { isDirectSaving, saveRecordingToBase, saveRecordingWithGas } = useRecordingSave({
    duration,
    subAccountAddress: subAccountAddress ?? undefined,
    hasSubAccount,
    isConnected,
    provider,
    isAgentMode,
    agentCategory,
    x402Price,
    onToast: (msg, type) => { setToastMessage(msg); setToastType(type); },
  });

  const handleOpenTool = useCallback(
    (tool: "voice" | "dub" | "script" | "insights", versionId: string) => {
      const version = getVersion(versionId);
      if (!version) {
        console.error(`Version ${versionId} not found`);
        return;
      }
      setActiveVersion(versionId);
      setActiveTool(tool);
    },
    [getVersion, setActiveVersion]
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
        const saveMethod = hasSubAccount
          ? saveRecordingToBase
          : saveRecordingWithGas;

        const result = await saveMethod(audioBlob, {
          title: baseTitle,
          description:
            recordingDescription || `Mission submission for: ${mission.title}`,
          isPublic: true, // Missions are usually public
          tags: ["mission-submission", missionId, ...recordingTags],
          isAgentContent: isAgentMode,
          category: agentCategory,
          x402Price: x402Price,
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
          participantConsent: true,
          isAnonymized: false,
          voiceObfuscated: false,
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
          },
        });

        const newSavedRecordings = results
          .filter((r) => r.success)
          .map((r) => r.recording);
        setSavedRecordings(newSavedRecordings);
        setShowSharing(true);
        return; // Exit here for mission flow
      }

      // Choose save method based on Sub Account availability
      const saveMethod = hasSubAccount
        ? saveRecordingToBase
        : saveRecordingWithGas;

      // Save selected versions from ledger
      for (const versionId of selectedVersionIds) {
        const version = getVersion(versionId);
        if (!version) continue;

        try {
          const result = await saveMethod(version.blob, {
            title: version.label,
            description:
              version.metadata.transformChain.length > 0
                ? `${
                    version.label
                  }\nTransformations: ${version.metadata.transformChain.join(
                    " → "
                  )}\n${recordingDescription}`
                : recordingDescription || version.label,
            isPublic: true,
            tags: [
              ...version.metadata.transformChain,
              version.metadata.language || "",
              version.metadata.voiceId || "",
              ...recordingTags,
            ].filter(Boolean),
            isAgentContent: isAgentMode,
            category: agentCategory,
            x402Price: x402Price,
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
            error: err instanceof Error ? err.message : "Unknown error",
            ipfsHash: "",
            recording: {
              id: `${versionId}-${Date.now()}`,
              title: version.label,
              ipfsHash: "",
              ipfsUrl: "",
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
          `${successCount} version${
            successCount > 1 ? "s" : ""
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
        const versionToForge =
          [...selectedVersionIds].reverse().find((id) => id !== "v0") || "v0";
        handleOpenTool("script", versionToForge);
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
    completeMissionMutation,
    getVersion,
    handleOpenTool,
    mission,
    missionId,
    saveRecordingWithGas,
    isAgentMode,
    agentCategory,
    x402Price,
  ]);

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

      {/* PHASE 2: STUDIO HUB (Laboratory & Forge) */}
      {!isRecording && (audioBlob || versions.length > 0) && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center py-6 border-b border-[#2A2A2A]">
            <h3 className="text-2xl font-black text-white tracking-tight uppercase">
              The Laboratory
            </h3>
            <p className="text-sm text-gray-400">
              Alchemy Hub: Transform, Dub, and Secure your creation
            </p>
          </div>

          {/* Top Section: Analysis & Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-3 space-y-6">
              <AudioPreview
                previewUrl={activePreviewUrl || previewUrl}
                audioBlob={activeVersion?.blob || audioBlob}
                formatFileSize={formatFileSize}
              />
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 space-y-6 shadow-xl">
                <RecordingTitle
                  recordingTitle={recordingTitle}
                  onTitleChange={setRecordingTitle}
                  isAgentMode={isAgentMode}
                  onAgentModeChange={setIsAgentMode}
                  category={agentCategory}
                  onCategoryChange={setAgentCategory}
                  x402Price={x402Price}
                  onX402PriceChange={setX402Price}
                  isVerifiedAgent={isVerifiedAgent}
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

          <div className="border-t border-[#2A2A2A] pt-6">
            <VersionSelection
              versions={versions}
              activeVersionId={activeVersionId}
              selectedVersionIds={selectedVersionIds}
              userTier={userTier}
              remainingQuota={remainingQuota}
              onSelectedVersionIdsChange={setSelectedVersionIds}
              onSetActive={setActiveVersion}
              onDeleteVersion={deleteVersion}
              onOpenTool={handleOpenTool}
            />
          </div>

          {/* Active Tool Panel (Tool Deck) */}
          {activeTool && (
            <>
              {/* Mobile Backdrop */}
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
                onClick={() => setActiveTool(null)}
              />

              <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#141414] border-t border-[#333] p-4 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-h-[85vh] overflow-y-auto md:static md:bg-transparent md:border-t md:border-[#2A2A2A] md:p-0 md:py-8 md:shadow-none md:max-h-none md:overflow-visible md:rounded-none animate-in slide-in-from-bottom-full md:slide-in-from-bottom-4 duration-500 ease-out-expo">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#141414] md:bg-transparent z-10 py-2 -mt-2 md:mt-0 md:py-0 border-b border-[#2A2A2A] md:border-none">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {activeTool === "voice" && "✨ Voice Alchemy"}
                    {activeTool === "dub" && "🌍 Global Dubbing"}
                    {activeTool === "script" && "📝 Transcript & Forge"}
                    {activeTool === "insights" && "🧠 Gemini Insights"}
                  </h3>
                  <button
                    onClick={() => setActiveTool(null)}
                    className="p-2 bg-[#2A2A2A] rounded-full text-gray-400 hover:text-white hover:bg-[#333] transition-colors md:bg-transparent md:p-0 md:rounded-none md:text-sm"
                  >
                    <span className="hidden md:inline">Close Panel</span>
                    <span className="md:hidden">✕</span>
                  </button>
                </div>

                {activeTool === "voice" && (
                  <Suspense fallback={<PanelLoadingFallback />}>
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
                  </Suspense>
                )}

                {activeTool === "dub" && (
                  <Suspense fallback={<PanelLoadingFallback />}>
                    <DubbingPanel
                      versions={versions}
                      activeVersionId={activeVersionId}
                      onAddVersion={addVersion}
                      onDubbingComplete={(
                        dubbedBlob,
                        language,
                        sourceVersionId
                      ) => {
                        setSelectedVersionIds((prev) => {
                          const updated = new Set(prev);
                          const newVersionIds = versions.map((v) => v.id);
                          const lastId = newVersionIds[newVersionIds.length - 1];
                          if (lastId) updated.add(lastId);
                          return updated;
                        });
                      }}
                    />
                  </Suspense>
                )}

                {activeTool === "script" && activeVersion && (
                  <Suspense fallback={<PanelLoadingFallback />}>
                    <TranscriptComposer
                      previewUrl={activePreviewUrl || ""}
                      durationSeconds={activeVersion.metadata.duration}
                      audioBlob={activeVersion.blob}
                      initialTemplateId={initialTranscriptTemplateId}
                      autoFocus={true}
                      languageHint={activeVersion.metadata.language || "en"}
                    />
                  </Suspense>
                )}
              </div>
            </>
          )}

          <div className="border-t border-[#2A2A2A] pt-6">
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
                Clicking &quot;Save &amp; Anchor&quot; will also submit this
                recording to the mission.
              </p>
            )}

            <div className="p-4 mt-6 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl flex items-center justify-between">
              <p className="text-sm text-gray-400">Ready to start fresh?</p>
              <button
                onClick={() => {
                  cancelRecording();
                }}
                className="px-4 py-2 rounded-lg bg-red-900/20 text-red-400 text-sm border border-red-900/30 hover:bg-red-900/30 transition-all"
              >
                New Project
              </button>
            </div>
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
