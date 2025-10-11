import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Text, Dimensions, Animated } from "react-native";
import Svg, { Rect } from "react-native-svg";
import colors from "../constants/colors";
import { theme } from "../constants/theme";

interface WaveformVisualizationProps {
  isRecording: boolean;
  meteringData?: number[];
  width: number;
  height: number;
}

const WAVEFORM_BARS = 50;

export default function WaveformVisualization({
  isRecording,
  meteringData = [],
  width,
  height,
}: WaveformVisualizationProps) {
  const animationRef = useRef<number>(0);
  const [waveformData, setWaveformData] = React.useState<number[]>(
    new Array(WAVEFORM_BARS).fill(0)
  );
  const lastMeteringRef = useRef<number[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate the recording indicator pulse
  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation;

    if (isRecording) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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
      pulseAnimation.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [isRecording, pulseAnim]);

  useEffect(() => {
    if (!isRecording) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Fade out animation
      const fadeOut = () => {
        setWaveformData((prev) => prev.map((val) => val * 0.95));
        if (Math.max(...waveformData) > 0.01) {
          animationRef.current = requestAnimationFrame(fadeOut);
        }
      };
      fadeOut();
      return;
    }

    const animate = () => {
      // Use actual metering data if available
      if (meteringData.length > 0) {
        // Store the latest metering data
        lastMeteringRef.current = [...meteringData];

        // Calculate average amplitude from metering data
        const average =
          meteringData.reduce((sum, value) => sum + Math.abs(value), 0) /
          meteringData.length;
        // Normalize to 0-1 range (metering values are typically in -1 to 1 range)
        const normalizedValue = Math.min(1, Math.abs(average));

        setWaveformData((prev) => {
          const newData = [...prev];
          newData.shift();
          newData.push(normalizedValue);
          return newData;
        });
      } else if (lastMeteringRef.current.length > 0) {
        // Continue using last known metering data
        const average =
          lastMeteringRef.current.reduce(
            (sum, value) => sum + Math.abs(value),
            0
          ) / lastMeteringRef.current.length;
        const normalizedValue = Math.min(1, Math.abs(average));

        setWaveformData((prev) => {
          const newData = [...prev];
          newData.shift();
          newData.push(normalizedValue * 0.8); // Gradually decrease
          return newData;
        });
      } else {
        // Simulate real-time audio data if no metering data available
        setWaveformData((prev) => {
          const newData = [...prev];
          newData.shift();
          newData.push(Math.random() * 0.8 + 0.1);
          return newData;
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, meteringData]);

  const barWidth = width / WAVEFORM_BARS;
  const maxHeight = height * 0.8;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {waveformData.map((value, index) => {
          const barHeight = value * maxHeight;
          const x = index * barWidth;
          const y = (height - barHeight) / 2;

          // Create gradient effect with more dynamic coloring
          const isActive =
            isRecording &&
            index / waveformData.length >
              (waveformData.length - 15) / waveformData.length;

          // More vibrant colors for active bars
          const color = isActive
            ? colors.dark.primary
            : isRecording
            ? `rgba(124, 93, 250, ${0.4 + value * 0.6})`
            : `rgba(107, 114, 128, ${0.1 + value * 0.2})`;

          return (
            <Rect
              key={index}
              x={x}
              y={y}
              width={Math.max(1, barWidth - 1)}
              height={Math.max(1, barHeight)}
              fill={color}
              rx={barWidth / 3}
            />
          );
        })}
      </Svg>

      {/* Enhanced recording indicator with pulse animation */}
      {isRecording && (
        <Animated.View
          style={[
            styles.recordingIndicator,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>REC</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.dark.border,
    shadowColor: colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recordingIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${colors.dark.error}20`,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.dark.error,
    opacity: 0.9,
  },
  recordingText: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: "700",
    color: colors.dark.error,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
