"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import RecordingStudio from "../../components/RecordingStudio";
import { RecordingCard } from "@voisss/ui";
import { formatDuration } from "@voisss/shared";
import { useRecordings } from "../../hooks/queries/useRecordings";
import { useAuth } from "../../contexts/AuthContext";
import { SocialShare } from "@voisss/ui";
export const dynamic = 'force-dynamic';

function StudioPageInner() {
  const searchParams = useSearchParams();
  const templateId = useMemo(() => searchParams.get('templateId') || undefined, [searchParams]);
  const mode = useMemo(() => searchParams.get('mode') || undefined, [searchParams]);
  // Legacy local recordings state (for backward compatibility)
  const [localRecordings, setLocalRecordings] = useState<
    Array<{
      id: string;
      title: string;
      duration: number;
      blob: Blob;
      createdAt: string;  // Now always a string to match Recording interface
    }>
  >([]);

  // Enhanced recordings from hook (local + on-chain)
  const { isAuthenticated, isCheckingSession } = useAuth();
  const { data: allRecordings = [], isLoading: isLoadingRecordings } = useRecordings();

  // Audio playback state
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map());

  // Sharing state
  const [sharingRecording, setSharingRecording] = useState<any | null>(null);

  const handleRecordingComplete = (audioBlob: Blob, duration: number) => {
    const newRecording = {
      id: Date.now().toString(),
      title: `Recording ${localRecordings.length + 1}`,
      duration,
      blob: audioBlob,
      createdAt: new Date().toISOString(),  // Convert to string to match Recording interface
    };
    setLocalRecordings((prev) => [newRecording, ...prev]);
  };

  // Enhanced audio playback with IPFS support
  const handlePlayRecording = async (recordingId: string) => {
    try {
      // Stop currently playing audio
      if (currentlyPlaying && audioElements.has(currentlyPlaying)) {
        const currentAudio = audioElements.get(currentlyPlaying);
        currentAudio?.pause();
        setCurrentlyPlaying(null);
      }

      const onChainRecording = allRecordings.find(r => r.id === recordingId);
      const localRecording = localRecordings.find(r => r.id === recordingId);

      if (!onChainRecording && !localRecording) return;

      let audioUrl: string;

      if (localRecording?.blob) {
        // Local recording with blob
        audioUrl = URL.createObjectURL(localRecording.blob);
      } else if (onChainRecording?.ipfsHash) {
        // On-chain recording from IPFS
        audioUrl = `https://gateway.pinata.cloud/ipfs/${onChainRecording.ipfsHash}`;
      } else {
        throw new Error('No audio source available');
      }

      // Create or reuse audio element
      let audio = audioElements.get(recordingId);
      if (!audio) {
        audio = new Audio(audioUrl);
        audio.addEventListener('ended', () => setCurrentlyPlaying(null));
        audio.addEventListener('error', (e) => {
          console.error('Audio playback error:', e);
          setCurrentlyPlaying(null);
        });
        setAudioElements(prev => new Map(prev).set(recordingId, audio!));
      }

      await audio.play();
      setCurrentlyPlaying(recordingId);
    } catch (error) {
      console.error('Failed to play recording:', error);
      setCurrentlyPlaying(null);
    }
  };

  const handlePauseRecording = (recordingId: string) => {
    const audio = audioElements.get(recordingId);
    if (audio) {
      audio.pause();
      setCurrentlyPlaying(null);
    }
  };

  const handleDeleteRecording = (recordingId: string) => {
    // Only allow deletion of local recordings for now
    setLocalRecordings(prev => prev.filter(r => r.id !== recordingId));

    // Clean up audio element
    const audio = audioElements.get(recordingId);
    if (audio) {
      audio.pause();
      audio.src = '';
      setAudioElements(prev => {
        const newMap = new Map(prev);
        newMap.delete(recordingId);
        return newMap;
      });
    }

    if (currentlyPlaying === recordingId) {
      setCurrentlyPlaying(null);
    }
  };

  const handleShareRecording = (recording: any) => {
    setSharingRecording(recording);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-8 sm:py-12">
        {/* Unified Recording Studio - Works for both connected and unconnected users */}
        <div id="recording-section" className="mb-12">
          <RecordingStudio onRecordingComplete={handleRecordingComplete} initialTranscriptTemplateId={templateId} initialMode={mode} />
        </div>

        {/* Enhanced Recordings List - Shows both local and on-chain recordings */}
        {(isAuthenticated && (allRecordings.length > 0 || isLoadingRecordings)) && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Your Recordings
              </h2>
              {isLoadingRecordings && (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Loading...</span>
                </div>
              )}
            </div>

            {allRecordings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allRecordings.map((recording) => (
                  <RecordingCard
                    key={recording.id}
                    recording={{
                      id: recording.id,
                      title: recording.title,
                      duration: recording.duration,
                      createdAt: typeof recording.createdAt === 'string'
                        ? recording.createdAt
                        : (recording.createdAt instanceof Date ? recording.createdAt.toISOString() : new Date().toISOString()),
                      tags: recording.onChain ? ['on-chain'] : ['local'],
                      isPlaying: currentlyPlaying === recording.id,
                      onChain: recording.onChain,
                    }}
                    onPlay={handlePlayRecording}
                    onPause={handlePauseRecording}
                    onDelete={recording.onChain ? undefined : handleDeleteRecording}
                    onShare={handleShareRecording}
                    className=""
                  />
                ))}
              </div>
            ) : !isLoadingRecordings ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No recordings yet</h3>
                <p className="text-gray-400 text-sm">
                  Start recording above to create your first voice recording!
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Legacy Local Recordings - Only show for guest users */}
        {!isAuthenticated && localRecordings.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">
              Session Recordings
              <span className="text-sm font-normal text-gray-400 ml-2">
                (Sign in to save permanently)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localRecordings.map((recording) => (
                <RecordingCard
                  key={recording.id}
                  recording={{
                    id: recording.id,
                    title: recording.title,
                    duration: recording.duration,
                    createdAt: typeof recording.createdAt === 'string' ? recording.createdAt : new Date().toISOString(),
                    tags: ['session'],
                    isPlaying: currentlyPlaying === recording.id,
                    onChain: false,
                  }}
                  onPlay={handlePlayRecording}
                  onPause={handlePauseRecording}
                  onDelete={handleDeleteRecording}
                  onShare={handleShareRecording}
                  className=""
                />
              ))}
            </div>
          </div>
        )}

        {/* Sharing Modal */}
        {sharingRecording && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0A0A0A] rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Share Recording</h3>
                <button
                  onClick={() => setSharingRecording(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <SocialShare
                  recording={sharingRecording}
                  onShare={(platform: string, url: string) => {
                    console.log(`Shared to ${platform}:`, url);
                    // Could add analytics tracking here
                  }}
                  className=""
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A] text-white"><div className="voisss-container py-8 sm:py-12">Loadingstudio...</div></div>}>
      <StudioPageInner />
    </Suspense>
  );
}