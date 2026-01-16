"use client";

import React, { useState } from "react";
import { Mission } from "@voisss/shared/types/socialfi";
import { getTokenDisplaySymbol } from "@voisss/shared/config/platform";
import { TokenTier, TOKEN_METADATA, getTokenBuyUrl, formatTokenBalance, getMinBalanceForTier } from "@voisss/shared/config/tokenAccess";

interface MissionCardProps {
  mission: Mission;
  onAccept: () => void;
  isConnected: boolean;
  isAccepted?: boolean;
  className?: string;
  // NEW: Token access info
  userTier?: TokenTier;
  userBalance?: bigint;
  balanceStatus?: 'loading' | 'success' | 'stale' | 'fallback' | 'error';
}

// Difficulty color helper
const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy':
      return 'border-green-500/30 bg-green-500/10 text-green-300';
    case 'medium':
      return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300';
    case 'hard':
      return 'border-red-500/30 bg-red-500/10 text-red-300';
    default:
      return 'border-gray-500/30 bg-gray-500/10 text-gray-300';
  }
};

export default function MissionCard({
  mission,
  onAccept,
  isConnected,
  isAccepted = false,
  className = "",
  userTier = 'none',
  userBalance = 0n,
  balanceStatus = 'success'
}: MissionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept();
    } finally {
      setIsAccepting(false);
    }
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return "< 1h";
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  // NEW: Determine tier eligibility
  const getEligibility = () => {
    const requiredTier = mission.requiredTier || 'basic';
    const tierOrder: TokenTier[] = ['none', 'basic', 'pro', 'premium'];
    const userTierIndex = tierOrder.indexOf(userTier);
    const requiredTierIndex = tierOrder.indexOf(requiredTier);
    const isEligible = userTierIndex >= requiredTierIndex;
    
    let tokenGap = 0n;
    if (!isEligible && userBalance) {
      const tierMinBalance = getMinBalanceForTier(requiredTier);
      const gap = tierMinBalance - userBalance;
      tokenGap = gap > 0n ? gap : 0n;
    }
    
    return { requiredTier, isEligible, tokenGap };
  };

  const { requiredTier, isEligible, tokenGap } = getEligibility();

  return (
    <div className={`voisss-card group hover:border-[#7C5DFA]/30 transition-all duration-300 ${className} ${isAccepted ? 'border-indigo-500/40 bg-indigo-500/5' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white group-hover:text-[#7C5DFA] transition-colors mb-2">
            {mission.title}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
            {mission.description}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(mission.difficulty)}`}>
              {mission.difficulty.toUpperCase()}
            </span>
            <span className="text-xs text-gray-400">
              {formatDuration(mission.targetDuration)}
            </span>
            {mission.language !== 'en' && (
              <span className="text-xs text-gray-400">
                {mission.language.toUpperCase()}
              </span>
            )}
            {mission.locationBased && (
              <span className="text-xs text-gray-400">
                📍 Location-based
              </span>
            )}
          </div>
        </div>
        <div className="text-right ml-4 flex-shrink-0">
          <div className="text-lg font-bold text-[#7C5DFA]">
            {mission.baseReward} {getTokenDisplaySymbol()}
          </div>
          <div className="text-xs text-gray-400">
            {formatTimeRemaining(mission.expiresAt)}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
        {mission.description}
      </p>

      {/* Metadata Details */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-xs">Reward Model</span>
          <span className="text-xs capitalize">{mission.rewardModel}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-xs">{mission.currentParticipants} participants</span>
        </div>
      </div>

      {/* NEW: Eligibility indicator */}
      {isConnected && (
        <div className={`mt-4 p-3 rounded-lg text-sm space-y-2 ${
          isEligible 
            ? 'bg-green-500/10 border border-green-500/20' 
            : 'bg-red-500/10 border border-red-500/20'
        }`}>
          <div className="flex items-center justify-between">
            <span className={isEligible ? 'text-green-300' : 'text-red-300'}>
              {isEligible ? '✓ Eligible' : `⚠️ Requires ${requiredTier}`}
            </span>
            {balanceStatus === 'loading' && (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            )}
            {balanceStatus === 'stale' && (
              <span className="text-xs text-yellow-300">(data outdated)</span>
            )}
          </div>
          
          {!isEligible && tokenGap > 0n && (
            <div className="flex items-center justify-between text-xs">
              <span>Need {formatTokenBalance(tokenGap)} more</span>
              <a 
                href={getTokenBuyUrl('voisss')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7C5DFA] hover:underline font-semibold"
              >
                Get Tokens →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleAccept}
        disabled={!isConnected || (isConnected && !isEligible && mission.requiredTier) || isAccepting}
        className={`mt-3 w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
          !isConnected
            ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
            : isConnected && !isEligible && mission.requiredTier
              ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
            : isAccepted 
              ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30"
              : "bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white hover:from-[#6B4CE6] hover:to-[#8B7AFF] hover:scale-[1.02]"
        }`}
      >
        {isAccepting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {isAccepted ? "Opening..." : "Accepting..."}
          </>
        ) : !isConnected ? (
          "Connect Wallet to Accept"
        ) : !isEligible && mission.requiredTier ? (
          "Insufficient Tier"
        ) : isAccepted ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Record Submission
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Accept Mission
          </>
        )}
      </button>
    </div>
  );
}