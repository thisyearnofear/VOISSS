import * as React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "@voisss/ui";

interface WaveformVisualizationProps {
  isRecording?: boolean;
  meteringData?: number[];
  width?: number;
  height?: number;
  color?: string;
}

const WaveformVisualization: React.FC<WaveformVisualizationProps> = ({
  isRecording = false,
  meteringData = [],
  width = 300,
  height = 100,
  color = colors.dark.waveform,
}) => {
  // If we have metering data, use it to generate the waveform
  const waveformData = meteringData.length > 0 
    ? meteringData 
    : Array(50).fill(0).map(() => Math.random() * (isRecording ? 0.8 : 0.2));

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.waveformContainer}>
        {waveformData.map((amplitude, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: Math.abs(amplitude) * height * 0.8,
                backgroundColor: isRecording ? color : colors.dark.waveformBackground,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    height: "100%",
  },
  bar: {
    width: 3,
    borderRadius: 2,
    minWidth: 2,
    maxWidth: 6,
    alignSelf: "center",
  },
});

export default WaveformVisualization;