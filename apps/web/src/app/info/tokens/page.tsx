"use client";

import React from "react";

export default function TokensInfoPage() {
  return (
    <div className="voisss-container voisss-section-spacing">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Token System</h1>
          <p className="text-gray-400">Understanding $papajams and $voisss</p>
        </div>

        {/* Token Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Papajams Card */}
          <div className="voisss-card">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📊</span>
              <h2 className="text-2xl font-bold text-white">$papajams</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-1">Creator Reward Token</p>
                <p className="text-sm text-gray-400">
                  Earned by creators when their missions get submissions and engagement.
                </p>
              </div>
              <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] space-y-2">
                <p className="text-xs font-semibold text-gray-300">You Get:</p>
                <ul className="text-xs text-gray-400 space-y-1">
                   <li>✓ 70% of mission rewards → your wallet</li>
                   <li>✓ Creator stake you put into missions</li>
                 </ul>
              </div>
              <div className="p-3 bg-green-600/10 rounded-lg border border-green-600/30">
                <p className="text-xs font-semibold text-green-300 mb-2">Minimum to Create Missions:</p>
                <p className="text-sm font-mono text-green-200">1,000,000 $papajams</p>
              </div>
            </div>
          </div>

          {/* Voisss Card */}
          <div className="voisss-card">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">💜</span>
              <h2 className="text-2xl font-bold text-white">$voisss</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-1">Platform Tier Token</p>
                <p className="text-sm text-gray-400">
                  Determines your access level and platform features.
                </p>
              </div>
              <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] space-y-2">
                <p className="text-xs font-semibold text-gray-300">What It Does:</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>✓ 10k+ = Basic tier (mission creation)</li>
                  <li>✓ 250k+ = Premium tier (advanced features)</li>
                  <li>✓ 30% of mission rewards → platform</li>
                </ul>
              </div>
              <div className="p-3 bg-blue-600/10 rounded-lg border border-blue-600/30">
                <p className="text-xs font-semibold text-blue-300 mb-2">Minimum to Create Missions:</p>
                <p className="text-sm font-mono text-blue-200">10,000 $voisss (Basic Tier)</p>
              </div>
            </div>
          </div>
        </div>

        {/* How Rewards Work */}
        <div className="voisss-card space-y-4">
          <h2 className="text-2xl font-bold text-white">How Rewards Work</h2>
          
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#7C5DFA] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">You Create a Mission</p>
                <p className="text-sm text-gray-400">
                  Need 1M $papajams + 10k $voisss. Set a base reward (easy=10, medium=25, hard=50 tokens).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#7C5DFA] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Users Submit Recordings</p>
                <p className="text-sm text-gray-400">
                  Submissions are auto-approved. Quality validated.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#7C5DFA] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Rewards Are Calculated</p>
                <p className="text-sm text-gray-400">
                  Base reward is set by difficulty level.
                  Split automatically: 70% $papajams (to creator) + 30% $voisss (to platform).
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#7C5DFA] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">4</span>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">You Distribute Rewards</p>
                <p className="text-sm text-gray-400">
                  Review submissions and manually send tokens from your wallet. 
                  Creator gets their $papajams immediately.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reward Calculation Example */}
        <div className="voisss-card space-y-4">
          <h2 className="text-2xl font-bold text-white">Example: Medium Mission</h2>
          
          <div className="space-y-3">
            <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
              <p className="text-sm font-semibold text-gray-300 mb-2">Example Setup:</p>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Mission Difficulty:</span>
                  <span className="text-white">Medium</span>
                </div>
                <div className="flex justify-between">
                  <span>Base Reward:</span>
                  <span className="text-white">25 tokens</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
              <p className="text-sm font-semibold text-gray-300 mb-3">Total Reward:</p>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="pt-2 border-t border-[#3A3A3A] flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-[#7C5DFA]">25 tokens</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
              <p className="text-sm font-semibold text-gray-300 mb-3">Distribution (70/30 split):</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Creator gets (70%):</span>
                  <span className="text-[#7C5DFA] font-semibold">17.5 $papajams</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform gets (30%):</span>
                  <span className="text-purple-400 font-semibold">7.5 $voisss</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="voisss-card space-y-4">
          <h2 className="text-2xl font-bold text-white">FAQ</h2>
          
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-white mb-2">Can I sell my $papajams and $voisss?</p>
              <p className="text-sm text-gray-400">
                Yes, both are ERC20 tokens on the Base chain. You can trade, transfer, or hold them.
              </p>
            </div>
            
            <div>
              <p className="font-semibold text-white mb-2">What if I don't have enough $papajams?</p>
              <p className="text-sm text-gray-400">
                You'll need to acquire 1M $papajams to create missions. It's a creator commitment requirement.
              </p>
            </div>
            
            <div>
              <p className="font-semibold text-white mb-2">Do I lose my $papajams when creating a mission?</p>
              <p className="text-sm text-gray-400">
                No—you just need to hold the minimum balance. Your $papajams stay in your wallet. 
                You earn more $papajams from mission rewards.
              </p>
            </div>
            
            <div>
              <p className="font-semibold text-white mb-2">What happens to the 30% $voisss allocation?</p>
              <p className="text-sm text-gray-400">
                It goes to the platform to fund ecosystem development, features, and platform sustainability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
