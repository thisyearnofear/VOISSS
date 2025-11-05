import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createBaseRecordingService, type Recording } from '@voisss/shared';
import { queryKeys, handleQueryError } from '../../lib/query-client';
import { useBaseAccount } from '../../hooks/useBaseAccount';

// Hook to get user recordings from Base chain
export function useUserRecordings() {
  const { universalAddress } = useBaseAccount();

  return useQuery({
    queryKey: queryKeys.recordings.lists(),
    queryFn: async () => {
      if (!universalAddress) return [];

      try {
        // TODO: Implement Base contract reading for user recordings
        // For now, return empty array (local storage only)
        console.log('Base recordings query not yet implemented');
        return [];
      } catch (error) {
        console.error('Failed to load user recordings:', error);
        return [];
      }
    },
    enabled: !!universalAddress,
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
        // TODO: Implement Base contract reading for specific recording
        console.log('Base recording detail query not yet implemented');
        return null;
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
        // TODO: Implement Base contract reading for public recordings
        console.log('Base public recordings query not yet implemented');
        return [];
      } catch (error) {
        console.error('Failed to load public recordings:', error);
        return [];
      }
    },
  });
}

// Hook to store recording on Base (using the shared service)
export function useStoreRecording() {
  const queryClient = useQueryClient();
  const { universalAddress } = useBaseAccount();

  return useMutation({
    mutationFn: async ({
      ipfsHash,
      metadata
    }: {
      ipfsHash: string;
      metadata: any;
    }) => {
      if (!universalAddress) {
        throw new Error('Wallet not connected');
      }

      const baseService = createBaseRecordingService(universalAddress, {
        permissionRetriever: async () => {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          return await AsyncStorage.getItem('spendPermissionHash');
        }
      });

      return await baseService.saveRecording(ipfsHash, metadata);
    },
    onSuccess: () => {
      // Invalidate recordings queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.recordings.lists() });
    },
    onError: handleQueryError,
  });
}

// Hook to get user profile (placeholder for future implementation)
export function useUserProfile(userAddress?: string) {
  return useQuery({
    queryKey: ['userProfile', userAddress],
    queryFn: async () => {
      // TODO: Implement Base user profile reading
      console.log('Base user profile query not yet implemented');
      return null;
    },
    enabled: !!userAddress,
  });
}

// Hook to check if user has access to a recording (placeholder)
export function useHasAccess(recordingId: string, userAddress: string, permissionType: number) {
  return useQuery({
    queryKey: ['access', recordingId, userAddress, permissionType],
    queryFn: async () => {
      // TODO: Implement Base access control checking
      console.log('Base access control query not yet implemented');
      return false;
    },
    enabled: !!recordingId && !!userAddress,
  });
}