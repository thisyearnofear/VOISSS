import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createElevenLabsProvider } from '@voisss/shared';
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
interface DubbingLanguage {
  language_id: string;
  name: string;
  code: string;
}

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
      try {
        const response = await fetch('/api/elevenlabs/dub-audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'getLanguages' }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch languages: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        return data.languages || [];
      } catch (error) {
        throw handleQueryError(error);
      }
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
    mutationFn: async (options: DubbingOptions): Promise<Blob> => {
      try {
        const formData = new FormData();
        formData.append('audio', options.audioBlob);
        formData.append('targetLanguage', options.targetLanguage);
        
        if (options.sourceLanguage) {
          formData.append('sourceLanguage', options.sourceLanguage);
        }
        
        if (options.preserveBackgroundAudio !== undefined) {
          formData.append('preserveBackgroundAudio', options.preserveBackgroundAudio.toString());
        }
        
        const response = await fetch('/api/elevenlabs/dub-audio', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Audio dubbing failed: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        if (blob.size === 0) {
          throw new Error('Received empty dubbed audio response');
        }
        
        return blob;
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
      queryFn: async () => {
        const response = await fetch('/api/elevenlabs/dub-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getLanguages' }),
        });
        const data = await response.json();
        return data.languages || [];
      },
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