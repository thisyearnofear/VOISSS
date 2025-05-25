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
import { useRouter } from "expo-router";
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
import colors from "../../constants/colors";

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

  const { addRecording } = useRecordingsStore();

  const [isPaused, setIsPaused] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  // Animation for recording button
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

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
      }
    } catch (error) {
      Alert.alert(
        "Recording Error",
        error instanceof Error ? error.message : "Failed to stop recording"
      );
    }
  }, [stopRecording]);

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
        filePath: uri,
        duration: duration,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fileSize: 0, // Will be calculated later
        tags: [],
        isFavorite: false,
        isShared: false,
        isPublic: false,
        waveform: [], // Will be generated later
      };

      addRecording(recording);
      setShowSaveOptions(false);
      setRecordingTitle("");

      Alert.alert("Success", "Recording saved successfully!", [
        {
          text: "View Recordings",
          onPress: () => router.push("/tabs/"),
        },
        {
          text: "Record Another",
          style: "cancel",
        },
      ]);
    } catch (error) {
      Alert.alert("Save Error", "Failed to save recording. Please try again.");
    }
  }, [uri, duration, recordingTitle, addRecording, router]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Record</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color={colors.dark.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.durationContainer}>
            <Text style={styles.duration}>{formatDuration(duration)}</Text>
            <Text style={styles.status}>
              {isRecording
                ? isPaused
                  ? "Paused"
                  : "Recording..."
                : showSaveOptions
                ? "Ready to save"
                : "Tap to start recording"}
            </Text>
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
});
