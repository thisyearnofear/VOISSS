"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MissionResponse } from "@voisss/shared/types/socialfi";
import RewardDistributionForm from "@/components/admin/RewardDistributionForm";

export default function AdminSubmissionsPage() {
  const [statusFilter, setStatusFilter] = useState<"approved" | "flagged" | "removed">("approved");
  const [selectedSubmission, setSelectedSubmission] = useState<MissionResponse | null>(null);
  const [showRewardForm, setShowRewardForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch submissions
  const { data: submissionsData, isLoading, error } = useQuery({
    queryKey: ["submissions", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ status: statusFilter });
      const response = await fetch(`/api/admin/submissions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10s
  });

  // Flag submission mutation
  const flagMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const response = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "flag",
          submissionId,
          reason: "Flagged by admin",
        }),
      });
      if (!response.ok) throw new Error("Failed to flag submission");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });

  // Remove submission mutation
  const removeMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      const response = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          submissionId,
          reason: "Removed by admin",
        }),
      });
      if (!response.ok) throw new Error("Failed to remove submission");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });

  const submissions: MissionResponse[] = submissionsData?.submissions || [];

  return (
    <div className="voisss-container voisss-section-spacing">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-[#3A3A3A] pb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Submissions Gallery</h1>
          <p className="text-gray-400">Review, flag, and reward user submissions</p>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {(["approved", "flagged", "removed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === status
                  ? "bg-[#7C5DFA] text-white"
                  : "bg-[#2A2A2A] text-gray-400 border border-[#3A3A3A] hover:border-[#4A4A4A]"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({submissions.length})
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="voisss-card bg-red-500/10 border-red-500/30">
            <p className="text-red-400">Failed to load submissions</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="voisss-card text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] rounded-full mb-4">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-400">Loading submissions...</p>
          </div>
        )}

        {/* Submissions Grid */}
        {!isLoading && submissions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="voisss-card cursor-pointer hover:border-[#4A4A4A] transition-colors group"
                onClick={() => setSelectedSubmission(submission)}
              >
                {/* Submission Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-mono text-[#7C5DFA] truncate">
                      {submission.userId.slice(0, 6)}...{submission.userId.slice(-4)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                    submission.status === 'approved'
                      ? 'bg-[#22C55E]/20 text-[#22C55E]'
                      : submission.status === 'flagged'
                      ? 'bg-yellow-600/20 text-yellow-400'
                      : 'bg-red-600/20 text-red-400'
                  }`}>
                    {submission.status}
                  </span>
                </div>

                {/* Status */}
                <div className="mb-4 p-3 bg-[#1A1A1A] rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <p className={`text-sm font-semibold ${
                    submission.status === 'approved' ? 'text-[#22C55E]' :
                    submission.status === 'flagged' ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {submission.status === 'approved' && '✓ Approved'}
                    {submission.status === 'flagged' && '⚠ Flagged'}
                    {submission.status === 'removed' && '✗ Removed'}
                  </p>
                </div>

                {/* Location */}
                <p className="text-xs text-gray-500 mb-3">
                  📍 {submission.location.city}, {submission.location.country}
                </p>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-3 border-t border-[#3A3A3A]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSubmission(submission);
                      setShowRewardForm(true);
                    }}
                    className="flex-1 px-2 py-1 text-xs bg-[#7C5DFA] hover:bg-[#6D4AE8] text-white rounded transition-colors"
                  >
                    Reward
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      flagMutation.mutate(submission.id);
                    }}
                    disabled={flagMutation.isPending}
                    className="flex-1 px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white rounded transition-colors"
                  >
                    Flag
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMutation.mutate(submission.id);
                    }}
                    disabled={removeMutation.isPending}
                    className="flex-1 px-2 py-1 text-xs bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && submissions.length === 0 && (
          <div className="voisss-card text-center py-12">
            <p className="text-gray-400 mb-4">No {statusFilter} submissions yet</p>
            <p className="text-sm text-gray-500">Submissions will appear here as users submit content</p>
          </div>
        )}
      </div>

      {/* Reward Form Modal */}
      {showRewardForm && selectedSubmission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <RewardDistributionForm
              submission={selectedSubmission}
              onSuccess={() => {
                setShowRewardForm(false);
                queryClient.invalidateQueries({ queryKey: ["submissions"] });
              }}
              onCancel={() => setShowRewardForm(false)}
            />
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmission && !showRewardForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="voisss-card w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Submission Details</h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* User */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                <p className="text-sm font-mono text-[#7C5DFA] break-all">{selectedSubmission.userId}</p>
              </div>

              {/* Recording */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Recording ID</p>
                <p className="text-sm font-mono text-white break-all">{selectedSubmission.recordingId}</p>
              </div>

              {selectedSubmission.recordingIpfsHash && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">IPFS Hash</p>
                  <p className="text-xs font-mono text-gray-400 break-all">{selectedSubmission.recordingIpfsHash}</p>
                </div>
              )}

              {/* Location */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Location</p>
                <p className="text-sm text-white">
                  {selectedSubmission.location.city}, {selectedSubmission.location.country}
                </p>
              </div>

              {/* Context */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Context</p>
                <p className="text-sm text-white">{selectedSubmission.context}</p>
              </div>

              {/* Transcription */}
              {selectedSubmission.transcription && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Transcription</p>
                  <p className="text-sm text-gray-300">{selectedSubmission.transcription}</p>
                </div>
              )}

              {/* Submitted At */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Submitted</p>
                <p className="text-sm text-white">{new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-[#3A3A3A]">
                <button
                  onClick={() => {
                    setShowRewardForm(true);
                  }}
                  className="flex-1 px-4 py-2 bg-[#7C5DFA] hover:bg-[#6D4AE8] text-white rounded-lg font-medium transition-colors"
                >
                  Reward
                </button>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="flex-1 px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] text-white rounded-lg font-medium hover:bg-[#3A3A3A] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
