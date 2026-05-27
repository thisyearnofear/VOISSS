"use client";

import { useState } from "react";
import { Database, ExternalLink, Shield, Clock, Zap, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ArkivMemoryExplorer from "@/components/RecordingStudio/ArkivMemoryExplorer";
import { EXPIRY_CONFIG } from "@/lib/arkiv-constants";

export default function ArkivPage() {
  const { address, isAuthenticated, signIn, isAuthenticating } = useAuth();
  const [showTechDetails, setShowTechDetails] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 flex items-center justify-center">
              <Database className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Voice Vault
              </h1>
              <p className="text-sm text-gray-500">
                Your voice insights, permanently archived on-chain
              </p>
            </div>
          </div>
          <p className="text-gray-400 text-sm max-w-2xl">
            Every voice analysis you run in the Studio is saved to Arkiv&apos;s decentralized network — owned by your wallet,
            queryable by time range, and verifiable on the explorer. Only you can access your data.
          </p>
        </div>

        {/* Wallet gate */}
        {!isAuthenticated ? (
          <div className="voisss-card text-center py-12">
            <Lock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">
              Connect to view your vault
            </h2>
            <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
              Your voice insights are wallet-gated. Connect to browse, search, and verify your archived data.
            </p>
            <button
              onClick={signIn}
              disabled={isAuthenticating}
              className="px-6 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] rounded-xl text-white font-semibold hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all disabled:opacity-50"
            >
              {isAuthenticating ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              <div className="voisss-card flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Archive Expiry</p>
                  <p className="text-sm font-semibold text-blue-400">{EXPIRY_CONFIG.ARCHIVE.label}</p>
                </div>
              </div>
              <div className="voisss-card flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Certificate Expiry</p>
                  <p className="text-sm font-semibold text-green-400">{EXPIRY_CONFIG.PERMANENT.label}</p>
                </div>
              </div>
              <div className="voisss-card flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Working Memory</p>
                  <p className="text-sm font-semibold text-yellow-400">{EXPIRY_CONFIG.WORKING.label}</p>
                </div>
              </div>
            </div>

            {/* Main explorer — reuses existing component */}
            <ArkivMemoryExplorer ownerAddress={address} />

            {/* Quick actions */}
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/studio"
                className="px-4 py-2 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] rounded-xl text-white text-sm font-semibold hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all"
              >
                Record in Studio
              </a>
              <a
                href="/api/health"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-gray-300 text-sm font-medium hover:border-purple-500/30 hover:text-white transition-colors flex items-center gap-2"
              >
                API Health
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </>
        )}

        {/* How it works — useful for power users + evaluators */}
        <div className="mt-12 border-t border-[#2A2A2A] pt-8">
          <button
            onClick={() => setShowTechDetails(!showTechDetails)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Database className="w-4 h-4" />
            {showTechDetails ? "Hide" : "How"} your data is secured
          </button>

          {showTechDetails && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
                  Ownership
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Entities are created by the server wallet then atomically transferred to your wallet via <code className="text-purple-300">mutateEntities</code>.
                  The on-chain <code className="text-purple-300">$owner</code> is always your address.
                </p>
              </div>
              <div className="p-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">
                  Batch Operations
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Insight + certificate pairs are created in a single transaction. One tx hash, two entities, both owned by you.
                </p>
              </div>
              <div className="p-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-green-400 mb-2">
                  Time-Range Queries
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  <code className="text-green-300">createdAt</code> is stored as a numeric timestamp, enabling <code className="text-green-300">gt()</code> / <code className="text-green-300">lt()</code> range queries for the time filter above.
                </p>
              </div>
              <div className="p-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-2">
                  Differentiated Expiry
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Working memory: 30 days. Archived insights: 365 days. Certificates: 730 days.
                  Data importance determines retention.
                </p>
              </div>
              <div className="p-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
                  Idempotent Writes
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Every write carries an <code className="text-cyan-300">Idempotency-Key</code>. Replaying the same request returns the cached result — no duplicates created.
                </p>
              </div>
              <div className="p-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Explorer Verification
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Every entity links to the{" "}
                  <a
                    href="https://explorer.braga.hoodi.arkiv.network"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
                  >
                    Braga Explorer
                  </a>{" "}
                  where you can verify ownership and payload on-chain.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
