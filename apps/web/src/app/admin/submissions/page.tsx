"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MissionResponse } from "@voisss/shared/types/socialfi";
import RewardDistributionForm from "@/components/admin/RewardDistributionForm";
import { Badge } from "@/components/ui";

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
    <main id="listening-main">
      <div
        className="lr-wrap lr-dark"
        style={{ paddingBottom: "var(--lr-space-2xl)" }}
      >
      <div className="space-y-6">
        {/* Header */}
        <div style={{ paddingTop: "var(--lr-space-md)" }}>
          <h1
            className="lr-h1"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)", margin: 0 }}
          >
            Submissions Gallery
          </h1>
          <p className="lr-quiet">Review, flag, and reward user submissions</p>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter by status">
          {(["approved", "flagged", "removed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              aria-pressed={statusFilter === status}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === status
                  ? "text-white"
                  : "text-gray-400 border hover:text-white"
              }`}
              style={
                statusFilter === status
                  ? { background: "var(--lr-accent)" }
                  : {
                      background: "var(--lr-night-raised)",
                      borderColor: "var(--lr-night-line)",
                    }
              }
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({submissions.length})
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="lr-card" role="alert">
            <p className="lr-error-text" style={{ margin: 0 }}>Failed to load submissions</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="lr-card" style={{ textAlign: "center", padding: "3rem 1rem" }} role="status">
            <div
              className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"
              style={{ margin: "0 auto 1rem" }}
              aria-hidden
            />
            <p className="lr-quiet" style={{ margin: 0 }}>Loading submissions...</p>
          </div>
        )}

        {/* Submissions Grid */}
        {!isLoading && submissions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map((submission) => (
              <article
                key={submission.id}
                className="lr-card"
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedSubmission(submission)}
              >
                {/* Submission Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">
                      {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
                    </p>
                    <p
                      className="text-sm font-mono truncate"
                      style={{ color: "var(--lr-night-accent)" }}
                    >
                      {submission.userId.slice(0, 6)}...{submission.userId.slice(-4)}
                    </p>
                  </div>
                  <Badge>{submission.rewardStatus}</Badge>
                </div>

                {/* Status */}
                <div
                  className="lr-legacy-inset"
                  style={{ marginBottom: "1rem", padding: "0.75rem" }}
                >
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--lr-night-ink)" }}>
                    {submission.rewardStatus === 'distributed' && '✓ Distributed'}
                    {submission.rewardStatus === 'pending' && '⧖ Pending'}
                    {submission.rewardStatus === 'flagged' && '⚠ Flagged'}
                    {submission.rewardStatus === 'removed' && '✗ Removed'}
                    {submission.rewardStatus === 'claimed' && '⚡ Claimed'}
                  </p>
                </div>

                {/* Location */}
                {submission.location && (
                  <p className="text-xs text-gray-500 mb-3">
                    📍 {submission.location.city}, {submission.location.country}
                  </p>
                )}

                {/* Quick Actions */}
                <div
                  className="flex gap-2 pt-3"
                  style={{ borderTop: "1px solid var(--lr-night-line)" }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSubmission(submission);
                      setShowRewardForm(true);
                    }}
                    className="flex-1 px-2 py-1 text-xs text-white rounded transition-colors"
                    style={{ background: "var(--lr-accent)" }}
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
              </article>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && submissions.length === 0 && (
          <div className="lr-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <p className="lr-quiet" style={{ margin: "0 0 0.5rem" }}>No {statusFilter} submissions yet</p>
            <p className="text-sm text-gray-500" style={{ margin: 0 }}>Submissions will appear here as users submit content</p>
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
          <div className="lr-card w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Submission Details</h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
                aria-label="Close submission details"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* User */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                <p
                  className="text-sm font-mono break-all"
                  style={{ color: "var(--lr-night-accent)" }}
                >
                  {selectedSubmission.userId}
                </p>
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
              {selectedSubmission.location && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <p className="text-sm text-white">
                    {selectedSubmission.location.city}, {selectedSubmission.location.country}
                  </p>
                </div>
              )}

              {/* Context */}
              {(selectedSubmission as any).context && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Context</p>
                  <p className="text-sm text-white">{(selectedSubmission as any).context}</p>
                </div>
              )}

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
                <p className="text-sm text-white">{selectedSubmission.submittedAt ? new Date(selectedSubmission.submittedAt).toLocaleString() : 'N/A'}</p>
              </div>

              {/* Action Buttons */}
              <div
                className="flex gap-2 pt-4"
                style={{ borderTop: "1px solid var(--lr-night-line)" }}
              >
                <button
                  onClick={() => {
                    setShowRewardForm(true);
                  }}
                  className="flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors"
                  style={{ background: "var(--lr-accent)" }}
                >
                  Reward
                </button>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors"
                  style={{
                    background: "var(--lr-night-raised)",
                    border: "1px solid var(--lr-night-line)",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}
