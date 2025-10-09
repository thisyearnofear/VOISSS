import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createStarknetRecordingService,
  type Recording,
  type StarknetRecordingMetadata,
  type UserProfile,
  type TransactionStatus,
  type AccountType
} from '@voisss/shared/src/services/starknet-recording';
import { queryKeys, handleQueryError } from '../../lib/query-client';
import { starknet } from '../../utils/starknet';

// Hook to get user recordings
export function useUserRecordings() {
  return useQuery({
    queryKey: queryKeys.recordings.lists(),
    queryFn: async () => {
      try {
        const walletAddress = await starknet.getStoredWalletAddress();
        if (!walletAddress) return [];
        
        const starknetService = createStarknetRecordingService();
        const recordings = await starknetService.getUserRecordings(walletAddress);
        return recordings;
      } catch (error) {
        console.error('Failed to load user recordings:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to get a specific recording
export function useRecording(recordingId: string) {
  return useQuery({
    queryKey: queryKeys.recordings.detail(recordingId),
    queryFn: async () => {
      if (!recordingId) return null;
      
      try {
        const starknetService = createStarknetRecordingService();
        const recording = await starknetService.getRecording(recordingId);
        return recording;
      } catch (error) {
        console.error('Failed to load recording:', error);
        return null;
      }
    },
    enabled: !!recordingId,
  });
}

// Hook to get public recordings
export function usePublicRecordings(offset: number = 0, limit: number = 20) {
  return useQuery({
    queryKey: [...queryKeys.recordings.lists(), 'public', offset, limit],
    queryFn: async () => {
      try {
        const starknetService = createStarknetRecordingService();
        const recordings = await starknetService.getPublicRecordings(offset, limit);
        return recordings;
      } catch (error) {
        console.error('Failed to load public recordings:', error);
        return [];
      }
    },
  });
}

// Hook to store recording on Starknet
export function useStoreRecording() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      account, 
      metadata,
      onStatusChange 
    }: { 
      account: AccountType;
      metadata: StarknetRecordingMetadata;
      onStatusChange?: (status: TransactionStatus) => void;
    }) => {
      const starknetService = createStarknetRecordingService();
      return await starknetService.storeRecording(account, metadata, onStatusChange);
    },
    onSuccess: () => {
      // Invalidate recordings queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.recordings.lists() });
    },
    onError: handleQueryError,
  });
}

// Hook to get user profile
export function useUserProfile(userAddress?: string) {
  return useQuery({
    queryKey: queryKeys.starknet.userProfile(userAddress || ''),
    queryFn: async () => {
      if (!userAddress) return null;
      
      try {
        const starknetService = createStarknetRecordingService();
        const profile = await starknetService.getUserProfile(userAddress);
        return profile;
      } catch (error) {
        console.error('Failed to load user profile:', error);
        return null;
      }
    },
    enabled: !!userAddress,
  });
}

// Hook to check if user has access to a recording
export function useHasAccess(recordingId: string, userAddress: string, permissionType: number) {
  return useQuery({
    queryKey: ['access', recordingId, userAddress, permissionType],
    queryFn: async () => {
      if (!recordingId || !userAddress) return false;
      
      try {
        const starknetService = createStarknetRecordingService();
        return await starknetService.hasAccess(recordingId, userAddress, permissionType);
      } catch (error) {
        console.error('Failed to check access:', error);
        return false;
      }
    },
    enabled: !!recordingId && !!userAddress,
  });
}