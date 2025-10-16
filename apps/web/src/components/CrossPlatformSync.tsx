"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { useSyncRecordings } from "../hooks/queries/useStarknetRecording";

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingUploads: number;
  totalRecordings: number;
}

export default function CrossPlatformSync() {
  const { address, isConnected } = useAccount();
  const { mutateAsync: syncRecordings, isPending: isSyncing } = useSyncRecordings();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    lastSync: null,
    pendingUploads: 0,
    totalRecordings: 0,
  });

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

  const handleSync = async () => {
    if (!isConnected || !address) return;

    try {
      await syncRecordings();
      setSyncStatus((prev) => ({
        ...prev,
        lastSync: new Date(),
        pendingUploads: 0,
      }));
    } catch (error) {
      console.error("Sync failed:", error);
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
      <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          <div>
            <h3 className="text-sm font-medium text-yellow-400">
              Sync Unavailable
            </h3>
            <p className="text-xs text-gray-400">
              Connect wallet to sync between Web and Flutter apps
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Sync Status</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400 text-xs font-medium">Active</span>
          </div>
        </div>
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
        onClick={handleSync}
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

      <div className="mt-4 p-3 bg-[#1A1A1A] rounded-lg">
        <h4 className="text-sm font-medium text-white mb-2">
          Current Ecosystem:
        </h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Web dApp: Full recording and management features</li>
          <li>• Flutter Mobile: Native performance with starknet.dart</li>
          <li>• React Native: Coming soon with Expo integration</li>
          <li>• All recordings sync via Starknet + IPFS</li>
        </ul>
      </div>

      {/* Device Indicators */}
      <div className="mt-4 flex justify-center items-center space-x-3">
        <div className="text-center">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-1 border border-blue-500/30">
            <span className="text-blue-400 text-sm">🌐</span>
          </div>
          <span className="text-xs text-blue-400 font-medium">Web</span>
        </div>

        <div className="flex items-center">
          <svg
            className="w-6 h-6 text-[#7C5DFA]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        </div>

        <div className="text-center">
          <div className="w-10 h-10 bg-[#7C5DFA]/20 rounded-lg flex items-center justify-center mb-1 border border-[#7C5DFA]/30">
            <span className="text-[#7C5DFA] text-sm">🚀</span>
          </div>
          <span className="text-xs text-[#7C5DFA] font-medium">Flutter</span>
        </div>

        <div className="flex items-center">
          <svg
            className="w-6 h-6 text-[#7C5DFA]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        </div>

        <div className="text-center">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-1 border border-green-500/30">
            <span className="text-green-400 text-sm">⛓️</span>
          </div>
          <span className="text-xs text-green-400 font-medium">Starknet</span>
        </div>
      </div>
    </div>
  );
}
