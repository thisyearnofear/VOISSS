import * as React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "@voisss/ui";

interface RecordingWaveformProps {
  duration?: number;
  meteringData?: number[];
  width?: number;
  height?: number;
  color?: string;
}

const RecordingWaveform: React.FC<RecordingWaveformProps> = ({
  duration = 0,
  meteringData,
  width = 200,
  height = 30,
  color = colors.dark.primary,
}) => {
  // Generate waveform pattern based on duration or metering data
  const generateWaveformPattern = () => {
    // If we have metering data, use it directly
    if (meteringData && meteringData.length > 0) {
      // Normalize metering data to fit within the waveform
      const normalizedData = meteringData.map((value) => {
        // Convert from decibels (-160 to 0) to a 0-1 scale
        return Math.max(0, Math.min(1, (value + 160) / 160));
      });

      // Limit to a reasonable number of bars for display
      if (normalizedData.length > 50) {
        // Sample the data to reduce the number of bars
        const sampleRate = Math.ceil(normalizedData.length / 50);
        const sampledData = [];
        for (let i = 0; i < normalizedData.length; i += sampleRate) {
          sampledData.push(normalizedData[i]);
        }
        return sampledData.slice(0, 50);
      }

      return normalizedData;
    }

    // Fallback to duration-based waveform if no metering data
    if (duration > 0) {
      // More bars for longer recordings
      const barCount = Math.min(100, Math.max(20, Math.floor(duration / 2)));

      const waveform = [];
      for (let i = 0; i < barCount; i++) {
        // Create a more natural waveform pattern
        const position = i / (barCount - 1);
        // Create peaks at the beginning and end with a valley in the middle
        const baseHeight = Math.sin(position * Math.PI) * 0.8 + 0.2;
        // Add some randomness for a more natural look
        const randomVariation = (Math.random() - 0.5) * 0.3;
        waveform.push(Math.max(0.1, Math.min(1, baseHeight + randomVariation)));
      }
      return waveform;
    }

    // Default waveform if no data
    return Array(20).fill(0.3);
  };

  const waveformData = generateWaveformPattern();
  const barWidth = Math.max(
    2,
    (width - (waveformData.length - 1)) / waveformData.length
  );

  return (
    <View style={[styles.container, { width, height }]}>
      {waveformData.map((amplitude, index) => {
        const barHeight = Math.max(2, amplitude * height);
        const yOffset = (height - barHeight) / 2;

        return (
          <View
            key={index}
            style={{
              width: barWidth,
              height: barHeight,
              backgroundColor: color,
              marginLeft: index === 0 ? 0 : 1,
              borderRadius: barWidth / 2,
              position: "absolute",
              left: index * (barWidth + 1),
              top: yOffset,
            }}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
    position: "relative",
  },
});

export default RecordingWaveform;
