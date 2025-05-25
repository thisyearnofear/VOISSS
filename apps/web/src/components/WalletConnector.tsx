"use client";

import React from "react";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { connect } from "starknetkit";

export default function WalletConnector() {
  const { address, isConnected } = useAccount();
  const { connect: connectStarknet, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = async () => {
    try {
      const { connector } = await connect({
        connectors: connectors,
      });
      if (connector) {
        await connectStarknet({ connector });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="voisss-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Wallet Connected
            </h3>
            <p className="text-sm text-gray-400 font-mono">
              {formatAddress(address)}
            </p>
          </div>
          <button
            onClick={() => disconnect()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="voisss-card text-center">
      <div className="mb-4">
        <div className="w-16 h-16 bg-[#7C5DFA] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Connect Your Starknet Wallet
        </h3>
        <p className="text-gray-400 mb-6">
          Connect your wallet to store recordings on Starknet and access
          decentralized features
        </p>
      </div>

      <button onClick={handleConnect} className="voisss-btn-primary w-full">
        Connect Wallet
      </button>

      <div className="mt-4 text-xs text-gray-500">
        Supports ArgentX, Braavos, and other Starknet wallets
      </div>
    </div>
  );
}
