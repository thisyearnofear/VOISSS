import * as React from "react";
import { View, StyleSheet } from "react-native";
import colors from "../constants/colors";

interface RecordingWaveformProps {
  duration: number;
  width?: number;
  height?: number;
  color?: string;
}

const RecordingWaveform: React.FC<RecordingWaveformProps> = ({
  duration,
  width = 200,
  height = 30,
  color = colors.dark.primary,
}) => {
  // Generate waveform pattern based on duration
  const generateWaveformPattern = () => {
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
  };

  const waveformData = generateWaveformPattern();
  const barWidth = Math.max(2, (width - (waveformData.length - 1)) / waveformData.length);

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
              position: 'absolute',
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