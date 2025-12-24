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
  Dice5,
} from "lucide-react-native";
import { colors } from "@voisss/ui";
import { theme } from "@voisss/ui";
import { Button } from "../ui/Button";
import { AIVoiceSelector } from "./AIVoiceSelector";
import { AudioPreviewPlayer } from "./AudioPreviewPlayer";
import { mobileAIService, type AIVoiceStyle } from "../services/ai-service";

interface AITransformationPanelProps {
  voices: VoiceInfo[];
  selectedVoiceId: string;
  setSelectedVoiceId: (voiceId: string) => void;
  isLoadingVoices: boolean;
  isTransforming: boolean;
  transformedBlob: Blob | null;
  audioBlobForDubbing?: Blob | null; // NEW: Original audio blob for preview
  onTransform: () => void;
  onVRFSelect?: (voiceId: string) => Promise<void>; // NEW: ScrollVRF integration
  isVRFLoading?: boolean; // NEW: VRF loading state
  capabilities: {
    remainingAIUses: number | null;
  };
  currentTier: string;
  useEnhancedSelector?: boolean; // Flag to use enhanced voice selector
}

export default function AITransformationPanel({
  voices,
  selectedVoiceId,
  setSelectedVoiceId,
  isLoadingVoices,
  isTransforming,
  transformedBlob,
  audioBlobForDubbing,
  onTransform,
  onVRFSelect,
  isVRFLoading = false,
  capabilities,
  currentTier,
  useEnhancedSelector = false, // Default to false for backward compatibility
}: AITransformationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [aiVoiceStyles, setAIVoiceStyles] = useState<AIVoiceStyle[]>([]);
  const [loadingAIVoiceStyles, setLoadingAIVoiceStyles] = useState(false);

  // Load AI voice styles if enhanced selector is enabled
  React.useEffect(() => {
    if (useEnhancedSelector && isExpanded && aiVoiceStyles.length === 0) {
      const loadAIVoiceStyles = async () => {
        try {
          setLoadingAIVoiceStyles(true);
          const styles = await mobileAIService.getVoiceStyles();
          setAIVoiceStyles(styles);
        } catch (error) {
          console.error('Failed to load AI voice styles:', error);
        } finally {
          setLoadingAIVoiceStyles(false);
        }
      };
      
      loadAIVoiceStyles();
    }
  }, [useEnhancedSelector, isExpanded, aiVoiceStyles.length]);

  // Map ElevenLabs voices to our AI voice styles for compatibility
  const mapVoiceIdToStyle = (voiceId: string): AIVoiceStyle | undefined => {
    return aiVoiceStyles.find(style => style.voiceId === voiceId);
  };

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

          {/* Voice Selection - Use enhanced selector if enabled */}
          {useEnhancedSelector ? (
            <View style={styles.voiceSection}>
              <Text style={styles.sectionTitle}>Choose AI Voice Style</Text>
              
              {loadingAIVoiceStyles ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.dark.primary} />
                  <Text style={styles.loadingText}>Loading AI voice styles...</Text>
                </View>
              ) : (
                <AIVoiceSelector
                  onVoiceSelected={(voiceStyle) => setSelectedVoiceId(voiceStyle.voiceId)}
                  selectedVoiceId={selectedVoiceId}
                  showCategories={true}
                />
              )}
              
              {/* Show selected voice info */}
              {selectedVoiceId && !loadingAIVoiceStyles && (
                <View style={styles.selectedVoiceInfo}>
                  <Text style={styles.selectedVoiceTitle}>Selected Voice</Text>
                  {mapVoiceIdToStyle(selectedVoiceId) ? (
                    <View style={styles.selectedVoiceDetails}>
                      <Text style={styles.selectedVoiceName}>
                        {mapVoiceIdToStyle(selectedVoiceId)?.name}
                      </Text>
                      <Text style={styles.selectedVoiceDescription}>
                        {mapVoiceIdToStyle(selectedVoiceId)?.description}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.selectedVoiceFallback}>
                      Custom voice selected
                    </Text>
                  )}
                </View>
              )}
            </View>
          ) : (
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
          )}

          {/* Transform Buttons */}
          <View style={styles.transformButtonsContainer}>
            <TouchableOpacity
              style={[
                buttonStyles.primary,
                styles.transformButton,
                styles.transformButtonFlex,
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

            {/* ScrollVRF "Surprise Me" Button */}
            {onVRFSelect && (
              <TouchableOpacity
                style={[
                  buttonStyles.secondary,
                  styles.transformButton,
                  styles.transformButtonFlex,
                  (isVRFLoading || isTransforming) &&
                    styles.transformButtonDisabled,
                ]}
                onPress={() => {
                  if (voices.length > 0) {
                    const randomVoice = voices[Math.floor(Math.random() * voices.length)];
                    onVRFSelect(randomVoice.voiceId);
                  }
                }}
                disabled={isVRFLoading || isTransforming || voices.length === 0}
              >
                {isVRFLoading ? (
                  <View style={styles.transformingContainer}>
                    <Loader2 size={20} color={colors.dark.primary} />
                    <Text style={buttonStyles.secondaryText}>VRF...</Text>
                  </View>
                ) : (
                  <>
                    <Dice5 size={20} color={colors.dark.primary} />
                    <Text style={buttonStyles.secondaryText}>Surprise Me</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Audio Preview Section */}
          {(transformedBlob || audioBlobForDubbing) && (
            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>Audio Preview</Text>
              
              {/* Original Audio Preview */}
              {audioBlobForDubbing && (
                <View style={styles.previewItem}>
                  <Text style={styles.previewItemTitle}>Original Recording</Text>
                  <AudioPreviewPlayer
                    audioBlob={audioBlobForDubbing}
                    title="Original"
                    subtitle="Your original voice recording"
                    showWaveform={true}
                  />
                </View>
              )}
              
              {/* Transformed Audio Preview */}
              {transformedBlob && (
                <View style={styles.previewItem}>
                  <Text style={styles.previewItemTitle}>AI Transformed</Text>
                  <AudioPreviewPlayer
                    audioBlob={transformedBlob}
                    title="AI Voice"
                    subtitle={`Transformed with ${selectedVoiceId}`}
                    showWaveform={true}
                  />
                </View>
              )}
              
              {/* Comparison View */}
              {transformedBlob && audioBlobForDubbing && (
                <View style={styles.comparisonContainer}>
                  <Text style={styles.comparisonTitle}>🎧 Compare Versions</Text>
                  <Text style={styles.comparisonSubtitle}>
                    Listen to both versions to choose your favorite
                  </Text>
                  
                  <View style={styles.comparisonControls}>
                    <Button
                      title="Play Both"
                      variant="secondary"
                      size="sm"
                      icon="play"
                      onPress={() => {
                        // Would play both audio clips sequentially
                        console.log('Play both audio clips');
                      }}
                    />
                    <Button
                      title="A/B Test"
                      variant="secondary"
                      size="sm"
                      icon="swap-horizontal"
                      onPress={() => {
                        // Would toggle between versions
                        console.log('A/B test mode');
                      }}
                    />
                  </View>
                </View>
              )}
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
  // Enhanced selector styles
  selectedVoiceInfo: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: colors.dark.cardAlt,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  selectedVoiceTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: "600",
    color: colors.dark.primary,
    marginBottom: theme.spacing.xs,
  },
  selectedVoiceDetails: {
    gap: theme.spacing.xxs,
  },
  selectedVoiceName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: "500",
    color: colors.dark.text,
  },
  selectedVoiceDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
  },
  selectedVoiceFallback: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
    fontStyle: "italic",
  },
  // Preview section styles
  previewSection: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  previewSectionTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  previewItem: {
    marginBottom: theme.spacing.lg,
  },
  previewItemTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: "500",
    color: colors.dark.text,
    marginBottom: theme.spacing.sm,
  },
  comparisonContainer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: colors.dark.cardAlt,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  comparisonTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  comparisonSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  comparisonControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
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
  transformButtonsContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: 16,
  },
  transformButton: {
    marginBottom: 0,
  },
  transformButtonFlex: {
    flex: 1,
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

// Button styles definition
const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.dark.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: colors.dark.textInverse,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  secondary: {
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  secondaryText: {
    color: colors.dark.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
