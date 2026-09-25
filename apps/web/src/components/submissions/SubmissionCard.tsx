"use client";

import React from "react";
import { MissionResponse } from "@voisss/shared/types/socialfi";

interface SubmissionCardProps {
  submission: MissionResponse;
  missionTitle?: string;
  showCreator?: boolean;
  onClick?: () => void;
  variant?: "gallery" | "dashboard";
}

export default function SubmissionCard({
  submission,
  missionTitle,
  showCreator = true,
  onClick,
  variant = "gallery",
}: SubmissionCardProps) {
  return (
    <div
      onClick={onClick}
      className={`voisss-card group transition-all hover:border-[#D6FF2A] ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          {missionTitle && (
            <p className="text-xs text-gray-500 mb-1 truncate">
              {missionTitle}
            </p>
          )}
          {showCreator && (
            <p className="text-sm font-mono text-[#D6FF2A] truncate">
              {submission.userId.slice(0, 6)}...{submission.userId.slice(-4)}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {new Date(submission.submittedAt || submission.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
          submission.rewardStatus === 'distributed' 
            ? 'bg-[#22C55E]/20 text-[#22C55E]'
            : submission.rewardStatus === 'flagged'
            ? 'bg-yellow-600/20 text-yellow-500'
            : submission.rewardStatus === 'removed'
            ? 'bg-red-600/20 text-red-500'
            : 'bg-blue-600/20 text-blue-400'
        }`}>
          {submission.rewardStatus === 'distributed' && '✓ Distributed'}
          {submission.rewardStatus === 'pending' && '⧖ Pending'}
          {submission.rewardStatus === 'flagged' && '⚠ Flagged'}
          {submission.rewardStatus === 'removed' && '✗ Removed'}
          {submission.rewardStatus === 'claimed' && '⚡ Claimed'}
        </span>
      </div>

      {/* Location */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
        <span>📍</span>
        {submission.location && (
          <span className="truncate">{submission.location.city}, {submission.location.country}</span>
        )}
      </div>

      {/* Context */}
      {(submission as any).context && (
        <p className="text-sm text-gray-300 mb-4 line-clamp-2">
          Context: {(submission as any).context}
        </p>
      )}

      {/* Quality & Transcript */}
      {submission.transcription && (
        <div className="mb-4 p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
          <p className="text-xs text-gray-500 mb-2">Transcription</p>
          <p className="text-sm text-gray-300 line-clamp-2">{submission.transcription}</p>
        </div>
      )}

      {/* Additional Info */}
      {variant === "dashboard" && (
        <div className="space-y-2 text-xs text-gray-500 mb-4 pt-3 border-t border-[#2A2A2A]">
          <div className="flex justify-between">
            <span>Recording ID</span>
            <span className="font-mono text-gray-400">{submission.recordingId.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span>Submission</span>
            <span className="text-gray-400">{new Date(submission.submittedAt || submission.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      {/* IPFS Hash (if available) */}
      {submission.recordingIpfsHash && (
        <div className="text-xs text-gray-600 break-all mb-3 p-2 bg-[#1A1A1A] rounded border border-[#2A2A2A]">
          <span className="text-gray-500">IPFS: </span>
          {submission.recordingIpfsHash.slice(0, 20)}...
        </div>
      )}

      {/* Consent Status */}
      <div className="flex gap-2 text-xs mb-4">
        {submission.participantConsent && (
          <span className="px-2 py-1 bg-[#22C55E]/20 text-[#22C55E] rounded">
            ✓ Consent
          </span>
        )}
        {(submission as any).isAnonymized && (
          <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
            🔒 Anonymized
          </span>
        )}
        {(submission as any).voiceObfuscated && (
          <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
            🔇 Voice Obfuscated
          </span>
        )}
      </div>

      {/* CTA */}
      {onClick && (
        <button className="w-full px-3 py-2 bg-gradient-to-r from-[#D6FF2A] to-[#EAFF6A] hover:from-[#C2EB22] hover:to-[#C2EB22] text-[#0A0E1A] text-sm font-medium rounded-lg transition-all group-hover:shadow-lg">
          View Details
        </button>
      )}
    </div>
  );
}
