"use client";

import React from "react";
import { BaseModal } from "@voisss/ui";
import { Play, Zap, ArrowRight } from "lucide-react";

interface LicensePurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  voice: {
    id: string;
    name?: string;
    voiceProfile?: { tone?: string; language?: string };
  } | null;
  licenseType: "exclusive" | "non-exclusive";
  onTryDemo: (voiceId: string) => void;
  onBuyCredits: () => void;
}

export function LicensePurchaseModal({
  visible,
  onClose,
  voice,
  licenseType,
  onTryDemo,
  onBuyCredits,
}: LicensePurchaseModalProps) {
  if (!voice) return null;

  const price = licenseType === "exclusive" ? "$490" : "$49";

  return (
    <BaseModal visible={visible} onClose={onClose} title="Use This Voice">
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

        <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
          <p className="text-xs text-purple-200">
            For user testing: try this voice free in the demo, or buy API credits for your app.
            Monthly licenses ({price}/mo) via USDC are coming soon.
          </p>
        </div>

        <button
          onClick={() => {
            onTryDemo(voice.id);
            onClose();
          }}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Try Free in Demo
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            onBuyCredits();
            onClose();
          }}
          className="w-full py-3 bg-[#2A2A35] hover:bg-[#3A3A45] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Buy API Credits — $5 for 5M chars
        </button>
      </div>
    </BaseModal>
  );
}
