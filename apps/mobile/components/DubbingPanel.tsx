import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SUPPORTED_DUBBING_LANGUAGES } from "../types";
import LanguageSelector from "./LanguageSelector";
import { AudioPreviewPlayer } from "./AudioPreviewPlayer";
import { colors } from "@voisss/ui";

interface DubbingPanelProps {
  audioBlob: Blob;
  onDubbingComplete: (dubbedAudio: Blob, targetLanguage: string) => void;
  onDubbingError: (error: string) => void;
}

export default function DubbingPanel({
  audioBlob,
  onDubbingComplete,
  onDubbingError,
}: DubbingPanelProps) {
  const [targetLanguage, setTargetLanguage] = useState("es"); // Default to Spanish
  const [isDubbing, setIsDubbing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dubbedBlob, setDubbedBlob] = useState<Blob | null>(null);

  const handleDubAudio = async () => {
    if (isDubbing) return;

    setIsDubbing(true);
    setProgress(0);

    try {
      const elevenLabs = createElevenLabsProvider();

      // Check if dubAudio method exists
      if (!elevenLabs.dubAudio) {
        throw new Error("Dubbing functionality is not available");
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await elevenLabs.dubAudio(audioBlob, {
        targetLanguage,
        sourceLanguage: "en", // Assuming source is English
        voiceId: "default", // Required but not used for dubbing
      });

      clearInterval(progressInterval);
      setProgress(100);

      // Small delay to show completion
      setTimeout(() => {
        setIsDubbing(false);
        setDubbedBlob(result.dubbedAudio);
        onDubbingComplete(result.dubbedAudio, targetLanguage);
      }, 500);
    } catch (error) {
      setIsDubbing(false);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      onDubbingError(errorMessage);
      Alert.alert("Dubbing Error", errorMessage);
    }
  };

  const selectedLanguageInfo = SUPPORTED_DUBBING_LANGUAGES.find(
    (lang) => lang.code === targetLanguage
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Voice Dubbing</Text>
      <Text style={styles.description}>
        Transform your voice to another language with AI
      </Text>

      <View style={styles.languageSelectorContainer}>
        <Text style={styles.label}>Select Target Language</Text>
        <LanguageSelector
          selectedLanguage={targetLanguage}
          onLanguageChange={setTargetLanguage}
          languages={SUPPORTED_DUBBING_LANGUAGES}
          placeholder="Choose a language..."
        />
      </View>

      {selectedLanguageInfo && (
        <View style={styles.languageInfo}>
          <Text style={styles.languageName}>
            {selectedLanguageInfo.flag} {selectedLanguageInfo.name}
          </Text>
          {selectedLanguageInfo.sampleText && (
            <Text style={styles.sampleText}>
              "{selectedLanguageInfo.sampleText}"
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.dubButton, isDubbing && styles.disabledButton]}
        onPress={handleDubAudio}
        disabled={isDubbing}
      >
        {isDubbing ? (
          <>
            <ActivityIndicator color="white" size="small" />
            <Text style={styles.dubButtonText}> Dubbing... {progress}%</Text>
          </>
        ) : (
          <Text style={styles.dubButtonText}>Dub Voice</Text>
        )}
      </TouchableOpacity>

      {isDubbing && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      )}

      {/* Audio Preview Section */}
      {dubbedBlob && (
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>🎉 Dubbing Complete!</Text>
          <Text style={styles.previewSubtitle}>
            Listen to your original and dubbed audio below
          </Text>

          {/* Original Audio */}
          <View style={styles.previewItem}>
            <Text style={styles.previewItemTitle}>Original Recording</Text>
            <AudioPreviewPlayer
              audioBlob={audioBlob}
              title="Original"
              subtitle="Your original voice recording"
              showWaveform={false}
            />
          </View>

          {/* Dubbed Audio */}
          <View style={styles.previewItem}>
            <Text style={styles.previewItemTitle}>
              Dubbed ({selectedLanguageInfo?.flag} {selectedLanguageInfo?.name})
            </Text>
            <AudioPreviewPlayer
              audioBlob={dubbedBlob}
              title="Dubbed Audio"
              subtitle={`Dubbed in ${selectedLanguageInfo?.name || targetLanguage}`}
              showWaveform={false}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dark.card,
    borderRadius: 16,
    marginVertical: 16,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.dark.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    marginBottom: 24,
  },
  languageSelectorContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: 8,
  },
  languageInfo: {
    alignItems: "center",
    marginVertical: 20,
    padding: 16,
    backgroundColor: colors.dark.background,
    borderRadius: 12,
  },
  languageName: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: 8,
  },
  sampleText: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    fontStyle: "italic",
  },
  dubButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dark.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  dubButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.dark.background,
    borderRadius: 3,
    marginTop: 16,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.dark.primary,
  },
  previewSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.dark.text,
    marginBottom: 4,
    textAlign: "center",
  },
  previewSubtitle: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    marginBottom: 20,
    textAlign: "center",
  },
  previewItem: {
    marginBottom: 16,
  },
  previewItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: 8,
  },
});
