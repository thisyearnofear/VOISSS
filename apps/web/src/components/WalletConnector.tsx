"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { StarknetkitConnector, useStarknetkitConnectModal } from "starknetkit";
import { handleWebwalletLogoutEvent } from "starknetkit/webwallet";

export default function WalletConnector() {
  const { address, isConnected } = useAccount();
  const { connect: connectStarknet, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isClient, setIsClient] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Enhanced Starknetkit modal integration
  const { starknetkitConnectModal } = useStarknetkitConnectModal({
    connectors: connectors as any,
    modalTheme: "dark",
  });

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle webwallet logout events
  useEffect(() => {
    handleWebwalletLogoutEvent(disconnect);
  }, [disconnect]);

  const handleConnect = async () => {
    try {
      setConnectionError(null);
      const { connector } = await starknetkitConnectModal();
      if (!connector) {
        return;
      }
      await connectStarknet({ connector: connector as any });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setConnectionError(
        error instanceof Error ? error.message : "Failed to connect wallet"
      );
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setConnectionError(null);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isClient) {
    return null;
  }

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

      {connectionError && (
        <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded-lg">
          <p className="text-red-300 text-sm">{connectionError}</p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        Supports ArgentX, Braavos, and other Starknet wallets
      </div>
    </div>
  );
}
