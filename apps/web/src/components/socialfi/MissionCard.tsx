"use client";

import React, { useState } from "react";
import { Mission } from "@voisss/shared/types/socialfi";

interface MissionCardProps {
  mission: Mission;
  onAccept: () => void;
  isConnected: boolean;
  getTopicIcon: (topic: string) => string;
  getDifficultyColor: (difficulty: string) => string;
}

export default function MissionCard({ 
  mission, 
  onAccept, 
  isConnected, 
  getTopicIcon, 
  getDifficultyColor 
}: MissionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept();
    } finally {
      setIsAccepting(false);
    }
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return "< 1h";
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const getParticipationStatus = () => {
    if (!mission.maxParticipants) return null;
    
    const percentage = (mission.currentParticipants / mission.maxParticipants) * 100;
    const isFull = percentage >= 100;
    const isAlmostFull = percentage >= 80;
    
    return {
      percentage,
      isFull,
      isAlmostFull,
      color: isFull ? "bg-red-500" : isAlmostFull ? "bg-yellow-500" : "bg-green-500"
    };
  };

  const participationStatus = getParticipationStatus();

  return (
    <div className="voisss-card group hover:border-[#7C5DFA]/30 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{getTopicIcon(mission.topic)}</div>
          <div>
            <h3 className="text-lg font-semibold text-white group-hover:text-[#7C5DFA] transition-colors">
              {mission.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(mission.difficulty)}`}>
                {mission.difficulty.toUpperCase()}
              </span>
              <span className="text-xs text-gray-400 capitalize">
                {mission.topic}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-[#7C5DFA]">
            {mission.reward} STRK
          </div>
          <div className="text-xs text-gray-400">
            {formatTimeRemaining(mission.expiresAt)}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
        {mission.description}
      </p>

      {/* Mission Details */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>~{formatDuration(mission.targetDuration)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>{mission.currentParticipants} participants</span>
        </div>
        {mission.locationBased && (
          <div className="flex items-center gap-2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Location-based</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span>{mission.tags.length} tags</span>
        </div>
      </div>

      {/* Participation Progress */}
      {participationStatus && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Participation</span>
            <span>{mission.currentParticipants}/{mission.maxParticipants}</span>
          </div>
          <div className="w-full bg-[#1A1A1A] rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${participationStatus.color}`}
              style={{ width: `${Math.min(participationStatus.percentage, 100)}%` }}
            />
          </div>
          {participationStatus.isFull && (
            <p className="text-red-400 text-xs mt-2">Mission is full</p>
          )}
          {participationStatus.isAlmostFull && !participationStatus.isFull && (
            <p className="text-yellow-400 text-xs mt-2">Almost full - act fast!</p>
          )}
        </div>
      )}

      {/* Expandable Details */}
      <div className="border-t border-[#3A3A3A] pt-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-sm text-gray-400 hover:text-white transition-colors mb-3"
        >
          <span>Mission Details</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDetails && (
          <div className="space-y-4 mb-4">
            {/* Example Questions */}
            {mission.examples.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Example Questions:</h4>
                <ul className="space-y-1">
                  {mission.examples.slice(0, 3).map((example: string, index: number) => (
                    <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-[#7C5DFA] mt-1">•</span>
                      <span>"{example}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Context Suggestions */}
            {mission.contextSuggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Suggested Contexts:</h4>
                <div className="flex flex-wrap gap-2">
                  {mission.contextSuggestions.map((context: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-[#2A2A2A] border border-[#3A3A3A] rounded text-xs text-gray-300"
                    >
                      {context}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {mission.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Tags:</h4>
                <div className="flex flex-wrap gap-2">
                  {mission.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-[#7C5DFA]/10 border border-[#7C5DFA]/20 rounded text-xs text-[#7C5DFA]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleAccept}
          disabled={!isConnected || isAccepting || (participationStatus?.isFull)}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            !isConnected
              ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
              : participationStatus?.isFull
              ? "bg-red-500/20 text-red-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white hover:from-[#6B4CE6] hover:to-[#8B7AFF] hover:scale-[1.02]"
          }`}
        >
          {isAccepting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Accepting...
            </>
          ) : !isConnected ? (
            "Connect Wallet to Accept"
          ) : participationStatus?.isFull ? (
            "Mission Full"
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Accept Mission
            </>
          )}
        </button>
      </div>
    </div>
  );
}