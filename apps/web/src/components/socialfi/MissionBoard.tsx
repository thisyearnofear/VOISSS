"use client";

import React, { useState, useEffect } from "react";
import { Mission, createMissionService, MissionService } from "@voisss/shared";
import { useAccount } from "@starknet-react/core";
import MissionCard from "./MissionCard";
import MissionFilters from "./MissionFilters";

interface MissionBoardProps {
  onMissionSelect?: (mission: Mission) => void;
}

export default function MissionBoard({ onMissionSelect }: MissionBoardProps) {
  const { address, isConnected } = useAccount();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missionService] = useState<MissionService>(() => createMissionService());
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "reward" | "participants">("newest");

  useEffect(() => {
    loadMissions();
  }, []);

  useEffect(() => {
    filterMissions();
  }, [missions, selectedTopic, selectedDifficulty, sortBy]);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const activeMissions = await missionService.getActiveMissions();
      setMissions(activeMissions);
      setError(null);
    } catch (err) {
      console.error("Failed to load missions:", err);
      setError("Failed to load missions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterMissions = () => {
    let filtered = [...missions];

    // Filter by topic
    if (selectedTopic !== "all") {
      filtered = filtered.filter(mission => mission.topic === selectedTopic);
    }

    // Filter by difficulty
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(mission => mission.difficulty === selectedDifficulty);
    }

    // Sort missions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "reward":
          return b.reward - a.reward;
        case "participants":
          return b.currentParticipants - a.currentParticipants;
        case "newest":
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    setFilteredMissions(filtered);
  };

  const handleMissionAccept = async (mission: Mission) => {
    if (!isConnected || !address) {
      alert("Please connect your wallet to accept missions");
      return;
    }

    try {
      const success = await missionService.acceptMission(mission.id, address);
      if (success) {
        // Refresh missions to update participant count
        await loadMissions();
        if (onMissionSelect) {
          onMissionSelect(mission);
        }
      } else {
        alert("Failed to accept mission. It may be full or expired.");
      }
    } catch (err) {
      console.error("Failed to accept mission:", err);
      alert("Failed to accept mission. Please try again.");
    }
  };

  const getTopicIcon = (topic: string) => {
    const icons: Record<string, string> = {
      crypto: "🪙",
      work: "💼",
      relationships: "💑",
      technology: "🤖",
      social: "👥",
      local: "🏘️",
      politics: "🏛️",
      culture: "🎭",
    };
    return icons[topic] || "💬";
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: "text-green-400 bg-green-500/20 border-green-500/30",
      medium: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
      hard: "text-red-400 bg-red-500/20 border-red-500/30",
    };
    return colors[difficulty] || "text-gray-400 bg-gray-500/20 border-gray-500/30";
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto voisss-section-spacing">
        <div className="voisss-card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] rounded-full mb-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Missions</h2>
          <p className="text-gray-400">Discovering exciting conversation opportunities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto voisss-section-spacing">
        <div className="voisss-card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Missions</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadMissions}
            className="px-6 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white font-semibold rounded-xl hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto voisss-section-spacing">
      {/* Header */}
      <div className="voisss-card text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] rounded-full mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Mission Board
        </h1>
        <p className="text-lg text-gray-300 mb-2">
          Discover conversation missions and earn STRK tokens
        </p>
        <p className="text-sm text-gray-400">
          Record candid conversations on trending topics and get rewarded for authentic perspectives
        </p>
      </div>

      {/* Filters */}
      <MissionFilters
        selectedTopic={selectedTopic}
        selectedDifficulty={selectedDifficulty}
        sortBy={sortBy}
        onTopicChange={setSelectedTopic}
        onDifficultyChange={setSelectedDifficulty}
        onSortChange={setSortBy}
        totalMissions={missions.length}
        filteredCount={filteredMissions.length}
      />

      {/* Mission Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="voisss-card text-center">
          <div className="text-2xl font-bold text-white mb-1">{missions.length}</div>
          <div className="text-sm text-gray-400">Active Missions</div>
        </div>
        <div className="voisss-card text-center">
          <div className="text-2xl font-bold text-[#7C5DFA] mb-1">
            {missions.reduce((sum, m) => sum + m.reward, 0)}
          </div>
          <div className="text-sm text-gray-400">Total STRK Rewards</div>
        </div>
        <div className="voisss-card text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            {missions.reduce((sum, m) => sum + m.currentParticipants, 0)}
          </div>
          <div className="text-sm text-gray-400">Active Participants</div>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="voisss-card mb-8">
          <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <div className="w-6 h-6 text-yellow-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-yellow-400 font-medium">Connect Wallet to Accept Missions</p>
              <p className="text-yellow-300/80 text-sm">You can browse missions, but you'll need to connect your wallet to accept them and earn rewards.</p>
            </div>
          </div>
        </div>
      )}

      {/* Mission Grid */}
      {filteredMissions.length === 0 ? (
        <div className="voisss-card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-500/20 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Missions Found</h3>
          <p className="text-gray-400 mb-4">
            {missions.length === 0 
              ? "No active missions available at the moment."
              : "No missions match your current filters. Try adjusting your search criteria."
            }
          </p>
          {missions.length > 0 && (
            <button
              onClick={() => {
                setSelectedTopic("all");
                setSelectedDifficulty("all");
              }}
              className="px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] text-white rounded-lg hover:bg-[#3A3A3A] transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onAccept={() => handleMissionAccept(mission)}
              isConnected={isConnected}
              getTopicIcon={getTopicIcon}
              getDifficultyColor={getDifficultyColor}
            />
          ))}
        </div>
      )}

      {/* Call to Action */}
      <div className="voisss-card text-center mt-12">
        <h3 className="text-xl font-semibold text-white mb-3">
          Ready to Start Earning?
        </h3>
        <p className="text-gray-400 mb-6">
          Accept a mission, record authentic conversations, and earn STRK tokens for sharing real-world perspectives.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-6 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white font-semibold rounded-xl hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-200"
          >
            Browse Missions
          </button>
          <button
            onClick={() => {
              // TODO: Link to mission creation when implemented
              alert("Mission creation coming soon!");
            }}
            className="px-6 py-3 bg-[#2A2A2A] border border-[#3A3A3A] text-white font-semibold rounded-xl hover:bg-[#3A3A3A] transition-colors"
          >
            Create Mission
          </button>
        </div>
      </div>
    </div>
  );
}