"use client";

import React from "react";

interface MissionFiltersProps {
  selectedTopic: string;
  selectedDifficulty: string;
  sortBy: "newest" | "reward" | "participants";
  onTopicChange: (topic: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  onSortChange: (sort: "newest" | "reward" | "participants") => void;
  totalMissions: number;
  filteredCount: number;
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
}: MissionFiltersProps) {
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
    { value: "easy", label: "Easy (5-15 STRK)", color: "text-green-400" },
    { value: "medium", label: "Medium (20-35 STRK)", color: "text-yellow-400" },
    { value: "hard", label: "Hard (40+ STRK)", color: "text-red-400" },
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