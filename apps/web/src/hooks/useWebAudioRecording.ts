'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// Maximum recording duration: 60 seconds (helps keep exports fast and predictable)
export const MAX_RECORDING_DURATION_MS = 60 * 1000;

export interface WebRecordingState {
  isRecording: boolean;
  isLoading: boolean;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
  waveformData: number[];
}

export interface WebRecordingActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
  requestPermissions: () => Promise<boolean>;
}

export function useWebAudioRecording(): WebRecordingState & WebRecordingActions & { maxDurationReached: boolean } {
  const [state, setState] = useState<WebRecordingState>({
    isRecording: false,
    isLoading: false,
    duration: 0,
    audioBlob: null,
    error: null,
    waveformData: [],
  });
  const [maxDurationReached, setMaxDurationReached] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const waveformIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const shouldAutoStopRef = useRef(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        }
      });

      // Test successful, stop the stream
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Failed to request audio permissions:', error);
      setState(prev => ({
        ...prev,
        error: 'Microphone permission denied or not available',
      }));
      return false;
    }
  }, []);

  const startDurationTimer = useCallback(() => {
    setMaxDurationReached(false);
    shouldAutoStopRef.current = false;
    durationIntervalRef.current = setInterval(() => {
      setState(prev => {
        const newDuration = prev.duration + 1000;
        // Check if we've hit the max duration
        if (newDuration >= MAX_RECORDING_DURATION_MS) {
          shouldAutoStopRef.current = true;
          setMaxDurationReached(true);
        }
        return {
          ...prev,
          duration: newDuration,
        };
      });
    }, 1000);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const startWaveformAnalysis = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    waveformIntervalRef.current = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate average amplitude for waveform visualization
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const normalizedValue = average / 255; // Normalize to 0-1

      setState(prev => ({
        ...prev,
        waveformData: [...prev.waveformData.slice(-50), normalizedValue], // Keep last 50 values
      }));
    }, 100); // Update every 100ms
  }, []);

  const stopWaveformAnalysis = useCallback(() => {
    if (waveformIntervalRef.current) {
      clearInterval(waveformIntervalRef.current);
      waveformIntervalRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permissions and get media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        }
      });

      streamRef.current = stream;

      // Set up audio context for waveform analysis
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Set up MediaRecorder with fallback MIME types
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/wav';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = ''; // Let browser choose
            }
          }
        }
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setState(prev => ({
          ...prev,
          audioBlob: blob,
          isRecording: false,
        }));
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      setState(prev => ({
        ...prev,
        isRecording: true,
        isLoading: false,
        duration: 0,
        waveformData: [],
      }));

      startDurationTimer();
      startWaveformAnalysis();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start recording',
      }));
    }
  }, [startDurationTimer, startWaveformAnalysis]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || !streamRef.current) {
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    stopDurationTimer();
    stopWaveformAnalysis();

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      const stream = streamRef.current!;

      // Set up the onstop handler to resolve with the blob
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm'
        });

        setState(prev => ({
          ...prev,
          audioBlob: blob,
          isRecording: false,
          isLoading: false,
        }));

        resolve(blob);
      };

      try {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());

        if (audioContextRef.current) {
          audioContextRef.current.close().catch(console.error);
        }
      } catch (error) {
        console.error('Failed to stop recording:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to stop recording',
        }));
        resolve(null);
      }
    });
  }, [stopDurationTimer, stopWaveformAnalysis]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopDurationTimer();
      stopWaveformAnalysis();
      setState(prev => ({ ...prev, isRecording: false }));
    }
  }, [stopDurationTimer, stopWaveformAnalysis]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      startDurationTimer();
      startWaveformAnalysis();
      setState(prev => ({ ...prev, isRecording: true }));
    }
  }, [startDurationTimer, startWaveformAnalysis]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    stopDurationTimer();
    stopWaveformAnalysis();

    setState(prev => ({
      ...prev,
      isRecording: false,
      isLoading: false,
      duration: 0,
      audioBlob: null,
      waveformData: [],
    }));

    chunksRef.current = [];
  }, [stopDurationTimer, stopWaveformAnalysis]);

  // Auto-stop recording when max duration is reached
  useEffect(() => {
    if (maxDurationReached && state.isRecording) {
      console.log(`⏱️ Max recording duration (${MAX_RECORDING_DURATION_MS / 1000}s) reached, auto-stopping...`);
      stopRecording();
    }
  }, [maxDurationReached, state.isRecording, stopRecording]);

  return {
    ...state,
    maxDurationReached,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    requestPermissions,
  };
}
