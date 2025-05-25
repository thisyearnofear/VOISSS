import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react-native";
import { theme, globalStyles } from "../constants/theme";
import colors from "../constants/colors";
import { formatDuration } from "../utils/formatters";

interface AudioPlayerProps {
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (position: number) => void;
  onSkipForward: () => void;
  onSkipBackward: () => void;
  currentPosition: number;
  waveform?: number[];
}

export default function AudioPlayer({
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  onSkipForward,
  onSkipBackward,
  currentPosition,
  waveform,
}: AudioPlayerProps) {
  const [seekPosition, setSeekPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    if (!isSeeking) {
      setSeekPosition(currentPosition);
    }
  }, [currentPosition, isSeeking]);

  const handleStartSeeking = () => {
    setIsSeeking(true);
  };

  const handleSeek = (position: number) => {
    setSeekPosition(position);
  };

  const handleEndSeeking = () => {
    setIsSeeking(false);
    onSeek(seekPosition);
  };

  const progress = duration > 0 ? seekPosition / duration : 0;

  // Simple progress bar for web
  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatDuration(seekPosition)}</Text>
          <Text style={styles.timeText}>{formatDuration(duration)}</Text>
        </View>
      </View>
    );
  };

  // Waveform visualization for native
  const renderWaveform = () => {
    if (!waveform) return renderProgressBar();

    return (
      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {waveform.map((value, index) => {
            const isActive = index / waveform.length <= progress;
            return (
              <View
                key={index}
                style={[
                  styles.waveformBar,
                  {
                    height: value * 50,
                    backgroundColor: isActive
                      ? colors.dark.primary
                      : colors.dark.waveformBackground,
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatDuration(seekPosition)}</Text>
          <Text style={styles.timeText}>{formatDuration(duration)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? renderProgressBar() : renderWaveform()}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={onSkipBackward}>
          <SkipBack size={24} color={colors.dark.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.playPauseButton} onPress={onPlayPause}>
          {isPlaying ? (
            <Pause size={28} color={colors.dark.text} />
          ) : (
            <Play size={28} color={colors.dark.text} fill={colors.dark.text} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={onSkipForward}>
          <SkipForward size={24} color={colors.dark.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: colors.dark.cardAlt,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  progressContainer: {
    marginBottom: theme.spacing.md,
  },
  progressBackground: {
    height: 6,
    backgroundColor: colors.dark.waveformBackground,
    borderRadius: theme.borderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.dark.primary,
    borderRadius: theme.borderRadius.full,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.xs,
  },
  timeText: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
  },
  waveformContainer: {
    marginBottom: theme.spacing.md,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 50,
  },
  waveformBar: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: theme.borderRadius.sm,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  controlButton: {
    padding: theme.spacing.sm,
  },
  playPauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.dark.primary,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: theme.spacing.md,
  },
});
