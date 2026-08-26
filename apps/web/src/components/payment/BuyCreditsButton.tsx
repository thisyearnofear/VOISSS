/*
 * BuyCreditsButton — compact "Buy Credits" button that opens the modal
 * Drop anywhere on the page to trigger the checkout flow.
 *
 * Props:
 *   agentAddress: wallet address to pre-fill in checkout
 *   variant: "primary" | "ghost"
 *   className: additional Tailwind classes
 *   context: context to preserve through checkout (voiceId, voiceName, taskId)
 */
import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { BuyCreditsModal } from "./BuyCreditsModal";

export function BuyCreditsButton({
  agentAddress,
  variant = "primary",
  className = "",
  context,
}: {
  agentAddress?: string;
  variant?: "primary" | "ghost";
  className?: string;
  context?: {
    voiceId?: string;
    voiceName?: string;
    taskId?: string;
  };
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
        context={context}
      />
    </>
  );
}