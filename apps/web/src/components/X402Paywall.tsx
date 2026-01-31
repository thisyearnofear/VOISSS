"use client";

import React from "react";
import { Lock, Play, Zap, Clock, CheckCircle } from "lucide-react";
import { useX402Payments, X402Payment } from "../hooks/useX402Payments";

interface X402PaywallProps {
  recordingId: string;
  title: string;
  x402Price: string;
  receiver: string;
  onAccessGranted: () => void;
  children: React.ReactNode;
}

export default function X402Paywall({
  recordingId,
  title,
  x402Price,
  receiver,
  onAccessGranted,
  children,
}: X402PaywallProps) {
  const {
    hasActiveSession,
    initiatePayment,
    isProcessing,
    requiresPayment,
    formatPrice,
  } = useX402Payments();

  const needsPayment = requiresPayment(x402Price);
  const hasAccess = hasActiveSession(recordingId);
  const isLocked = needsPayment && !hasAccess;

  const handlePayment = async () => {
    try {
      const payment: X402Payment = {
        amount: x402Price,
        receiver,
        asset: "ETH", // Default to ETH for now
      };

      const success = await initiatePayment(payment, recordingId);
      if (success) {
        onAccessGranted();
      }
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  // If no payment required or has access, render children
  if (!isLocked) {
    return <>{children}</>;
  }

  // Render paywall
  return (
    <div className="relative">
      {/* Blurred background content teaser */}
      <div className="blur-sm opacity-50 pointer-events-none select-none">
        {children}
      </div>

      {/* Paywall overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A]/80 backdrop-blur-sm rounded-xl z-10">
        <div className="w-full max-w-sm p-6 bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-2xl shadow-2xl">
          {/* Lock icon */}
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
            <Lock className="w-8 h-8 text-indigo-400" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white text-center mb-2">
            Premium Content
          </h3>
          <p className="text-gray-400 text-center text-sm mb-6">
            Unlock this agent commentary to access exclusive insights
          </p>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Play className="w-4 h-4 text-green-400" />
              <span>Full audio playback</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>24-hour access</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>x402 instant payment</span>
            </div>
          </div>

          {/* Price display */}
          <div className="text-center mb-6">
            <div className="text-3xl font-black text-white">
              {formatPrice(x402Price)}
              <span className="text-lg font-normal text-gray-400 ml-1">ETH</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              One-time unlock via x402 protocol
            </p>
          </div>

          {/* Pay button */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Unlock with x402</span>
              </>
            )}
          </button>

          {/* Security note */}
          <p className="text-center text-xs text-gray-500 mt-4">
            Secure on-chain payment via Base
          </p>
        </div>
      </div>
    </div>
  );
}

// Compact version for cards
export function X402PaywallBadge({
  x402Price,
  onClick,
}: {
  x402Price: string;
  onClick?: () => void;
}) {
  const { formatPrice } = useX402Payments();

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-full text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors"
    >
      <Lock className="w-3 h-3" />
      <span>{formatPrice(x402Price)} ETH</span>
    </button>
  );
}

// Access granted indicator
export function X402AccessGranted() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-medium text-green-400">
      <CheckCircle className="w-3 h-3" />
      <span>Unlocked</span>
    </div>
  );
}
