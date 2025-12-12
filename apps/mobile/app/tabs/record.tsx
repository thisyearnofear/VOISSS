import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Mic,
  Square,
  Pause,
  Play,
  Save,
  X,
  Settings,
} from "lucide-react-native";
import { useAudioRecording } from "../../hooks/useAudioRecording";
import { useRecordingsStore } from "../../store/recordingsStore";
// TODO: Replace with Base wallet hook
import { useBase } from "../../hooks/useBase";
import { useFeatureGating } from "../../utils/featureGating";
import { colors } from "@voisss/ui";
import { createAIServiceClient, formatDuration } from "@voisss/shared";
import { theme } from "@voisss/ui";
import type { VoiceInfo } from "@voisss/shared/types/audio";
import { scrollBlockchainService } from "../../services/scrollBlockchainService";

const { width } = Dimensions.get("window");

import { WaveformVisualization, AITransformationPanel, DubbingPanel } from "@voisss/ui";
import { SocialShare } from "@voisss/ui";

export default function RecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    isRecording,
    isLoading,
    duration,
    uri,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    meteringData,
  } = useAudioRecording();

  const { addRecording, addRecordingWithIPFS } = useRecordingsStore();
  const { account, permissionActive, requestPermission } = useBase();
  const { getCurrentTier, getUserCapabilities } = useFeatureGating();

  // IPFS upload state from store
  const isUploadingToIPFS = useRecordingsStore(
    (state) => state.isUploadingToIPFS
  );
  const ipfsUploadProgress = useRecordingsStore(
    (state) => state.ipfsUploadProgress
  );

  const currentTier = getCurrentTier();
  const capabilities = getUserCapabilities();

  // AI Voice Transformation state
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedBlob, setTransformedBlob] = useState<Blob | null>(null);
  const [aiService] = useState(() =>
  createAIServiceClient({
  apiBaseUrl: "https://voisss.netlify.app/api",
  platform: "mobile",
  })
  );

  // Dubbing state
  const [dubbedBlob, setDubbedBlob] = useState<Blob | null>(null);
  const [dubbedLanguage, setDubbedLanguage] = useState<string>("");
  const [audioBlobForDubbing, setAudioBlobForDubbing] = useState<Blob | null>(null);

  // Version selection state for unified save
  const [selectedVersions, setSelectedVersions] = useState({
    original: true,
    aiVoice: false,
    dubbed: false,
  });

  // Sharing state
  const [savedRecordings, setSavedRecordings] = useState<any[]>([]);
  const [showSharing, setShowSharing] = useState(false);

  // Scroll blockchain state
  const [isVRFLoading, setIsVRFLoading] = useState(false);
  const [isStoringOnScroll, setIsStoringOnScroll] = useState(false);
  const [isRecordingPublic, setIsRecordingPublic] = useState(false);

  const [isPaused, setIsPaused] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  // Animation for recording button
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Check if user has mission context
  const missionId = params.missionId as string;

  // Load voices for AI transformation
  const loadVoices = useCallback(async () => {
    if (!capabilities.canAccessAI) return;

    try {
      setIsLoadingVoices(true);
      const availableVoices = await aiService.listVoices();
      setVoices(availableVoices);

      // Auto-select first voice
      if (availableVoices.length > 0 && !selectedVoiceId) {
        setSelectedVoiceId(availableVoices[0].voiceId);
      }
    } catch (error) {
      console.error("Failed to load voices:", error);
      Alert.alert("Error", "Failed to load AI voices");
    } finally {
      setIsLoadingVoices(false);
    }
  }, [capabilities.canAccessAI, aiService, selectedVoiceId]);

  // Transform voice with AI
  const transformVoice = useCallback(async () => {
    if (!uri || !selectedVoiceId || !capabilities.canAccessAI) return;

    try {
      setIsTransforming(true);

      // Convert file URI to blob for web API
      const response = await fetch(uri);
      const audioBlob = await response.blob();

      const transformedBlob = await aiService.transformVoice(
        audioBlob,
        selectedVoiceId
      );
      setTransformedBlob(transformedBlob);

      // Haptic feedback for successful transformation
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Voice transformation failed:", error);
      Alert.alert("Error", "Failed to transform voice");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsTransforming(false);
    }
  }, [uri, selectedVoiceId, capabilities.canAccessAI, aiService]);

  // Load voices when AI features become available
  useEffect(() => {
  if (capabilities.canAccessAI && showSaveOptions) {
  loadVoices();
  }
  }, [capabilities.canAccessAI, showSaveOptions, loadVoices]);

  // Handle ScrollVRF "Surprise Me" voice selection
  const handleVRFVoiceSelection = useCallback(async (voiceId: string) => {
    try {
      setIsVRFLoading(true);
      console.log('🎲 VRF Voice Selection:', voiceId);
      // For testnet, simulate VRF request
      await new Promise(resolve => setTimeout(resolve, 500));
      setSelectedVoiceId(voiceId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('VRF selection failed:', error);
      Alert.alert('Error', 'Failed to select random voice');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsVRFLoading(false);
    }
  }, []);

  // Convert URI to Blob for dubbing when recording is complete
  useEffect(() => {
    if (uri && showSaveOptions) {
      const convertUriToBlob = async () => {
        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          setAudioBlobForDubbing(blob);
        } catch (error) {
          console.error('Failed to convert URI to Blob:', error);
        }
      };
      convertUriToBlob();
    }
  }, [uri, showSaveOptions]);

  // Animate recording button when recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
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
      pulse.start();

      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, isPaused, pulseAnim]);

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
      setIsPaused(false);
      setShowSaveOptions(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      Alert.alert(
        "Recording Error",
        error instanceof Error ? error.message : "Failed to start recording"
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
  try {
  const recordingUri = await stopRecording();
  if (recordingUri) {
  setShowSaveOptions(true);
  // Reset AI state for new recording
    setVoices([]);
      setSelectedVoiceId("");
    setTransformedBlob(null);
  setIsLoadingVoices(false);
  setIsTransforming(false);
    // Reset dubbing state
    setDubbedBlob(null);
      setDubbedLanguage("");
        // Reset version selection
        setSelectedVersions({
          original: true,
          aiVoice: false,
          dubbed: false,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert(
        "Recording Error",
        error instanceof Error ? error.message : "Failed to stop recording"
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [stopRecording]);

  const handlePauseResume = useCallback(async () => {
    try {
      if (isPaused) {
        await resumeRecording();
        setIsPaused(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        await pauseRecording();
        setIsPaused(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert(
        "Recording Error",
        error instanceof Error
          ? error.message
          : "Failed to pause/resume recording"
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [isPaused, pauseRecording, resumeRecording]);

  const handleSaveRecording = useCallback(async () => {
    if (!uri) return;

    try {
      const recording = {
        id: Date.now().toString(),
        title: recordingTitle || `Recording ${new Date().toLocaleDateString()}`,
        description: "",
        duration: duration,
        fileSize: 0, // Will be calculated later
        format: "mp3" as const,
        quality: "medium" as const,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: false,
        participantConsent: false,
        isAnonymized: false,
        voiceObfuscated: false,
        isCompleted: false,
        // Mobile-specific fields
        filePath: uri,

        isShared: false,
        waveform: [], // Will be generated later
      };

      // Use IPFS-enabled recording if user has premium access
      if (capabilities.canAccessWeb3) {
        await addRecordingWithIPFS(recording, uri, { storeRecording });
        Alert.alert(
          "Success",
          "Recording saved locally and uploaded to IPFS!",
          [
            {
              text: "View Recordings",
              onPress: () => router.push("/tabs/index" as any),
            },
            {
              text: "Record Another",
              style: "cancel",
            },
          ]
        );
      } else {
        addRecording(recording);
        Alert.alert("Success", "Recording saved locally!", [
          {
            text: "View Recordings",
            onPress: () => router.push("/tabs/index" as any),
          },
          {
            text: "Record Another",
            style: "cancel",
          },
        ]);
      }

      setShowSaveOptions(false);
      setRecordingTitle("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert("Save Error", "Failed to save recording. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [
    uri,
    duration,
    recordingTitle,
    addRecording,
    addRecordingWithIPFS,
    storeRecording,
    capabilities.canAccessWeb3,
    router,
  ]);

  const handleCancelRecording = useCallback(async () => {
    Alert.alert(
      "Cancel Recording",
      "Are you sure you want to cancel this recording? It will be lost.",
      [
        {
          text: "Keep Recording",
          style: "cancel",
        },
        {
          text: "Cancel Recording",
          style: "destructive",
          onPress: async () => {
            await cancelRecording();
            setShowSaveOptions(false);
            setRecordingTitle("");
            setIsPaused(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          },
        },
      ]
    );
  }, [cancelRecording]);

  // Unified save handler for all selected versions with Scroll integration
  const handleUnifiedSave = useCallback(async () => {
    if (!audioBlobForDubbing) return;

    // Count selected versions
    const versionsToSave = Object.values(selectedVersions).filter(Boolean).length;
    if (versionsToSave === 0) {
      Alert.alert("No Versions Selected", "Please select at least one version to save.");
      return;
    }

    try {
      setIsStoringOnScroll(true);
      const baseTitle = recordingTitle || `Recording ${new Date().toLocaleString()}`;
      const results = [];
      
      // Connect to Scroll if not already connected
      if (!scrollBlockchainService.isConnected() && account) {
        console.log('📡 Connecting to Scroll Sepolia...');
        await scrollBlockchainService.connectWallet(account);
      }

      // Save original if selected
      if (selectedVersions.original && audioBlobForDubbing) {
        try {
          const recording = await saveRecordingToBase(
            audioBlobForDubbing,
            {
              title: baseTitle,
              description: 'Original recording',
              isPublic: true,
              tags: ['original'],
            }
          );
          results.push({ type: 'original', success: true, recording });
        } catch (error) {
          console.error('Failed to save original:', error);
          results.push({ type: 'original', success: false, error });
        }
      }

      // Save AI voice if selected
      if (selectedVersions.aiVoice && transformedBlob) {
        try {
          const recording = await saveRecordingToBase(
            transformedBlob,
            {
              title: `${baseTitle} (AI Voice)`,
              description: `AI voice transformation using ${selectedVoiceId}`,
              isPublic: true,
              tags: ['ai-voice', selectedVoiceId],
            }
          );
          results.push({ type: 'ai-voice', success: true, recording });
        } catch (error) {
          console.error('Failed to save AI voice:', error);
          results.push({ type: 'ai-voice', success: false, error });
        }
      }

      // Save dubbed if selected
      if (selectedVersions.dubbed && dubbedBlob) {
        try {
          const recording = await saveRecordingToBase(
            dubbedBlob,
            {
              title: `${baseTitle} (${dubbedLanguage})`,
              description: `Dubbed to ${dubbedLanguage}`,
              isPublic: true,
              tags: ['dubbed', dubbedLanguage],
            }
          );
          results.push({ type: 'dubbed', success: true, recording });
        } catch (error) {
          console.error('Failed to save dubbed:', error);
          results.push({ type: 'dubbed', success: false, error });
        }
      }

      // Show results
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        Alert.alert(
          "Success",
          `${successCount} version${successCount > 1 ? 's' : ''} saved successfully!`,
          [
            {
              text: "View Recordings",
              onPress: () => router.push("/tabs/index" as any),
            },
            {
              text: "Record Another",
              style: "cancel",
            },
          ]
        );

        // Add saved recordings to sharing state
        setSavedRecordings(results.filter(r => r.success).map(r => r.recording));
        setShowSharing(true);

        if (onRecordingComplete && audioBlobForDubbing) {
          onRecordingComplete(audioBlobForDubbing, duration);
        }
      }

      if (failCount > 0) {
        Alert.alert(
          "Partial Success",
          `${failCount} version${failCount > 1 ? 's' : ''} failed to save, but ${successCount} succeeded.`
        );
      }

      if (successCount === versionsToSave) {
        // All saved successfully, can close
        setShowSaveOptions(false);
        setRecordingTitle("");
      }
      } catch (error) {
      console.error('Error saving recordings:', error);
      if (error instanceof Error && error.message.includes('Wallet not connected')) {
        Alert.alert("Wallet Connection", "Please connect your wallet to save to Scroll blockchain.");
      } else {
        Alert.alert("Save Error", "Failed to save recordings. Please try again.");
      }
      } finally {
      setIsStoringOnScroll(false);
      }
      }, [
      audioBlobForDubbing,
      transformedBlob,
      dubbedBlob,
      selectedVersions,
    recordingTitle,
    duration,
    selectedVoiceId,
    dubbedLanguage,
    router,
  ]);

  // Save recording to Base blockchain
  const saveRecordingToBase = async (audioBlob: Blob, metadata: any) => {
    // Use shared BaseRecordingService
    if (!account?.address) {
      throw new Error('Wallet not connected');
    }

    // Upload to IPFS first
    const { createIPFSService } = await import('@voisss/shared');
    const ipfsService = createIPFSService();

    const ipfsResult = await ipfsService.uploadAudio(audioBlob, {
      filename: `${metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`,
      mimeType: audioBlob.type || 'audio/mpeg',
      duration: duration,
    });

    // Save to Base blockchain
    const { createBaseRecordingService } = await import('@voisss/shared');
    const baseService = createBaseRecordingService(account.address, {
      permissionRetriever: async () => {
        // TODO: Implement proper permission retrieval for mobile
        // For now, return stored permission hash
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        return await AsyncStorage.getItem('spendPermissionHash');
      }
    });

    const txHash = await baseService.saveRecording(ipfsResult.hash, metadata);

    const recording = {
      id: Date.now().toString(),
      title: metadata.title,
      description: metadata.description || "",
      duration: duration,
      fileSize: audioBlob.size,
      format: "mp3" as const,
      quality: "medium" as const,
      tags: metadata.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: metadata.isPublic || false,
      ipfsHash: ipfsResult.hash,
      transactionHash: txHash,
      onChain: true,
    };

    // Save to local store
    addRecording(recording);

    return recording;
  };

  // Download handler
  const handleDownload = useCallback(() => {
    if (!audioBlobForDubbing) return;

    // On mobile, we can't directly download files like on web
    // Instead, we'll inform the user that recordings are saved locally
    Alert.alert(
      "Download",
      "On mobile, recordings are saved locally. You can access them in your recordings list.",
      [
        { text: "OK" },
        {
          text: "View Recordings",
          onPress: () => router.push("/tabs/index" as any),
        },
      ]
    );
  }, [audioBlobForDubbing, router]);

  const renderRecordingButton = () => {
    const buttonColor = isRecording
      ? isPaused
        ? colors.dark.warning
        : colors.dark.error
      : colors.dark.primary;

    const icon = isRecording ? (isPaused ? Play : Square) : Mic;

    const IconComponent = icon;

    return (
      <Animated.View
        style={[
          styles.recordButtonContainer,
          {
            transform: [
              { scale: scaleAnim },
              { scale: isRecording && !isPaused ? pulseAnim : 1 },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: buttonColor }]}
          onPress={
            isRecording
              ? isPaused
                ? handlePauseResume
                : handleStopRecording
              : handleStartRecording
          }
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <IconComponent size={48} color={colors.dark.text} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderControls = () => {
    if (!isRecording && !showSaveOptions) return null;

    return (
      <View style={styles.controls}>
        {isRecording && (
          <TouchableOpacity
            style={[buttonStyles.iconButton, styles.controlButton]}
            onPress={handlePauseResume}
          >
            {isPaused ? (
              <Play size={24} color={colors.dark.text} />
            ) : (
              <Pause size={24} color={colors.dark.text} />
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[buttonStyles.iconButton, styles.controlButton]}
          onPress={handleCancelRecording}
        >
          <X size={24} color={colors.dark.text} />
        </TouchableOpacity>

        {showSaveOptions && (
          <TouchableOpacity
            style={[buttonStyles.iconButton, styles.controlButton]}
            onPress={handleSaveRecording}
          >
            <Save size={24} color={colors.dark.text} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Record</Text>
          <TouchableOpacity style={buttonStyles.iconButton}>
            <Settings size={24} color={colors.dark.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.durationContainer}>
            <Text style={styles.duration}>{formatDuration(duration)}</Text>
            <Text style={styles.status}>
              {isUploadingToIPFS
                ? `Uploading to IPFS... ${ipfsUploadProgress}%`
                : isRecording
                ? isPaused
                  ? "Paused"
                  : "Recording..."
                : showSaveOptions
                ? "Ready to save"
                : "Tap to start recording"}
            </Text>

            {/* IPFS Upload Progress Bar */}
            {isUploadingToIPFS && (
              <View style={styles.ipfsProgressContainer}>
                <View style={styles.ipfsProgressBar}>
                  <View
                    style={[
                      styles.ipfsProgressFill,
                      { width: `${ipfsUploadProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.ipfsProgressText}>
                  Uploading to decentralized storage...
                </Text>
              </View>
            )}
          </View>

          <View style={styles.waveformContainer}>
            <WaveformVisualization
              isRecording={isRecording}
              meteringData={meteringData}
              width={width - 32}
              height={100}
            />
          </View>

          {renderRecordingButton()}
          {renderControls()}
        </View>

        {/* AI Transformation Panel - Use enhanced selector with VRF */}
         {showSaveOptions && capabilities.canAccessAI && (
         <AITransformationPanel
         voices={voices}
         selectedVoiceId={selectedVoiceId}
         setSelectedVoiceId={setSelectedVoiceId}
         isLoadingVoices={isLoadingVoices}
         isTransforming={isTransforming}
         transformedBlob={transformedBlob}
         audioBlobForDubbing={audioBlobForDubbing} // Pass original audio for preview
         onTransform={transformVoice}
         onVRFSelect={handleVRFVoiceSelection}
         isVRFLoading={isVRFLoading}
         capabilities={capabilities}
         currentTier={currentTier}
         useEnhancedSelector={true} // Enable enhanced AI voice selector
         />
         )}

        {/* Dubbing Panel */}
        {showSaveOptions && audioBlobForDubbing && (
          <DubbingPanel
            audioBlob={audioBlobForDubbing}
            onDubbingComplete={(dubbedBlob, language) => {
              setDubbedBlob(dubbedBlob);
              setDubbedLanguage(language);
              setSelectedVersions(prev => ({ ...prev, dubbed: true }));
            }}
            onDubbingError={(error) => {
              Alert.alert("Dubbing Error", error);
            }}
          />
        )}

        {/* Version Selection Panel */}
         {showSaveOptions && (
           <View style={styles.versionSelectionPanel}>
             <Text style={styles.versionSelectionTitle}>Select Versions to Save</Text>
             <Text style={styles.versionSelectionSubtitle}>
               Choose which versions you want to save to blockchain
             </Text>

             {/* Privacy Toggle - Scroll Integration */}
             <TouchableOpacity
               style={[styles.privacyToggle, isRecordingPublic && styles.privacyTogglePublic]}
               onPress={() => setIsRecordingPublic(!isRecordingPublic)}
             >
               <View style={styles.privacyToggleContent}>
                 <Text style={styles.privacyToggleLabel}>
                   {isRecordingPublic ? '🌐 Public Recording' : '🔒 Private Recording'}
                 </Text>
                 <Text style={styles.privacyToggleSubtitle}>
                   {isRecordingPublic
                     ? 'Anyone can view this recording'
                     : 'Only you can access via Scroll Privacy'}
                 </Text>
               </View>
               <View style={[styles.toggleSwitch, isRecordingPublic && styles.toggleSwitchActive]} />
             </TouchableOpacity>

             <View style={styles.versionOptions}>
              {/* Original Version */}
              <TouchableOpacity
                style={[styles.versionOption, selectedVersions.original && styles.versionOptionSelected]}
                onPress={() => setSelectedVersions(prev => ({ ...prev, original: !prev.original }))}
              >
                <View style={styles.versionOptionLeft}>
                  <View style={[styles.versionDot, { backgroundColor: '#3B82F6' }]} />
                  <View>
                    <Text style={styles.versionOptionTitle}>Original Recording</Text>
                    <Text style={styles.versionOptionSubtitle}>Your original voice recording</Text>
                  </View>
                </View>
                <Text style={styles.versionSize}>
                  {audioBlobForDubbing ? `${(audioBlobForDubbing.size / 1024).toFixed(0)} KB` : ''}
                </Text>
              </TouchableOpacity>

              {/* AI Voice Version */}
              <TouchableOpacity
                style={[
                  styles.versionOption,
                  selectedVersions.aiVoice && styles.versionOptionSelected,
                  !transformedBlob && styles.versionOptionDisabled
                ]}
                onPress={() => transformedBlob && setSelectedVersions(prev => ({ ...prev, aiVoice: !prev.aiVoice }))}
                disabled={!transformedBlob}
              >
                <View style={styles.versionOptionLeft}>
                  <View style={[styles.versionDot, { backgroundColor: '#8B5CF6' }]} />
                  <View>
                    <Text style={styles.versionOptionTitle}>AI Voice Transform</Text>
                    <Text style={styles.versionOptionSubtitle}>
                      {transformedBlob ? `AI voice using ${selectedVoiceId}` : 'Generate AI voice first'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.versionSize}>
                  {transformedBlob ? `${(transformedBlob.size / 1024).toFixed(0)} KB` : ''}
                </Text>
              </TouchableOpacity>

              {/* Dubbed Version */}
              <TouchableOpacity
                style={[
                  styles.versionOption,
                  selectedVersions.dubbed && styles.versionOptionSelected,
                  !dubbedBlob && styles.versionOptionDisabled
                ]}
                onPress={() => dubbedBlob && setSelectedVersions(prev => ({ ...prev, dubbed: !prev.dubbed }))}
                disabled={!dubbedBlob}
              >
                <View style={styles.versionOptionLeft}>
                  <View style={[styles.versionDot, { backgroundColor: '#10B981' }]} />
                  <View>
                    <Text style={styles.versionOptionTitle}>Dubbed Version</Text>
                    <Text style={styles.versionOptionSubtitle}>
                      {dubbedBlob ? `Dubbed in ${dubbedLanguage}` : 'Generate dubbed version first'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.versionSize}>
                  {dubbedBlob ? `${(dubbedBlob.size / 1024).toFixed(0)} KB` : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selection Summary */}
            <View style={styles.selectionSummary}>
              <Text style={styles.selectionSummaryText}>
                Selected: {Object.values(selectedVersions).filter(Boolean).length} of {[
                  audioBlobForDubbing,
                  transformedBlob,
                  dubbedBlob
                ].filter(Boolean).length} available
              </Text>
              {currentTier === 'free' && (
                <Text style={styles.selectionWarning}>
                  Free tier: Limited saves per week
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Save Actions */}
         {showSaveOptions && (
           <View style={styles.saveActions}>
             <TouchableOpacity
               style={[buttonStyles.primaryButton, styles.saveButton, isStoringOnScroll && { opacity: 0.6 }]}
               onPress={handleUnifiedSave}
               disabled={!Object.values(selectedVersions).some(Boolean) || isStoringOnScroll}
             >
               <Text style={styles.saveButtonText}>
                 {isStoringOnScroll
                   ? 'Saving to Scroll...'
                   : Object.values(selectedVersions).filter(Boolean).length === 0
                   ? 'Select versions to save'
                   : `Save Selected (${Object.values(selectedVersions).filter(Boolean).length})`}
               </Text>
             </TouchableOpacity>

            <TouchableOpacity
              style={[buttonStyles.secondaryButton, styles.downloadButton]}
              onPress={handleDownload}
            >
              <Text style={styles.downloadButtonText}>Download (Free)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Social Sharing */}
        {showSharing && savedRecordings.length > 0 && (
          <SocialShare
            recording={savedRecordings[0]} // Show sharing for the first saved recording
            onShare={(platform, url) => {
              console.log(`Shared to ${platform}:`, url);
              // TODO: Track sharing analytics
            }}
          />
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: theme.typography.fontSizes.xxxl,
    fontWeight: "700",
    color: colors.dark.text,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  durationContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  duration: {
    fontSize: 48,
    fontWeight: "300",
    color: colors.dark.text,
    fontVariant: ["tabular-nums"],
  },
  status: {
    fontSize: theme.typography.fontSizes.lg,
    color: colors.dark.textSecondary,
    marginTop: 8,
  },
  waveformContainer: {
    width: width - 32,
    height: 100,
    marginBottom: 32,
  },
  waveformPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
  },
  waveformText: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.dark.textSecondary,
  },
  recordButtonContainer: {
    marginBottom: 24,
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: colors.dark.error,
    margin: 16,
    borderRadius: theme.borderRadius.md,
  },
  errorText: {
    color: colors.dark.text,
    textAlign: "center",
  },
  // IPFS Upload styles
  ipfsProgressContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  ipfsProgressBar: {
    width: width * 0.6,
    height: 4,
    backgroundColor: colors.dark.card,
    borderRadius: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  ipfsProgressFill: {
    height: "100%",
    backgroundColor: colors.dark.primary,
    borderRadius: 2,
  },
  ipfsProgressText: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
    textAlign: "center",
  },
  // Version Selection Panel
  versionSelectionPanel: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  versionSelectionTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: theme.spacing.xs,
  },
  versionSelectionSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  // Privacy Toggle
  privacyToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    backgroundColor: colors.dark.cardAlt,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: "#8B5CF6",
  },
  privacyTogglePublic: {
    borderColor: "#3B82F6",
  },
  privacyToggleContent: {
    flex: 1,
  },
  privacyToggleLabel: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: theme.spacing.xs,
  },
  privacyToggleSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#8B5CF6",
    marginLeft: theme.spacing.md,
  },
  toggleSwitchActive: {
    backgroundColor: "#3B82F6",
  },
  versionOptions: {
    marginBottom: theme.spacing.lg,
  },
  versionOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
    backgroundColor: colors.dark.cardAlt,
  },
  versionOptionSelected: {
    borderColor: colors.dark.primary,
    backgroundColor: colors.dark.primary + "10",
  },
  versionOptionDisabled: {
    opacity: 0.5,
  },
  versionOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  versionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  versionOptionTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: "500",
    color: colors.dark.text,
    marginBottom: 2,
  },
  versionOptionSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
  },
  versionSize: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
    fontWeight: "500",
  },
  selectionSummary: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  selectionSummaryText: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  selectionWarning: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.warning,
    fontWeight: "500",
  },
  // Save Actions
  saveActions: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  saveButton: {
    flex: 1,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: "600",
    color: colors.dark.text,
  },
  downloadButton: {
    flex: 1,
  },
  downloadButtonText: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: "600",
    color: colors.dark.text,
  },
});
