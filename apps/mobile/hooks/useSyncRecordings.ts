import { useCallback } from 'react';
import { useRecordingsStore } from '../store/recordingsStore';
import { createStarknetRecordingService } from '@voisss/shared';

interface SyncResult {
  success: boolean;
  count: number;
  error?: string;
}

export function useSyncRecordings() {
  const { syncWithStarknet } = useRecordingsStore.getState();

  const syncRecordings = useCallback(async (walletAddress: string): Promise<SyncResult> => {
    try {
      // Create Starknet recording service
      const starknetService = createStarknetRecordingService();
      
      // Sync recordings from Starknet
      const count = await syncWithStarknet(starknetService, walletAddress);
      
      return {
        success: true,
        count,
      };
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