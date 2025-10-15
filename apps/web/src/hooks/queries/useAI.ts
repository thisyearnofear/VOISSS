import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createElevenLabsProvider } from '@voisss/shared';
import {
  SUPPORTED_DUBBING_LANGUAGES,
  getSortedLanguages,
  type LanguageInfo,
} from '@voisss/shared/src/constants/languages';
import { queryKeys, handleQueryError } from '../../lib/query-client';

// AI Voice interface
interface AIVoice {
  voiceId: string;
  name: string;
  category?: string;
  description?: string;
  previewUrl?: string;
}

// AI Model interface
interface AIModel {
  model_id: string;
  name: string;
  can_do_voice_conversion?: boolean;
  can_do_streaming?: boolean;
  description?: string;
}

// Language interface for dubbing
// Use shared LanguageInfo for consistency across app and server
type DubbingLanguage = LanguageInfo;

// Voice transformation options
interface VoiceTransformOptions {
  voiceId: string;
  audioBlob: Blob;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

// Dubbing options
interface DubbingOptions {
  audioBlob: Blob;
  targetLanguage: string;
  sourceLanguage?: string;
  preserveBackgroundAudio?: boolean;
}

// Result type for dubbing with optional transcripts
export interface DubbingResult {
  blob: Blob;
  transcript?: string;
  translatedTranscript?: string;
}

// Convert AudioBuffer to 16-bit PCM WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.length;

  // Interleave channels
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  const interleaved = new Float32Array(samples * numChannels);
  for (let i = 0, idx = 0; i < samples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      interleaved[idx++] = channels[ch][i];
    }
  }

  // WAV header + PCM 16-bit data
  const blockAlign = numChannels * 2; // 16-bit
  const byteRate = sampleRate * blockAlign;
  const dataSize = interleaved.length * 2; // 16-bit
  const bufferSize = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // RIFF header
  let offset = 0;
  const writeString = (s: string) => {
    for (let i = 0; i < s.length; i++) {
      view.setUint8(offset++, s.charCodeAt(i));
    }
  };

  writeString('RIFF');
  view.setUint32(offset, 36 + dataSize, true); offset += 4; // file size minus 8
  writeString('WAVE');
  writeString('fmt ');
  view.setUint32(offset, 16, true); offset += 4; // PCM header size
  view.setUint16(offset, 1, true); offset += 2; // audio format = PCM
  view.setUint16(offset, numChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, byteRate, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, 16, true); offset += 2; // bits per sample
  writeString('data');
  view.setUint32(offset, dataSize, true); offset += 4;

  // Write PCM samples
  const clampSample = (s: number) => Math.max(-1, Math.min(1, s));
  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    const s = clampSample(interleaved[i]);
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Normalize webm/ogg input to WAV for upstream API compatibility
async function normalizeAudioForDubbing(input: Blob): Promise<{ blob: Blob; filename: string }> {
  try {
    const type = (input.type || '').toLowerCase();
    const baseType = type.split(';')[0];

    console.log('normalizeAudioForDubbing: Input type:', type, 'baseType:', baseType);

    // If already a commonly supported type, pass through
    if (baseType && (baseType.includes('mpeg') || baseType.includes('mp3') || baseType.includes('wav') || baseType.includes('mp4') || baseType.includes('aac') || baseType.includes('m4a'))) {
      const filename = baseType.includes('wav') ? 'input.wav' : baseType.includes('mp3') || baseType.includes('mpeg') ? 'input.mp3' : 'input.m4a';
      console.log('normalizeAudioForDubbing: Already supported format, passing through');
      return { blob: input, filename };
    }

    // Convert webm/ogg/unknown to WAV using Web Audio on client
    if (typeof window !== 'undefined' && (baseType?.includes('webm') || baseType?.includes('ogg') || baseType === '' || baseType?.includes('opus'))) {
      console.log('normalizeAudioForDubbing: Converting WebM/Ogg/Opus to WAV');
      const arrayBuffer = await input.arrayBuffer();
      console.log('normalizeAudioForDubbing: ArrayBuffer size:', arrayBuffer.byteLength);
      
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        console.error('normalizeAudioForDubbing: Web Audio API not supported in this browser');
        return { blob: input, filename: 'input' };
      }
      
      const audioCtx = new AudioCtx();
      console.log('normalizeAudioForDubbing: Created AudioContext');
      
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      console.log('normalizeAudioForDubbing: Successfully decoded audio data. Duration:', decoded.duration, 'Channels:', decoded.numberOfChannels, 'Sample rate:', decoded.sampleRate);
      
      const wavBlob = audioBufferToWav(decoded);
      console.log('normalizeAudioForDubbing: Successfully converted to WAV. Size:', wavBlob.size, 'Type:', wavBlob.type);
      
      await audioCtx.close();
      console.log('normalizeAudioForDubbing: AudioContext closed');
      return { blob: wavBlob, filename: 'input.wav' };
    }

    console.log('normalizeAudioForDubbing: No conversion needed, returning original');
    // Fallback: pass through
    return { blob: input, filename: 'input' };
  } catch (err) {
    console.error('normalizeAudioForDubbing: Conversion failed', err);
    // If conversion fails, return original blob so server can produce a meaningful error
    return { blob: input, filename: 'input' };
  }
}

// Browser-native base64 -> Blob via data URL fetch (robust across environments)
async function base64ToBlobAsync(base64: string, mimeType = 'application/octet-stream'): Promise<Blob> {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('Invalid base64 string for audio');
  }
  const normalized = base64.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const res = await fetch(`data:${mimeType};base64,${normalized}`);
  if (!res.ok) {
    throw new Error(`Failed to convert base64 to Blob: ${res.status}`);
  }
  return await res.blob();
}

// Hook to fetch available AI voices
export function useAIVoices() {
  return useQuery({
    queryKey: queryKeys.ai.voices(),
    queryFn: async (): Promise<AIVoice[]> => {
      try {
        const response = await fetch('/api/elevenlabs/list-voices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch voices: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        return data.voices || [];
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - voices don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 2, // Retry twice for voice fetching
  });
}

// Hook to fetch available AI models
export function useAIModels() {
  return useQuery({
    queryKey: queryKeys.ai.models(),
    queryFn: async (): Promise<AIModel[]> => {
      try {
        const response = await fetch('/api/elevenlabs/test-models');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        return data.recommendedForSpeechToSpeech || [];
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - models change rarely
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });
}

// Hook to fetch supported dubbing languages
export function useDubbingLanguages() {
  return useQuery({
    queryKey: queryKeys.ai.languages(),
    queryFn: async (): Promise<DubbingLanguage[]> => {
      // Source of truth is shared constants; no network call needed
      return getSortedLanguages(SUPPORTED_DUBBING_LANGUAGES);
    },
    staleTime: 60 * 60 * 1000, // 1 hour - languages rarely change
    gcTime: 2 * 60 * 60 * 1000, // 2 hours cache
  });
}

// Hook to transform voice
export function useVoiceTransform() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (options: VoiceTransformOptions): Promise<Blob> => {
      try {
        const formData = new FormData();
        // Provide a filename for consistency across platforms
        const originalType = (options.audioBlob.type || '').toLowerCase();
        const normalizedType = originalType.split(';')[0] || 'audio/webm';
        const filename = normalizedType.includes('webm')
          ? 'input.webm'
          : normalizedType.includes('ogg')
          ? 'input.ogg'
          : normalizedType.includes('mpeg') || normalizedType.includes('mp3')
          ? 'input.mp3'
          : 'input';
        formData.append('audio', options.audioBlob, filename);
        formData.append('voiceId', options.voiceId);
        
        if (options.modelId) {
          formData.append('modelId', options.modelId);
        }
        
        if (options.stability !== undefined) {
          formData.append('stability', options.stability.toString());
        }
        
        if (options.similarityBoost !== undefined) {
          formData.append('similarityBoost', options.similarityBoost.toString());
        }
        
        // Use the existing transform-voice API route
        const response = await fetch('/api/elevenlabs/transform-voice', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Voice transformation failed: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('Received empty audio response');
        }
        
        return blob;
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    retry: 1, // Retry once for voice transformation
    retryDelay: 2000, // 2 second delay before retry
  });
}

// Hook to dub audio
export function useAudioDubbing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (options: DubbingOptions): Promise<DubbingResult> => {
      try {
        const formData = new FormData();
        // Normalize audio to a supported format (WAV) when needed
        const normalized = await normalizeAudioForDubbing(options.audioBlob);
        formData.append('audio', normalized.blob, normalized.filename);
        formData.append('targetLanguage', options.targetLanguage);
        
        if (options.sourceLanguage) {
          formData.append('sourceLanguage', options.sourceLanguage);
        }
        
        if (options.preserveBackgroundAudio !== undefined) {
          formData.append('preserveBackgroundAudio', options.preserveBackgroundAudio.toString());
        }
        
        // Create an AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
        
        let response;
        try {
          response = await fetch('/api/elevenlabs/dub-audio', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error('Dubbing request timed out. The audio may be too long or the service is experiencing high load. Please try with a shorter audio clip or try again later.');
          }
          throw fetchError;
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Audio dubbing failed: ${response.status}`);
        }
        // Server returns JSON with base64 audio and optional transcripts
        const data = await response.json();
        console.log('Server response data:', data);
        if (!data.audio_base64) {
          console.error('Invalid response: missing audio_base64. Response was:', data);
          throw new Error('Invalid response: missing audio_base64');
        }
        const dubbedBlob = await base64ToBlobAsync(
          data.audio_base64,
          data.content_type || 'audio/mpeg'
        );
        if (dubbedBlob.size === 0) {
          throw new Error('Received empty dubbed audio response');
        }
        return {
          blob: dubbedBlob,
          transcript: data.transcript || undefined,
          translatedTranscript: data.translated_transcript || undefined,
        };
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    retry: 1, // Retry once for dubbing
    retryDelay: 3000, // 3 second delay before retry (dubbing takes longer)
  });
}

// Hook to get AI service status
export function useAIServiceStatus() {
  return useQuery({
    queryKey: [...queryKeys.ai.all, 'status'],
    queryFn: async () => {
      try {
        // Test if the AI service is available by fetching a small amount of data
        const response = await fetch('/api/elevenlabs/test-models');
        
        if (!response.ok) {
          return {
            isAvailable: false,
            error: `Service unavailable: ${response.status}`,
            lastChecked: new Date(),
          };
        }
        
        const data = await response.json();
        
        return {
          isAvailable: !data.error,
          error: data.error || null,
          lastChecked: new Date(),
          modelsCount: data.recommendedForSpeechToSpeech?.length || 0,
        };
      } catch (error) {
        return {
          isAvailable: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date(),
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

// Hook to prefetch AI data (useful for preloading)
export function usePrefetchAIData() {
  const queryClient = useQueryClient();
  
  const prefetchVoices = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.ai.voices(),
      queryFn: async () => {
        const response = await fetch('/api/elevenlabs/list-voices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        return data.voices || [];
      },
      staleTime: 10 * 60 * 1000,
    });
  };
  
  const prefetchModels = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.ai.models(),
      queryFn: async () => {
        const response = await fetch('/api/elevenlabs/test-models');
        const data = await response.json();
        return data.recommendedForSpeechToSpeech || [];
      },
      staleTime: 15 * 60 * 1000,
    });
  };
  
  const prefetchLanguages = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.ai.languages(),
      queryFn: async () => getSortedLanguages(SUPPORTED_DUBBING_LANGUAGES),
      staleTime: 60 * 60 * 1000,
    });
  };
  
  return {
    prefetchVoices,
    prefetchModels,
    prefetchLanguages,
    prefetchAll: () => {
      prefetchVoices();
      prefetchModels();
      prefetchLanguages();
    },
  };
}