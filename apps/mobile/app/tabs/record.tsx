import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Mic,
  Square,
  Pause,
  Play,
  Save,
  X,
  Settings,
  Bot,
  Download,
  Volume2,
  Check,
  Loader2,
} from "lucide-react-native";
import { useAudioRecording } from "../../hooks/useAudioRecording";
import { useRecordingsStore } from "../../store/recordingsStore";
import { useStarknet } from "../../hooks/useStarknet";
import { useFeatureGating } from "../../utils/featureGating";
import colors from "../../constants/colors";
import { createAIServiceClient } from "@voisss/shared";
import type { VoiceInfo } from "@voisss/shared/types/audio";

const { width } = Dimensions.get("window");

// Utility function to format duration
const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

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
  } = useAudioRecording();

  const { addRecording, addRecordingWithIPFS } = useRecordingsStore();
  const { storeRecording } = useStarknet();
  const { getCurrentTier, getUserCapabilities } = useFeatureGating();

  // IPFS upload state from store
  const isUploadingToIPFS = useRecordingsStore((state) => state.isUploadingToIPFS);
  const ipfsUploadProgress = useRecordingsStore((state) => state.ipfsUploadProgress);

  const currentTier = getCurrentTier();
  const capabilities = getUserCapabilities();

  // AI Voice Transformation state
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedBlob, setTransformedBlob] = useState<Blob | null>(null);
  const [showAITransform, setShowAITransform] = useState(false);
  const [aiService] = useState(() => createAIServiceClient({
    apiBaseUrl: 'https://voisss.netlify.app/api',
    platform: 'mobile'
  }));

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
      console.error('Failed to load voices:', error);
      Alert.alert('Error', 'Failed to load AI voices');
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

      const transformedBlob = await aiService.transformVoice(audioBlob, selectedVoiceId);
      setTransformedBlob(transformedBlob);
    } catch (error) {
      console.error('Voice transformation failed:', error);
      Alert.alert('Error', 'Failed to transform voice');
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
    } catch (error) {
      Alert.alert(
        "Recording Error",
        error instanceof Error ? error.message : "Failed to start recording"
      );
    }
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    try {
      const recordingUri = await stopRecording();
      if (recordingUri) {
        setShowSaveOptions(true);
        // Show AI transformation options if user has access
        if (capabilities.canAccessAI) {
          setShowAITransform(true);
        }
      }
    } catch (error) {
      Alert.alert(
        "Recording Error",
        error instanceof Error ? error.message : "Failed to stop recording"
      );
    }
  }, [stopRecording, capabilities.canAccessAI]);

  const handlePauseResume = useCallback(async () => {
    try {
      if (isPaused) {
        await resumeRecording();
        setIsPaused(false);
      } else {
        await pauseRecording();
        setIsPaused(true);
      }
    } catch (error) {
      Alert.alert(
        "Recording Error",
        error instanceof Error
          ? error.message
          : "Failed to pause/resume recording"
      );
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
        isFavorite: false,
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
    } catch (error) {
      Alert.alert("Save Error", "Failed to save recording. Please try again.");
    }
  }, [uri, duration, recordingTitle, addRecording, addRecordingWithIPFS, storeRecording, capabilities.canAccessWeb3, router]);

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
            style={styles.controlButton}
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
          style={[styles.controlButton, styles.cancelButton]}
          onPress={handleCancelRecording}
        >
          <X size={24} color={colors.dark.text} />
        </TouchableOpacity>

        {showSaveOptions && (
          <TouchableOpacity
            style={[styles.controlButton, styles.saveButton]}
            onPress={handleSaveRecording}
          >
            <Save size={24} color={colors.dark.text} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render AI voice transformation section
  const renderAITransformation = () => {
    if (!showSaveOptions || !capabilities.canAccessAI) return null;

    return (
      <ScrollView style={styles.aiTransformContainer}>
        <View style={styles.aiTransformHeader}>
          <Bot size={24} color={colors.dark.primary} />
          <Text style={styles.aiTransformTitle}>AI Voice Transformation</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAITransform(false)}
          >
            <X size={20} color={colors.dark.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.aiTransformDescription}>
          Transform your recording with professional AI voices
        </Text>

        {/* Voice Selection */}
        <View style={styles.voiceSection}>
          <Text style={styles.sectionTitle}>Choose Voice</Text>

          {isLoadingVoices ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.dark.primary} />
              <Text style={styles.loadingText}>Loading voices...</Text>
            </View>
          ) : (
            <FlatList
              data={voices}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.voiceItem,
                    selectedVoiceId === item.voiceId && styles.voiceItemSelected,
                  ]}
                  onPress={() => setSelectedVoiceId(item.voiceId)}
                >
                  <View style={styles.voiceInfo}>
                    <Text style={styles.voiceName}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.voiceDescription}>{item.description}</Text>
                    )}
                  </View>
                  {selectedVoiceId === item.voiceId && (
                    <Check size={20} color={colors.dark.primary} />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.voiceId}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.voicesList}
            />
          )}
        </View>

        {/* Transform Button */}
        <TouchableOpacity
          style={[
            styles.transformButton,
            (!selectedVoiceId || isTransforming) && styles.transformButtonDisabled,
          ]}
          onPress={transformVoice}
          disabled={!selectedVoiceId || isTransforming}
        >
          {isTransforming ? (
            <View style={styles.transformingContainer}>
              <Loader2 size={20} color={colors.dark.text} />
              <Text style={styles.transformButtonText}>Transforming...</Text>
            </View>
          ) : (
            <>
              <Bot size={20} color={colors.dark.text} />
              <Text style={styles.transformButtonText}>Transform Voice</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Transformed Audio Preview */}
        {transformedBlob && (
          <View style={styles.transformedContainer}>
            <Text style={styles.transformedTitle}>Transformed Audio Ready!</Text>
            <TouchableOpacity style={styles.playButton}>
              <Volume2 size={20} color={colors.dark.text} />
              <Text style={styles.playButtonText}>Play Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.downloadButton}>
              <Download size={20} color={colors.dark.text} />
              <Text style={styles.downloadButtonText}>Download</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Usage Info */}
        {capabilities.remainingAIUses !== null && (
          <View style={styles.usageContainer}>
            <Text style={styles.usageText}>
              {capabilities.remainingAIUses} AI transformations remaining today
            </Text>
            {currentTier === "web3" && (
              <TouchableOpacity style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Record</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color={colors.dark.textSecondary} />
          </TouchableOpacity>
        </View>

        {showAITransform ? (
          renderAITransformation()
        ) : (
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
                        { width: `${ipfsUploadProgress}%` }
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
              {/* Placeholder for waveform visualization */}
              <View style={styles.waveformPlaceholder}>
                <Text style={styles.waveformText}>
                  {isRecording ? "🎵 Recording audio..." : "🎤 Ready to record"}
                </Text>
              </View>
            </View>

            {renderRecordingButton()}
            {renderControls()}
          </View>
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
    fontSize: 28,
    fontWeight: "700",
    color: colors.dark.text,
  },
  settingsButton: {
    padding: 8,
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
    fontSize: 18,
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
    borderRadius: 12,
  },
  waveformText: {
    fontSize: 16,
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
    backgroundColor: colors.dark.card,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.dark.error,
  },
  saveButton: {
    backgroundColor: colors.dark.success,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: colors.dark.error,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: colors.dark.text,
    textAlign: "center",
  },
  // AI Transformation styles
  aiTransformContainer: {
    flex: 1,
    padding: 16,
  },
  aiTransformHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  aiTransformTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark.text,
    marginLeft: 8,
  },
  aiTransformDescription: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  closeButton: {
    padding: 8,
  },
  voiceSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    color: colors.dark.textSecondary,
    fontSize: 14,
  },
  voicesList: {
    paddingBottom: 8,
  },
  voiceItem: {
    backgroundColor: colors.dark.card,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: "center",
  },
  voiceItemSelected: {
    backgroundColor: `${colors.dark.primary}20`,
    borderWidth: 2,
    borderColor: colors.dark.primary,
  },
  voiceInfo: {
    alignItems: "center",
    marginBottom: 8,
  },
  voiceName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark.text,
    textAlign: "center",
  },
  voiceDescription: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    textAlign: "center",
  },
  transformButton: {
    backgroundColor: colors.dark.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  transformButtonDisabled: {
    opacity: 0.5,
  },
  transformingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  transformButtonText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: "600",
  },
  transformedContainer: {
    backgroundColor: colors.dark.card,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  transformedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: 12,
  },
  playButton: {
    backgroundColor: colors.dark.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  playButtonText: {
    color: colors.dark.text,
    fontSize: 14,
    fontWeight: "600",
  },
  downloadButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.dark.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  downloadButtonText: {
    color: colors.dark.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  usageContainer: {
    backgroundColor: colors.dark.card,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  usageText: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: colors.dark.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  upgradeButtonText: {
    color: colors.dark.text,
    fontSize: 12,
    fontWeight: "600",
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
    fontSize: 12,
    color: colors.dark.textSecondary,
    textAlign: "center",
  },
});
