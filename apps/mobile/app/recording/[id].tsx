import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Heart,
  Share2,
  MoreVertical,
  Tag as TagIcon,
  Calendar,
  Clock,
  HardDrive,
  Plus,
  Globe,
  Users,
  Lock,
  ChevronRight,
} from "lucide-react-native";
import {
  useRecording,
  useRecordingsStore,
  useRecordingTags,
} from "../../store/recordingsStore";
import { globalStyles, theme } from "../../constants/theme";
import colors from "../../constants/colors";
import AudioPlayer from "../../components/AudioPlayer";
import TagBadge from "../../components/TagBadge";
import RecordingOptionsModal from "../../components/RecordingOptionsModal";
import {
  formatDate,
  formatDuration,
  formatFileSize,
} from "../../utils/formatters";

export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const recording = useRecording(id || null);
  const tags = useRecordingTags(id || null);

  // Get actions separately to avoid re-renders
  const {
    toggleFavorite,
    updateRecording,
    deleteRecording,
    removeTagFromRecording,
    togglePublic,
    toggleShared,
  } = useRecordingsStore((state) => ({
    toggleFavorite: state.toggleFavorite,
    updateRecording: state.updateRecording,
    deleteRecording: state.deleteRecording,
    removeTagFromRecording: state.removeTagFromRecording,
    togglePublic: state.togglePublic,
    toggleShared: state.toggleShared,
  }));

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [sharingOption, setSharingOption] = useState<
    "private" | "public" | "shared"
  >(
    recording?.isPublic ? "public" : recording?.isShared ? "shared" : "private"
  );

  // Set title only when recording changes
  useEffect(() => {
    if (recording) {
      setTitle(recording.title);
      setSharingOption(
        recording.isPublic
          ? "public"
          : recording.isShared
          ? "shared"
          : "private"
      );
    }
  }, [recording?.id]);

  if (!recording) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.text}>Recording not found</Text>
      </View>
    );
  }

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleSeek = useCallback((position: number) => {
    setCurrentPosition(position);
  }, []);

  const handleSkipForward = useCallback(() => {
    setCurrentPosition((prev) => Math.min(recording.duration, prev + 15));
  }, [recording?.duration]);

  const handleSkipBackward = useCallback(() => {
    setCurrentPosition((prev) => Math.max(0, prev - 15));
  }, []);

  const handleSaveTitle = useCallback(() => {
    if (title.trim() === "") {
      Alert.alert("Error", "Title cannot be empty");
      return;
    }

    updateRecording(recording.id, { title });
    setIsEditing(false);
  }, [title, recording?.id, updateRecording]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Recording",
      "Are you sure you want to delete this recording? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteRecording(recording.id);
            router.back();
          },
        },
      ]
    );
  }, [recording?.id, deleteRecording, router]);

  const handleShare = useCallback(() => {
    // Share functionality would go here
    Alert.alert("Share", "Sharing functionality would be implemented here");
  }, []);

  const handleManageTags = useCallback(() => {
    setOptionsModalVisible(false);
    setTagModalVisible(true);
  }, []);

  const handleExport = useCallback(() => {
    // Export functionality would go here
    Alert.alert("Export", "Export functionality would be implemented here");
  }, []);

  const handleDuplicate = useCallback(() => {
    // Duplicate functionality would go here
    Alert.alert(
      "Duplicate",
      "Duplicate functionality would be implemented here"
    );
  }, []);

  const handleSharingChange = useCallback(
    (option: "private" | "public" | "shared") => {
      setSharingOption(option);

      if (option === "public") {
        togglePublic(recording.id);
      } else if (option === "shared") {
        toggleShared(recording.id);
      } else {
        // If private, ensure both public and shared are false
        updateRecording(recording.id, { isPublic: false, isShared: false });
      }
    },
    [recording?.id, togglePublic, toggleShared, updateRecording]
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Recording Details",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setOptionsModalVisible(true)}
              style={styles.headerButton}
            >
              <MoreVertical size={24} color={colors.dark.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={globalStyles.safeArea} edges={["bottom"]}>
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            {isEditing ? (
              <View style={styles.editTitleContainer}>
                <TextInput
                  style={styles.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  autoFocus
                  selectionColor={colors.dark.primary}
                />
                <TouchableOpacity
                  style={styles.saveTitleButton}
                  onPress={handleSaveTitle}
                >
                  <Text style={styles.saveTitleButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{recording.title}</Text>
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => toggleFavorite(recording.id)}
              >
                <Heart
                  size={24}
                  color={
                    recording.isFavorite ? colors.dark.error : colors.dark.text
                  }
                  fill={
                    recording.isFavorite ? colors.dark.error : "transparent"
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
              >
                <Share2 size={24} color={colors.dark.text} />
              </TouchableOpacity>
            </View>
          </View>

          <AudioPlayer
            duration={recording.duration}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onSkipForward={handleSkipForward}
            onSkipBackward={handleSkipBackward}
            currentPosition={currentPosition}
            waveform={recording.waveform}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sharing</Text>
            <View style={styles.sharingOptions}>
              <TouchableOpacity
                style={[
                  styles.sharingOption,
                  sharingOption === "private" && styles.selectedSharingOption,
                ]}
                onPress={() => handleSharingChange("private")}
              >
                <Lock
                  size={20}
                  color={
                    sharingOption === "private"
                      ? colors.dark.text
                      : colors.dark.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.sharingOptionText,
                    sharingOption === "private" &&
                      styles.selectedSharingOptionText,
                  ]}
                >
                  Private
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sharingOption,
                  sharingOption === "shared" && styles.selectedSharingOption,
                ]}
                onPress={() => handleSharingChange("shared")}
              >
                <Users
                  size={20}
                  color={
                    sharingOption === "shared"
                      ? colors.dark.text
                      : colors.dark.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.sharingOptionText,
                    sharingOption === "shared" &&
                      styles.selectedSharingOptionText,
                  ]}
                >
                  Shared
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sharingOption,
                  sharingOption === "public" && styles.selectedSharingOption,
                ]}
                onPress={() => handleSharingChange("public")}
              >
                <Globe
                  size={20}
                  color={
                    sharingOption === "public"
                      ? colors.dark.text
                      : colors.dark.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.sharingOptionText,
                    sharingOption === "public" &&
                      styles.selectedSharingOptionText,
                  ]}
                >
                  Public
                </Text>
              </TouchableOpacity>
            </View>

            {sharingOption === "shared" && (
              <TouchableOpacity style={styles.selectUsersButton}>
                <Text style={styles.selectUsersText}>
                  Select Users or Groups
                </Text>
                <ChevronRight size={16} color={colors.dark.primary} />
              </TouchableOpacity>
            )}

            {sharingOption === "public" && (
              <View style={styles.publicInfo}>
                <Text style={styles.publicInfoText}>
                  This recording will be visible to everyone in the VOISSS
                  community.
                </Text>
                {recording.duration > 180 && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      This recording is longer than 3 minutes. Only the first 3
                      minutes will be shared publicly.
                    </Text>
                    <TouchableOpacity style={styles.upgradeButton}>
                      <Text style={styles.upgradeButtonText}>
                        Upgrade to Pro
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={handleManageTags}
              >
                <TagIcon size={16} color={colors.dark.text} />
                <Text style={styles.addTagButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tagsContainer}>
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    selected
                    onRemove={() =>
                      removeTagFromRecording(recording.id, tag.id)
                    }
                  />
                ))
              ) : (
                <Text style={styles.noTagsText}>No tags added yet</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Calendar size={20} color={colors.dark.text} />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Created</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(recording.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <Clock size={20} color={colors.dark.text} />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>
                    {formatDuration(recording.duration)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIconContainer}>
                  <HardDrive size={20} color={colors.dark.text} />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Size</Text>
                  <Text style={styles.detailValue}>
                    {formatFileSize(recording.size)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <RecordingOptionsModal
          visible={optionsModalVisible}
          onClose={() => setOptionsModalVisible(false)}
          recording={recording}
          onEdit={() => {
            setOptionsModalVisible(false);
            setIsEditing(true);
          }}
          onDelete={handleDelete}
          onToggleFavorite={() => {
            toggleFavorite(recording.id);
            setOptionsModalVisible(false);
          }}
          onShare={handleShare}
          onManageTags={handleManageTags}
          onExport={handleExport}
          onDuplicate={handleDuplicate}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    padding: 16,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: "700",
    color: colors.dark.text,
    flex: 1,
  },
  editButton: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.dark.primary,
    marginLeft: theme.spacing.sm,
  },
  editTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  titleInput: {
    flex: 1,
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: "700",
    color: colors.dark.text,
    borderBottomWidth: 2,
    borderBottomColor: colors.dark.primary,
    paddingVertical: theme.spacing.xs,
  },
  saveTitleButton: {
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: colors.dark.primary,
    borderRadius: theme.borderRadius.md,
  },
  saveTitleButtonText: {
    color: colors.dark.text,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.dark.card,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: 600,
    color: colors.dark.text,
    marginBottom: theme.spacing.sm,
  },
  sharingOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  sharingOption: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
  },
  selectedSharingOption: {
    backgroundColor: colors.dark.primary,
  },
  sharingOptionText: {
    color: colors.dark.textSecondary,
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSizes.sm,
  },
  selectedSharingOptionText: {
    color: colors.dark.text,
    fontWeight: "500",
  },
  selectUsersButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  selectUsersText: {
    color: colors.dark.primary,
    fontWeight: "500",
  },
  publicInfo: {
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  publicInfoText: {
    color: colors.dark.textSecondary,
    fontSize: theme.typography.fontSizes.sm,
    marginBottom: theme.spacing.md,
  },
  warningBox: {
    backgroundColor: `${colors.dark.warning}20`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.dark.warning,
  },
  warningText: {
    color: colors.dark.text,
    fontSize: theme.typography.fontSizes.sm,
    marginBottom: theme.spacing.sm,
  },
  upgradeButton: {
    backgroundColor: colors.dark.warning,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    alignSelf: "flex-start",
  },
  upgradeButtonText: {
    color: colors.dark.background,
    fontWeight: "600",
    fontSize: theme.typography.fontSizes.sm,
  },
  addTagButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dark.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  addTagButtonText: {
    marginLeft: theme.spacing.xs,
    color: colors.dark.text,
    fontSize: theme.typography.fontSizes.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  noTagsText: {
    color: colors.dark.textSecondary,
    fontSize: theme.typography.fontSizes.md,
    fontStyle: "italic",
  },
  detailsContainer: {
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark.cardAlt,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  detailLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.dark.text,
  },
  headerButton: {
    marginRight: theme.spacing.sm,
  },
});
