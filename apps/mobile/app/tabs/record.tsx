import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Mic,
  Square,
  Pause,
  Play,
  Save,
  X,
  Settings,
} from "lucide-react-native";
import { useAudioRecording } from "../../hooks/useAudioRecording";
import { useRecordingsStore } from "../../store/recordingsStore";
import { useStarknet } from "../../hooks/useStarknet";
import { useFeatureGating } from "../../utils/featureGating";
import colors from "../../constants/colors";
import { createAIServiceClient, formatDuration } from "@voisss/shared";
import { theme, buttonStyles } from "../../constants/theme";
import type { VoiceInfo } from "@voisss/shared/types/audio";

const { width } = Dimensions.get("window");

import WaveformVisualization from "../../components/WaveformVisualization";
import AITransformationPanel from "../../components/AITransformationPanel";

export default function RecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    isRecording,
    isLoading,
    duration,
    uri,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    meteringData,
  } = useAudioRecording();

  const { addRecording, addRecordingWithIPFS } = useRecordingsStore();
  const { storeRecording } = useStarknet();
  const { getCurrentTier, getUserCapabilities } = useFeatureGating();

  // IPFS upload state from store
  const isUploadingToIPFS = useRecordingsStore(
    (state) => state.isUploadingToIPFS
  );
  const ipfsUploadProgress = useRecordingsStore(
    (state) => state.ipfsUploadProgress
  );

  const currentTier = getCurrentTier();
  const capabilities = getUserCapabilities();

  // AI Voice Transformation state
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedBlob, setTransformedBlob] = useState<Blob | null>(null);
  const [aiService] = useState(() =>
    createAIServiceClient({
      apiBaseUrl: "https://voisss.netlify.app/api",
      platform: "mobile",
    })
  );

  const [isPaused, setIsPaused] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  // Animation for recording button
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Check if user has mission context
  const missionId = params.missionId as string;

  // Load voices for AI transformation
  const loadVoices = useCallback(async () => {
    if (!capabilities.canAccessAI) return;

    try {
      setIsLoadingVoices(true);
      const availableVoices = await aiService.listVoices();
      setVoices(availableVoices);

      // Auto-select first voice
      if (availableVoices.length > 0 && !selectedVoiceId) {
        setSelectedVoiceId(availableVoices[0].voiceId);
      }
    } catch (error) {
      console.error("Failed to load voices:", error);
      Alert.alert("Error", "Failed to load AI voices");
    } finally {
      setIsLoadingVoices(false);
    }
  }, [capabilities.canAccessAI, aiService, selectedVoiceId]);

  // Transform voice with AI
  const transformVoice = useCallback(async () => {
    if (!uri || !selectedVoiceId || !capabilities.canAccessAI) return;

    try {
      setIsTransforming(true);

      // Convert file URI to blob for web API
      const response = await fetch(uri);
      const audioBlob = await response.blob();

      const transformedBlob = await aiService.transformVoice(
        audioBlob,
        selectedVoiceId
      );
      setTransformedBlob(transformedBlob);

      // Haptic feedback for successful transformation
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Voice transformation failed:", error);
      Alert.alert("Error", "Failed to transform voice");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsTransforming(false);
    }
  }, [uri, selectedVoiceId, capabilities.canAccessAI, aiService]);

  // Load voices when AI features become available
  useEffect(() => {
    if (capabilities.canAccessAI && showSaveOptions) {
      loadVoices();
    }
  }, [capabilities.canAccessAI, showSaveOptions, loadVoices]);

  // Animate recording button when recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, isPaused, pulseAnim]);

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
      setIsPaused(false);
      setShowSaveOptions(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      Alert.alert(
        "Recording Error",
        error instanceof Error ? error.message : "Failed to start recording"
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    try {
      const recordingUri = await stopRecording();
      if (recordingUri) {
        setShowSaveOptions(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert(
        "Recording Error",
        error instanceof Error ? error.message : "Failed to stop recording"
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [stopRecording]);

  const handlePauseResume = useCallback(async () => {
    try {
      if (isPaused) {
        await resumeRecording();
        setIsPaused(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        await pauseRecording();
        setIsPaused(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert(
        "Recording Error",
        error instanceof Error
          ? error.message
          : "Failed to pause/resume recording"
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [isPaused, pauseRecording, resumeRecording]);

  const handleSaveRecording = useCallback(async () => {
    if (!uri) return;

    try {
      const recording = {
        id: Date.now().toString(),
        title: recordingTitle || `Recording ${new Date().toLocaleDateString()}`,
        description: "",
        duration: duration,
        fileSize: 0, // Will be calculated later
        format: "mp3" as const,
        quality: "medium" as const,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: false,
        participantConsent: false,
        isAnonymized: false,
        voiceObfuscated: false,
        isCompleted: false,
        // Mobile-specific fields
        filePath: uri,

        isShared: false,
        waveform: [], // Will be generated later
      };

      // Use IPFS-enabled recording if user has premium access
      if (capabilities.canAccessWeb3) {
        await addRecordingWithIPFS(recording, uri, { storeRecording });
        Alert.alert(
          "Success",
          "Recording saved locally and uploaded to IPFS!",
          [
            {
              text: "View Recordings",
              onPress: () => router.push("/tabs/index" as any),
            },
            {
              text: "Record Another",
              style: "cancel",
            },
          ]
        );
      } else {
        addRecording(recording);
        Alert.alert("Success", "Recording saved locally!", [
          {
            text: "View Recordings",
            onPress: () => router.push("/tabs/index" as any),
          },
          {
            text: "Record Another",
            style: "cancel",
          },
        ]);
      }

      setShowSaveOptions(false);
      setRecordingTitle("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Save Error", "Failed to save recording. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [
    uri,
    duration,
    recordingTitle,
    addRecording,
    addRecordingWithIPFS,
    storeRecording,
    capabilities.canAccessWeb3,
    router,
  ]);

  const handleCancelRecording = useCallback(async () => {
    Alert.alert(
      "Cancel Recording",
      "Are you sure you want to cancel this recording? It will be lost.",
      [
        {
          text: "Keep Recording",
          style: "cancel",
        },
        {
          text: "Cancel Recording",
          style: "destructive",
          onPress: async () => {
            await cancelRecording();
            setShowSaveOptions(false);
            setRecordingTitle("");
            setIsPaused(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          },
        },
      ]
    );
  }, [cancelRecording]);

  const renderRecordingButton = () => {
    const buttonColor = isRecording
      ? isPaused
        ? colors.dark.warning
        : colors.dark.error
      : colors.dark.primary;

    const icon = isRecording ? (isPaused ? Play : Square) : Mic;

    const IconComponent = icon;

    return (
      <Animated.View
        style={[
          styles.recordButtonContainer,
          {
            transform: [
              { scale: scaleAnim },
              { scale: isRecording && !isPaused ? pulseAnim : 1 },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: buttonColor }]}
          onPress={
            isRecording
              ? isPaused
                ? handlePauseResume
                : handleStopRecording
              : handleStartRecording
          }
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <IconComponent size={48} color={colors.dark.text} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderControls = () => {
    if (!isRecording && !showSaveOptions) return null;

    return (
      <View style={styles.controls}>
        {isRecording && (
          <TouchableOpacity
            style={[buttonStyles.iconButton, styles.controlButton]}
            onPress={handlePauseResume}
          >
            {isPaused ? (
              <Play size={24} color={colors.dark.text} />
            ) : (
              <Pause size={24} color={colors.dark.text} />
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[buttonStyles.iconButton, styles.controlButton]}
          onPress={handleCancelRecording}
        >
          <X size={24} color={colors.dark.text} />
        </TouchableOpacity>

        {showSaveOptions && (
          <TouchableOpacity
            style={[buttonStyles.iconButton, styles.controlButton]}
            onPress={handleSaveRecording}
          >
            <Save size={24} color={colors.dark.text} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Record</Text>
          <TouchableOpacity style={buttonStyles.iconButton}>
            <Settings size={24} color={colors.dark.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.durationContainer}>
            <Text style={styles.duration}>{formatDuration(duration)}</Text>
            <Text style={styles.status}>
              {isUploadingToIPFS
                ? `Uploading to IPFS... ${ipfsUploadProgress}%`
                : isRecording
                ? isPaused
                  ? "Paused"
                  : "Recording..."
                : showSaveOptions
                ? "Ready to save"
                : "Tap to start recording"}
            </Text>

            {/* IPFS Upload Progress Bar */}
            {isUploadingToIPFS && (
              <View style={styles.ipfsProgressContainer}>
                <View style={styles.ipfsProgressBar}>
                  <View
                    style={[
                      styles.ipfsProgressFill,
                      { width: `${ipfsUploadProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.ipfsProgressText}>
                  Uploading to decentralized storage...
                </Text>
              </View>
            )}
          </View>

          <View style={styles.waveformContainer}>
            <WaveformVisualization
              isRecording={isRecording}
              meteringData={meteringData}
              width={width - 32}
              height={100}
            />
          </View>

          {renderRecordingButton()}
          {renderControls()}
        </View>

        {/* AI Transformation Panel */}
        {showSaveOptions && capabilities.canAccessAI && (
          <AITransformationPanel
            voices={voices}
            selectedVoiceId={selectedVoiceId}
            setSelectedVoiceId={setSelectedVoiceId}
            isLoadingVoices={isLoadingVoices}
            isTransforming={isTransforming}
            transformedBlob={transformedBlob}
            onTransform={transformVoice}
            capabilities={capabilities}
            currentTier={currentTier}
          />
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: theme.typography.fontSizes.xxxl,
    fontWeight: "700",
    color: colors.dark.text,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  durationContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  duration: {
    fontSize: 48,
    fontWeight: "300",
    color: colors.dark.text,
    fontVariant: ["tabular-nums"],
  },
  status: {
    fontSize: theme.typography.fontSizes.lg,
    color: colors.dark.textSecondary,
    marginTop: 8,
  },
  waveformContainer: {
    width: width - 32,
    height: 100,
    marginBottom: 32,
  },
  waveformPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
  },
  waveformText: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.dark.textSecondary,
  },
  recordButtonContainer: {
    marginBottom: 24,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: colors.dark.error,
    margin: 16,
    borderRadius: theme.borderRadius.md,
  },
  errorText: {
    color: colors.dark.text,
    textAlign: "center",
  },
  // IPFS Upload styles
  ipfsProgressContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  ipfsProgressBar: {
    width: width * 0.6,
    height: 4,
    backgroundColor: colors.dark.card,
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  ipfsProgressFill: {
    height: "100%",
    backgroundColor: colors.dark.primary,
    borderRadius: 2,
  },
  ipfsProgressText: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
    textAlign: "center",
  },
});
