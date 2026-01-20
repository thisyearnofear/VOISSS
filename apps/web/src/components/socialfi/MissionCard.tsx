"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Mission } from "@voisss/shared/types/socialfi";
import { getTokenDisplaySymbol } from "@voisss/shared/config/platform";
import { TokenTier, getTokenBuyUrl, formatTokenBalance, getMinBalanceForTier } from "@voisss/shared/config/tokenAccess";

interface MissionCardProps {
  mission: Mission;
  onAccept: () => void;
  isConnected: boolean;
  isAccepted?: boolean;
  className?: string;
  // Enhanced token access info - CLEAN interface
  userTier?: TokenTier;
  userBalance?: bigint;
  balanceStatus?: 'loading' | 'success' | 'stale' | 'fallback' | 'error';
}

// PERFORMANT: Memoized difficulty color helper - single source of truth
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

// PERFORMANT: Memoized time formatting - CLEAN utility functions
const formatTimeRemaining = (expiresAt: Date): string => {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();

  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return "< 1h";
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
};

// ENHANCEMENT FIRST: Enhanced MissionCard with React.memo for performance optimization
const MissionCard = React.memo<MissionCardProps>(({
  mission,
  onAccept,
  isConnected,
  isAccepted = false,
  className = "",
  userTier = 'none',
  userBalance = 0n,
  balanceStatus = 'success'
}) => {
  const [isAccepting, setIsAccepting] = useState(false);

  // PERFORMANT: Memoized expensive calculations
  const memoizedTimeRemaining = useMemo(() =>
    formatTimeRemaining(mission.expiresAt),
    [mission.expiresAt]
  );

  const memoizedDuration = useMemo(() =>
    formatDuration(mission.targetDuration),
    [mission.targetDuration]
  );

  const memoizedDifficultyColor = useMemo(() =>
    getDifficultyColor(mission.difficulty),
    [mission.difficulty]
  );

  // PERFORMANT: Memoized eligibility calculation - CLEAN business logic
  const eligibilityInfo = useMemo(() => {
    const requiredTier = mission.requiredTier || 'none';
    const tierOrder: TokenTier[] = ['none', 'basic', 'pro', 'premium'];
    const userTierIndex = tierOrder.indexOf(userTier);
    const requiredTierIndex = tierOrder.indexOf(requiredTier);
    const isEligible = userTierIndex >= requiredTierIndex;

    let tokenGap = 0n;
    if (!isEligible && userBalance && requiredTier !== 'none') {
      const tierMinBalance = getMinBalanceForTier(requiredTier);
      const gap = tierMinBalance - userBalance;
      tokenGap = gap > 0n ? gap : 0n;
    }

    return { requiredTier, isEligible, tokenGap };
  }, [mission.requiredTier, userTier, userBalance]);

  // PERFORMANT: Memoized reward display
  const rewardDisplay = useMemo(() =>
    `${mission.baseReward} ${getTokenDisplaySymbol()}`,
    [mission.baseReward]
  );

  // CLEAN: Optimized event handlers with useCallback
  const handleAccept = useCallback(async () => {
    setIsAccepting(true);
    try {
      await onAccept();
    } finally {
      setIsAccepting(false);
    }
  }, [onAccept]);

  // PERFORMANT: Memoized button state calculation
  const buttonState = useMemo(() => {
    if (!isConnected) {
      return {
        disabled: true,
        text: "Connect Wallet to Accept",
        className: "bg-gray-500/20 text-gray-400 cursor-not-allowed"
      };
    }

    if (isConnected && !eligibilityInfo.isEligible && mission.requiredTier && mission.requiredTier !== 'none') {
      return {
        disabled: true,
        text: "Insufficient Tier",
        className: "bg-gray-500/20 text-gray-400 cursor-not-allowed"
      };
    }

    if (isAccepted) {
      return {
        disabled: false,
        text: isAccepting ? "Opening..." : "Record Submission",
        className: "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30",
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )
      };
    }

    return {
      disabled: false,
      text: isAccepting ? "Accepting..." : "Accept Mission",
      className: "bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white hover:from-[#6B4CE6] hover:to-[#8B7AFF] hover:scale-[1.02]",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    };
  }, [isConnected, eligibilityInfo.isEligible, mission.requiredTier, isAccepted, isAccepting]);

  return (
    <div className={`voisss-card group hover:border-[#7C5DFA]/30 transition-all duration-300 ${className} ${isAccepted ? 'border-indigo-500/40 bg-indigo-500/5' : ''}`}>
      {/* Header - CLEAN layout structure */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white group-hover:text-[#7C5DFA] transition-colors mb-2">
            {mission.title}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
            {mission.description}
          </p>

          {/* CLEAN: Consolidated metadata badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${memoizedDifficultyColor}`}>
              {mission.difficulty.toUpperCase()}
            </span>
            <span className="text-xs text-gray-400">
              {memoizedDuration}
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

        {/* PERFORMANT: Memoized reward display */}
        <div className="text-right ml-4 flex-shrink-0">
          <div className="text-lg font-bold text-[#7C5DFA]">
            {rewardDisplay}
          </div>
          <div className="text-xs text-gray-400">
            {memoizedTimeRemaining}
          </div>
        </div>
      </div>

      {/* CLEAN: Mission metadata grid */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-xs">Reward Model</span>
          <span className="text-xs capitalize">{mission.rewardModel}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-xs">{mission.currentParticipants} participants</span>
        </div>
      </div>

      {/* ENHANCEMENT FIRST: Enhanced eligibility indicator */}
      {isConnected && (
        <div className={`mt-4 p-3 rounded-lg text-sm space-y-2 ${eligibilityInfo.isEligible
            ? 'bg-green-500/10 border border-green-500/20'
            : 'bg-red-500/10 border border-red-500/20'
          }`}>
          <div className="flex items-center justify-between">
            <span className={eligibilityInfo.isEligible ? 'text-green-300' : 'text-red-300'}>
              {eligibilityInfo.isEligible ? '✓ Eligible' : `⚠️ Requires ${eligibilityInfo.requiredTier}`}
            </span>
            {balanceStatus === 'loading' && (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            )}
            {balanceStatus === 'stale' && (
              <span className="text-xs text-yellow-300">(data outdated)</span>
            )}
          </div>

          {!eligibilityInfo.isEligible && eligibilityInfo.tokenGap > 0n && (
            <div className="flex items-center justify-between text-xs">
              <span>Need {formatTokenBalance(eligibilityInfo.tokenGap)} more</span>
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

      {/* PERFORMANT: Optimized action button */}
      <button
        onClick={handleAccept}
        disabled={buttonState.disabled || isAccepting}
        className={`mt-3 w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${buttonState.className}`}
      >
        {isAccepting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {buttonState.text}
          </>
        ) : (
          <>
            {buttonState.icon}
            {buttonState.text}
          </>
        )}
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  // PERFORMANT: Custom comparison function for selective re-rendering
  // Only re-render if these specific props change
  return (
    prevProps.mission.id === nextProps.mission.id &&
    prevProps.mission.currentParticipants === nextProps.mission.currentParticipants &&
    prevProps.mission.baseReward === nextProps.mission.baseReward &&
    prevProps.isConnected === nextProps.isConnected &&
    prevProps.isAccepted === nextProps.isAccepted &&
    prevProps.userTier === nextProps.userTier &&
    prevProps.userBalance === nextProps.userBalance &&
    prevProps.balanceStatus === nextProps.balanceStatus
  );
});

// CLEAN: Set display name for debugging
MissionCard.displayName = 'MissionCard';

export default MissionCard;