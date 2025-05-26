"use client";

import React, { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";

export default function WalletConnector() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isClient, setIsClient] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showConnectors, setShowConnectors] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleConnect = async (connector: any) => {
    try {
      setConnectionError(null);
      await connect({ connector });
      setShowConnectors(false);
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
            onClick={handleDisconnect}
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

      {!showConnectors ? (
        <button
          onClick={() => setShowConnectors(true)}
          className="voisss-btn-primary w-full"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="space-y-3">
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-white mb-2">
              Choose Wallet
            </h4>
            <p className="text-sm text-gray-400">
              Select your preferred Starknet wallet
            </p>
          </div>

          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => handleConnect(connector)}
              className="w-full p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors flex items-center justify-between"
            >
              <span className="text-white font-medium">{connector.name}</span>
              <div className="w-6 h-6 bg-[#7C5DFA] rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </button>
          ))}

          <button
            onClick={() => setShowConnectors(false)}
            className="w-full p-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

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
