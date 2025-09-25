"use client";

import { useState } from "react";
import RecordingStudio from "../components/RecordingStudio";
import StarknetRecordingStudio from "../components/StarknetRecordingStudio";
import { useAccount } from "@starknet-react/core";

export default function Home() {
  const { isConnected } = useAccount();
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

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handlePlayRecording = (recording: any) => {
    const audio = new Audio(URL.createObjectURL(recording.blob));
    audio.play();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold voisss-gradient-text mb-4">
            VOISSS
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 mb-2">
            Record + Transform with AI
          </p>
          <p className="text-gray-400 mb-8">
            High-quality voice recording with AI voice transformation
          </p>
          
          {/* Value Props */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span className="text-sm text-gray-300">1 Free AI Transform</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full">
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="text-sm text-gray-300">Decentralized Storage</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full">
              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
              </svg>
              <span className="text-sm text-gray-300">HD Quality</span>
            </div>
          </div>
        </div>



        {/* Recording Studio */}
        <div id="recording-section" className="mb-12">
          {isConnected ? (
            <StarknetRecordingStudio />
          ) : (
            <RecordingStudio onRecordingComplete={handleRecordingComplete} />
          )}
        </div>

        {/* Recordings List - Only show for non-connected users */}
        {!isConnected && recordings.length > 0 && (
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

        {/* Simple Footer */}
        <div className="text-center mt-16 pt-8 border-t border-[#2A2A2A]">
          <p className="text-gray-400 text-sm mb-4">
            Built for Starknet Reignite Hackathon
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="/platform" className="text-gray-400 hover:text-white transition-colors">
              Platform
            </a>
            <a href="/features" className="text-gray-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="/missions" className="text-gray-400 hover:text-white transition-colors">
              Missions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
