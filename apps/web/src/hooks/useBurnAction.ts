'use client';

import { useState, useCallback } from 'react';
import {
  type BurnActionType,
  type BurnActionRequest,
  canAffordBurnAction,
  getBurnActionDisplay,
  submitBurnAction,
} from '@voisss/shared';
import { useTokenAccess } from '@voisss/shared/hooks/useTokenAccess';
import { encodeBurnTokens, STANDARD_BURN_ADDRESS } from '../lib/token-transfer';

export interface UseBurnActionOptions {
  userAddress?: string | null;
  tokenAddress?: string;
  onSuccess?: (result: { txHash: string; cost: bigint }) => void;
  onError?: (error: Error) => void;
}

export interface UseBurnActionResult {
  // State
  isPending: boolean;
  isTransacting: boolean;
  error: Error | null;

  // Queries
  canAfford(action: BurnActionType): boolean;
  getActionDisplay(action: BurnActionType): ReturnType<typeof getBurnActionDisplay>;
  getBurnAddress(): string;

  // Actions
  /**
   * Initiate burn action (backend validation)
   * Returns transaction data to execute
   */
  initiateBurn(
    action: BurnActionType,
    recordingId: string,
    metadata?: Record<string, any>
  ): Promise<{ cost: bigint; txData: `0x${string}` }>;

  /**
   * Execute token transfer after user signs
   * Call this after user confirms the transaction
   */
  executeTransfer(txHash: string): void;
}

/**
 * Hook to manage $voisss burn actions (premium outputs)
 * 
 * Flow:
 * 1. User initiates burn (video export, NFT mint, etc.)
 * 2. Backend validates balance and queues action
 * 3. Frontend encodes token transfer
 * 4. User signs transaction with wallet
 * 5. Frontend executes transfer to burn address
 * 
 * Usage:
 *   const { initiateBurn, executeTransfer, canAfford } = useBurnAction({
 *     userAddress,
 *   });
 *   
 *   // Show modal
 *   const { cost } = await initiateBurn('video_export', recordingId);
 *   
 *   // User signs
 *   const txHash = await userWallet.sendTransaction(txData);
 *   
 *   // Confirm
 *   executeTransfer(txHash);
 */
export function useBurnAction(
  options: UseBurnActionOptions = {}
): UseBurnActionResult {
  const { userAddress, tokenAddress = process.env.NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS, onSuccess, onError } = options;

  const { balance } = useTokenAccess({
    address: userAddress,
    autoRefresh: true,
  });

  const [isPending, setPending] = useState(false);
  const [isTransacting, setIsTransacting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Check if user can afford burn action
   */
  const canAfford = useCallback(
    (action: BurnActionType): boolean => {
      if (!balance) return false;
      return canAffordBurnAction(balance, action);
    },
    [balance]
  );

  /**
   * Get display info for burn action
   */
  const getActionDisplay = useCallback(
    (action: BurnActionType) => {
      return getBurnActionDisplay(action);
    },
    []
  );

  /**
   * Get burn address
   */
  const getBurnAddress = useCallback(() => STANDARD_BURN_ADDRESS, []);

  /**
   * Initiate burn action
   * Validates with backend and returns transaction data
   */
  const initiateBurn = useCallback(
    async (
      action: BurnActionType,
      recordingId: string,
      metadata?: Record<string, any>
    ): Promise<{ cost: bigint; txData: `0x${string}` }> => {
      try {
        if (!userAddress) {
          throw new Error('User address required');
        }

        if (!tokenAddress) {
          throw new Error('Token address not configured');
        }

        if (!canAfford(action)) {
          throw new Error('Insufficient balance for this action');
        }

        setPending(true);
        setError(null);

        // Backend validation and action queueing
        const request: BurnActionRequest = {
          action,
          userId: userAddress,
          recordingId,
          metadata,
        };

        const result = await submitBurnAction(request);

        if (!result.success) {
          throw new Error(result.error || 'Burn action failed');
        }

        // Encode token transfer for user to sign
        const txData = encodeBurnTokens(
          tokenAddress as `0x${string}`,
          result.cost
        );

        return { cost: result.cost, txData };

      } catch (err) {
        const burnError = err instanceof Error ? err : new Error('Unknown error');
        setError(burnError);
        onError?.(burnError);
        throw burnError;
      } finally {
        setPending(false);
      }
    },
    [userAddress, tokenAddress, canAfford, onError]
  );

  /**
   * Execute transfer after user signs transaction
   */
  const executeTransfer = useCallback(
    (txHash: string) => {
      setIsTransacting(true);
      try {
        // Log successful burn
        console.log('[useBurnAction] Transfer executed:', txHash);
        onSuccess?.({ txHash, cost: 0n }); // Cost already paid, 0n is placeholder
      } finally {
        setIsTransacting(false);
      }
    },
    [onSuccess]
  );

  return {
    isPending,
    isTransacting,
    error,
    canAfford,
    getActionDisplay,
    getBurnAddress,
    initiateBurn,
    executeTransfer,
  };
}
