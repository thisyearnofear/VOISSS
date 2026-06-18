"use client";

import { useMemo, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import RecordingStudio from "../../components/RecordingStudio";
import StudioRecordingsList from "../../components/StudioRecordingsList";
import StudioEarningsHero from "../../components/StudioEarningsHero";
import { useRecordings } from "../../hooks/queries/useRecordings";
import { useAuth } from "../../contexts/AuthContext";

function StudioPageInner() {
  const searchParams = useSearchParams();
  const templateId = useMemo(
    () => searchParams.get("templateId") || undefined,
    [searchParams],
  );
  const mode = useMemo(
    () => searchParams.get("mode") || undefined,
    [searchParams],
  );
  const missionId = useMemo(
    () => searchParams.get("missionId") || undefined,
    [searchParams],
  );

  // Local recordings state (for guest users)
  const [localRecordings, setLocalRecordings] = useState<
    Array<{
      id: string;
      title: string;
      duration: number;
      blob: Blob;
      createdAt: string;
    }>
  >([]);

  // Enhanced recordings from hook (local + on-chain)
  const { isAuthenticated, address } = useAuth();
  const { data: allRecordings = [], isLoading: isLoadingRecordings } =
    useRecordings();

  interface RecordingWithIpfs {
    id: string;
    title: string;
    duration: number;
    createdAt: string | Date;
    onChain?: boolean;
    ipfsHash?: string;
  }

  const handleRecordingComplete = (audioBlob: Blob, duration: number) => {
    const newRecording = {
      id: Date.now().toString(),
      title: `Recording ${localRecordings.length + 1}`,
      duration,
      blob: audioBlob,
      createdAt: new Date().toISOString(),
    };
    setLocalRecordings((prev) => [newRecording, ...prev]);
  };

  const handleDeleteLocal = useCallback((recordingId: string) => {
    setLocalRecordings((prev) => prev.filter((r) => r.id !== recordingId));
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-8 sm:py-12">
        {/* "Earn 70%" hero — closes the click-through from the homepage
            showcase (OriginalVsAiShowcase links "70%" to /studio).
            Anchors the visitor before the recording tool loads. */}
        <StudioEarningsHero />

        {/* Recording Studio */}
        <div id="recording-section" className="mb-12">
          <RecordingStudio
            onRecordingComplete={handleRecordingComplete}
            initialTranscriptTemplateId={templateId}
            initialMode={mode}
            missionId={missionId}
          />
        </div>

        {/* Discover Agent Content CTA */}
        <div className="max-w-4xl mx-auto mb-12">
          <a
            href="/agents"
            className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-xl hover:border-indigo-500/50 hover:from-indigo-600/30 hover:to-purple-600/30 transition-all duration-300 group"
          >
            <svg
              className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="text-indigo-300 font-medium">
              Discover Agent Commentary
            </span>
            <span className="text-indigo-400/60 text-sm">&rarr;</span>
          </a>
        </div>

        {/* Recordings List — authenticated users */}
        {isAuthenticated &&
          (allRecordings.length > 0 || isLoadingRecordings) && (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Your Recordings
                </h2>
                {isLoadingRecordings && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                )}
              </div>
              <StudioRecordingsList
                recordings={allRecordings.map((r: RecordingWithIpfs) => ({
                  id: r.id,
                  title: r.title,
                  duration: r.duration,
                  createdAt:
                    typeof r.createdAt === "string"
                      ? r.createdAt
                      : r.createdAt instanceof Date
                        ? r.createdAt.toISOString()
                        : new Date().toISOString(),
                  tags: r.onChain ? ["on-chain"] : ["local"],
                  onChain: r.onChain,
                  ipfsHash: r.ipfsHash,
                }))}
                isLoading={isLoadingRecordings}
                isAuthenticated={isAuthenticated}
                userId={address || undefined}
              />
            </div>
          )}

        {/* Legacy Local Recordings — guest users */}
        {!isAuthenticated && localRecordings.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">
              Session Recordings
              <span className="text-sm font-normal text-gray-400 ml-2">
                (Sign in to save permanently)
              </span>
            </h2>
            <StudioRecordingsList
              recordings={localRecordings.map((r) => ({
                id: r.id,
                title: r.title,
                duration: r.duration,
                createdAt: r.createdAt,
                tags: ["session"],
              }))}
              localRecordings={localRecordings}
              isAuthenticated={isAuthenticated}
              onDeleteLocal={handleDeleteLocal}
              userId={address || undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] text-white">
          <div className="voisss-container py-8 sm:py-12">
            Loading studio...
          </div>
        </div>
      }
    >
      <StudioPageInner />
    </Suspense>
  );
}
