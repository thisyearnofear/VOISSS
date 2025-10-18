import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBaseAccount } from '../useBaseAccount';
import { VoiceRecording } from '@voisss/shared/types';
import { queryKeys, handleQueryError } from '../../lib/query-client';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { VoiceRecordsABI } from '../../contracts/VoiceRecordsABI';

// Recording interface for web app
interface Recording {
  id: string;
  title: string;
  duration: number;
  blob?: Blob; // Optional for on-chain recordings
  isPublic: boolean;
  createdAt: Date;
  transactionHash?: string;
  ipfsHash?: string;
  isHidden?: boolean;
  onChain?: boolean; // Track if recording is on blockchain
  owner?: string; // Contract owner address
}

// Enhanced hook to fetch user's recordings (local + on-chain)
export function useRecordings(showHidden: boolean = false) {
  const { universalAddress: address } = useBaseAccount();
  
  return useQuery({
    queryKey: queryKeys.recordings.list(address || '', { showHidden }),
    queryFn: async (): Promise<Recording[]> => {
      if (!address) return [];
      
      try {
        // Fetch local recordings
        const localRecordings = await fetchLocalRecordings(address, showHidden);
        
        // Fetch on-chain recordings
        const onChainRecordings = await fetchOnChainRecordings(address);
        
        // Merge and deduplicate (prioritize on-chain data)
        const allRecordings = [...onChainRecordings, ...localRecordings];
        const uniqueRecordings = deduplicateRecordings(allRecordings);
        
        // Sort by creation date (newest first)
        return uniqueRecordings.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (error) {
        console.error('Failed to load recordings:', error);
        // Fallback to local recordings only
        return await fetchLocalRecordings(address, showHidden);
      }
    },
    enabled: !!address,
    staleTime: 30 * 1000, // 30 seconds for recordings (they change frequently)
    gcTime: 2 * 60 * 1000, // 2 minutes cache
  });
}

// Helper: Fetch local recordings from localStorage
async function fetchLocalRecordings(address: string, showHidden: boolean): Promise<Recording[]> {
  try {
    const storageKey = `voisss_recordings_${address}`;
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) return [];
    
    const recordings: Recording[] = JSON.parse(stored);
    
    // Filter hidden recordings if needed
    const filteredRecordings = showHidden 
      ? recordings 
      : recordings.filter(r => !r.isHidden);
    
    return filteredRecordings.map(r => ({ ...r, onChain: false }));
  } catch (error) {
    console.error('Failed to load local recordings:', error);
    return [];
  }
}

// Helper: Fetch on-chain recordings from Base contract
async function fetchOnChainRecordings(address: string): Promise<Recording[]> {
  const contractAddress = process.env.NEXT_PUBLIC_VOICE_RECORDS_CONTRACT as `0x${string}`;
  
  if (!contractAddress) {
    console.warn('Contract address not configured');
    return [];
  }
  
  try {
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });
    
    // Get user's recording IDs
    const recordingIds = await publicClient.readContract({
      address: contractAddress,
      abi: VoiceRecordsABI,
      functionName: 'getUserRecordings',
      args: [address as `0x${string}`],
    }) as bigint[];
    
    // Fetch details for each recording
    const recordings: Recording[] = [];
    
    for (const id of recordingIds) {
      try {
        const recordingData = await publicClient.readContract({
          address: contractAddress,
          abi: VoiceRecordsABI,
          functionName: 'getRecording',
          args: [id],
        }) as [bigint, string, string, string, boolean, bigint];
        
        const [recordingId, owner, ipfsHash, title, isPublic, timestamp] = recordingData;
        
        recordings.push({
          id: `onchain_${recordingId.toString()}`,
          title: title || `Recording #${recordingId.toString()}`,
          duration: 0, // Duration not stored on-chain, could be fetched from IPFS metadata
          isPublic,
          createdAt: new Date(Number(timestamp) * 1000),
          ipfsHash,
          onChain: true,
          owner,
        });
      } catch (error) {
        console.warn(`Failed to fetch recording ${id}:`, error);
      }
    }
    
    return recordings;
  } catch (error) {
    console.error('Failed to fetch on-chain recordings:', error);
    return [];
  }
}

// Helper: Remove duplicates (prioritize on-chain data)
function deduplicateRecordings(recordings: Recording[]): Recording[] {
  const seen = new Set<string>();
  const unique: Recording[] = [];
  
  // Process on-chain recordings first (higher priority)
  const onChain = recordings.filter(r => r.onChain);
  const local = recordings.filter(r => !r.onChain);
  
  for (const recording of [...onChain, ...local]) {
    const key = recording.ipfsHash || recording.id;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(recording);
    }
  }
  
  return unique;
}

// Hook to fetch a specific recording
export function useRecording(recordingId: string) {
  const { universalAddress: address } = useBaseAccount();
  
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
  const { universalAddress: address } = useBaseAccount();
  
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
  const { universalAddress: address } = useBaseAccount();
  
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
  const { universalAddress: address } = useBaseAccount();
  
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
  const { universalAddress: address } = useBaseAccount();
  
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
  const { universalAddress: address } = useBaseAccount();
  
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