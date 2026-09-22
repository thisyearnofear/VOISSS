"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  RecordingCard,
  SocialShare,
  BaseModal,
  type ShareableRecording,
} from "@voisss/ui";
import MascotEmptyState from "./MascotEmptyState";
import {
  useListeningPlayback,
  useListeningRoom,
} from "@/contexts/ListeningRoomContext";

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
  const { player } = useListeningRoom();
  const playback = useListeningPlayback();
  const [sharingRecording, setSharingRecording] =
    useState<ShareableRecording | null>(null);
  // Blob URLs minted for local (un-uploaded) recordings. Revoked on delete /
  // unmount so repeated play/pause cycles never leak object URLs.
  const blobUrls = useRef(new Map<string, string>());
  useEffect(() => {
    const cache = blobUrls.current;
    return () => {
      for (const url of cache.values()) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      }
      cache.clear();
    };
  }, []);

  const resolveAudioUrl = useCallback(
    (recordingId: string): string | null => {
      const cached = blobUrls.current.get(recordingId);
      if (cached) return cached;
      const recording = recordings.find((r) => r.id === recordingId);
      const localRec = localRecordings?.find((r) => r.id === recordingId);
      if (localRec?.blob) {
        const url = URL.createObjectURL(localRec.blob);
        blobUrls.current.set(recordingId, url);
        return url;
      }
      if (recording?.ipfsHash) {
        return `https://gateway.pinata.cloud/ipfs/${recording.ipfsHash}`;
      }
      return null;
    },
    [recordings, localRecordings]
  );

  const isCurrent = (recordingId: string) =>
    playback.track?.id === `sample:${recordingId}` &&
    playback.track?.kind === "sample";
  const isPlayingId = (recordingId: string) =>
    isCurrent(recordingId) && playback.status === "playing";

  const handlePlayRecording = useCallback(
    async (recordingId: string) => {
      const recording =
        recordings.find((r) => r.id === recordingId) ??
        localRecordings?.find((r) => r.id === recordingId);
      const audioUrl = resolveAudioUrl(recordingId);
      if (!audioUrl || !recording) return;
      await player
        .toggle({
          id: `sample:${recordingId}`,
          url: audioUrl,
          title: recording.title || "Recording",
          subtitle: "Studio recording",
          kind: "sample",
        })
        .catch(() => {});
    },
    [player, recordings, localRecordings, resolveAudioUrl]
  );

  const handlePauseRecording = useCallback(
    (recordingId: string) => {
      // Toggling the same shared track pauses; anything else is a no-op.
      if (isCurrent(recordingId)) {
        const snap = player.getSnapshot();
        if (snap.status === "playing" || snap.status === "loading") {
          player.stop();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [player, playback.track?.id, playback.status]
  );

  const handleDeleteRecording = useCallback(
    (recordingId: string) => {
      // Stop shared playback if the deleted recording is audible, then free
      // its blob URL so the object-URL cache can't grow across deletes.
      if (isCurrent(recordingId)) player.stop();
      const cached = blobUrls.current.get(recordingId);
      if (cached) {
        try {
          URL.revokeObjectURL(cached);
        } catch {
          // ignore
        }
        blobUrls.current.delete(recordingId);
      }
      // Notify parent to remove from state
      onDeleteLocal?.(recordingId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [player, playback.track?.id, onDeleteLocal]
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
                isPlaying: isPlayingId(recording.id),
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
        <MascotEmptyState
          title="No recordings yet"
          description="Start recording above to create your first voice recording!"
        />
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
