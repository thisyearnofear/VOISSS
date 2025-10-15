"use client";

import React from "react";
import { ExternalLink, Shield } from "lucide-react";

// Type-safe icon wrapper to resolve React 18/19 compatibility issues
const CompatibleExternalLink = ExternalLink as React.ComponentType<{
  className?: string;
}>;
const CompatibleShield = Shield as React.ComponentType<{ className?: string }>;

export default function StarknetShowcase() {
  // Real deployed contract addresses (verifiable on Starkscan)
  const contracts = [
    {
      name: "VoiceStorage",
      address: "0x545b48dd76469e984b5622e5841d2affa30155980829399e7ec7447012922e2",
      description: "Stores voice recording metadata and IPFS hashes",
    },
    {
      name: "UserRegistry",
      address: "0x52bb03f52e7c07d6f7053b0fc7c52c9e0c7d73ceb36fab93db3d7bbc578bb63",
      description: "Manages user profiles and permissions",
    },
    {
      name: "AccessControl",
      address: "0x5db925a0dfe7ab9137121613ef66a32ceb48acbc9cc33091d804dd9feb983b5",
      description: "Handles access control and authorization",
    },
  ];

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

      {/* Contract Info - Compact View */}
      <div className="space-y-3">
        {contracts.map((contract, index) => (
          <div key={index} className="flex items-center justify-between bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm truncate">{contract.name}</h4>
              <p className="text-gray-400 text-xs truncate">{contract.description}</p>
            </div>
            <a
              href={`https://sepolia.starkscan.co/contract/${contract.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors text-xs text-blue-400 font-medium flex items-center gap-1.5 whitespace-nowrap"
            >
              View
              <CompatibleExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
