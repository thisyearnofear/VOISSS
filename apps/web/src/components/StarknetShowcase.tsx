"use client";

import React from "react";
import { ExternalLink, Shield, Globe } from "lucide-react";

// Type-safe icon wrappers to resolve React 18/19 compatibility issues
const CompatibleExternalLink = ExternalLink as React.ComponentType<{
  className?: string;
}>;
const CompatibleShield = Shield as React.ComponentType<{ className?: string }>;
const CompatibleGlobe = Globe as React.ComponentType<{ className?: string }>;

interface ContractInfo {
  name: string;
  address: string;
  description: string;
}

export default function StarknetShowcase() {
  // Real deployed contract addresses (verifiable on Starkscan)
  const contracts: ContractInfo[] = [
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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-[#3A3A3A] rounded-2xl p-8 mb-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full mb-4">
          <CompatibleShield className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">
            Powered by Starknet
          </span>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Ultra-Low Fees, Ethereum Security
        </h2>
        <p className="text-gray-400">
          Experience the future of blockchain with sub-cent transaction costs
        </p>
      </div>

      {/* Deployed Contracts - Real and Verifiable */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <CompatibleGlobe className="w-5 h-5 text-blue-400" />
          Deployed Smart Contracts
        </h3>
        <div className="space-y-3">
          {contracts.map((contract, index) => (
            <div
              key={index}
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">{contract.name}</h4>
                <p className="text-gray-400 text-xs mb-2">{contract.description}</p>
                <p className="text-gray-500 text-xs font-mono break-all">
                  {contract.address}
                </p>
              </div>
              <a
                href={`https://sepolia.starkscan.co/contract/${contract.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors text-sm text-blue-400 font-medium flex items-center gap-2"
              >
                View on Starkscan
                <CompatibleExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Why Starknet - Honest Value Proposition */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 text-center">
          Why Starknet?
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400 mb-1">Ultra-Low Fees</div>
            <p className="text-sm text-gray-400">Sub-cent transactions for voice storage</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400 mb-1">Ethereum Security</div>
            <p className="text-sm text-gray-400">L2 scaling with L1 security guarantees</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400 mb-1">Permanent Storage</div>
            <p className="text-sm text-gray-400">IPFS + blockchain for true ownership</p>
          </div>
        </div>
      </div>
    </div>
  );
}
