import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import WaveformVisualization from "./WaveformVisualization";
import colors from "../constants/colors";

export default function WaveformTest() {
  const [isRecording, setIsRecording] = useState(false);
  const [meteringData, setMeteringData] = useState<number[]>([]);

  // Simulate metering data
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        // Generate random metering data to simulate audio input
        const newData = Array.from({ length: 10 }, () => Math.random() * 2 - 1);
        setMeteringData(newData);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isRecording]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Waveform Visualization Test</Text>

      <WaveformVisualization
        isRecording={isRecording}
        meteringData={meteringData}
        width={300}
        height={100}
      />

      <TouchableOpacity
        style={[
          styles.button,
          isRecording ? styles.stopButton : styles.recordButton,
        ]}
        onPress={() => setIsRecording(!isRecording)}
      >
        <Text style={styles.buttonText}>
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.dark.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.dark.text,
    marginBottom: 30,
  },
  button: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  recordButton: {
    backgroundColor: colors.dark.error,
  },
  stopButton: {
    backgroundColor: colors.dark.primary,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
