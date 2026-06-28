"use client";

import React, { useState } from "react";
import {
  X,
  CreditCard,
  Zap,
  Star,
  TrendingUp,
  CheckCircle,
  Loader2,
  Sparkles,
  Mic,
} from "lucide-react";

interface CreditPack {
  id: string;
  label: string;
  priceUSD: number;
  creditsUSD: number;
  bonusPercent: number;
  charactersApprox: number;
}

const PACKS: CreditPack[] = [
  {
    id: "starter",
    label: "Starter",
    priceUSD: 5,
    creditsUSD: 5,
    bonusPercent: 0,
    charactersApprox: 5_000_000,
  },
  {
    id: "builder",
    label: "Builder",
    priceUSD: 10,
    creditsUSD: 11,
    bonusPercent: 10,
    charactersApprox: 11_000_000,
  },
  {
    id: "pro",
    label: "Pro",
    priceUSD: 25,
    creditsUSD: 30,
    bonusPercent: 20,
    charactersApprox: 30_000_000,
  },
  {
    id: "scale",
    label: "Scale",
    priceUSD: 50,
    creditsUSD: 65,
    bonusPercent: 30,
    charactersApprox: 65_000_000,
  },
];

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentAddress?: string;
}

export function BuyCreditsModal({
  isOpen,
  onClose,
  agentAddress,
}: BuyCreditsModalProps) {
  const [selectedPack, setSelectedPack] = useState<CreditPack>(PACKS[1]); // Default: Builder
  const [walletAddress, setWalletAddress] = useState(agentAddress || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for active referral bonus
  const [referralBonus] = useState(() => {
    try {
      const refCode = sessionStorage.getItem("voisss_referral_code");
      if (refCode) {
        return {
          active: true,
          bonusPercent: 10,
          code: refCode,
        };
      }
    } catch { /* noop */ }
    return { active: false, bonusPercent: 0, code: null };
  });

  const handlePurchase = async () => {
    if (!walletAddress || !walletAddress.startsWith("0x")) {
      setError("Please enter your wallet address (starts with 0x)");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pack: selectedPack.id,
          agentAddress: walletAddress,
          successUrl: `${window.location.origin}/studio?credits=success&pack=${selectedPack.id}`,
          cancelUrl: `${window.location.origin}/studio?credits=cancelled`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0F0F0F] border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-[#2A2A2A] bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Buy Voice Credits</h2>
              <p className="text-sm text-gray-400">
                Pay with card • Credits added instantly • 70% to voice creators
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Pack Selector */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
              Choose a Pack
            </p>
            <div className="grid grid-cols-2 gap-3">
              {PACKS.map((pack) => {
                const isSelected = selectedPack.id === pack.id;
                const isPopular = pack.id === "builder";
                return (
                  <button
                    key={pack.id}
                    onClick={() => setSelectedPack(pack)}
                    className={`relative p-4 rounded-xl border text-left transition-all duration-200 ${
                      isSelected
                        ? "bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/10"
                        : "bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3A3A3A] hover:bg-[#1F1F1F]"
                    }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-2 left-3 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[10px] font-bold text-white">
                        POPULAR
                      </span>
                    )}
                    {pack.bonusPercent > 0 && (
                      <span className="absolute -top-2 right-3 px-2 py-0.5 bg-green-600 rounded-full text-[10px] font-bold text-white">
                        +{pack.bonusPercent}% BONUS
                      </span>
                    )}
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-lg font-bold text-white">
                        ${pack.priceUSD}
                      </span>
                      {pack.bonusPercent > 0 && (
                        <span className="text-xs text-green-400 font-semibold">
                          ${pack.creditsUSD} credit
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-300">
                      {pack.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ~{(pack.charactersApprox / 1_000_000).toFixed(0)}M chars
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* What you get */}
          <div className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-white">
                  ${selectedPack.creditsUSD} in voice API credits
                </p>
                <p className="text-xs text-gray-500">
                  ≈{" "}
                  {(selectedPack.charactersApprox / 1_000_000).toFixed(0)}M
                  characters • ~{" "}
                  {Math.round(selectedPack.charactersApprox / 750).toLocaleString()}{" "}
                  full articles
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">
                ${selectedPack.priceUSD}
              </p>
              {selectedPack.bonusPercent > 0 && (
                <p className="text-xs text-green-400">
                  Save {selectedPack.bonusPercent}%
                </p>
              )}
            </div>
          </div>

          {/* Referral bonus banner */}
          {referralBonus.active && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-900/30 to-green-900/30 border border-amber-500/30 rounded-xl">
              <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-200">
                  🎉 +10% referral bonus active!
                </p>
                <p className="text-xs text-amber-300/70">
                  You get <span className="font-bold text-green-300">10% more credits</span> on any purchase — thanks to the person who referred you.
                </p>
              </div>
            </div>
          )}

          {/* Wallet address */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Your Wallet Address (for credits)
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => {
                setWalletAddress(e.target.value);
                setError(null);
              }}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] focus:border-purple-500 rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-colors font-mono"
            />
            <p className="text-xs text-gray-600 mt-1.5">
              Credits are tied to this address. Any EVM wallet address works.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {/* CTA */}
          <button
            onClick={handlePurchase}
            disabled={isLoading || !walletAddress}
            id="buy-credits-checkout-btn"
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Redirecting to checkout…</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>
                  Pay ${selectedPack.priceUSD} with Card
                </span>
              </>
            )}
          </button>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span>Stripe secure checkout</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span>Instant activation</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              <span>No monthly fees</span>
            </div>
          </div>

          {/* Ethics note */}
          <p className="text-center text-xs text-gray-600 border-t border-[#1A1A1A] pt-4">
            🎤 70% of every purchase goes directly to voice contributors via smart contract
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact "Buy Credits" button — drop anywhere on the page
 */
export function BuyCreditsButton({
  agentAddress,
  variant = "primary",
  className = "",
}: {
  agentAddress?: string;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        id="buy-credits-trigger-btn"
        className={
          variant === "primary"
            ? `flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-purple-500/20 text-sm ${className}`
            : `flex items-center gap-2 px-4 py-2 border border-purple-500/40 hover:border-purple-500 text-purple-300 hover:text-white rounded-xl transition-all duration-200 text-sm ${className}`
        }
      >
        <Sparkles className="w-4 h-4" />
        <span>Buy Credits</span>
      </button>

      <BuyCreditsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        agentAddress={agentAddress}
      />
    </>
  );
}
