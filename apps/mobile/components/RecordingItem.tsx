import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Animated, Dimensions } from "react-native";
import { Heart, MoreVertical, Play, Pause, Music, Globe, Link } from "lucide-react-native";
import { MissionRecording } from "@voisss/shared";
import { formatDuration, formatRelativeTime } from "../utils/formatters";
import { useRecordingTags } from "../store/recordingsStore";
import { useUIStore, useIsFavorite } from "../store/uiStore";
import { theme, globalStyles } from "../constants/theme";
import colors from "../constants/colors";
import TagBadge from "./TagBadge";
import RecordingWaveform from "./RecordingWaveform";

interface RecordingItemProps {
  recording: MissionRecording;
  onPress: () => void;
  onPlayPress: () => void;
  onMorePress: () => void;
  isPlaying?: boolean;
}

export default function RecordingItem({
  recording,
  onPress,
  onPlayPress,
  onMorePress,
  isPlaying = false,
}: RecordingItemProps) {
  const tags = useRecordingTags(recording.id);
  const { toggleFavorite } = useUIStore();
  const isFavorite = useIsFavorite(recording.id);
  const { width } = Dimensions.get("window");

  // Enhanced visual feedback for playing state
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isPlaying) {
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.02,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isPlaying, scaleValue]);

  return (
    <Animated.View
      style={[
        styles.container,
        isPlaying && styles.playing,
        { transform: [{ scale: scaleValue }] }
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {recording.title}
            </Text>
            {recording.onChain && (
              <View style={styles.chainIndicator}>
                <Globe size={12} color={colors.dark.success} />
              </View>
            )}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleFavorite(recording.id)}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Heart
                size={20}
                color={
                  isFavorite
                    ? colors.dark.error
                    : colors.dark.textSecondary
                }
                fill={isFavorite ? colors.dark.error : "transparent"}
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
            {recording.timestamp ? formatRelativeTime(recording.timestamp.toISOString()) : 'Unknown date'}
          </Text>
          {recording.fileSize && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.fileSize}>
                {(recording.fileSize / 1024).toFixed(0)} KB
              </Text>
            </>
          )}
        </View>

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

        {/* Waveform Visualization */}
        <View style={styles.waveformContainer}>
          <RecordingWaveform 
            duration={recording.duration} 
            width={width - 120}
            height={30}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.playButton, isPlaying && styles.playingButton]}
        onPress={onPlayPress}
      >
        {isPlaying ? (
          <Pause
            size={24}
            color={colors.dark.text}
          />
        ) : (
          <Play
            size={24}
            color={colors.dark.text}
            fill={colors.dark.text}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: colors.dark.card,
  },
  playing: {
    borderLeftWidth: 4,
    borderLeftColor: colors.dark.primary,
    shadowColor: colors.dark.primary,
    shadowOpacity: 0.2,
  },
  content: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.xs,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: "600",
    color: colors.dark.text,
    flex: 1,
  },
  chainIndicator: {
    marginLeft: theme.spacing.xs,
    padding: 2,
    backgroundColor: colors.dark.success + "20",
    borderRadius: theme.borderRadius.sm,
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
    fontWeight: "500",
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
  fileSize: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 30,
    marginTop: theme.spacing.xs,
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
    shadowColor: colors.dark.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playingButton: {
    backgroundColor: colors.dark.secondary,
  },
});
