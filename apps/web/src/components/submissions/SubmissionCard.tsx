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
      className={`voisss-card group transition-all hover:border-[#7C5DFA] ${
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
            <p className="text-sm font-mono text-[#7C5DFA] truncate">
              {submission.userId.slice(0, 6)}...{submission.userId.slice(-4)}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {new Date(submission.submittedAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
          submission.status === 'approved' 
            ? 'bg-[#22C55E]/20 text-[#22C55E]'
            : submission.status === 'flagged'
            ? 'bg-yellow-600/20 text-yellow-500'
            : 'bg-red-600/20 text-red-500'
        }`}>
          {submission.status === 'approved' && '✓ Approved'}
          {submission.status === 'flagged' && '⚠ Flagged'}
          {submission.status === 'removed' && '✗ Removed'}
        </span>
      </div>

      {/* Location */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-400">
        <span>📍</span>
        <span className="truncate">{submission.location.city}, {submission.location.country}</span>
      </div>

      {/* Context */}
      <p className="text-sm text-gray-300 mb-4 line-clamp-2">
        Context: {submission.context}
      </p>

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
            <span className="text-gray-400">{new Date(submission.submittedAt).toLocaleDateString()}</span>
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
        {submission.isAnonymized && (
          <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
            🔒 Anonymized
          </span>
        )}
        {submission.voiceObfuscated && (
          <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
            🔇 Voice Obfuscated
          </span>
        )}
      </div>

      {/* CTA */}
      {onClick && (
        <button className="w-full px-3 py-2 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] hover:from-[#6B4CE6] hover:to-[#8B7AFF] text-white text-sm font-medium rounded-lg transition-all group-hover:shadow-lg">
          View Details
        </button>
      )}
    </div>
  );
}
