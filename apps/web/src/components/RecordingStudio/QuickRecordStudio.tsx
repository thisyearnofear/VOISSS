"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWebAudioRecording } from "@/hooks/useWebAudioRecording";

// Core components (eager loaded)
import DurationDisplay from "@/components/RecordingStudio/DurationDisplay";
import WaveformVisualization from "@/components/RecordingStudio/WaveformVisualization";
import RecordingControls from "@/components/RecordingStudio/RecordingControls";
import ToastNotification from "@/components/RecordingStudio/ToastNotification";
import AudioPreview from "@/components/RecordingStudio/AudioPreview";

interface QuickRecordStudioProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
  initialTranscriptTemplateId?: string;
}

export default function QuickRecordStudio({
  onRecordingComplete,
  initialTranscriptTemplateId,
}: QuickRecordStudioProps) {
  const router = useRouter();
  const titleInputRef = useRef<HTMLInputElement>(null);

  const {
    isRecording,
    isLoading,
    duration,
    audioBlob,
    error,
    waveformData,
    maxDurationReached,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  } = useWebAudioRecording();

  const [isPaused, setIsPaused] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("error");

  // Track object URL for cleanup
  useEffect(() => {
    if (!audioBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(audioBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audioBlob]);

  // Show toast when max recording duration is reached
  useEffect(() => {
    if (maxDurationReached) {
      setToastType("success");
      setToastMessage(
        "Maximum 60 second recording limit reached. Recording saved automatically!"
      );
    }
  }, [maxDurationReached]);

  // Auto-focus title input after recording completes
  useEffect(() => {
    if (showSaveOptions && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [showSaveOptions]);

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
      setIsPaused(false);
    } catch (error) {
      console.error("Failed to start recording:", error);
      setToastType("error");
      setToastMessage("Failed to start recording. Check microphone permissions.");
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
      setToastType("error");
      setToastMessage("Failed to stop recording.");
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

  const handleCancelRecording = useCallback(() => {
    cancelRecording();
    setRecordingTitle("");
    setShowSaveOptions(false);
    setPreviewUrl(null);
  }, [cancelRecording]);

  const handleDownload = useCallback(() => {
    if (audioBlob) {
      const filename = recordingTitle || `recording-${new Date().toISOString()}.webm`;
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [audioBlob, recordingTitle]);

  return (
    <div className="max-w-2xl mx-auto voisss-card shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8 relative">
        <button
          onClick={() => {
            cancelRecording();
            router.push("/studio");
          }}
          className="absolute top-0 left-0 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          aria-label="Back to Studio"
          tabIndex={0}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Studio
        </button>

        <h2 className="text-3xl font-bold text-white mb-2">
          Quick Record
        </h2>
        <p className="text-gray-400">
          {isRecording
            ? isPaused
              ? "Recording paused"
              : "Recording in progress..."
            : showSaveOptions
            ? "Recording complete"
            : "Ready to record"}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Simple recording — no advanced tools
        </p>
      </div>

      {/* Core recording UI */}
      {!isRecording && !showSaveOptions && (
        <DurationDisplay duration={duration} isRecording={isRecording} />
      )}
      {isRecording && (
        <>
          <DurationDisplay duration={duration} isRecording={isRecording} />
          <WaveformVisualization
            waveformData={waveformData}
            isRecording={isRecording}
          />
        </>
      )}

      <RecordingControls
        isRecording={isRecording}
        isLoading={isLoading}
        isPaused={isPaused}
        showSaveOptions={showSaveOptions}
        onStartRecording={handleStartRecording}
        onPauseResume={handlePauseResume}
        onStopRecording={handleStopRecording}
        onCancelRecording={handleCancelRecording}
      />

      {/* Post-recording: preview + save options */}
      {showSaveOptions && audioBlob && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <AudioPreview
            previewUrl={previewUrl}
            audioBlob={audioBlob}
            formatFileSize={(bytes: number) => {
              if (bytes < 1024) return bytes + " B";
              if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
              return (bytes / 1048576).toFixed(1) + " MB";
            }}
          />

          {/* Simple title input */}
          <div>
            <label htmlFor="quick-record-title" className="block text-sm font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Recording Title
            </label>
            <input
              id="quick-record-title"
              ref={titleInputRef}
              type="text"
              value={recordingTitle}
              onChange={(e) => setRecordingTitle(e.target.value)}
              placeholder="e.g., My voice sample"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#7C5DFA] focus:ring-1 focus:ring-[#7C5DFA]/30 transition-all placeholder:text-gray-600"
              maxLength={100}
              aria-required="true"
              aria-describedby="title-help"
            />
            <p id="title-help" className="text-xs text-gray-600 mt-1">
              Required before saving
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 px-4 py-3 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
              aria-label="Download recording as WAV"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={() => {
                if (!recordingTitle.trim()) {
                  setToastType("error");
                  setToastMessage("Please enter a title before saving.");
                  return;
                }
                if (audioBlob && onRecordingComplete) {
                  onRecordingComplete(audioBlob, duration);
                } else {
                  setToastType("error");
                  setToastMessage("No recording to save.");
                }
              }}
              disabled={!recordingTitle.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Save recording and continue"
            >
              <CheckCircle className="w-4 h-4" />
              Save &amp; Continue
            </button>
          </div>

          {/* Next steps guidance */}
          <div className="p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
            <p className="text-sm text-gray-400 mb-3">
              What would you like to do next?
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="/marketplace"
                className="px-3 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg text-xs text-white font-medium transition-colors"
              >
                Browse Marketplace
              </a>
              <a
                href="/demo"
                className="px-3 py-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg text-xs text-white font-medium transition-colors"
              >
                Try Demo
              </a>
              <a
                href="/studio"
                className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium transition-colors"
              >
                Open Full Studio &rarr;
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 bg-red-900/30 border border-red-500/30 rounded-xl"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-red-300 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Toast Notification */}
      <ToastNotification
        message={toastMessage}
        type={toastType}
        onTimeout={() => setToastMessage(null)}
      />
    </div>
  );
}
