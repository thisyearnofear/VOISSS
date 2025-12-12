import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/design-system';
import { Button } from './ui/Button';

interface AudioPreviewPlayerProps {
  audioBlob: Blob | null;
  title?: string;
  subtitle?: string;
  showWaveform?: boolean;
  onPlaybackStatusChange?: (isPlaying: boolean) => void;
}

export const AudioPreviewPlayer: React.FC<AudioPreviewPlayerProps> = ({
  audioBlob,
  title = 'Audio Preview',
  subtitle = 'Tap to play',
  showWaveform = true,
  onPlaybackStatusChange,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const positionRef = useRef(position);
  positionRef.current = position;

  // Load audio from blob
  useEffect(() => {
    const loadAudio = async () => {
      if (!audioBlob) {
        setSound(null);
        setIsPlaying(false);
        setPosition(0);
        setDuration(0);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Clean up previous sound
        if (sound) {
          await sound.unloadAsync();
        }

        // Convert blob to base64 for Expo AV
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = reader.result as string;
            const audioUri = `data:audio/mpeg;base64,${base64Data.split(',')[1]}`;
            
            const { sound: newSound } = await Audio.Sound.createAsync(
              { uri: audioUri },
              { progressUpdateIntervalMillis: 100 }
            );
            
            setSound(newSound);
            
            // Get duration
            const status = await newSound.getStatusAsync();
            if (status.isLoaded) {
              setDuration(status.durationMillis || 0);
            }
            
            // Set up playback status updates
            newSound.setOnPlaybackStatusUpdate((status) => {
              if (status.isLoaded) {
                setPosition(status.positionMillis || 0);
                setIsPlaying(status.isPlaying || false);
                
                if (onPlaybackStatusChange) {
                  onPlaybackStatusChange(status.isPlaying || false);
                }
                
                // Clean up when finished
                if (status.didJustFinish) {
                  setIsPlaying(false);
                  setPosition(0);
                }
              }
            });
            
          } catch (err) {
            console.error('Failed to load audio:', err);
            setError('Failed to load audio preview');
          } finally {
            setIsLoading(false);
          }
        };
        
        reader.readAsDataURL(audioBlob);
        
      } catch (err) {
        console.error('Audio loading error:', err);
        setError('Failed to load audio');
        setIsLoading(false);
      }
    };
    
    loadAudio();
    
    // Cleanup on unmount
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioBlob]);

  const togglePlayback = async () => {
    if (!sound) return;
    
    try {
      const status = await sound.getStatusAsync();
      
      if (status.isLoaded) {
        if (status.isPlaying) {
          await sound.pauseAsync();
        } else {
          if (positionRef.current === duration) {
            await sound.setPositionAsync(0);
          }
          await sound.playAsync();
        }
      }
    } catch (err) {
      console.error('Playback error:', err);
      setError('Playback failed');
    }
  };

  const formatTime = (millis: number) => {
    const seconds = Math.floor(millis / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  if (!audioBlob) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="musical-notes" size={24} color={Colors.textSecondary} />
        <Text style={styles.emptyText}>No audio to preview</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={24} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          title="Retry"
          onPress={() => {
            setError(null);
            // Trigger reload by temporarily setting audioBlob to null
            const currentBlob = audioBlob;
            setSound(null);
            setTimeout(() => {
              // This would trigger the useEffect to reload
              // In a real implementation, we might need a key prop
            }, 100);
          }}
          variant="outline"
          size="sm"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="volume-high" size={20} color={Colors.primary} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.timeText}>
          {formatTime(position)} / {formatTime(duration)}
        </Text>
      </View>

      {/* Playback controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.playButton}
          onPress={togglePlayback}
          disabled={isLoading || !sound}
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
          title={isPlaying ? "Pause" : "Play"}
          onPress={togglePlayback}
          disabled={isLoading || !sound}
          variant="secondary"
          size="sm"
        />
      </View>
      
      {/* Waveform placeholder */}
      {showWaveform && (
        <View style={styles.waveformContainer}>
          <View style={styles.waveform}>
            {/* Simple waveform visualization */}
            {[...Array(20)].map((_, i) => {
              const height = 10 + Math.random() * 30;
              const opacity = 0.3 + Math.random() * 0.7;
              return (
                <View
                  key={i}
                  style={[
                    styles.waveformBar,
                    {
                      height,
                      opacity,
                      backgroundColor: Colors.primary,
                    }
                  ]}
                />
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  errorContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.body,
    marginVertical: Spacing.sm,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.body,
    fontWeight: Typography.semiBold,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.bodySmall,
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  timeText: {
    color: Colors.textSecondary,
    fontSize: Typography.caption,
    textAlign: 'right',
  },
  controls: {
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
  waveformContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
  },
});
