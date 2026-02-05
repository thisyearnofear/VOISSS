"use client";

import React, { useState } from "react";
import { Lock, Play, Zap, Clock, CheckCircle, Wallet, Coins, Crown } from "lucide-react";
import { usePayments, useServiceAccess } from "../hooks/usePayments";
import { ServiceType, formatUSDC } from "@voisss/shared";

interface X402PaywallProps {
  recordingId: string;
  title: string;
  service: ServiceType;
  quantity: number;
  receiver: string;
  onAccessGranted: () => void;
  children: React.ReactNode;
}

/**
 * X402Paywall Component
 * 
 * Unified paywall supporting multiple payment methods:
 * - Prepaid credits (for agents)
 * - Token-gated tier access (for $VOISSS holders)
 * - x402 USDC payment (universal fallback)
 * 
 * Core Principles:
 * - Show best payment option first
 * - Allow method switching
 * - Clear pricing and benefits
 */
export default function X402Paywall({
  recordingId,
  title,
  service,
  quantity,
  receiver,
  onAccessGranted,
  children,
}: X402PaywallProps) {
  const { 
    quote, 
    pay, 
    isLoading, 
    isQuoting,
    isPaying,
    lastResult,
    error,
    canPayWithoutX402,
  } = usePayments({
    service,
    quantity,
    autoQuote: true,
  });

  const [selectedMethod, setSelectedMethod] = useState<'auto' | 'credits' | 'tier' | 'x402'>('auto');
  const [showMethodSelector, setShowMethodSelector] = useState(false);

  // Determine if we need to show paywall
  const needsPayment = !lastResult?.success && !canPayWithoutX402;
  const hasAccess = lastResult?.success || canPayWithoutX402;
  const isLocked = needsPayment && !hasAccess;

  const handlePayment = async () => {
    const method = selectedMethod === 'auto' ? undefined : selectedMethod;
    const result = await pay(method);
    
    if (result.success) {
      onAccessGranted();
    }
  };

  // If no payment required or has access, render children
  if (!isLocked) {
    return <>{children}</>;
  }

  // Get display cost
  const displayCost = quote ? formatUSDC(quote.estimatedCost) : '$--';
  
  // Determine which methods are available
  const hasCredits = quote?.availableMethods.includes('credits');
  const hasTier = quote?.availableMethods.includes('tier');
  const hasX402 = quote?.availableMethods.includes('x402');

  // Render paywall
  return (
    <div className="relative">
      {/* Blurred background content teaser */}
      <div className="blur-sm opacity-50 pointer-events-none select-none">
        {children}
      </div>

      {/* Paywall overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A]/80 backdrop-blur-sm rounded-xl z-10">
        <div className="w-full max-w-md p-6 bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-2xl shadow-2xl">
          {/* Lock icon */}
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-indigo-500/30">
            <Lock className="w-8 h-8 text-indigo-400" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white text-center mb-2">
            Premium Content
          </h3>
          <p className="text-gray-400 text-center text-sm mb-6">
            Unlock this {service.replace('_', ' ')} to access exclusive content
          </p>

          {/* Payment Method Selector */}
          {showMethodSelector && (
            <div className="space-y-2 mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Select Payment Method
              </p>
              
              {hasCredits && (
                <PaymentMethodButton
                  icon={<Wallet className="w-4 h-4" />}
                  label="Use Credits"
                  description={`${quote?.creditsAvailable ? formatUSDC(quote.creditsAvailable) : '$0.00'} available`}
                  selected={selectedMethod === 'credits'}
                  onClick={() => setSelectedMethod('credits')}
                />
              )}
              
              {hasTier && (
                <PaymentMethodButton
                  icon={<Crown className="w-4 h-4" />}
                  label={`${quote?.currentTier} Tier Access`}
                  description="Included with your token holdings"
                  selected={selectedMethod === 'tier'}
                  onClick={() => setSelectedMethod('tier')}
                />
              )}
              
              {hasX402 && (
                <PaymentMethodButton
                  icon={<Coins className="w-4 h-4" />}
                  label="Pay with USDC"
                  description={`${displayCost} via x402`}
                  selected={selectedMethod === 'x402'}
                  onClick={() => setSelectedMethod('x402')}
                />
              )}
              
              <button
                onClick={() => setShowMethodSelector(false)}
                className="text-xs text-gray-500 hover:text-gray-400 mt-2"
              >
                ← Back
              </button>
            </div>
          )}

          {!showMethodSelector && (
            <>
              {/* Benefits */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Play className="w-4 h-4 text-green-400" />
                  <span>Full access to content</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Instant unlock</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Multiple payment options</span>
                </div>
              </div>

              {/* Price display */}
              <div className="text-center mb-6">
                {quote?.recommendedMethod === 'tier' && hasTier ? (
                  <div className="text-2xl font-bold text-green-400">
                    {quote.estimatedCost === 0n ? 'Whitelisted / Included' : 'Included'}
                    <span className="text-sm font-normal text-gray-400 ml-2">
                      {quote.estimatedCost === 0n ? 'Free access' : `with ${quote.currentTier} tier`}
                    </span>
                  </div>
                ) : quote?.recommendedMethod === 'credits' && hasCredits ? (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-blue-400">
                      Use Credits
                      <span className="text-sm font-normal text-gray-400 ml-2">
                        {formatUSDC(quote.estimatedCost)}
                      </span>
                    </div>
                    {quote.discountPercent > 0 && (
                      <p className="text-xs text-green-400 font-medium">
                        {quote.discountPercent}% Tier Discount Applied
                        <span className="text-gray-500 line-through ml-1.5">{formatUSDC(quote.baseCost)}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-3xl font-black text-white">
                      {displayCost}
                      <span className="text-lg font-normal text-gray-400 ml-1">USDC</span>
                    </div>
                    {quote && quote.discountPercent > 0 && (
                      <p className="text-xs text-green-400 font-medium">
                        {quote.discountPercent}% Tier Discount Applied
                        <span className="text-gray-500 line-through ml-1.5">{formatUSDC(quote.baseCost)}</span>
                      </p>
                    )}
                  </div>
                )}
                
                {/* Method indicator */}
                <p className="text-xs text-gray-500 mt-1">
                  {quote?.recommendedMethod === 'tier' && hasTier
                    ? (quote.estimatedCost === 0n ? 'Complimentary access enabled' : 'Token-gated access')
                    : quote?.recommendedMethod === 'credits' && hasCredits
                    ? 'Deduct from prepaid credits'
                    : 'Pay via x402 protocol'}
                </p>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  onClick={handlePayment}
                  disabled={isLoading || !quote}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isQuoting ? 'Getting quote...' : 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      {quote?.recommendedMethod === 'tier' && hasTier ? (
                        <>
                          <Crown className="w-5 h-5" />
                          <span>Unlock with Tier</span>
                        </>
                      ) : quote?.recommendedMethod === 'credits' && hasCredits ? (
                        <>
                          <Wallet className="w-5 h-5" />
                          <span>Use Credits</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          <span>Pay with USDC</span>
                        </>
                      )}
                    </>
                  )}
                </button>

                {/* Alternative methods toggle */}
                {(hasCredits || hasTier) && hasX402 && (
                  <button
                    onClick={() => setShowMethodSelector(true)}
                    className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Choose different payment method
                  </button>
                )}
              </div>

              {/* Error message */}
              {error && (
                <p className="text-center text-sm text-red-400 mt-4">
                  {error.message}
                </p>
              )}

              {/* Security note */}
              <p className="text-center text-xs text-gray-500 mt-4">
                Secure on-chain payment via Base
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for payment method selection
function PaymentMethodButton({
  icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
        selected
          ? 'bg-indigo-500/20 border-indigo-500/50'
          : 'bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3A3A3A]'
      }`}
    >
      <div className={`${selected ? 'text-indigo-400' : 'text-gray-400'}`}>
        {icon}
      </div>
      <div className="text-left flex-1">
        <p className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-300'}`}>
          {label}
        </p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {selected && (
        <CheckCircle className="w-4 h-4 text-indigo-400" />
      )}
    </button>
  );
}

// Compact version for cards
export function X402PaywallBadge({
  price,
  onClick,
  method,
}: {
  price: string;
  onClick?: () => void;
  method?: 'credits' | 'tier' | 'x402';
}) {
  const icons = {
    credits: <Wallet className="w-3 h-3" />,
    tier: <Crown className="w-3 h-3" />,
    x402: <Coins className="w-3 h-3" />,
  };

  const labels = {
    credits: 'Credits',
    tier: 'Tier',
    x402: 'USDC',
  };

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-full text-xs font-medium text-indigo-300 hover:bg-indigo-500/30 transition-colors"
    >
      <Lock className="w-3 h-3" />
      {method && icons[method]}
      <span>{method ? labels[method] : price}</span>
    </button>
  );
}

// Access granted indicator
export function X402AccessGranted({ method }: { method?: string }) {
  const labels: Record<string, string> = {
    credits: 'Credits',
    tier: 'Tier Access',
    x402: 'Paid',
  };

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-medium text-green-400">
      <CheckCircle className="w-3 h-3" />
      <span>{method ? `Unlocked (${labels[method]})` : 'Unlocked'}</span>
    </div>
  );
}
