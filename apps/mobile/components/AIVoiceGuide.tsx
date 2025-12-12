import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/design-system';
import { Button } from './ui/Button';
import { mobileAIService } from '../services/ai-service';

interface AIVoiceGuideProps {
  step: number;
  onGuideComplete: () => void;
  onSkip: () => void;
}

export const AIVoiceGuide: React.FC<AIVoiceGuideProps> = ({
  step,
  onGuideComplete,
  onSkip,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guideScript, setGuideScript] = useState<{ text: string; voiceStyleId: string } | null>(null);

  // Guide scripts for different steps
  const guideScripts: Record<number, { text: string; voiceStyleId: string }> = {
    1: {
      text: "Welcome to VOISSS! I'm your AI guide. Let me show you how to create amazing voice recordings with AI enhancement. First, let's set up your account.",
      voiceStyleId: 'podcast-host',
    },
    2: {
      text: "Great! Now let's connect your wallet. This will allow you to save your recordings on the blockchain and receive tips. Don't worry, it's safe and secure.",
      voiceStyleId: 'news-anchor',
    },
    3: {
      text: "Perfect! Your wallet is connected. Next, choose your preferred blockchain. We support both Starknet and Scroll. Starknet is great for fast transactions, while Scroll offers EVM compatibility.",
      voiceStyleId: 'storyteller',
    },
    4: {
      text: "Excellent choice! Now, if you want to tip creators or receive tips, you'll need some crypto. You can add funds now or later. It's completely up to you!",
      voiceStyleId: 'epic',
    },
    5: {
      text: "You're almost there! Let me give you a quick tour. Here's how VOISSS works: Record your voice, enhance it with AI, and share it with the world. You can also tip other creators and earn tips yourself!",
      voiceStyleId: 'podcast-host',
    },
    6: {
      text: "Congratulations! You're all set up. Your account is ready to use. Start creating amazing voice recordings and enjoy the VOISSS experience. If you need help, just ask!",
      voiceStyleId: 'news-anchor',
    },
  };

  // Load guide script for current step
  useEffect(() => {
    if (guideScripts[step]) {
      setGuideScript(guideScripts[step]);
    }
  }, [step]);

  // Generate and play guide audio
  const playGuideAudio = async () => {
    if (!guideScript || isPlaying) return;

    try {
      setIsLoading(true);
      setError(null);

      // Generate speech using ElevenLabs
      const audioBlob = await mobileAIService.generateTextToSpeech(
        guideScript.text,
        guideScript.voiceStyleId
      );

      // Convert blob to base64 for Expo AV
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const audioUri = `data:audio/mpeg;base64,${base64Data.split(',')[1]}`;
          
          // Clean up previous sound
          if (sound) {
            await sound.unloadAsync();
          }
          
          // Load and play new sound
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { progressUpdateIntervalMillis: 100 }
          );
          
          setSound(newSound);
          setIsPlaying(true);
          
          // Set up playback status updates
          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying || false);
              
              // Clean up when finished
              if (status.didJustFinish) {
                setIsPlaying(false);
              }
            }
          });
          
          await newSound.playAsync();
          
        } catch (err) {
          console.error('Failed to play guide audio:', err);
          setError('Failed to play guide audio');
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.readAsDataURL(audioBlob);
      
    } catch (err) {
      console.error('Guide audio generation failed:', err);
      setError('Failed to generate guide audio');
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  if (!guideScript) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="robot" size={24} color={Colors.primary} />
        <Text style={styles.headerTitle}>AI Voice Guide</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.guideText}>
          {guideScript.text}
        </Text>

        {/* Audio controls */}
        <View style={styles.audioControls}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={playGuideAudio}
            disabled={isLoading || isPlaying}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : isPlaying ? (
              <Ionicons name="pause" size={24} color={Colors.textPrimary} />
            ) : (
              <Ionicons name="play" size={24} color={Colors.textPrimary} />
            )}
          </TouchableOpacity>
          
          <Button
            title={isPlaying ? "Playing..." : "Listen to Guide"}
            onPress={playGuideAudio}
            disabled={isLoading || isPlaying}
            variant="secondary"
            size="sm"
            icon="volume-high"
          />
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={20} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Retry"
              onPress={playGuideAudio}
              variant="outline"
              size="sm"
            />
          </View>
        )}

        {/* Voice style info */}
        <View style={styles.voiceInfo}>
          <Text style={styles.voiceInfoTitle}>Voice Style</Text>
          <View style={styles.voiceStyleContainer}>
            <Ionicons 
              name={mobileAIService.getVoiceStyleById(guideScript.voiceStyleId)?.icon || 'mic'}
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.voiceStyleName}>
              {mobileAIService.getVoiceStyleById(guideScript.voiceStyleId)?.name || 'AI Voice'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Skip Guide"
          onPress={onSkip}
          variant="outline"
          size="sm"
          icon="skip-forward"
        />
        
        <Button
          title={step === 6 ? "Complete Onboarding" : "Next Step"}
          onPress={onGuideComplete}
          variant="primary"
          size="sm"
          icon={step === 6 ? "checkmark" : "arrow-forward"}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
  },
  content: {
    marginBottom: Spacing.lg,
  },
  guideText: {
    color: Colors.textPrimary,
    fontSize: Typography.body,
    lineHeight: Typography.lineHeight.body,
    marginBottom: Spacing.lg,
    textAlign: 'left',
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.bodySmall,
    flex: 1,
  },
  voiceInfo: {
    padding: Spacing.md,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  voiceInfoTitle: {
    color: Colors.textSecondary,
    fontSize: Typography.bodySmall,
    marginBottom: Spacing.xs,
  },
  voiceStyleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  voiceStyleName: {
    color: Colors.textPrimary,
    fontSize: Typography.body,
    fontWeight: Typography.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
});
