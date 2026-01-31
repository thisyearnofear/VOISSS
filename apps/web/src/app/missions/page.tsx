"use client";

import { useState } from "react";
import { Mission } from "@voisss/shared/types/socialfi";
import MissionBoard from "../../components/socialfi/MissionBoard";
import { useBaseAccount } from "../../hooks/useBaseAccount";

export default function MissionsPage() {
  const { isConnected, connect } = useBaseAccount();
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  const handleMissionSelect = (mission: Mission) => {
    setSelectedMission(mission);
    // TODO: Navigate to recording interface with mission context
    console.log("Selected mission:", mission);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold voisss-gradient-text mb-4">
            Community Conversations
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-2">
            Join Curated Dialogue Campaigns
          </p>
          <p className="text-sm text-gray-400">
            Record authentic conversations, earn rewards, and contribute to meaningful discussions
          </p>
        </div>

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="mb-8 sm:mb-12 max-w-md mx-auto text-center">
            <button
              onClick={connect}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect Base Account
            </button>
          </div>
        )}

        {/* Mission Board */}
        <MissionBoard onMissionSelect={handleMissionSelect} />

        {/* Navigation */}
        <div className="text-center mt-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/studio"
              className="px-6 py-3 bg-[#2A2A2A] border border-[#3A3A3A] text-white font-semibold rounded-xl hover:bg-[#3A3A3A] transition-colors"
            >
              ← Back to Studio
            </a>
            <a
              href="/agents"
              className="px-6 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white font-semibold rounded-xl hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-200"
            >
              Discover Agents →
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <a
            className="text-gray-400 hover:text-white transition-colors text-sm"
            href="https://farcaster.xyz/papa"
            target="_blank"
            rel="noopener noreferrer"
          >
            built by papa
          </a>
        </div>
      </div>
    </div>
  );
}