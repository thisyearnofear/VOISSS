"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { useSearchParams } from "next/navigation";
import {
  createIPFSService,
  createStarknetRecordingService,
  createRecordingService,
  createPersistentMissionService,
} from "@voisss/shared";
import { Mission } from "@voisss/shared/types/socialfi";
import { VoiceRecording } from "@voisss/shared/types";

// Import React Query hooks
import { 
  useUserRecordings,
  useSaveRecording,
  useDeleteRecording,
  useToggleRecordingVisibility,
  useRecordingStats
} from "../hooks/queries/useStarknetRecording";
import { useAIVoices } from "../hooks/queries/useAI";

// Extended recording interface for this component
interface Recording extends Omit<VoiceRecording, 'createdAt' | 'updatedAt'> {
  timestamp?: Date;
  transactionHash?: string;
  isHidden?: boolean;
  customTitle?: string;
  ipfsUrl?: string;
  blob?: Blob;
  onChain?: boolean;
}

const missionService = createPersistentMissionService();
import MissionRecordingInterface from "./socialfi/MissionRecordingInterface";

// Local interfaces
interface RecordingMetadata {
  title: string;
  description: string;
  ipfsHash: string;
  duration: number;
  fileSize: number;
  isPublic: boolean;
  tags: string[];
  mission?: Mission;
  timestamp?: Date;
  transactionHash?: string;
  isHidden?: boolean;
  customTitle?: string;
  ipfsUrl?: string;
  blob?: Blob;
}

interface PipelineProgress {
  stage: "converting" | "uploading" | "storing" | "complete" | "error";
  progress: number;
  message: string;
  error?: string;
}

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function StarknetRecordingStudio() {
  const { address, isConnected, account } = useAccount();
  const searchParams = useSearchParams();
  
  // React Query hooks for data management
  const { data: recordings = [], isLoading: isLoadingRecordings, refetch: refetchRecordings } = useUserRecordings();
  const { data: voices = [], isLoading: isVoicesLoading } = useAIVoices();
  const { data: recordingStats } = useRecordingStats();
  
  // Mutations
  const saveRecordingMutation = useSaveRecording();
  const deleteRecordingMutation = useDeleteRecording();
  const toggleVisibilityMutation = useToggleRecordingVisibility();
  
  // Local UI state (not managed by React Query)
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [variantBlob, setVariantBlob] = useState<Blob | null>(null);
  const [isGeneratingVariant, setIsGeneratingVariant] = useState(false);
  const [mission, setMission] = useState<Mission | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<PipelineProgress | null>(null);
  const [editingRecording, setEditingRecording] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showHidden, setShowHidden] = useState(false);

  // Derived state
  const isUploading = saveRecordingMutation.isPending || deleteRecordingMutation.isPending;
  const isVoicesLoaded = !isVoicesLoading && voices.length > 0;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recording management functions using React Query mutations
  const toggleRecordingVisibility = (id: string) => {
    const recording = recordings.find((r: Recording) => r.id === id);
    if (recording) {
      toggleVisibilityMutation.mutate({
        recordingId: id,
        isHidden: !recording.isHidden
      });
    }
  };

  const startEditingTitle = (recording: Recording) => {
    setEditingRecording(recording.id);
    setEditTitle(recording.customTitle || recording.title);
  };

  const saveEditedTitle = () => {
    if (editingRecording && editTitle.trim()) {
      const recording = recordings.find((r: Recording) => r.id === editingRecording);
      if (recording) {
        saveRecordingMutation.mutate({
          ...recording,
          customTitle: editTitle.trim()
        });
      }
      setEditingRecording(null);
      setEditTitle("");
    }
  };

  const cancelEditingTitle = () => {
    setEditingRecording(null);
    setEditTitle("");
  };

  // Get display title for a recording
  const getDisplayTitle = (recording: Recording): string => {
    if (recording.customTitle) return recording.customTitle;
    if (recording.title && recording.title !== recording.id)
      return recording.title;
    return `Recording ${recording.timestamp?.toLocaleTimeString() || 'Unknown time'}`;
  };

  // Filter recordings based on visibility
  const visibleRecordings = recordings.filter(
    (recording: Recording) => showHidden || !recording.isHidden
  );

  // Load mission from URL
  useEffect(() => {
    const missionId = searchParams.get("missionId");
    if (missionId) {
      missionService.getMissionById(missionId).then((foundMission) => {
        if (foundMission) {
          setMission(foundMission);
          setTitle(foundMission.title);
        }
      });
    }
  }, [searchParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Set up audio context for waveform visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Set up MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const newRecording: Recording = {
          id: Date.now().toString(),
          title: title || `Recording ${new Date().toLocaleTimeString()}`,
          description: mission?.description || "",
          format: "wav" as const,
          quality: "medium" as const,
          duration: duration,
          timestamp: new Date(),
          blob: blob,
          fileSize: blob.size,
          tags: mission?.tags || [],
          isPublic: isPublic,
          participantConsent: true,
          isAnonymized: false,
          voiceObfuscated: false,
          isCompleted: true,
        };

        setCurrentRecording(newRecording);
        setShowSaveOptions(true);
      };

      // Start recording
      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setDuration(0);

      // Update waveform and duration
      const updateWaveform = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setWaveformData(prev => [...prev.slice(-50), average]);
        }
        setDuration(prev => prev + 0.1);
      };

      intervalRef.current = setInterval(updateWaveform, 100);
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const saveRecording = async () => {
    if (!currentRecording || !address) return;

    try {
      setUploadProgress({
        stage: "uploading",
        progress: 0,
        message: "Saving recording..."
      });

      await saveRecordingMutation.mutateAsync(currentRecording);

      setUploadProgress({
        stage: "complete",
        progress: 100,
        message: "Recording saved successfully!"
      });

      // Reset state
      setCurrentRecording(null);
      setShowSaveOptions(false);
      setTitle("");
      setWaveformData([]);
      setDuration(0);

      setTimeout(() => setUploadProgress(null), 2000);
    } catch (error) {
      console.error("Failed to save recording:", error);
      setUploadProgress({
        stage: "error",
        progress: 0,
        message: "Failed to save recording",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const deleteRecording = (id: string) => {
    if (confirm("Are you sure you want to delete this recording?")) {
      deleteRecordingMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              VOISSS Recording Studio
            </h1>
            <p className="text-gray-300">
              Record, enhance, and store your voice on Starknet
            </p>
          </div>

          {/* Mission Interface */}
          {mission && (
            <div className="mb-8">
              <MissionRecordingInterface mission={mission} />
            </div>
          )}

          {/* Recording Controls */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
            <div className="flex flex-col items-center space-y-4">
              {/* Recording Button */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isUploading}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : "bg-purple-500 hover:bg-purple-600"
                } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isRecording ? "⏹️" : "🎤"}
              </button>

              {/* Recording Status */}
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {isRecording ? "Recording..." : "Ready to Record"}
                </p>
                {isRecording && (
                  <p className="text-purple-300">
                    Duration: {duration.toFixed(1)}s
                  </p>
                )}
              </div>

              {/* Waveform Visualization */}
              {waveformData.length > 0 && (
                <div className="flex items-end space-x-1 h-16">
                  {waveformData.map((value, index) => (
                    <div
                      key={index}
                      className="bg-purple-400 w-2 transition-all duration-100"
                      style={{ height: `${(value / 255) * 64}px` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Save Options */}
          {showSaveOptions && currentRecording && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold mb-4">Save Recording</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white/20 rounded-lg border border-white/30 text-white placeholder-gray-300"
                    placeholder="Enter recording title..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="isPublic" className="text-sm">
                    Make this recording public
                  </label>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={saveRecording}
                    disabled={isUploading}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {isUploading ? "Saving..." : "Save Recording"}
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveOptions(false);
                      setCurrentRecording(null);
                    }}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <p className="font-medium">{uploadProgress.message}</p>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                </div>
                {uploadProgress.stage === "complete" && (
                  <div className="text-green-400 text-2xl">✅</div>
                )}
                {uploadProgress.stage === "error" && (
                  <div className="text-red-400 text-2xl">❌</div>
                )}
              </div>
            </div>
          )}

          {/* Recordings List */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Your Recordings</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowHidden(!showHidden)}
                  className="text-sm text-purple-300 hover:text-purple-100"
                >
                  {showHidden ? "Hide Hidden" : "Show Hidden"}
                </button>
                {recordingStats && (
                  <div className="text-sm text-gray-300">
                    Total: {recordingStats.total} | Public: {recordingStats.public} | Private: {recordingStats.private}
                  </div>
                )}
              </div>
            </div>

            {isLoadingRecordings ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                <p className="mt-2 text-gray-300">Loading recordings...</p>
              </div>
            ) : visibleRecordings.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No recordings found.</p>
                <p className="text-sm mt-2">Start recording to see your voice recordings here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleRecordings.map((recording: Recording) => (
                  <div
                    key={recording.id}
                    className={`bg-white/5 rounded-lg p-4 ${
                      recording.isHidden ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {editingRecording === recording.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="flex-1 px-2 py-1 bg-white/20 rounded border border-white/30 text-white"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") saveEditedTitle();
                                if (e.key === "Escape") cancelEditingTitle();
                              }}
                              autoFocus
                            />
                            <button
                              onClick={saveEditedTitle}
                              className="text-green-400 hover:text-green-300"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditingTitle}
                              className="text-red-400 hover:text-red-300"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <h4
                            className="font-medium cursor-pointer hover:text-purple-300"
                            onClick={() => startEditingTitle(recording)}
                          >
                            {getDisplayTitle(recording)}
                          </h4>
                        )}
                        <div className="text-sm text-gray-400 mt-1">
                          <span>Duration: {recording.duration.toFixed(1)}s</span>
                          <span className="mx-2">•</span>
                          <span>Size: {formatFileSize(recording.fileSize)}</span>
                          <span className="mx-2">•</span>
                          <span>
                            {recording.timestamp?.toLocaleDateString()} {recording.timestamp?.toLocaleTimeString()}
                          </span>
                          {recording.onChain && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-green-400">On-chain</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleRecordingVisibility(recording.id)}
                          className="text-gray-400 hover:text-white"
                          title={recording.isHidden ? "Show" : "Hide"}
                        >
                          {recording.isHidden ? "👁️" : "🙈"}
                        </button>
                        <button
                          onClick={() => deleteRecording(recording.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
