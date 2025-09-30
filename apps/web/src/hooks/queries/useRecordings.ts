import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from '@starknet-react/core';
import { VoiceRecording } from '@voisss/shared/types';
import { queryKeys, handleQueryError } from '../../lib/query-client';

// Recording interface for web app
interface Recording {
  id: string;
  title: string;
  duration: number;
  blob: Blob;
  isPublic: boolean;
  createdAt: Date;
  transactionHash?: string;
  ipfsHash?: string;
  isHidden?: boolean;
}

// Hook to fetch user's recordings
export function useRecordings(showHidden: boolean = false) {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: queryKeys.recordings.list(address || '', { showHidden }),
    queryFn: async (): Promise<Recording[]> => {
      if (!address) return [];
      
      try {
        const storageKey = `voisss_recordings_${address}`;
        const stored = localStorage.getItem(storageKey);
        
        if (!stored) return [];
        
        const recordings: Recording[] = JSON.parse(stored);
        
        // Filter hidden recordings if needed
        const filteredRecordings = showHidden 
          ? recordings 
          : recordings.filter(r => !r.isHidden);
        
        // Sort by creation date (newest first)
        return filteredRecordings.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (error) {
        console.error('Failed to load recordings:', error);
        return [];
      }
    },
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds for recordings (they change frequently)
    gcTime: 2 * 60 * 1000, // 2 minutes cache
  });
}

// Hook to fetch a specific recording
export function useRecording(recordingId: string) {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: queryKeys.recordings.detail(recordingId),
    queryFn: async (): Promise<Recording | null> => {
      if (!address || !recordingId) return null;
      
      try {
        const storageKey = `voisss_recordings_${address}`;
        const stored = localStorage.getItem(storageKey);
        
        if (!stored) return null;
        
        const recordings: Recording[] = JSON.parse(stored);
        return recordings.find(r => r.id === recordingId) || null;
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    enabled: !!address && !!recordingId,
    staleTime: 1 * 60 * 1000, // 1 minute for individual recording
  });
}

// Hook to save a recording
export function useSaveRecording() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  
  return useMutation({
    mutationFn: async (recording: Omit<Recording, 'id' | 'createdAt'>) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }
      
      try {
        const storageKey = `voisss_recordings_${address}`;
        const stored = localStorage.getItem(storageKey);
        const existingRecordings: Recording[] = stored ? JSON.parse(stored) : [];
        
        const newRecording: Recording = {
          ...recording,
          id: `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };
        
        const updatedRecordings = [newRecording, ...existingRecordings];
        localStorage.setItem(storageKey, JSON.stringify(updatedRecordings));
        
        return newRecording;
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    onSuccess: () => {
      // Invalidate recordings queries
      if (address) {
        queryClient.invalidateQueries({ queryKey: queryKeys.recordings.list(address, {}) });
      }
    },
  });
}

// Hook to update a recording
export function useUpdateRecording() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  
  return useMutation({
    mutationFn: async ({ 
      recordingId, 
      updates 
    }: { 
      recordingId: string; 
      updates: Partial<Omit<Recording, 'id' | 'createdAt'>>; 
    }) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }
      
      try {
        const storageKey = `voisss_recordings_${address}`;
        const stored = localStorage.getItem(storageKey);
        
        if (!stored) {
          throw new Error('No recordings found');
        }
        
        const recordings: Recording[] = JSON.parse(stored);
        const recordingIndex = recordings.findIndex(r => r.id === recordingId);
        
        if (recordingIndex === -1) {
          throw new Error('Recording not found');
        }
        
        recordings[recordingIndex] = {
          ...recordings[recordingIndex],
          ...updates,
        };
        
        localStorage.setItem(storageKey, JSON.stringify(recordings));
        
        return recordings[recordingIndex];
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    onSuccess: (updatedRecording) => {
      // Invalidate and update queries
      if (address) {
        queryClient.invalidateQueries({ queryKey: queryKeys.recordings.list(address, {}) });
        queryClient.setQueryData(
          queryKeys.recordings.detail(updatedRecording.id),
          updatedRecording
        );
      }
    },
  });
}

// Hook to delete a recording
export function useDeleteRecording() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  
  return useMutation({
    mutationFn: async (recordingId: string) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }
      
      try {
        const storageKey = `voisss_recordings_${address}`;
        const stored = localStorage.getItem(storageKey);
        
        if (!stored) {
          throw new Error('No recordings found');
        }
        
        const recordings: Recording[] = JSON.parse(stored);
        const filteredRecordings = recordings.filter(r => r.id !== recordingId);
        
        localStorage.setItem(storageKey, JSON.stringify(filteredRecordings));
        
        return recordingId;
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    onSuccess: (deletedId) => {
      // Invalidate and remove from cache
      if (address) {
        queryClient.invalidateQueries({ queryKey: queryKeys.recordings.list(address, {}) });
        queryClient.removeQueries({ queryKey: queryKeys.recordings.detail(deletedId) });
      }
    },
  });
}

// Hook to get recording statistics
export function useRecordingStats() {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: [...queryKeys.recordings.all, 'stats', address],
    queryFn: async () => {
      if (!address) return null;
      
      try {
        const storageKey = `voisss_recordings_${address}`;
        const stored = localStorage.getItem(storageKey);
        
        if (!stored) {
          return {
            total: 0,
            public: 0,
            private: 0,
            totalDuration: 0,
            withTransactionHash: 0,
            withIPFS: 0,
          };
        }
        
        const recordings: Recording[] = JSON.parse(stored);
        
        return {
          total: recordings.length,
          public: recordings.filter(r => r.isPublic).length,
          private: recordings.filter(r => !r.isPublic).length,
          totalDuration: recordings.reduce((sum, r) => sum + r.duration, 0),
          withTransactionHash: recordings.filter(r => r.transactionHash).length,
          withIPFS: recordings.filter(r => r.ipfsHash).length,
        };
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    enabled: !!address,
    staleTime: 1 * 60 * 1000, // 1 minute for stats
  });
}

// Hook to bulk operations on recordings
export function useBulkRecordingOperations() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  
  return useMutation({
    mutationFn: async ({ 
      operation, 
      recordingIds 
    }: { 
      operation: 'delete' | 'hide' | 'show' | 'makePublic' | 'makePrivate'; 
      recordingIds: string[]; 
    }) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }
      
      try {
        const storageKey = `voisss_recordings_${address}`;
        const stored = localStorage.getItem(storageKey);
        
        if (!stored) {
          throw new Error('No recordings found');
        }
        
        let recordings: Recording[] = JSON.parse(stored);
        
        switch (operation) {
          case 'delete':
            recordings = recordings.filter(r => !recordingIds.includes(r.id));
            break;
          case 'hide':
            recordings = recordings.map(r => 
              recordingIds.includes(r.id) ? { ...r, isHidden: true } : r
            );
            break;
          case 'show':
            recordings = recordings.map(r => 
              recordingIds.includes(r.id) ? { ...r, isHidden: false } : r
            );
            break;
          case 'makePublic':
            recordings = recordings.map(r => 
              recordingIds.includes(r.id) ? { ...r, isPublic: true } : r
            );
            break;
          case 'makePrivate':
            recordings = recordings.map(r => 
              recordingIds.includes(r.id) ? { ...r, isPublic: false } : r
            );
            break;
        }
        
        localStorage.setItem(storageKey, JSON.stringify(recordings));
        
        return { operation, recordingIds, affectedCount: recordingIds.length };
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    onSuccess: () => {
      // Invalidate all recording queries
      if (address) {
        queryClient.invalidateQueries({ queryKey: queryKeys.recordings.all });
      }
    },
  });
}