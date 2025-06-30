"use client";

import { useState } from "react";
import RecordingStudio from "../components/RecordingStudio";
import StarknetRecordingStudio from "../components/StarknetRecordingStudio";
import WalletConnector from "../components/WalletConnector";
import CrossPlatformSync from "../components/CrossPlatformSync";
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
      <div className="voisss-container py-6 sm:py-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold voisss-gradient-text mb-4">
            VOISSS
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-2">
            Decentralized Voice Recording Platform
          </p>
          <p className="text-sm text-gray-400">
            Built exclusively for Starknet Reignite Hackathon
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="mb-8 sm:mb-12 max-w-md mx-auto">
          <WalletConnector />
        </div>

        {/* Recording Studio */}
        <div id="recording-section" className="mb-8 sm:mb-12">
          {isConnected ? (
            <StarknetRecordingStudio />
          ) : (
            <RecordingStudio onRecordingComplete={handleRecordingComplete} />
          )}
        </div>

        {/* Recordings List */}
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

        {/* SocialFi Mission CTA */}
        <div className="text-center mt-12 sm:mt-16 max-w-4xl mx-auto">
          <div className="voisss-card mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] rounded-full mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                🎯 New: SocialFi Missions
              </h2>
              <p className="text-lg text-gray-300 mb-6">
                Record candid conversations on trending topics and earn STRK tokens for authentic perspectives
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/missions"
                  className="px-6 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white font-semibold rounded-xl hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Explore Missions
                </a>
                <button
                  onClick={() => {
                    document.getElementById('recording-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-[#2A2A2A] border border-[#3A3A3A] text-white font-semibold rounded-xl hover:bg-[#3A3A3A] transition-colors"
                >
                  Start Recording
                </button>
              </div>
            </div>
          </div>

          <p className="text-base sm:text-lg mb-6 sm:mb-8 text-gray-300 px-4">
            Transform how you capture, organize, and share audio content with
            our comprehensive three-app ecosystem on Starknet.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
            <div className="voisss-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-blue-400 text-base sm:text-lg">
                  🌐 Web dApp
                </h3>
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 text-xs font-medium">
                    Live
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-300">
                Next.js + Starknet.js for browser-based recording and community
                features
              </p>
            </div>
            <div className="voisss-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-[#7C5DFA] text-base sm:text-lg">
                  🚀 Flutter Native
                </h3>
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 text-xs font-medium">
                    Live
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-300">
                Native performance with starknet.dart SDK for optimal mobile
                experience
              </p>
            </div>
            <div className="voisss-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-orange-400 text-base sm:text-lg">
                  📱 React Native
                </h3>
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <span className="text-orange-400 text-xs font-medium">
                    Coming Soon
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-300">
                Cross-platform mobile app with Expo and Starknet integration
              </p>
            </div>
          </div>

          {/* Cross-Platform Sync */}
          <div className="mb-8 sm:mb-10">
            <div className="voisss-card max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Cross-Platform Sync
                </h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Seamlessly sync your recordings between Web and Flutter apps
                using Starknet blockchain
              </p>
              <CrossPlatformSync />
            </div>
          </div>

          <div className="text-center">
            <a
              className="text-gray-400 hover:text-white transition-colors text-sm"
              href="https://farcaster.xyz/papa"
              target="_blank"
              rel="noopener noreferrer"
            >
              built by papa
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
