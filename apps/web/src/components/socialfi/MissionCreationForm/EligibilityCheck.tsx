"use client";

import React from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useTokenAccess } from "@voisss/shared/hooks/useTokenAccess";
import { PLATFORM_CONFIG } from "@voisss/shared/config/platform";
import { formatTokenBalance } from "@voisss/shared/config/tokenAccess";

interface EligibilityCheckProps {
  onContinue?: () => void;
}

export default function EligibilityCheck({ onContinue }: EligibilityCheckProps) {
  const { isConnected, isCheckingEligibility, address, isCreatorEligible } = useAuth();
  
  // Fetch $voisss balance for platform tier requirement
  const { balance: voisssBalance, tier, isLoading: isLoadingVoisss } = useTokenAccess({
    address,
  });

  if (!isConnected) {
    return (
      <div className="voisss-card text-center py-8">
        <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet First</h3>
        <p className="text-gray-400">You need to connect your wallet to create missions.</p>
      </div>
    );
  }

  if (isCheckingEligibility || isLoadingVoisss) {
    return (
      <div className="voisss-card text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] rounded-full mb-4">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-400">Checking your eligibility...</p>
      </div>
    );
  }

  // Check both token requirements
  const meetsVoisssRequirement = tier && tier !== 'none';
  const meetsPapajamsRequirement = isCreatorEligible;

  if (!meetsPapajamsRequirement || !meetsVoisssRequirement) {
    return (
      <div className="voisss-card space-y-4">
        <div className="border-b border-white/10 pb-4">
          <h3 className="text-lg font-semibold text-white mb-4">Mission Creator Requirements</h3>
        </div>

        {/* $papajams requirement */}
        <div className={`flex items-start gap-3 p-4 rounded-lg border ${
          meetsPapajamsRequirement 
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className={`w-5 h-5 rounded-full mt-0.5 flex-shrink-0 text-lg ${
            meetsPapajamsRequirement ? 'text-green-400' : 'text-red-400'
          }`}>
            {meetsPapajamsRequirement ? '✓' : '✗'}
          </div>
          <div className="text-left flex-1">
            <p className={`font-medium ${meetsPapajamsRequirement ? 'text-green-300' : 'text-red-300'}`}>
              📊 $papajams: Creator Stake (1M minimum)
            </p>
            <p className="text-sm opacity-75 mt-1">
              Ensures you have skin in the game. You'll receive 70% of all rewards from your mission as $papajams.
            </p>
          </div>
        </div>

        {/* $voisss requirement */}
        <div className={`flex items-start gap-3 p-4 rounded-lg border ${
          meetsVoisssRequirement 
            ? 'bg-blue-500/10 border-blue-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className={`w-5 h-5 rounded-full mt-0.5 flex-shrink-0 text-lg ${
            meetsVoisssRequirement ? 'text-blue-400' : 'text-red-400'
          }`}>
            {meetsVoisssRequirement ? '✓' : '✗'}
          </div>
          <div className="text-left flex-1">
            <p className={`font-medium ${meetsVoisssRequirement ? 'text-blue-300' : 'text-red-300'}`}>
              💜 $voisss: Platform Tier (10k+ minimum = Basic tier)
            </p>
            <p className="text-sm opacity-75 mt-1">
              Demonstrates platform commitment. Unlocks creator features and 30% platform allocation goes to ecosystem support.
            </p>
            {!meetsVoisssRequirement && voisssBalance && (
              <p className="text-sm mt-2">
                Current: {formatTokenBalance(voisssBalance)} $voisss (Need 10k+)
              </p>
            )}
          </div>
        </div>

        {!meetsPapajamsRequirement || !meetsVoisssRequirement ? (
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
            <p className="text-gray-400 text-sm">
              You don't meet all requirements yet. Acquire the necessary tokens and try again.
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  // Eligible - render nothing, parent will show form
  return null;
}
