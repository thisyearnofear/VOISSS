"use client";

import React, { useState } from "react";
import { TokenTier, TOKEN_METADATA, getTokenBuyUrl, getTokenExplorerUrl, formatTokenBalance } from "@voisss/shared/config/tokenAccess";

interface MissionFiltersProps {
  selectedTopic: string;
  selectedDifficulty: string;
  sortBy: "newest" | "reward" | "participants";
  onTopicChange: (topic: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  onSortChange: (sort: "newest" | "reward" | "participants") => void;
  totalMissions: number;
  filteredCount: number;
  // NEW: Token access info
  userTier?: TokenTier;
  userBalance?: bigint;
}

export default function MissionFilters({
  selectedTopic,
  selectedDifficulty,
  sortBy,
  onTopicChange,
  onDifficultyChange,
  onSortChange,
  totalMissions,
  filteredCount,
  userTier = 'none',
  userBalance = 0n,
}: MissionFiltersProps) {
  const [showTokenInfo, setShowTokenInfo] = useState(false);
  const topics = [
    { value: "all", label: "All Topics", icon: "🌐" },
    { value: "crypto", label: "Crypto & Web3", icon: "🪙" },
    { value: "work", label: "Work & Career", icon: "💼" },
    { value: "relationships", label: "Relationships", icon: "💑" },
    { value: "technology", label: "Technology", icon: "🤖" },
    { value: "social", label: "Social Issues", icon: "👥" },
    { value: "local", label: "Local Insights", icon: "🏘️" },
    { value: "politics", label: "Politics", icon: "🏛️" },
    { value: "culture", label: "Culture", icon: "🎭" },
  ];

  const difficulties = [
    { value: "all", label: "All Levels" },
    { value: "easy", label: "Easy (5-15 $papajams + $voisss)", color: "text-green-400" },
    { value: "medium", label: "Medium (20-35 $papajams + $voisss)", color: "text-yellow-400" },
    { value: "hard", label: "Hard (40+ $papajams + $voisss)", color: "text-red-400" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First", icon: "🕒" },
    { value: "reward", label: "Highest Reward", icon: "💰" },
    { value: "participants", label: "Most Popular", icon: "👥" },
  ];

  return (
    <div className="voisss-card mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Filter Missions</h3>
          <p className="text-sm text-gray-400">
            Showing {filteredCount} of {totalMissions} missions
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {/* NEW: Token info toggle */}
          <button
            onClick={() => setShowTokenInfo(!showTokenInfo)}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            title="View token requirements and earn info"
          >
            <span>💰</span>
            {userTier && userTier !== 'none' ? (
              <span className="text-[#7C5DFA] text-xs uppercase font-semibold">{userTier}</span>
            ) : (
              <span className="text-gray-400 text-xs">Info</span>
            )}
          </button>
          
          {(selectedTopic !== "all" || selectedDifficulty !== "all") && (
            <button
              onClick={() => {
                onTopicChange("all");
                onDifficultyChange("all");
              }}
              className="px-3 py-1.5 text-sm bg-[#2A2A2A] border border-[#3A3A3A] text-gray-400 hover:text-white hover:bg-[#3A3A3A] rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* NEW: Collapsible token info section */}
      {showTokenInfo && (
        <div className="mb-6 p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">Token Info</h4>
            <button
              onClick={() => setShowTokenInfo(false)}
              className="text-gray-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
          
          {/* Token cards */}
          <div className="space-y-2">
            {(['voisss', 'papajams'] as const).map((tokenKey) => {
              const meta = TOKEN_METADATA[tokenKey];
              const [copied, setCopied] = useState(false);
              
              const handleCopy = () => {
                navigator.clipboard.writeText(meta.address);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              };
              
              return (
                <div key={tokenKey} className="p-3 bg-[#2A2A2A]/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white text-sm">{meta.name}</span>
                    <button
                      onClick={handleCopy}
                      className="text-xs px-2 py-1 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-gray-400 hover:text-gray-300 rounded transition-colors"
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 font-mono break-all mb-2">{meta.address}</div>
                  <div className="flex gap-1 flex-wrap">
                    <a
                      href={getTokenBuyUrl(tokenKey)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 bg-[#7C5DFA]/20 hover:bg-[#7C5DFA]/30 text-[#7C5DFA] rounded transition-colors font-semibold"
                    >
                      Buy
                    </a>
                    <a
                      href={getTokenExplorerUrl(tokenKey)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 bg-[#3A3A3A] hover:bg-[#4A4A4A] text-gray-400 rounded transition-colors"
                    >
                      View
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Current tier display */}
          {userTier && userTier !== 'none' && (
            <div className="pt-3 border-t border-[#3A3A3A]">
              <p className="text-xs text-gray-400">
                Your tier: <span className="text-[#7C5DFA] font-semibold uppercase">{userTier}</span>
              </p>
              {userBalance && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatTokenBalance(userBalance)} VOISSS held
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        {/* Topic Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Topic Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {topics.map((topic) => (
              <button
                key={topic.value}
                onClick={() => onTopicChange(topic.value)}
                className={`p-3 rounded-xl border transition-all duration-200 text-left ${
                  selectedTopic === topic.value
                    ? "bg-[#7C5DFA]/20 border-[#7C5DFA]/40 text-[#7C5DFA]"
                    : "bg-[#2A2A2A] border-[#3A3A3A] text-gray-300 hover:bg-[#3A3A3A] hover:border-[#4A4A4A]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{topic.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{topic.label}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty and Sort Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Difficulty Level
            </label>
            <div className="space-y-2">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty.value}
                  onClick={() => onDifficultyChange(difficulty.value)}
                  className={`w-full p-3 rounded-xl border transition-all duration-200 text-left ${
                    selectedDifficulty === difficulty.value
                      ? "bg-[#7C5DFA]/20 border-[#7C5DFA]/40"
                      : "bg-[#2A2A2A] border-[#3A3A3A] hover:bg-[#3A3A3A] hover:border-[#4A4A4A]"
                  }`}
                >
                  <div className={`text-sm font-medium ${
                    selectedDifficulty === difficulty.value 
                      ? "text-[#7C5DFA]" 
                      : difficulty.color || "text-gray-300"
                  }`}>
                    {difficulty.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Sort By
            </label>
            <div className="space-y-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSortChange(option.value as any)}
                  className={`w-full p-3 rounded-xl border transition-all duration-200 text-left ${
                    sortBy === option.value
                      ? "bg-[#7C5DFA]/20 border-[#7C5DFA]/40 text-[#7C5DFA]"
                      : "bg-[#2A2A2A] border-[#3A3A3A] text-gray-300 hover:bg-[#3A3A3A] hover:border-[#4A4A4A]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {filteredCount !== totalMissions && (
          <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="w-5 h-5 text-blue-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-blue-400 text-sm">
              Filters applied - showing {filteredCount} of {totalMissions} missions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}