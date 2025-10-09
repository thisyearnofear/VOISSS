import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccount } from '@starknet-react/core';
import { 
  createIPFSService, 
  createStarknetRecordingService, 
  createRecordingService 
} from '@voisss/shared';
import { VoiceRecording } from '@voisss/shared/types';
import { queryKeys, handleQueryError } from '../../lib/query-client';
import { useSession, useUpdateSession } from '@voisss/shared/src/hooks/useSession';

// Extended recording interface for this component
interface Recording extends Omit<VoiceRecording, 'createdAt' | 'updatedAt'> {
  timestamp?: Date;
  transactionHash?: string;
  isHidden?: boolean;
  customTitle?: string;
  ipfsUrl?: string;
  blob?: Blob;
  onChain?: boolean;
}

interface PipelineProgress {
  stage: "converting" | "uploading" | "storing" | "complete" | "error";
  progress: number;
  message: string;
  error?: string;
}

interface RecordingMetadata {
  title: string;
  description: string;
  ipfsHash: string;
  duration: number;
  fileSize: number;
  isPublic: boolean;
  tags: string[];
  timestamp?: Date;
  transactionHash?: string;
  isHidden?: boolean;
  customTitle?: string;
  ipfsUrl?: string;
  blob?: Blob;
}

// Hook to get user recordings
export function useUserRecordings() {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: queryKeys.recordings.list(address || ''),
    queryFn: async () => {
      if (!address) return [];
      
      try {
        const stored = localStorage.getItem(`recordings_${address}`);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('Failed to load recordings:', error);
        return [];
      }
    },
    enabled: !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to save recording
export function useSaveRecording() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { mutateAsync: updateSession } = useUpdateSession();
  
  return useMutation({
    mutationFn: async (recording: Recording) => {
      if (!address) throw new Error('Wallet not connected');
      
      const recordings = JSON.parse(
        localStorage.getItem(`recordings_${address}`) || '[]'
      );
      
      const newRecording = {
        ...recording,
        id: recording.id || Date.now().toString(),
        timestamp: new Date(),
      };
      
      recordings.push(newRecording);
      localStorage.setItem(`recordings_${address}`, JSON.stringify(recordings));
      
      // Update cross-platform session with wallet address
      if (session && session.walletAddress !== address) {
        await updateSession({ walletAddress: address });
      }
      
      return newRecording;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.recordings.list(address || '') 
      });
    },
    onError: handleQueryError,
  });
}

// Hook to process recording through pipeline
export function useProcessRecording() {
  const { account } = useAccount();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      blob, 
      metadata, 
      onProgress 
    }: { 
      blob: Blob; 
      metadata: RecordingMetadata; 
      onProgress?: (progress: PipelineProgress) => void;
    }) => {
      const ipfsService = createIPFSService();
      const starknetService = createStarknetRecordingService();
      const recordingService = createRecordingService(ipfsService, starknetService);
      
      try {
        const result = await recordingService.processRecording(
          blob,
          metadata,
          account,
          onProgress
        );
        
        return result;
      } finally {
        recordingService.dispose();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.recordings.all 
      });
    },
    onError: handleQueryError,
  });
}

// Hook to upload to IPFS
export function useIPFSUpload() {
  return useMutation({
    mutationFn: async (data: { blob: Blob; title: string }) => {
      const ipfsService = createIPFSService();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.mp3`;
      
      const audioMetadata = {
        filename,
        mimeType: data.blob.type || 'audio/mpeg',
        duration: 0, // Would need to calculate from blob
      };
      
      return await ipfsService.uploadAudio(data.blob, audioMetadata);
    },
    onError: handleQueryError,
  });
}

// Hook to store on Starknet
export function useStarknetStorage() {
  return useMutation({
    mutationFn: async (data: { metadata: RecordingMetadata; account: any }) => {
      const starknetService = createStarknetRecordingService();
      
      return await starknetService.storeRecording(data.account, data.metadata);
    },
    onError: handleQueryError,
  });
}

// Hook to delete recording
export function useDeleteRecording() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (recordingId: string) => {
      if (!address) throw new Error('Wallet not connected');
      
      const recordings = JSON.parse(
        localStorage.getItem(`recordings_${address}`) || '[]'
      );
      
      const filteredRecordings = recordings.filter(
        (r: Recording) => r.id !== recordingId
      );
      
      localStorage.setItem(
        `recordings_${address}`, 
        JSON.stringify(filteredRecordings)
      );
      
      return recordingId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.recordings.list(address || '') 
      });
    },
    onError: handleQueryError,
  });
}

// Hook to toggle recording visibility
export function useToggleRecordingVisibility() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ recordingId, isHidden }: { recordingId: string; isHidden: boolean }) => {
      if (!address) throw new Error('Wallet not connected');
      
      const recordings = JSON.parse(
        localStorage.getItem(`recordings_${address}`) || '[]'
      );
      
      const updatedRecordings = recordings.map((r: Recording) =>
        r.id === recordingId ? { ...r, isHidden } : r
      );
      
      localStorage.setItem(
        `recordings_${address}`, 
        JSON.stringify(updatedRecordings)
      );
      
      return { recordingId, isHidden };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.recordings.list(address || '') 
      });
    },
    onError: handleQueryError,
  });
}

// Hook to get recording statistics
export function useRecordingStats() {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: [...queryKeys.recordings.all, 'stats', address],
    queryFn: async () => {
      if (!address) return { total: 0, public: 0, private: 0, totalSize: 0 };
      
      try {
        const stored = localStorage.getItem(`recordings_${address}`);
        const recordings = stored ? JSON.parse(stored) : [];
        
        return {
          total: recordings.length,
          public: recordings.filter((r: any) => r.isPublic).length,
          private: recordings.filter((r: any) => !r.isPublic).length,
          totalSize: recordings.reduce((sum: number, r: any) => sum + (r.fileSize || 0), 0),
        };
      } catch (error) {
        console.error('Failed to calculate recording stats:', error);
        return { total: 0, public: 0, private: 0, totalSize: 0 };
      }
    },
    enabled: !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}