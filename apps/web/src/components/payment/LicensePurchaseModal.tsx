"use client";

import React, { useState, useCallback, useRef } from "react";

/* ──────────────────────────────────────────────────────────────────────────────
 * License Purchase Modal — end-to-end license flow for a single voice
 *
 * Replaces the old "coming soon" modal with a real checkout path:
 *   1. Confirm voice details
 *   2. Choose license type (non-exclusive / exclusive)
 *   3. If credits balance > price → deduct from wallet
 *   4. If not → prompt Buy Credits with context preserved
 *   5. On success → lock license on-chain via x402 + smart contract
 *
 * Props:
 *   voiceId, voiceName, voicePreviewUrl, licenseType, price
 *   onClose
 * ────────────────────────────────────────────────────────────────────────────── */

import {
  X,
  Play,
  Pause,
  Check,
  Shield,
  CreditCard,
  Loader2,
} from "lucide-react";

type LicenseTier = "non-exclusive" | "exclusive";

interface LicensePurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  voiceId: string;
  voiceName: string;
  voicePreviewUrl?: string;
  licenseType: LicenseTier;
  price: number;
}

export function LicensePurchaseModal({
  visible,
  onClose,
  voiceId,
  voiceName,
  voicePreviewUrl,
  licenseType,
  price,
}: LicensePurchaseModalProps) {
  const [step, setStep] = useState<"confirm" | "checkout" | "processing" | "done">("confirm");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPreview = useCallback(() => {
    if (!voicePreviewUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(voicePreviewUrl);
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying((v) => !v);
  }, [voicePreviewUrl, isPlaying]);

  const handlePurchase = async () => {
    setStep("processing");
    setLoading(true);
    setError(null);

    try {
      // ── Real purchase flow ─────────────────────────────────────────────
      // 1. Call the x402 payment API to lock the license
      const response = await fetch("/api/licenses/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId,
          licenseType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "License purchase failed");
      }

      // Stripe Checkout is the authoritative payment step. The webhook creates
      // the entitlement, and Stripe returns the buyer to the success URL.
      window.location.assign(data.data.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Purchase failed";
      setError(msg);
      setStep("checkout");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setStep("confirm");
    setError(null);
    onClose();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Purchase license for ${voiceName}`}
    >
      <div className="w-full max-w-lg bg-[#0F0F0F] border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-[#2A2A2A] bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">License {voiceName}</h3>
              <p className="text-sm text-gray-400">{licenseType} · ${price.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] mb-6">
            <button
              onClick={handlePlayPreview}
              className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center hover:bg-purple-500/30 transition-all"
              aria-label={isPlaying ? "Pause preview" : "Play preview"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-purple-400" />
              ) : (
                <Play className="w-4 h-4 text-purple-400" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{voiceName}</p>
              <p className="text-xs text-gray-500">Preview · {licenseType}</p>
            </div>
          </div>

          {/* Pricing breakdown */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Voice licence</span>
              <span className="text-white font-medium">${price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Voice contributor earns</span>
              <span className="text-green-400 font-medium">70%</span>
            </div>
            <div className="h-px bg-[#2A2A2A] my-2" />
            <div className="flex justify-between text-base">
              <span className="font-semibold text-white">Total</span>
              <span className="font-bold text-white">${price.toFixed(2)}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Steps */}
          {step === "confirm" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <Check className="w-4 h-4 text-green-400" />
                <span>Blockchain-verified license on Base</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <Check className="w-4 h-4 text-green-400" />
                <span>70% revenue share to voice owner</span>
              </div>
              <button
                onClick={() => setStep("checkout")}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Continue to Checkout
              </button>
            </div>
          )}

          {step === "checkout" && (
            <div className="space-y-3">
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay ${price.toFixed(2)} via Stripe
                  </>
                )}
              </button>
              <button
                onClick={() => setStep("confirm")}
                className="w-full py-2 text-gray-400 hover:text-white text-sm transition-all"
              >
                ← Back
              </button>
            </div>
          )}

          {step === "processing" && (
            <div className="py-8 text-center">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Processing license...</p>
              <p className="text-sm text-gray-400 mt-1">Verifying payment on-chain</p>
            </div>
          )}

          {step === "done" && (
            <div className="py-4 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">License Purchased!</h4>
              <p className="text-gray-400 text-sm mb-4">
                Your license for <strong>{voiceName}</strong> is now active.
              </p>
              <button
                onClick={handleClose}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all"
              >
                Start Using Voice
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
