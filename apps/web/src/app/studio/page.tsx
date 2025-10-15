"use client";

import { useState } from "react";
import RecordingStudio from "../../components/RecordingStudio";
import { formatDuration } from "@voisss/shared";

export default function RecordPage() {
  const [recordings, setRecordings] = useState<
    Array<{
      id: string;
      title: string;
      duration: number;
      blob: Blob;
      createdAt: Date;
    }>
  >([]);

  const handleRecordingComplete = (audioBlob: Blob, duration: number) => {
    const newRecording = {
      id: Date.now().toString(),
      title: `Recording ${recordings.length + 1}`,
      duration,
      blob: audioBlob,
      createdAt: new Date(),
    };
    setRecordings((prev) => [newRecording, ...prev]);
  };

  const handlePlayRecording = (recording: any) => {
    const audio = new Audio(URL.createObjectURL(recording.blob));
    audio.play();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-8 sm:py-12">
        {/* Unified Recording Studio - Works for both connected and unconnected users */}
        <div id="recording-section" className="mb-12">
          <RecordingStudio onRecordingComplete={handleRecordingComplete} />
        </div>

        {/* Legacy Recordings List - Only show for guest users with local recordings */}
        {recordings.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">
              Your Recordings
            </h2>
            <div className="space-y-4">
              {recordings.map((recording) => (
                <div key={recording.id} className="voisss-recording-card">
                  <div className="voisss-recording-header">
                    <div className="voisss-recording-content">
                      <h3 className="text-lg font-semibold text-white mb-1 voisss-text-truncate">
                        {recording.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Duration: {formatDuration(recording.duration)} •
                        Created: {recording.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="voisss-action-buttons">
                      <button
                        onClick={() => handlePlayRecording(recording)}
                        className="voisss-action-btn-primary"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Play
                      </button>
                      <button
                        onClick={() => {
                          const url = URL.createObjectURL(recording.blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${recording.title}.webm`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="voisss-action-btn-secondary"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}