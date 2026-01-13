'use client';

import { useState } from 'react';
import { type BurnActionType, getBurnActionDisplay } from '@voisss/shared';
import { formatTokenBalance } from '@voisss/shared/config/tokenAccess';
import { AlertCircle, Loader } from 'lucide-react';

interface BurnActionModalProps {
  action: BurnActionType;
  recordingTitle: string;
  isOpen: boolean;
  isPending: boolean;
  userBalance: bigint;
  canAfford: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  onSuccess?: () => void;
}

/**
 * Modal to confirm $voisss burn action before execution
 * Shows cost, user balance, and success/error states
 */
export function BurnActionModal({
  action,
  recordingTitle,
  isOpen,
  isPending,
  userBalance,
  canAfford,
  onConfirm,
  onCancel,
  onSuccess,
}: BurnActionModalProps) {
  const [error, setError] = useState<string | null>(null);
  const actionDisplay = getBurnActionDisplay(action);

  if (!isOpen || !actionDisplay) return null;

  const handleConfirm = async () => {
    try {
      setError(null);
      await onConfirm();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <h2 className="text-xl font-bold text-white mb-2">{actionDisplay.label}</h2>
        <p className="text-gray-400 text-sm mb-4">{actionDisplay.description}</p>

        {/* Recording title */}
        <div className="bg-white/5 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-400">Recording</p>
          <p className="text-white font-semibold truncate">{recordingTitle}</p>
        </div>

        {/* Cost breakdown */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Cost</span>
            <span className="text-white font-semibold">{formatTokenBalance(actionDisplay.cost)} $voisss</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Your Balance</span>
            <span className={canAfford ? 'text-green-400' : 'text-red-400'}>
              {formatTokenBalance(userBalance)} $voisss
            </span>
          </div>
        </div>

        {/* Error message */}
        {!canAfford && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">
              Insufficient balance. You need {formatTokenBalance(
                actionDisplay.cost - userBalance
              )} more $voisss.
            </p>
          </div>
        )}

        {/* Error from execution */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canAfford || isPending}
            className="flex-1 px-4 py-2 rounded-lg bg-[#7C5DFA] hover:bg-[#6B4CE6] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {isPending && <Loader className="w-4 h-4 animate-spin" />}
            {isPending ? 'Processing...' : 'Confirm'}
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 mt-4">
          This action will burn {formatTokenBalance(actionDisplay.cost)} $voisss from your wallet.
          This cannot be undone.
        </p>
      </div>
    </div>
  );
}
