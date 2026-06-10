"use client";

import { useState, useCallback } from "react";
import {
  RecordingCard,
  SocialShare,
  BaseModal,
  type ShareableRecording,
} from "@voisss/ui";

interface RecordingSummary {
  id: string;
  title: string;
  duration: number;
  createdAt: string;
  tags?: string[];
  onChain?: boolean;
  ipfsHash?: string;
}

interface StudioRecordingsListProps {
  recordings: RecordingSummary[];
  localRecordings?: Array<{
    id: string;
    title: string;
    duration: number;
    blob: Blob;
    createdAt: string;
  }>;
  isLoading?: boolean;
  isAuthenticated: boolean;
  onDeleteLocal?: (recordingId: string) => void;
  userId?: string;
}

/**
 * Encapsulates the playback, deletion, and sharing logic for the recordings gallery.
 * This is a `"use client"` boundary — it keeps browser-only APIs (Audio, URL.createObjectURL)
 * isolated so the parent page doesn't need them.
 */
export default function StudioRecordingsList({
  recordings,
  localRecordings,
  isLoading,
  isAuthenticated,
  onDeleteLocal,
  userId,
}: StudioRecordingsListProps) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<
    Map<string, HTMLAudioElement>
  >(new Map());
  const [sharingRecording, setSharingRecording] =
    useState<ShareableRecording | null>(null);

  const handlePlayRecording = useCallback(
    async (recordingId: string) => {
      try {
        // Stop currently playing audio
        if (currentlyPlaying && audioElements.has(currentlyPlaying)) {
          const currentAudio = audioElements.get(currentlyPlaying);
          currentAudio?.pause();
          setCurrentlyPlaying(null);
        }        const recording = recordings.find((r) => r.id === recordingId);
        const localRec = localRecordings?.find((r) => r.id === recordingId);

        let audioUrl: string;

        if (localRec?.blob) {
          audioUrl = URL.createObjectURL(localRec.blob);
        } else if (recording?.ipfsHash) {
          audioUrl = `https://gateway.pinata.cloud/ipfs/${recording.ipfsHash}`;
        } else {
          throw new Error("No audio source available");
        }

        let audio = audioElements.get(recordingId);
        if (!audio) {
          audio = new Audio(audioUrl);
          audio.addEventListener("ended", () => setCurrentlyPlaying(null));
          audio.addEventListener("error", (e) => {
            console.error("Audio playback error:", e);
            setCurrentlyPlaying(null);
          });
          setAudioElements((prev) => new Map(prev).set(recordingId, audio!));
        }

        await audio.play();
        setCurrentlyPlaying(recordingId);
      } catch (error) {
        console.error("Failed to play recording:", error);
        setCurrentlyPlaying(null);
      }
    },
    [currentlyPlaying, audioElements, recordings, localRecordings],
  );

  const handlePauseRecording = useCallback(
    (recordingId: string) => {
      const audio = audioElements.get(recordingId);
      if (audio) {
        audio.pause();
        setCurrentlyPlaying(null);
      }
    },
    [audioElements],
  );

  const handleDeleteRecording = useCallback(
    (recordingId: string) => {
      // Clean up audio element
      const audio = audioElements.get(recordingId);
      if (audio) {
        audio.pause();
        audio.src = "";
        setAudioElements((prev) => {
          const newMap = new Map(prev);
          newMap.delete(recordingId);
          return newMap;
        });
      }
      if (currentlyPlaying === recordingId) {
        setCurrentlyPlaying(null);
      }
      // Notify parent to remove from state
      onDeleteLocal?.(recordingId);
    },
    [audioElements, currentlyPlaying, onDeleteLocal],
  );

  const handleShareRecording = (recording: ShareableRecording) => {
    setSharingRecording(recording);
  };

  return (
    <>
      {recordings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recordings.map((recording) => (
            <RecordingCard
              key={recording.id}
              recording={{
                id: recording.id,
                title: recording.title,
                duration: recording.duration,
                createdAt: recording.createdAt,
                tags: recording.onChain ? ["on-chain"] : ["local"],
                isPlaying: currentlyPlaying === recording.id,
                onChain: recording.onChain,
              }}
              onPlay={handlePlayRecording}
              onPause={handlePauseRecording}
              onDelete={recording.onChain ? undefined : handleDeleteRecording}
              onShare={handleShareRecording}
            />
          ))}
        </div>
      )}

      {recordings.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            No recordings yet
          </h3>
          <p className="text-gray-400 text-sm">
            Start recording above to create your first voice recording!
          </p>
        </div>
      )}

      {/* Sharing Modal */}
      <BaseModal
        visible={!!sharingRecording}
        onClose={() => setSharingRecording(null)}
        title="Share Recording"
      >
        {sharingRecording && (
          <SocialShare
            recording={sharingRecording}
            userId={userId}
            generateReferralCode={async (refUserId: string, recordingId: string) => {
              const hash = btoa(`${refUserId}:${recordingId}`).slice(0, 8);
              return hash;
            }}
            onShare={(platform: string, url: string) => {
              console.log(`Shared to ${platform}:`, url);
            }}
          />
        )}
      </BaseModal>
    </>
  );
}
