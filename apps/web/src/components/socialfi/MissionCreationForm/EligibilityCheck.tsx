"use client";

import React from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { getTokenDisplaySymbol } from "@voisss/shared/config/platform";

interface EligibilityCheckProps {
  onContinue?: () => void;
}

export default function EligibilityCheck({ onContinue }: EligibilityCheckProps) {
  const { isConnected, isCreatorEligible, isCheckingEligibility, creatorBalance } = useAuth();

  if (!isConnected) {
    return (
      <div className="voisss-card text-center py-8">
        <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet First</h3>
        <p className="text-gray-400">You need to connect your wallet to create missions.</p>
      </div>
    );
  }

  if (isCheckingEligibility) {
    return (
      <div className="voisss-card text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] rounded-full mb-4">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-400">Checking your eligibility...</p>
      </div>
    );
  }

  if (!isCreatorEligible) {
    const balance = creatorBalance ? (Number(creatorBalance) / Math.pow(10, 18)).toFixed(2) : "0";
    return (
      <div className="voisss-card">
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-left">
            <p className="text-red-400 font-medium">Insufficient Balance</p>
            <p className="text-red-300 text-sm mt-1">
              To create missions, you need at least <strong>1,000,000 {getTokenDisplaySymbol()}</strong>
            </p>
            <p className="text-red-300 text-sm">
              Your current balance: <strong>{balance} {getTokenDisplaySymbol()}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Eligible - render nothing, parent will show form
  return null;
}
