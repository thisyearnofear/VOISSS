"use client";

import React, { useState } from "react";
import { PLATFORM_CONFIG, getTokenDisplaySymbol } from "@voisss/shared/config/platform";

export interface FormData {
  // Core fields
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  targetDuration: number;
  expirationDays: number;
  
  // Advanced fields (optional, behind toggle)
  locationBased: boolean;
  qualityCriteria?: {
    audioMinScore?: number;
    transcriptionRequired?: boolean;
  };
  rewardModel?: "flat_rate" | "pool" | "performance";
  budgetAllocation?: number;
  creatorStake?: number;
  language?: string;
}

interface MissionFormFieldsProps {
  formData: FormData;
  errors: Record<string, string>;
  onChange: (field: keyof FormData, value: any) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

const REWARD_BY_DIFFICULTY = {
  easy: 10,
  medium: 25,
  hard: 50,
};

export default function MissionFormFields({
  formData,
  errors,
  onChange,
  showAdvanced,
  onToggleAdvanced,
}: MissionFormFieldsProps) {
  const baseReward = REWARD_BY_DIFFICULTY[formData.difficulty];

  return (
    <>
      {/* CORE FIELDS SECTION */}
      <div className="space-y-6 pb-6 border-b border-[#3A3A3A]">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Mission Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onChange("title", e.target.value)}
            className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
            placeholder="e.g., Taxi Conversations, Street Interviews on AI"
          />
          {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">What are you looking for?</label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange("description", e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
            placeholder="Describe what you want to learn or explore. Include any context (location, audience, conversation starters) here."
          />
          {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Difficulty, Duration, Expiration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Difficulty</label>
            <select
              value={formData.difficulty}
              onChange={(e) => onChange("difficulty", e.target.value as any)}
              className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
            >
              <option value="easy">Easy (30-60s)</option>
              <option value="medium">Medium (1-3 min)</option>
              <option value="hard">Hard (5+ min)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Target Length (seconds)</label>
            <input
              type="number"
              value={formData.targetDuration}
              onChange={(e) => onChange("targetDuration", parseInt(e.target.value) || 120)}
              min="30"
              max="600"
              className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
            />
            {errors.targetDuration && (
              <p className="text-red-400 text-sm mt-1">{errors.targetDuration}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Expires in (days)</label>
            <input
              type="number"
              value={formData.expirationDays}
              onChange={(e) => onChange("expirationDays", parseInt(e.target.value) || 7)}
              min="1"
              max="90"
              className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
            />
          </div>
        </div>

        {/* Location Based */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="locationBased"
            checked={formData.locationBased}
            onChange={(e) => onChange("locationBased", e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer"
          />
          <label htmlFor="locationBased" className="text-sm font-medium text-white cursor-pointer">
            Location-specific (taxi, street interview, local venues)
          </label>
        </div>

        {/* Estimated Reward Display */}
        <div className="p-3 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg space-y-3">
          <div>
            <p className="text-sm text-gray-300">
              Base reward per participant: <span className="font-semibold text-[#7C5DFA]">{baseReward} {getTokenDisplaySymbol()}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Splits equally across all submissions. Bonus tokens for engagement & featured content.
            </p>
          </div>
          
          {/* Token breakdown */}
          <div className="pt-2 border-t border-[#3A3A3A] space-y-2">
            <p className="text-xs font-semibold text-gray-400">Reward allocation:</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#7C5DFA]">📊</span>
              <span className="text-gray-300">70% {getTokenDisplaySymbol()} → participants</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-purple-400">💜</span>
              <span className="text-gray-300">30% $voisss → platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* ADVANCED OPTIONS */}
      <button
        type="button"
        onClick={onToggleAdvanced}
        className="w-full py-3 text-left flex items-center justify-between text-sm font-medium text-[#7C5DFA] hover:text-[#9C88FF] transition-colors"
      >
        <span>{showAdvanced ? "Hide" : "Show"} Advanced Options</span>
        <span className={`transform transition-transform ${showAdvanced ? "rotate-180" : ""}`}>▼</span>
      </button>

      {showAdvanced && (
        <div className="space-y-6 pt-6 border-t border-[#3A3A3A]">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Language</label>
            <select
              value={formData.language || "en"}
              onChange={(e) => onChange("language", e.target.value)}
              className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
            >
              <option value="en">English</option>
              <option value="es">Spanish (Español)</option>
              <option value="fr">French (Français)</option>
              <option value="de">German (Deutsch)</option>
              <option value="pt">Portuguese (Português)</option>
              <option value="ja">Japanese (日本語)</option>
              <option value="zh">Chinese (中文)</option>
            </select>
          </div>

          {/* Reward Model */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Reward Distribution</label>
            <select
              value={formData.rewardModel || "pool"}
              onChange={(e) => onChange("rewardModel", e.target.value as any)}
              className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
            >
              <option value="pool">Pool (split equally)</option>
              <option value="flat_rate">Flat Rate (same per submission)</option>
              <option value="performance">Performance (quality-based bonus)</option>
            </select>
          </div>

          {/* Budget Allocation */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Total Budget Allocation (optional)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.budgetAllocation || ""}
                onChange={(e) => onChange("budgetAllocation", e.target.value ? parseInt(e.target.value) : undefined)}
                min="0"
                className="flex-1 px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
                placeholder="Leave empty for unlimited"
              />
              <div className="px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-gray-400 flex items-center">
                {getTokenDisplaySymbol()}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Set a maximum budget for this mission. Leave empty for unlimited rewards.</p>
          </div>

          {/* Creator Stake */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Creator Stake (optional)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={formData.creatorStake || ""}
                onChange={(e) => onChange("creatorStake", e.target.value ? parseInt(e.target.value) : undefined)}
                min="0"
                className="flex-1 px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
                placeholder="0"
              />
              <div className="px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-gray-400 flex items-center">
                {getTokenDisplaySymbol()}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Stake tokens to signal confidence. Unlocks 1.5x reward multiplier & priority placement.</p>
          </div>

          {/* Quality Criteria */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-white">Quality Requirements</label>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="transcriptionRequired"
                checked={formData.qualityCriteria?.transcriptionRequired || false}
                onChange={(e) =>
                  onChange("qualityCriteria", {
                    ...formData.qualityCriteria,
                    transcriptionRequired: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="transcriptionRequired" className="text-sm text-white cursor-pointer">
                Require transcription
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Minimum audio quality score (optional)</label>
              <input
                type="number"
                value={formData.qualityCriteria?.audioMinScore || ""}
                onChange={(e) =>
                  onChange("qualityCriteria", {
                    ...formData.qualityCriteria,
                    audioMinScore: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                min="0"
                max="100"
                className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:border-[#7C5DFA] focus:outline-none"
                placeholder="70 (0-100)"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
