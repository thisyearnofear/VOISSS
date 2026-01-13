"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { MissionResponse } from "@voisss/shared/types/socialfi";
import SubmissionCard from "@/components/submissions/SubmissionCard";

export default function CreatorDashboardPage() {
  const { address, isAuthenticated } = useAuth();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [selectedSubmission, setSelectedSubmission] = useState<MissionResponse | null>(null);

  // Fetch user's submissions
  const { data: submissionsData, isLoading: submissionsLoading } = useQuery({
    queryKey: ["my-submissions", address],
    queryFn: async () => {
      if (!address) throw new Error("Not authenticated");
      const response = await fetch(`/api/admin/submissions?userId=${address}&status=approved`);
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return response.json();
    },
    enabled: !!address && isAuthenticated,
    refetchInterval: 30000,
  });

  // Fetch reward distributions for this user
  const { data: distributionsData, isLoading: distributionsLoading } = useQuery({
    queryKey: ["my-rewards", address],
    queryFn: async () => {
      if (!address) throw new Error("Not authenticated");
      const response = await fetch(`/api/admin/rewards/distributions?walletAddress=${address}`);
      if (!response.ok) throw new Error("Failed to fetch rewards");
      return response.json();
    },
    enabled: !!address && isAuthenticated,
  });

  if (!isAuthenticated || !address) {
    return (
      <div className="voisss-container voisss-section-spacing">
        <div className="voisss-card text-center py-16">
          <h2 className="text-xl font-semibold text-white mb-4">Sign in to view your dashboard</h2>
          <p className="text-gray-400">Connect your wallet to see your submissions, engagement, and earnings.</p>
        </div>
      </div>
    );
  }

  const submissions: MissionResponse[] = submissionsData?.submissions || [];
  const distributions = distributionsData?.distributions || [];

  // Filter submissions by time range
  let filteredSubmissions = submissions;
  if (timeRange !== "all") {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    filteredSubmissions = submissions.filter(s => new Date(s.submittedAt) >= cutoff);
  }

  // Calculate stats
  const totalViews = filteredSubmissions.reduce((sum, s) => sum + s.views, 0);
  const totalLikes = filteredSubmissions.reduce((sum, s) => sum + s.likes, 0);
  const totalComments = filteredSubmissions.reduce((sum, s) => sum + s.comments, 0);
  
  const totalEarnings = distributions.reduce((sum, d) => sum + d.papajamsAmount + d.voisssAmount, 0);
  const pendingEarnings = distributions
    .filter(d => d.status === "pending_transaction")
    .reduce((sum, d) => sum + d.papajamsAmount + d.voisssAmount, 0);

  return (
    <div className="voisss-container voisss-section-spacing">
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-[#3A3A3A] pb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Creator Dashboard</h1>
          <p className="text-gray-400 font-mono text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="voisss-responsive-grid">
          {/* Submissions */}
          <div className="voisss-card">
            <p className="text-gray-500 text-xs mb-2">SUBMISSIONS ({timeRange})</p>
            <p className="text-3xl font-bold text-white mb-4">{filteredSubmissions.length}</p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>📅 Active submissions</p>
              <p>Status: All approved</p>
            </div>
          </div>

          {/* Total Engagement */}
          <div className="voisss-card">
            <p className="text-gray-500 text-xs mb-2">TOTAL ENGAGEMENT ({timeRange})</p>
            <p className="text-3xl font-bold text-[#7C5DFA] mb-4">
              {totalViews + totalLikes + totalComments}
            </p>
            <div className="space-y-1 text-sm text-gray-400">
              <p>👁️ {totalViews} views</p>
              <p>❤️ {totalLikes} likes</p>
              <p>💬 {totalComments} comments</p>
            </div>
          </div>

          {/* Earnings */}
          <div className="voisss-card">
            <p className="text-gray-500 text-xs mb-2">TOTAL EARNINGS</p>
            <p className="text-3xl font-bold text-[#22C55E] mb-4">{totalEarnings}</p>
            <div className="space-y-1 text-sm text-gray-400">
              <p>🎁 Tokens distributed</p>
              <p>⏳ {pendingEarnings} pending</p>
            </div>
          </div>

          {/* Avg. Engagement Per Submission */}
          <div className="voisss-card">
            <p className="text-gray-500 text-xs mb-2">AVG. PER SUBMISSION ({timeRange})</p>
            <p className="text-3xl font-bold text-white mb-4">
              {filteredSubmissions.length > 0
                ? Math.round((totalViews + totalLikes + totalComments) / filteredSubmissions.length)
                : 0}
            </p>
            <div className="space-y-1 text-sm text-gray-400">
              <p>🚀 Engagement per post</p>
              <p>Trending potential</p>
            </div>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2">
          {(["7d", "30d", "90d", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                timeRange === range
                  ? "bg-[#7C5DFA] text-white"
                  : "bg-[#2A2A2A] text-gray-400 border border-[#3A3A3A] hover:border-[#4A4A4A]"
              }`}
            >
              {range === "all" ? "All Time" : range}
            </button>
          ))}
        </div>

        {/* Submissions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#3A3A3A] pb-4">
            <h2 className="text-xl font-semibold text-white">Your Submissions</h2>
            <p className="text-sm text-gray-500">{filteredSubmissions.length} total</p>
          </div>

          {submissionsLoading ? (
            <div className="voisss-card text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] rounded-full mb-4">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-400 mt-4">Loading your submissions...</p>
            </div>
          ) : filteredSubmissions.length > 0 ? (
            <div className="voisss-responsive-grid">
              {filteredSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  variant="dashboard"
                  showCreator={false}
                  onClick={() => setSelectedSubmission(submission)}
                />
              ))}
            </div>
          ) : (
            <div className="voisss-card text-center py-12">
              <p className="text-gray-400 mb-4">No submissions yet</p>
              <p className="text-sm text-gray-500">Start creating to see your submissions here</p>
            </div>
          )}
        </div>

        {/* Rewards History */}
        {distributions.length > 0 && (
          <div className="space-y-4">
            <div className="border-b border-[#3A3A3A] pb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Reward History</h2>
              <div className="flex gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <span className="text-[#7C5DFA]">📊</span>
                  <span>$papajams = Your reward</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-purple-400">💜</span>
                  <span>$voisss = Platform</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {distributions.map((distribution) => (
                <div key={distribution.id} className="voisss-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-mono text-[#7C5DFA]">
                          {distribution.submissionId.slice(0, 12)}...
                        </p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          distribution.status === "pending_transaction"
                            ? "bg-yellow-600/20 text-yellow-400"
                            : distribution.status === "sent"
                            ? "bg-[#22C55E]/20 text-[#22C55E]"
                            : "bg-red-600/20 text-red-400"
                        }`}>
                          {distribution.status === "pending_transaction" && "⏳ Pending"}
                          {distribution.status === "sent" && "✓ Sent"}
                          {distribution.status === "failed" && "✗ Failed"}
                        </span>
                      </div>
                      {distribution.notes && (
                        <p className="text-sm text-gray-400 mb-2">{distribution.notes}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(distribution.distributedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-semibold text-[#7C5DFA] mb-1">
                        {distribution.papajamsAmount + distribution.voisssAmount}
                      </p>
                      <p className="text-xs text-gray-500">
                        {distribution.papajamsAmount}📊 + {distribution.voisssAmount}💜
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="voisss-card w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#3A3A3A]">
              <h2 className="text-xl font-semibold text-white">Submission</h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-5">
              {/* Engagement */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Engagement</p>
                <div className="grid grid-cols-3 gap-2 p-3 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Views</p>
                    <p className="text-lg font-semibold text-white">{selectedSubmission.views}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Likes</p>
                    <p className="text-lg font-semibold text-[#22C55E]">{selectedSubmission.likes}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Comments</p>
                    <p className="text-lg font-semibold text-[#7C5DFA]">{selectedSubmission.comments}</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Location</p>
                <p className="text-sm text-white">
                  📍 {selectedSubmission.location.city}, {selectedSubmission.location.country}
                </p>
              </div>

              {/* Context */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Context</p>
                <p className="text-sm text-white">{selectedSubmission.context}</p>
              </div>

              {/* Recording ID */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Recording ID</p>
                <p className="text-xs font-mono text-gray-400 break-all">{selectedSubmission.recordingId}</p>
              </div>

              {/* Submitted */}
              <div className="pt-3 border-t border-[#3A3A3A]">
                <p className="text-xs text-gray-500 mb-1">Submitted</p>
                <p className="text-sm text-white">
                  {new Date(selectedSubmission.submittedAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedSubmission(null)}
              className="w-full mt-6 px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] text-white rounded-lg font-medium hover:bg-[#3A3A3A] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
