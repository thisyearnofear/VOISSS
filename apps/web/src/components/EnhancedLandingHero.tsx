"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { Mic, Zap, Globe, Users, TrendingUp } from "lucide-react";

// Type-safe icon wrappers to resolve React 18/19 compatibility issues
const CompatibleMic = Mic as React.ComponentType<{ className?: string }>;
const CompatibleZap = Zap as React.ComponentType<{ className?: string }>;
const CompatibleGlobe = Globe as React.ComponentType<{ className?: string }>;
const CompatibleUsers = Users as React.ComponentType<{ className?: string }>;
const CompatibleTrendingUp = TrendingUp as React.ComponentType<{
  className?: string;
}>;

interface LiveStats {
  totalRecordings: number;
  activeUsers: number;
  aiTransformations: number;
  starknetTxs: number;
}

export default function EnhancedLandingHero() {
  const { isConnected } = useAccount();
  const [liveStats, setLiveStats] = useState<LiveStats>({
    totalRecordings: 1247,
    activeUsers: 89,
    aiTransformations: 3421,
    starknetTxs: 892,
  });

  // Simulate live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats((prev) => ({
        totalRecordings: prev.totalRecordings + Math.floor(Math.random() * 3),
        activeUsers: Math.max(
          50,
          prev.activeUsers + Math.floor(Math.random() * 10) - 5
        ),
        aiTransformations:
          prev.aiTransformations + Math.floor(Math.random() * 5),
        starknetTxs: prev.starknetTxs + Math.floor(Math.random() * 2),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A]">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 voisss-container py-16 sm:py-24">
        {/* Main Hero Content */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full mb-6">
            <CompatibleZap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-white">
              Built on Starknet • Ultra-Low Fees
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="voisss-gradient-text">VOISSS</span>
            <br />
            <span className="text-white">AI Studio</span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            Record, Transform, Store.
          </p>
          <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
            Transform your voice with AI and secure it onchain.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <a
              href="/studio"
              className="px-8 py-4 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] rounded-xl text-white text-lg font-semibold hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center gap-3"
            >
              <CompatibleMic className="w-5 h-5" />
              Launch Studio
            </a>
            <a
              href="https://voisss.netlify.app/platform"
              className="px-8 py-4 border border-gray-600 rounded-xl text-white text-lg font-semibold hover:border-gray-400 transition-all duration-300 hover:bg-white/5"
            >
              View Demo
            </a>
          </div>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-[#3A3A3A] rounded-xl p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <CompatibleMic className="w-6 h-6 text-purple-400 mr-2" />
              <span className="text-2xl font-bold text-white">
                {liveStats.totalRecordings.toLocaleString()}
              </span>
            </div>
            <p className="text-gray-400 text-sm">Recordings Created</p>
          </div>

          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-[#3A3A3A] rounded-xl p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <CompatibleUsers className="w-6 h-6 text-green-400 mr-2" />
              <span className="text-2xl font-bold text-white">
                {liveStats.activeUsers}
              </span>
            </div>
            <p className="text-gray-400 text-sm">Active Users</p>
          </div>

          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-[#3A3A3A] rounded-xl p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <CompatibleZap className="w-6 h-6 text-yellow-400 mr-2" />
              <span className="text-2xl font-bold text-white">
                {liveStats.aiTransformations.toLocaleString()}
              </span>
            </div>
            <p className="text-gray-400 text-sm">AI Transformations</p>
          </div>

          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-[#3A3A3A] rounded-xl p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <CompatibleGlobe className="w-6 h-6 text-blue-400 mr-2" />
              <span className="text-2xl font-bold text-white">
                {liveStats.starknetTxs}
              </span>
            </div>
            <p className="text-gray-400 text-sm">Starknet Transactions</p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CompatibleMic className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              HD Voice Recording
            </h3>
            <p className="text-gray-400">
              Crystal clear audio capture with real-time waveform visualization
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CompatibleZap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              AI Voice Transform
            </h3>
            <p className="text-gray-400">
              Transform your voice with 20+ AI models powered by ElevenLabs
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CompatibleGlobe className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Starknet Storage
            </h3>
            <p className="text-gray-400">
              Decentralized storage with ultra-low fees and Ethereum security
            </p>
          </div>
        </div>

        {/* Social Proof */}
        <div className="text-center">
          <p className="text-gray-400 mb-6">Trusted by creators worldwide</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-60">
            <div className="text-gray-500 font-semibold">Content Creators</div>
            <div className="text-gray-500 font-semibold">Podcasters</div>
            <div className="text-gray-500 font-semibold">Voice Artists</div>
            <div className="text-gray-500 font-semibold">Developers</div>
          </div>
        </div>
      </div>
    </div>
  );
}
