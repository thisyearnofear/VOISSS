import { useBaseAccount } from './useBaseAccount';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createBaseRecordingService, Recording } from '@voisss/shared';
import { queryKeys, handleQueryError } from '../lib/query-client';

// Hook to get wallet connection status and basic actions
export function useBase() {
  const {
    isConnected,
    isConnecting,
    universalAddress,
    connect,
    disconnect,
    permissionActive,
    requestPermission,
    status,
    error
  } = useBaseAccount();

  return {
    isConnected,
    isConnecting,
    account: universalAddress ? { address: universalAddress } : null,
    connect,
    disconnect,
    permissionActive,
    requestPermission,
    status,
    error,
  };
}

// Hook to get wallet status (for backward compatibility)
export function useStarknetStatus() {
  const { isConnected, isConnecting, status } = useBase();
  return { isConnected, isConnecting, status };
}

// Hook to store recording (replaces the old storeRecording function)
export function useStoreRecording() {
  const { universalAddress } = useBaseAccount();
  const queryClient = useQueryClient();

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
          // TODO: Implement proper permission retrieval for mobile
          // For now, this will fail and we handle it gracefully
          return null;
        }
      });

      return await baseService.saveRecording(ipfsHash, metadata);
    },
    onSuccess: () => {
      // Invalidate recordings queries
      queryClient.invalidateQueries({ queryKey: queryKeys.recordings.lists() });
    },
    onError: handleQueryError,
  });
}
