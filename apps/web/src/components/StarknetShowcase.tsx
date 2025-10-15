"use client";

import React from "react";
import { ExternalLink, Shield } from "lucide-react";

// Type-safe icon wrapper to resolve React 18/19 compatibility issues
const CompatibleExternalLink = ExternalLink as React.ComponentType<{
  className?: string;
}>;
const CompatibleShield = Shield as React.ComponentType<{ className?: string }>;

export default function StarknetShowcase() {
  return (
    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-[#3A3A3A] rounded-2xl p-8 mb-12">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full mb-4">
          <CompatibleShield className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">
            Powered by Starknet
          </span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Ultra-Low Fees • Ethereum Security
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Your voice recordings are stored securely on decentralized networks with sub-cent transactions and enterprise-grade security.
        </p>
      </div>

      <div className="flex justify-center gap-4 mt-6">
        <a
          href="https://sepolia.starkscan.co/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors text-blue-400 font-medium flex items-center gap-2"
        >
          View on Starkscan
          <CompatibleExternalLink className="w-4 h-4" />
        </a>
        <a
          href="#learn-more"
          className="px-4 py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg hover:bg-gray-500/30 transition-colors text-gray-400 font-medium"
        >
          Learn More
        </a>
      </div>
    </div>
  );
}
