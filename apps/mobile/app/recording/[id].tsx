import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  useAudioRecording,
  RecordingState,
} from "../../hooks/useAudioRecording";
import { useBaseAccount } from "../../hooks/useBaseAccount";
import { createBaseRecordingService } from "../types";
import { colors } from "@voisss/ui";
import RecordingWaveform from "../../components/RecordingWaveform";
import {
  createMobileIPFSService,
  MobileIPFSService,
} from "../../services/ipfsService";

// Real IPFS upload implementation using the shared service
async function uploadToIpfs(uri: string): Promise<string> {
  console.log(`Uploading ${uri} to IPFS...`);

  try {
    // Create IPFS service instance
    const ipfsService = createMobileIPFSService();

    // Check if IPFS is properly configured
    if (
      !process.env.EXPO_PUBLIC_PINATA_API_KEY ||
      !process.env.EXPO_PUBLIC_PINATA_API_SECRET
    ) {
      throw new Error(
        "Pinata API credentials not configured. Please set EXPO_PUBLIC_PINATA_API_KEY and EXPO_PUBLIC_PINATA_API_SECRET in your environment."
      );
    }

    // Prepare metadata for the audio file
    const metadata = {
      filename: `recording_${Date.now()}.m4a`,
      mimeType: "audio/mp4", // iOS records in m4a format by default
      duration: 0, // We don't have duration info here, but it's optional
    };

    // Upload the file using the mobile-specific method
    const result = await ipfsService.uploadAudioFromUri(uri, metadata);

    console.log(`IPFS upload complete: ${result.hash}`);
    return result.hash;
  } catch (error) {
    console.error("IPFS upload failed:", error);
    throw new Error(
      `Failed to upload to IPFS: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export default function RecordingScreen() {
  const { id } = useLocalSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    isRecording,
    isLoading: isRecordingLoading,
    duration,
    uri,
    meteringData,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecording();

  const {
    isConnected,
    isConnecting,
    universalAddress,
    connect,
    disconnect,
    permissionActive,
    isLoadingPermissions,
    requestPermission,
    status,
  } = useBaseAccount();

  const handleSave = async () => {
    if (!uri || !universalAddress) {
      setSaveError("No recording available or wallet not connected.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // 1. Check for spend permission
      if (!permissionActive) {
        console.log("Requesting spend permission before saving...");
        await requestPermission();
        // After permission is granted, the save needs to be re-initiated by the user.
        // A better UX would be to automatically continue, but this is simpler.
        setIsSaving(false);
        alert("Permission granted! Please press Save again to confirm.");
        return;
      }

      // 2. Upload to IPFS
      const ipfsHash = await uploadToIpfs(uri);

      // 3. Save to blockchain via backend
      const recordingService = createBaseRecordingService(universalAddress, {
        permissionRetriever: () => {
          // TODO: Implement proper permission storage for mobile
          // For now, return a placeholder - mobile permission handling needs implementation
          return null;
        }
      });
      const metadata = {
        title: `Recording ${id}`,
        description: "",
        isPublic: true,
        tags: [],
      };
      const txHash = await recordingService.saveRecording(ipfsHash, metadata);

      console.log("Save successful! TxHash:", txHash);
      alert(`Recording saved successfully!\nTransaction: ${txHash}`);
    } catch (error: any) {
      console.error("Failed to save recording:", error);
      setSaveError(error.message || "An unknown error occurred during save.");
      alert(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderWalletState = () => {
    if (isConnecting || isLoadingPermissions) {
      return <ActivityIndicator color={colors.dark.text} />;
    }
    if (!isConnected) {
      return <Button title="Connect Wallet" onPress={connect} />;
    }
    return (
      <View style={styles.walletContainer}>
        <Text style={styles.text}>
          Connected: {universalAddress?.slice(0, 6)}...
          {universalAddress?.slice(-4)}
        </Text>
        <Text style={styles.statusText}>Status: {status}</Text>
        {!permissionActive && (
          <Button
            title="Grant Gasless Permission"
            onPress={requestPermission}
          />
        )}
        <Button title="Disconnect" onPress={disconnect} color="#ff4444" />
      </View>
    );
  };

  const renderRecordingControls = () => {
    if (isRecordingLoading) {
      return <ActivityIndicator size="large" color={colors.dark.primary} />;
    }
    if (uri && !isRecording) {
      return (
        <View style={styles.buttonRow}>
          <Button
            title="Save"
            onPress={handleSave}
            disabled={isSaving || !isConnected}
          />
          <Button title="Discard" onPress={cancelRecording} color="#ff4444" />
        </View>
      );
    }
    return (
      <View style={styles.buttonRow}>
        {isRecording ? (
          <Button title="Stop Recording" onPress={stopRecording} />
        ) : (
          <Button title="Start Recording" onPress={startRecording} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recording {id}</Text>

      {renderWalletState()}

      <View style={styles.waveformContainer}>
        <RecordingWaveform meteringData={meteringData} />
        <Text style={styles.durationText}>{(duration / 1000).toFixed(1)}s</Text>
      </View>

      {renderRecordingControls()}

      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" />
          <Text style={styles.savingText}>Saving to IPFS & Blockchain...</Text>
        </View>
      )}

      {saveError && <Text style={styles.errorText}>{saveError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.dark.background,
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.dark.text,
    marginBottom: 20,
  },
  walletContainer: {
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 8,
  },
  text: {
    color: colors.dark.text,
    fontSize: 16,
    marginBottom: 5,
  },
  statusText: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    marginBottom: 10,
  },
  waveformContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  durationText: {
    color: colors.dark.text,
    fontSize: 20,
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: 20,
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  savingText: {
    color: "white",
    marginTop: 10,
  },
  errorText: {
    color: "red",
    marginTop: 10,
  },
});
