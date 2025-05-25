import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Conditional imports for expo-audio (not available in Expo Go)
let useAudioRecorder: any = null;
let RecordingPresets: any = null;
let Audio: any = null;

try {
  const expoAudio = require('expo-audio');
  useAudioRecorder = expoAudio.useAudioRecorder;
  RecordingPresets = expoAudio.RecordingPresets;
  Audio = expoAudio.Audio;
} catch (error) {
  console.log('expo-audio not available (likely running in Expo Go)');
}

export interface RecordingState {
  isRecording: boolean;
  isLoading: boolean;
  duration: number;
  uri: string | null;
  error: string | null;
}

export interface RecordingActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

// Web Audio API types
interface WebAudioRecorder {
  mediaRecorder: MediaRecorder | null;
  stream: MediaStream | null;
  chunks: Blob[];
  startTime: number;
}

export function useAudioRecording(): RecordingState & RecordingActions {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isLoading: false,
    duration: 0,
    uri: null,
    error: null,
  });

  // Web Audio API recorder for web platform
  const [webRecorder, setWebRecorder] = useState<WebAudioRecorder>({
    mediaRecorder: null,
    stream: null,
    chunks: [],
    startTime: 0,
  });

  // Use the expo-audio hook for native platforms (if available)
  const audioRecorder = Platform.OS !== 'web' && useAudioRecorder && RecordingPresets ?
    useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
      // Update duration from recording status
      setState(prev => ({
        ...prev,
        duration: status.durationMillis || 0,
        isRecording: status.isRecording,
      }));
    }) : null;

  // Duration timer for web recording
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (Platform.OS === 'web' && state.isRecording && webRecorder.startTime > 0) {
      interval = setInterval(() => {
        const elapsed = Date.now() - webRecorder.startTime;
        setState(prev => ({
          ...prev,
          duration: elapsed,
        }));
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRecording, webRecorder.startTime]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        // Web Audio API permissions
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
        return true;
      } else {
        // Native permissions (if expo-audio is available)
        if (!Audio) {
          setState(prev => ({
            ...prev,
            error: 'Audio recording not available in Expo Go. Please use a development build or web version.',
          }));
          return false;
        }
        const { status } = await Audio.requestRecordingPermissionsAsync();
        return status === 'granted';
      }
    } catch (error) {
      console.error('Failed to request audio permissions:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to request microphone permissions',
      }));
      return false;
    }
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      if (Platform.OS === 'web') {
        // Web Audio API recording
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          }
        });

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.start(100); // Collect data every 100ms

        setWebRecorder({
          mediaRecorder,
          stream,
          chunks,
          startTime: Date.now(),
        });

        setState(prev => ({
          ...prev,
          isLoading: false,
          isRecording: true,
          duration: 0,
          uri: null,
        }));
      } else {
        // Native recording
        if (!audioRecorder) throw new Error('Audio recorder not available');
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();

        setState(prev => ({
          ...prev,
          isLoading: false,
          duration: 0,
          uri: null,
        }));
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start recording',
      }));
    }
  }, [requestPermissions, audioRecorder]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      if (Platform.OS === 'web') {
        // Web Audio API stop recording
        return new Promise((resolve) => {
          const { mediaRecorder, stream, chunks } = webRecorder;

          if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            setState(prev => ({ ...prev, isLoading: false }));
            resolve(null);
            return;
          }

          mediaRecorder.onstop = () => {
            // Stop all tracks
            stream?.getTracks().forEach(track => track.stop());

            // Create blob from chunks
            const blob = new Blob([...chunks, ...webRecorder.chunks], { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);

            setState(prev => ({
              ...prev,
              isLoading: false,
              isRecording: false,
              uri: url,
            }));

            // Reset web recorder
            setWebRecorder({
              mediaRecorder: null,
              stream: null,
              chunks: [],
              startTime: 0,
            });

            resolve(url);
          };

          mediaRecorder.stop();
        });
      } else {
        // Native recording
        if (!audioRecorder) throw new Error('Audio recorder not available');
        await audioRecorder.stop();
        const uri = audioRecorder.uri;

        setState(prev => ({
          ...prev,
          isLoading: false,
          uri,
        }));

        return uri;
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to stop recording',
      }));
      return null;
    }
  }, [audioRecorder, webRecorder]);

  const pauseRecording = useCallback((): void => {
    try {
      if (Platform.OS === 'web') {
        const { mediaRecorder } = webRecorder;
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.pause();
        }
      } else {
        if (audioRecorder) {
          audioRecorder.pause();
        }
      }
    } catch (error) {
      console.error('Failed to pause recording:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to pause recording',
      }));
    }
  }, [audioRecorder, webRecorder]);

  const resumeRecording = useCallback((): void => {
    try {
      if (Platform.OS === 'web') {
        const { mediaRecorder } = webRecorder;
        if (mediaRecorder && mediaRecorder.state === 'paused') {
          mediaRecorder.resume();
        }
      } else {
        if (audioRecorder) {
          audioRecorder.record();
        }
      }
    } catch (error) {
      console.error('Failed to resume recording:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to resume recording',
      }));
    }
  }, [audioRecorder, webRecorder]);

  const cancelRecording = useCallback(async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        const { mediaRecorder, stream } = webRecorder;

        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }

        // Stop all tracks
        stream?.getTracks().forEach(track => track.stop());

        // Reset web recorder
        setWebRecorder({
          mediaRecorder: null,
          stream: null,
          chunks: [],
          startTime: 0,
        });
      } else {
        if (audioRecorder) {
          await audioRecorder.stop();

          // Delete the file if it exists
          const uri = audioRecorder.uri;
          if (uri) {
            await FileSystem.deleteAsync(uri, { idempotent: true });
          }
        }
      }

      setState(prev => ({
        ...prev,
        isRecording: false,
        isLoading: false,
        duration: 0,
        uri: null,
      }));
    } catch (error) {
      console.error('Failed to cancel recording:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to cancel recording',
      }));
    }
  }, [audioRecorder, webRecorder]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    requestPermissions,
  };
}
