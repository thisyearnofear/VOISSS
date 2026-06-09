"use client";

import React, { useState, useCallback } from "react";
import { BaseModal } from "@voisss/ui";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

type PurchaseStep = "confirm" | "paying" | "success" | "error";

interface LicensePurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  voice: {
    id: string;
    name?: string;
    voiceProfile?: { tone?: string; language?: string };
  } | null;
  licenseType: "exclusive" | "non-exclusive";
  onPurchase: (voiceId: string) => Promise<{ success: boolean; licenseId?: string; error?: string }>;
}

export function LicensePurchaseModal({
  visible,
  onClose,
  voice,
  licenseType,
  onPurchase,
}: LicensePurchaseModalProps) {
  const [step, setStep] = useState<PurchaseStep>("confirm");
  const [error, setError] = useState<string | null>(null);
  const [licenseId, setLicenseId] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setStep("confirm");
    setError(null);
    setLicenseId(null);
    onClose();
  }, [onClose]);

  const handlePurchase = async () => {
    if (!voice) return;
    setStep("paying");
    setError(null);

    try {
      const result = await onPurchase(voice.id);
      if (result.success) {
        setLicenseId(result.licenseId || null);
        setStep("success");
      } else {
        setError(result.error || "Purchase failed");
        setStep("error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setStep("error");
    }
  };

  if (!voice) return null;

  const price = licenseType === "exclusive" ? "$0.49" : "$0.049";

  return (
    <BaseModal visible={visible} onClose={handleClose} title="License Voice">
      {step === "confirm" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#2A2A35] bg-[#121214] p-4">
            <div className="text-sm text-gray-400 mb-1">Voice</div>
            <div className="text-white font-semibold">
              {voice.name || voice.voiceProfile?.tone || voice.id}
            </div>
            {voice.voiceProfile?.language && (
              <div className="text-xs text-gray-500 mt-1">{voice.voiceProfile.language}</div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">License type</span>
            <span className="text-white font-medium capitalize">{licenseType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Price</span>
            <span className="text-white font-bold text-lg">{price} USDC</span>
          </div>

          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
            <p className="text-xs text-blue-300">
              Payment via x402 protocol on Base. Requires USDC in your connected wallet.
            </p>
          </div>

          <button
            onClick={handlePurchase}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all"
          >
            Purchase License
          </button>
        </div>
      )}

      {step === "paying" && (
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Processing Payment</h3>
          <p className="text-gray-400 text-sm">
            Confirm the transaction in your wallet...
          </p>
        </div>
      )}

      {step === "success" && (
        <div className="text-center py-6 space-y-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <h3 className="text-lg font-semibold text-white">License Active</h3>
          <p className="text-gray-400 text-sm">
            You can now use this voice via the API.
          </p>
          {licenseId && (
            <div className="rounded-lg bg-[#121214] border border-[#2A2A35] p-3">
              <div className="text-xs text-gray-500">License ID</div>
              <div className="text-sm text-white font-mono break-all">{licenseId}</div>
            </div>
          )}
          <button
            onClick={handleClose}
            className="w-full py-3 bg-[#2A2A35] hover:bg-[#3A3A45] text-white font-medium rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      )}

      {step === "error" && (
        <div className="text-center py-6 space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-semibold text-white">Purchase Failed</h3>
          <p className="text-red-400 text-sm">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setStep("confirm")}
              className="flex-1 py-3 bg-[#2A2A35] hover:bg-[#3A3A45] text-white font-medium rounded-xl transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleClose}
              className="flex-1 py-3 border border-[#2A2A35] text-gray-400 hover:text-white font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </BaseModal>
  );
}
