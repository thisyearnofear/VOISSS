/**
 * StreakDisplay Component
 * ENHANCEMENT FIRST: Visual streak indicator with milestone progress
 * CLEAN: Minimal, reusable, works on web and native
 */

import React from 'react';

export interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  nextMilestone?: { days: number; reward: string };
  className?: string;
  compact?: boolean;
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  nextMilestone,
  className = '',
  compact = false,
}: StreakDisplayProps) {
  const getMilestones = () => [
    { days: 7, reward: '100', label: 'Week' },
    { days: 30, reward: '500', label: 'Month' },
    { days: 100, reward: '2000', label: 'Century' },
    { days: 365, reward: '10000', label: 'Year' },
  ];

  const milestones = getMilestones();
  const currentMilestone = milestones.find((m) => currentStreak < m.days);
  const progress = currentMilestone
    ? (currentStreak / currentMilestone.days) * 100
    : 100;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-2xl">🔥</span>
        <div>
          <div className="text-lg font-bold text-white">{currentStreak}</div>
          <div className="text-xs text-gray-400">day streak</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🔥</span>
          <div>
            <div className="text-3xl font-bold text-white">{currentStreak}</div>
            <div className="text-sm text-gray-400">Day Streak</div>
          </div>
        </div>
        
        {longestStreak > currentStreak && (
          <div className="text-right">
            <div className="text-sm text-gray-400">Best</div>
            <div className="text-xl font-semibold text-orange-400">
              {longestStreak}
            </div>
          </div>
        )}
      </div>

      {/* Progress to Next Milestone */}
      {currentMilestone && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Next: {currentMilestone.label} Streak
            </span>
            <span className="text-orange-400 font-semibold">
              {currentMilestone.days - currentStreak} days to go
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="text-xs text-gray-500 text-right">
            Reward: {currentMilestone.reward} tokens
          </div>
        </div>
      )}

      {/* Milestones Grid */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {milestones.map((milestone) => {
          const achieved = currentStreak >= milestone.days;
          return (
            <div
              key={milestone.days}
              className={`text-center p-2 rounded-lg border ${
                achieved
                  ? 'bg-orange-500/20 border-orange-500/40'
                  : 'bg-gray-800/50 border-gray-700'
              }`}
            >
              <div
                className={`text-xs font-semibold ${
                  achieved ? 'text-orange-400' : 'text-gray-500'
                }`}
              >
                {milestone.label}
              </div>
              <div
                className={`text-lg font-bold ${
                  achieved ? 'text-white' : 'text-gray-600'
                }`}
              >
                {achieved ? '✓' : milestone.days}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tip */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-300">
          💡 Record daily to maintain your streak. You get one free pass per month!
        </p>
      </div>
    </div>
  );
}
