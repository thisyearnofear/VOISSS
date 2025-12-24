import { useCallback } from 'react';
import { useRecordingsStore } from '../store/recordingsStore';
// TODO: createStarknetRecordingService uses starknet SDK which has node:crypto dependency
// For React Native, we need to implement a mobile-specific Starknet service

interface SyncResult {
  success: boolean;
  count: number;
  error?: string;
}

export function useSyncRecordings() {
  const { syncWithStarknet } = useRecordingsStore.getState();

  const syncRecordings = useCallback(async (walletAddress: string): Promise<SyncResult> => {
    try {
      // TODO: Implement mobile-compatible Starknet sync
      // The starknet SDK uses node:crypto which is not available in React Native
      // For now, return a placeholder response
      console.warn('Starknet sync not yet implemented for React Native');

      return {
        success: false,
        count: 0,
        error: 'Starknet sync not yet implemented for React Native',
      };

      // Original code (requires starknet SDK):
      // const starknetService = createStarknetRecordingService();
      // const count = await syncWithStarknet(starknetService, walletAddress);
      // return { success: true, count };
    } catch (error) {
      console.error('Failed to sync recordings:', error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [syncWithStarknet]);

  return { syncRecordings };
}