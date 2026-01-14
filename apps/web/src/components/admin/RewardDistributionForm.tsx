"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MissionResponse } from "@voisss/shared/types/socialfi";
import { calculateRewardSplit } from "@voisss/shared/config/platform";

interface RewardDistributionFormProps {
  submission: MissionResponse;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  customRewardAmount?: number;
  papajamsAmount: number;
  voisssAmount: number;
  notes: string;
}

export default function RewardDistributionForm({
  submission,
  onSuccess,
  onCancel,
}: RewardDistributionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    papajamsAmount: 0,
    voisssAmount: 0,
    notes: "",
  });
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  const handleCalculate = () => {
    // Rewards are manually determined (no engagement tracking)
  };

  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const distributeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/rewards/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submission.id,
          walletAddress: submission.userId,
          customRewardAmount: useCustomAmount ? formData.customRewardAmount : undefined,
          papajamsAmount: formData.papajamsAmount,
          voisssAmount: formData.voisssAmount,
          notes: formData.notes,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to distribute rewards");
      }

      return response.json();
    },
    onSuccess: () => {
      onSuccess?.();
    },
  });

  const totalValue = formData.papajamsAmount + formData.voisssAmount;

  return (
    <div className="voisss-card space-y-6">
      <div className="border-b border-[#3A3A3A] pb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Distribute Reward</h3>
        <p className="text-sm text-gray-400">
          Submission from <span className="font-mono text-[#7C5DFA]">{submission.userId.slice(0, 6)}...{submission.userId.slice(-4)}</span>
        </p>
      </div>

      {/* Submission Status */}
      <div className="p-4 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
        <p className="text-xs text-gray-400 mb-1">Status</p>
        <p className={`text-sm font-semibold ${
          submission.status === 'approved' ? 'text-[#22C55E]' :
          submission.status === 'flagged' ? 'text-yellow-500' :
          'text-red-500'
        }`}>
          {submission.status === 'approved' && '✓ Approved'}
          {submission.status === 'flagged' && '⚠ Flagged'}
          {submission.status === 'removed' && '✗ Removed'}
        </p>
      </div>

      {/* Token Explanation */}
      <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] space-y-2">
        <p className="text-xs font-semibold text-white mb-3">Token Allocation</p>
        <div className="flex items-start gap-2 text-xs">
          <span className="text-[#7C5DFA] font-bold">📊</span>
          <div>
            <p className="text-gray-300"><span className="font-semibold">$papajams (70%)</span> — Creator reward</p>
            <p className="text-gray-500 text-xs">Paid directly to creator wallet</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-xs">
          <span className="text-purple-400 font-bold">💜</span>
          <div>
            <p className="text-gray-300"><span className="font-semibold">$voisss (30%)</span> — Platform allocation</p>
            <p className="text-gray-500 text-xs">Supports ecosystem & features</p>
          </div>
        </div>
      </div>

      {/* Token Amount Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            $papajams Amount
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.papajamsAmount}
              onChange={(e) => handleFieldChange("papajamsAmount", parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="flex-1 px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#7C5DFA] focus:border-transparent"
              placeholder="0"
            />
            <div className="px-4 py-2 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-gray-400 flex items-center min-w-fit">
              $papajams
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            $voisss Amount
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.voisssAmount}
              onChange={(e) => handleFieldChange("voisssAmount", parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
              className="flex-1 px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#7C5DFA] focus:border-transparent"
              placeholder="0"
            />
            <div className="px-4 py-2 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-gray-400 flex items-center min-w-fit">
              $voisss
            </div>
          </div>
        </div>
      </div>

      {/* Total Value Display */}
      {totalValue > 0 && (
        <div className="p-3 bg-gradient-to-r from-[#7C5DFA]/10 to-[#22C55E]/10 border border-[#7C5DFA]/30 rounded-lg">
          <p className="flex justify-between items-center">
            <span className="text-white font-medium">Total value</span>
            <span className="text-lg font-semibold text-[#7C5DFA]">{totalValue} tokens</span>
          </p>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Notes / Reason
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleFieldChange("notes", e.target.value)}
          rows={3}
          className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#7C5DFA] focus:border-transparent resize-none"
          placeholder="e.g., High engagement, quality content, featured in reel, etc."
        />
        <p className="text-xs text-gray-500 mt-1">Optional: Document why this reward was issued</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-[#3A3A3A]">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] text-white rounded-lg font-medium hover:bg-[#3A3A3A] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => distributeMutation.mutate()}
          disabled={totalValue === 0 || distributeMutation.isPending}
          className="flex-1 px-4 py-2 bg-[#7C5DFA] hover:bg-[#6D4AE8] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {distributeMutation.isPending ? "Distributing..." : "Record Distribution"}
        </button>
      </div>

      {/* Error/Success Messages */}
      {distributeMutation.isError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">
            {distributeMutation.error instanceof Error ? distributeMutation.error.message : "Failed to record distribution"}
          </p>
        </div>
      )}

      {distributeMutation.isSuccess && (
        <div className="p-3 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-lg">
          <p className="text-[#22C55E] text-sm">
            ✓ Distribution recorded successfully
          </p>
        </div>
      )}
    </div>
  );
}
