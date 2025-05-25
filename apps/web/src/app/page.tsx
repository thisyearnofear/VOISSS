"use client";

import { useState } from "react";
import RecordingStudio from "../components/RecordingStudio";
import StarknetRecordingStudio from "../components/StarknetRecordingStudio";
import WalletConnector from "../components/WalletConnector";
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold voisss-gradient-text mb-4">
            VOISSS
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Decentralized Voice Recording Platform
          </p>
          <p className="text-sm text-gray-400">
            Built exclusively for Starknet Reignite Hackathon
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="mb-12 max-w-md mx-auto">
          <WalletConnector />
        </div>

        {/* Recording Studio */}
        <div className="mb-12">
          {isConnected ? (
            <StarknetRecordingStudio />
          ) : (
            <RecordingStudio onRecordingComplete={handleRecordingComplete} />
          )}
        </div>

        {/* Recordings List */}
        {recordings.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">
              Your Recordings
            </h2>
            <div className="grid gap-4">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="voisss-card flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {recording.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Duration: {formatDuration(recording.duration)} • Created:{" "}
                      {recording.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePlayRecording(recording)}
                      className="voisss-btn-primary"
                    >
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
                      className="voisss-btn-secondary"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Platform Info */}
        <div className="text-center mt-16 max-w-4xl mx-auto">
          <p className="text-lg mb-8 text-gray-300">
            Transform how you capture, organize, and share audio content with
            our comprehensive three-app ecosystem on Starknet.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="voisss-card">
              <h3 className="font-semibold mb-2 text-blue-400 text-lg">
                🌐 Web dApp
              </h3>
              <p className="text-sm text-gray-300">
                Next.js + Starknet.js for browser-based recording and community
                features
              </p>
            </div>
            <div className="voisss-card">
              <h3 className="font-semibold mb-2 text-green-400 text-lg">
                📱 React Native
              </h3>
              <p className="text-sm text-gray-300">
                Cross-platform mobile app with Expo and Starknet integration
              </p>
            </div>
            <div className="voisss-card">
              <h3 className="font-semibold mb-2 text-[#7C5DFA] text-lg">
                🚀 Flutter Native
              </h3>
              <p className="text-sm text-gray-300">
                Native performance with starknet.dart SDK for optimal mobile
                experience
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-center justify-center flex-col sm:flex-row">
            <a
              className="rounded-full bg-blue-600 text-white hover:bg-blue-700 font-medium px-6 py-3 transition-colors"
              href="https://t.me/+jG3_jEJF8YFmOTY1"
              target="_blank"
              rel="noopener noreferrer"
            >
              🚀 Join Hackathon
            </a>
            <a
              className="rounded-full border border-gray-600 text-gray-300 hover:bg-gray-800 font-medium px-6 py-3 transition-colors"
              href="https://starknetdart.dev/"
              target="_blank"
              rel="noopener noreferrer"
            >
              📚 Starknet.dart Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
