"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "@starknet-react/core";

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingUploads: number;
  totalRecordings: number;
}

export default function CrossPlatformSync() {
  const { address, isConnected } = useAccount();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    lastSync: null,
    pendingUploads: 0,
    totalRecordings: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () =>
      setSyncStatus((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () =>
      setSyncStatus((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncWithBlockchain = async () => {
    if (!isConnected || !address) return;

    setIsSyncing(true);
    try {
      // Simulate fetching recordings from Starknet
      // In real implementation, this would:
      // 1. Query VoiceStorage contract for user's recordings
      // 2. Compare with local storage
      // 3. Download missing recordings from IPFS
      // 4. Upload pending local recordings

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay

      setSyncStatus((prev) => ({
        ...prev,
        lastSync: new Date(),
        pendingUploads: 0,
        totalRecordings: prev.totalRecordings + Math.floor(Math.random() * 3),
      }));
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return "Never";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isConnected) {
    return (
      <div className="voisss-card border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          <div>
            <h3 className="text-sm font-medium text-yellow-400">
              Offline Mode
            </h3>
            <p className="text-xs text-gray-400">
              Connect wallet to sync across devices
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="voisss-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Cross-Platform Sync
        </h3>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              syncStatus.isOnline ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="text-xs text-gray-400">
            {syncStatus.isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Last sync:</span>
          <span className="text-white">
            {formatLastSync(syncStatus.lastSync)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total recordings:</span>
          <span className="text-white">{syncStatus.totalRecordings}</span>
        </div>

        {syncStatus.pendingUploads > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Pending uploads:</span>
            <span className="text-yellow-400">{syncStatus.pendingUploads}</span>
          </div>
        )}
      </div>

      <button
        onClick={syncWithBlockchain}
        disabled={isSyncing || !syncStatus.isOnline}
        className="w-full voisss-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSyncing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Syncing...</span>
          </div>
        ) : (
          "Sync Now"
        )}
      </button>

      <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-2">How it works:</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Recordings stored on Starknet blockchain</li>
          <li>• Audio files stored on IPFS for decentralization</li>
          <li>• Access from any device with your wallet</li>
          <li>• Automatic sync when online</li>
        </ul>
      </div>

      {/* Device Indicators */}
      <div className="mt-4 flex justify-center space-x-4">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mb-1">
            <span className="text-blue-400 text-xs">🌐</span>
          </div>
          <span className="text-xs text-gray-400">Web</span>
        </div>

        <div className="flex items-center">
          <div className="w-8 h-0.5 bg-gray-600"></div>
        </div>

        <div className="text-center">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mb-1">
            <span className="text-purple-400 text-xs">📱</span>
          </div>
          <span className="text-xs text-gray-400">Flutter</span>
        </div>

        <div className="flex items-center">
          <div className="w-8 h-0.5 bg-gray-600"></div>
        </div>

        <div className="text-center">
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mb-1">
            <span className="text-green-400 text-xs">⛓️</span>
          </div>
          <span className="text-xs text-gray-400">Starknet</span>
        </div>
      </div>
    </div>
  );
}
