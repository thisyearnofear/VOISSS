import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import {
  Bot,
  Download,
  Volume2,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react-native";
import { colors } from "@voisss/ui";
import { theme } from "@voisss/ui";
import type { VoiceInfo } from "@voisss/shared/types/audio";

interface AITransformationPanelProps {
  voices: VoiceInfo[];
  selectedVoiceId: string;
  setSelectedVoiceId: (voiceId: string) => void;
  isLoadingVoices: boolean;
  isTransforming: boolean;
  transformedBlob: Blob | null;
  onTransform: () => void;
  capabilities: {
    remainingAIUses: number | null;
  };
  currentTier: string;
}

export default function AITransformationPanel({
  voices,
  selectedVoiceId,
  setSelectedVoiceId,
  isLoadingVoices,
  isTransforming,
  transformedBlob,
  onTransform,
  capabilities,
  currentTier,
}: AITransformationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.sectionTitleContainer}>
          <Sparkles size={20} color={colors.dark.primary} />
          <Text style={styles.sectionTitle}>AI Voice Transformation</Text>
        </View>
        {isExpanded ? (
          <ChevronUp size={20} color={colors.dark.textSecondary} />
        ) : (
          <ChevronDown size={20} color={colors.dark.textSecondary} />
        )}
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView style={styles.aiTransformContainer}>
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
                      selectedVoiceId === item.voiceId &&
                        styles.voiceItemSelected,
                    ]}
                    onPress={() => setSelectedVoiceId(item.voiceId)}
                  >
                    <View style={styles.voiceInfo}>
                      <Text style={styles.voiceName}>{item.name}</Text>
                      {item.description && (
                        <Text style={styles.voiceDescription}>
                          {item.description}
                        </Text>
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
              buttonStyles.primary,
              styles.transformButton,
              (!selectedVoiceId || isTransforming) &&
                styles.transformButtonDisabled,
            ]}
            onPress={onTransform}
            disabled={!selectedVoiceId || isTransforming}
          >
            {isTransforming ? (
              <View style={styles.transformingContainer}>
                <Loader2 size={20} color={colors.dark.text} />
                <Text style={buttonStyles.primaryText}>Transforming...</Text>
              </View>
            ) : (
              <>
                <Bot size={20} color={colors.dark.text} />
                <Text style={buttonStyles.primaryText}>Transform Voice</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Transformed Audio Preview */}
          {transformedBlob && (
            <View style={styles.transformedContainer}>
              <Text style={styles.transformedTitle}>
                Transformed Audio Ready!
              </Text>
              <TouchableOpacity style={buttonStyles.primary}>
                <View style={styles.buttonContent}>
                  <Volume2 size={20} color={colors.dark.text} />
                  <Text style={buttonStyles.primaryText}>Play Preview</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={buttonStyles.secondary}>
                <View style={styles.buttonContent}>
                  <Download size={20} color={colors.dark.primary} />
                  <Text style={buttonStyles.secondaryText}>Download</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Usage Info */}
          {capabilities.remainingAIUses !== null && (
            <View style={styles.usageContainer}>
              <Text style={styles.usageText}>
                {capabilities.remainingAIUses} AI transformations remaining
                today
              </Text>
              {currentTier === "web3" && (
                <TouchableOpacity style={buttonStyles.primary}>
                  <Text style={buttonStyles.primaryText}>
                    Upgrade to Premium
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.xl,
    margin: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: "700",
    color: colors.dark.text,
  },
  aiTransformContainer: {
    padding: 16,
  },
  aiTransformDescription: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.dark.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  voiceSection: {
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    color: colors.dark.textSecondary,
    fontSize: theme.typography.fontSizes.md,
  },
  voicesList: {
    paddingBottom: 8,
  },
  voiceItem: {
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  voiceItemSelected: {
    backgroundColor: `${colors.dark.primary}20`,
    borderColor: colors.dark.primary,
  },
  voiceInfo: {
    alignItems: "center",
    marginBottom: 8,
  },
  voiceName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: "600",
    color: colors.dark.text,
    textAlign: "center",
  },
  voiceDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
    textAlign: "center",
  },
  transformButton: {
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
  transformedContainer: {
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  transformedTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: 12,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  usageContainer: {
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  usageText: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.dark.textSecondary,
    marginBottom: 12,
  },
});
