"use client";

import React, { useState, useEffect } from "react";
import { ExternalLink, Zap, Shield, Globe, TrendingUp } from "lucide-react";

// Type-safe icon wrappers to resolve React 18/19 compatibility issues
const CompatibleExternalLink = ExternalLink as React.ComponentType<{
  className?: string;
}>;
const CompatibleZap = Zap as React.ComponentType<{ className?: string }>;
const CompatibleShield = Shield as React.ComponentType<{ className?: string }>;
const CompatibleGlobe = Globe as React.ComponentType<{ className?: string }>;
const CompatibleTrendingUp = TrendingUp as React.ComponentType<{
  className?: string;
}>;

interface NetworkStats {
  gasPrice: string;
  tps: number;
  blockTime: string;
  totalTxs: number;
}

interface ContractInfo {
  name: string;
  address: string;
  txCount: number;
}

export default function StarknetShowcase() {
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    gasPrice: "0.000001",
    tps: 1247,
    blockTime: "2.3s",
    totalTxs: 15420,
  });

  const [contracts] = useState<ContractInfo[]>([
    {
      name: "VoiceStorage",
      address:
        "0x545b48dd76469e984b5622e5841d2affa30155980829399e7ec7447012922e2",
      txCount: 342,
    },
    {
      name: "UserRegistry",
      address:
        "0x52bb03f52e7c07d6f7053b0fc7c52c9e0c7d73ceb36fab93db3d7bbc578bb63",
      txCount: 156,
    },
    {
      name: "AccessControl",
      address:
        "0x5db925a0dfe7ab9137121613ef66a32ceb48acbc9cc33091d804dd9feb983b5",
      txCount: 89,
    },
  ]);

  // Simulate live network updates
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkStats((prev) => ({
        ...prev,
        tps: Math.max(800, prev.tps + Math.floor(Math.random() * 100) - 50),
        totalTxs: prev.totalTxs + Math.floor(Math.random() * 5),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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

      {/* Network Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <CompatibleZap className="w-5 h-5 text-yellow-400 mr-2" />
            <span className="text-xl font-bold text-white">
              {networkStats.gasPrice} ETH
            </span>
          </div>
          <p className="text-gray-400 text-sm">Avg Gas Price</p>
        </div>

        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <CompatibleTrendingUp className="w-5 h-5 text-green-400 mr-2" />
            <span className="text-xl font-bold text-white">
              {networkStats.tps.toLocaleString()}
            </span>
          </div>
          <p className="text-gray-400 text-sm">Transactions/sec</p>
        </div>

        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <CompatibleGlobe className="w-5 h-5 text-blue-400 mr-2" />
            <span className="text-xl font-bold text-white">
              {networkStats.blockTime}
            </span>
          </div>
          <p className="text-gray-400 text-sm">Block Time</p>
        </div>

        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <CompatibleShield className="w-5 h-5 text-purple-400 mr-2" />
            <span className="text-xl font-bold text-white">
              {networkStats.totalTxs.toLocaleString()}
            </span>
          </div>
          <p className="text-gray-400 text-sm">Total Transactions</p>
        </div>
      </div>

      {/* Deployed Contracts */}
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
              <div>
                <h4 className="font-semibold text-white">{contract.name}</h4>
                <p className="text-gray-400 text-sm font-mono">
                  {formatAddress(contract.address)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-400">Transactions</p>
                  <p className="font-semibold text-white">{contract.txCount}</p>
                </div>
                <a
                  href={`https://sepolia.starkscan.co/contract/${contract.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <CompatibleExternalLink className="w-4 h-4 text-blue-400" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Comparison */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 text-center">
          Cost Comparison
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400 mb-2">$15.50</div>
            <p className="text-gray-400 mb-1">Ethereum Mainnet</p>
            <p className="text-sm text-gray-500">Voice recording transaction</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">$0.001</div>
            <p className="text-gray-400 mb-1">Starknet</p>
            <p className="text-sm text-gray-500">
              Same transaction, 15,500x cheaper!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
