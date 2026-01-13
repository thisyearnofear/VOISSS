"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MissionResponse } from "@voisss/shared/types/socialfi";
import SubmissionCard from "@/components/submissions/SubmissionCard";

type SortBy = "recent" | "trending" | "most-liked";

export default function SubmissionsGalleryPage() {
  const [sortBy, setSortBy] = useState<SortBy>("trending");
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<MissionResponse | null>(null);

  // Fetch all approved submissions
  const { data: submissionsData, isLoading } = useQuery({
    queryKey: ["submissions-gallery"],
    queryFn: async () => {
      const response = await fetch("/api/admin/submissions?status=approved");
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  let submissions: MissionResponse[] = submissionsData?.submissions || [];

  // Filter by mission if selected
  if (selectedMission) {
    submissions = submissions.filter(s => s.missionId === selectedMission);
  }

  // Sort submissions
  const sortedSubmissions = [...submissions].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        return b.submittedAt.getTime() - a.submittedAt.getTime();
      case "most-liked":
        // Sort by submission date when likes not available
        return b.submittedAt.getTime() - a.submittedAt.getTime();
      case "trending":
        // Sort by submission date when engagement metrics not tracked
        return b.submittedAt.getTime() - a.submittedAt.getTime();
      default:
        return 0;
    }
  });

  // Get unique missions for filter
  const uniqueMissions = Array.from(
    new Map(submissions.map(s => [s.missionId, s.missionId])).entries()
  ).map(([, id]) => id);

  return (
    <div className="voisss-container voisss-section-spacing">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            Community Submissions
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Explore authentic voices from around the world. Browse submissions, 
            engage with creators, and discover diverse perspectives.
          </p>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {(["trending", "recent", "most-liked"] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    sortBy === sort
                      ? "bg-[#7C5DFA] text-white"
                      : "bg-[#2A2A2A] text-gray-400 border border-[#3A3A3A] hover:border-[#4A4A4A]"
                  }`}
                >
                  {sort === "trending" && "🔥 Trending"}
                  {sort === "recent" && "📅 Recent"}
                  {sort === "most-liked" && "❤️ Most Liked"}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              {sortedSubmissions.length} submissions
            </p>
          </div>

          {/* Mission Filter - only show if there are multiple missions */}
          {uniqueMissions.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedMission(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  selectedMission === null
                    ? "bg-[#7C5DFA] text-white"
                    : "bg-[#2A2A2A] text-gray-400 border border-[#3A3A3A] hover:border-[#4A4A4A]"
                }`}
              >
                All Missions
              </button>
              {uniqueMissions.map((missionId) => (
                <button
                  key={missionId}
                  onClick={() => setSelectedMission(missionId)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    selectedMission === missionId
                      ? "bg-[#7C5DFA] text-white"
                      : "bg-[#2A2A2A] text-gray-400 border border-[#3A3A3A] hover:border-[#4A4A4A]"
                  }`}
                >
                  {missionId.slice(0, 8)}...
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="voisss-card text-center py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] rounded-full mb-4">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-400 mt-4">Loading submissions...</p>
          </div>
        )}

        {/* Submissions Grid */}
        {!isLoading && sortedSubmissions.length > 0 && (
          <div className="voisss-responsive-grid">
            {sortedSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                variant="gallery"
                onClick={() => setSelectedSubmission(submission)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && sortedSubmissions.length === 0 && (
          <div className="voisss-card text-center py-16">
            <p className="text-gray-400 mb-4 text-lg">No submissions yet</p>
            <p className="text-sm text-gray-500">
              {selectedMission
                ? "This mission doesn't have any submissions yet"
                : "Check back soon as creators submit their work"}
            </p>
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="voisss-card w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#3A3A3A]">
              <h2 className="text-xl font-semibold text-white">Submission Details</h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-5">
              {/* Creator */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Creator</p>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">
                      {selectedSubmission.userId.slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm font-mono text-[#7C5DFA] break-all">
                    {selectedSubmission.userId.slice(0, 10)}...
                  </p>
                </div>
              </div>

              {/* Location & Context */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Location & Context</p>
                <p className="text-sm text-white mb-1">
                  📍 {selectedSubmission.location.city}, {selectedSubmission.location.country}
                </p>
                <p className="text-sm text-gray-300">{selectedSubmission.context}</p>
              </div>

              {/* Quality Status */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Status</p>
                <p className={`text-sm font-semibold ${
                  selectedSubmission.status === 'approved' ? 'text-[#22C55E]' :
                  selectedSubmission.status === 'flagged' ? 'text-yellow-500' :
                  'text-red-500'
                }`}>
                  {selectedSubmission.status === 'approved' && '✓ Approved'}
                  {selectedSubmission.status === 'flagged' && '⚠ Flagged'}
                  {selectedSubmission.status === 'removed' && '✗ Removed'}
                </p>
              </div>

              {/* Submitted */}
              <div className="pt-3 border-t border-[#3A3A3A]">
                <p className="text-xs text-gray-500 mb-1">Submitted</p>
                <p className="text-sm text-white">
                  {new Date(selectedSubmission.submittedAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Privacy Info */}
              <div className="flex gap-2 flex-wrap">
                {selectedSubmission.participantConsent && (
                  <span className="px-2 py-1 text-xs bg-[#22C55E]/20 text-[#22C55E] rounded">
                    ✓ Consent obtained
                  </span>
                )}
                {selectedSubmission.isAnonymized && (
                  <span className="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded">
                    🔒 Anonymized
                  </span>
                )}
              </div>
            </div>

            {/* Close Button */}
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
