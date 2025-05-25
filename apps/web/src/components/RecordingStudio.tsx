"use client";

import React, { useState, useCallback } from "react";
import { useWebAudioRecording } from "../hooks/useWebAudioRecording";

interface RecordingStudioProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
}

export default function RecordingStudio({
  onRecordingComplete,
}: RecordingStudioProps) {
  const {
    isRecording,
    isLoading,
    duration,
    audioBlob,
    error,
    waveformData,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  } = useWebAudioRecording();

  const [isPaused, setIsPaused] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
      setIsPaused(false);
      setShowSaveOptions(false);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    try {
      const blob = await stopRecording();
      if (blob) {
        setShowSaveOptions(true);
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  }, [stopRecording]);

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      resumeRecording();
      setIsPaused(false);
    } else {
      pauseRecording();
      setIsPaused(true);
    }
  }, [isPaused, pauseRecording, resumeRecording]);

  const handleSaveRecording = useCallback(() => {
    if (audioBlob && onRecordingComplete) {
      onRecordingComplete(audioBlob, duration);
      setShowSaveOptions(false);
      setRecordingTitle("");
    }
  }, [audioBlob, duration, onRecordingComplete]);

  const handleCancelRecording = useCallback(() => {
    cancelRecording();
    setShowSaveOptions(false);
    setRecordingTitle("");
    setIsPaused(false);
  }, [cancelRecording]);

  const handleDownload = useCallback(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        recordingTitle || `recording-${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [audioBlob, recordingTitle]);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const renderWaveform = () => {
    if (waveformData.length === 0) {
      return (
        <div className="h-24 bg-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-gray-400">
            {isRecording ? "🎵 Recording audio..." : "🎤 Ready to record"}
          </span>
        </div>
      );
    }

    return (
      <div className="h-24 bg-[#2A2A2A] rounded-lg flex items-end justify-center gap-1 p-2">
        {waveformData.map((value, index) => (
          <div
            key={index}
            className="voisss-waveform-bar"
            style={{
              height: `${Math.max(2, value * 80)}px`,
              width: "3px",
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto voisss-card shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Voice Recording Studio
        </h2>
        <p className="text-gray-400">
          {isRecording
            ? isPaused
              ? "Recording paused"
              : "Recording in progress..."
            : showSaveOptions
            ? "Recording complete"
            : "Ready to start recording"}
        </p>
      </div>

      {/* Duration Display */}
      <div className="text-center mb-8">
        <div className="text-6xl font-mono text-white mb-2">
          {formatDuration(duration)}
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="mb-8">{renderWaveform()}</div>

      {/* Recording Controls */}
      <div className="flex justify-center items-center gap-4 mb-8">
        {!isRecording && !showSaveOptions && (
          <button
            onClick={handleStartRecording}
            disabled={isLoading}
            className="voisss-recording-button idle disabled:bg-gray-600"
          >
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}

        {isRecording && (
          <>
            <button
              onClick={handlePauseResume}
              className="w-16 h-16 bg-yellow-600 hover:bg-yellow-700 rounded-full flex items-center justify-center transition-colors"
            >
              {isPaused ? (
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            <button
              onClick={handleStopRecording}
              className="voisss-recording-button recording"
            >
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </>
        )}

        {(isRecording || showSaveOptions) && (
          <button
            onClick={handleCancelRecording}
            className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Save Options */}
      {showSaveOptions && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Save Recording
          </h3>

          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Recording Title
            </label>
            <input
              type="text"
              id="title"
              value={recordingTitle}
              onChange={(e) => setRecordingTitle(e.target.value)}
              placeholder="Enter recording title..."
              className="voisss-input w-full"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveRecording}
              className="voisss-btn-secondary flex-1"
            >
              Save Recording
            </button>
            <button
              onClick={handleDownload}
              className="voisss-btn-primary flex-1"
            >
              Download
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded-md">
          <p className="text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}
