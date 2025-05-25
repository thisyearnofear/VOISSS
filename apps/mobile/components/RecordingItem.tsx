import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Heart, MoreVertical, Play } from "lucide-react-native";
import { Recording } from "@/types/recording";
import { formatDuration, formatRelativeTime } from "@/utils/formatters";
import { useRecordingTags } from "@/store/recordingsStore";
import { theme, globalStyles } from "@/constants/theme";
import colors from "@/constants/colors";
import TagBadge from "./TagBadge";

interface RecordingItemProps {
  recording: Recording;
  onPress: () => void;
  onPlayPress: () => void;
  onFavoritePress: () => void;
  onMorePress: () => void;
  isPlaying?: boolean;
}

export default function RecordingItem({
  recording,
  onPress,
  onPlayPress,
  onFavoritePress,
  onMorePress,
  isPlaying = false,
}: RecordingItemProps) {
  const tags = useRecordingTags(recording.id);

  return (
    <TouchableOpacity
      style={[styles.container, isPlaying && styles.playing]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {recording.title}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onFavoritePress}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Heart
                size={20}
                color={
                  recording.isFavorite
                    ? colors.dark.error
                    : colors.dark.textSecondary
                }
                fill={recording.isFavorite ? colors.dark.error : "transparent"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onMorePress}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <MoreVertical size={20} color={colors.dark.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.details}>
          <Text style={styles.duration}>
            {formatDuration(recording.duration)}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.date}>
            {formatRelativeTime(recording.createdAt)}
          </Text>
        </View>

        {recording.waveform && (
          <View style={styles.waveformContainer}>
            {recording.waveform.map((value, index) => (
              <View
                key={index}
                style={[
                  styles.waveformBar,
                  {
                    height: value * 30,
                    backgroundColor: isPlaying
                      ? colors.dark.primary
                      : colors.dark.waveformBackground,
                  },
                ]}
              />
            ))}
          </View>
        )}

        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag.id} tag={tag} size="small" />
            ))}
            {tags.length > 3 && (
              <View style={styles.moreTagsBadge}>
                <Text style={styles.moreTagsText}>+{tags.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.playButton, isPlaying && styles.playingButton]}
        onPress={onPlayPress}
      >
        <Play
          size={24}
          color={colors.dark.text}
          fill={isPlaying ? colors.dark.text : "transparent"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    ...globalStyles.card,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    borderLeftWidth: 0,
    borderLeftColor: "transparent",
  },
  playing: {
    borderLeftWidth: 4,
    borderLeftColor: colors.dark.primary,
  },
  content: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: "600",
    color: colors.dark.text,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginLeft: theme.spacing.sm,
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  duration: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
  },
  dot: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
    marginHorizontal: theme.spacing.xs,
  },
  date: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 30,
    marginBottom: theme.spacing.sm,
  },
  waveformBar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: theme.borderRadius.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: theme.spacing.xs,
  },
  moreTagsBadge: {
    backgroundColor: colors.dark.cardAlt,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    marginRight: 8,
    marginBottom: 8,
  },
  moreTagsText: {
    fontSize: 12,
    color: colors.dark.textSecondary,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.dark.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  playingButton: {
    backgroundColor: colors.dark.secondary,
  },
});
