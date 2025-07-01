"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { useSearchParams } from "next/navigation";
import {
  createIPFSService,
  createStarknetRecordingService,
  createRecordingService,
  createMissionService,
} from "@voisss/shared";
import { Mission } from "@voisss/shared/types/socialfi";
import { VoiceRecording } from "@voisss/shared/types";

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

const missionService = createMissionService();
import MissionRecordingInterface from "./socialfi/MissionRecordingInterface";

// Local interfaces until exports are fixed
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

interface RecordingService {
  processRecording: (
    blob: Blob,
    options: any,
    account?: any,
    onProgress?: (progress: PipelineProgress) => void
  ) => Promise<any>;
  getPlaybackUrl: (ipfsHash: string) => string;
  dispose: () => void;
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
  const [mission, setMission] = useState<Mission | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(
    null
  );
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<PipelineProgress | null>(
    null
  );
  const [recordingService, setRecordingService] =
    useState<RecordingService | null>(null);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  const [editingRecording, setEditingRecording] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showHidden, setShowHidden] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchParams = useSearchParams();

  // Local storage key for recordings
  const getStorageKey = (userAddress: string) =>
    `voisss_recordings_${userAddress}`;

  // Load recordings from local storage
  const loadLocalRecordings = (userAddress: string): Recording[] => {
    try {
      const stored = localStorage.getItem(getStorageKey(userAddress));
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }));
      }
    } catch (error) {
      console.error("Failed to load local recordings:", error);
    }
    return [];
  };

  // Save recordings to local storage
  const saveLocalRecordings = (
    userAddress: string,
    recordings: Recording[]
  ) => {
    try {
      localStorage.setItem(
        getStorageKey(userAddress),
        JSON.stringify(recordings)
      );
    } catch (error) {
      console.error("Failed to save local recordings:", error);
    }
  };

  // Load recordings from Starknet
  const loadStarknetRecordings = async (userAddress: string) => {
    if (!recordingService) return [];

    try {
      setIsLoadingRecordings(true);
      // We need to access the starknet service directly
      const starknetService = createStarknetRecordingService();
      const starknetRecordings = await starknetService.getUserRecordings(
        userAddress
      );

      // Debug: Log the raw Starknet recordings to understand the data structure
      console.log("Raw Starknet recordings:", starknetRecordings);

      // Convert Starknet recordings to our Recording interface
      return starknetRecordings
        .filter((sr: any) => sr && sr.id) // Filter out null/undefined recordings
        .map(
          (sr: any): Recording => ({
            id: String(sr.id || ""),
            title: String(sr.title || "Untitled Recording"),
            duration: Number(sr.duration || 0),
            timestamp: new Date(Number(sr.createdAt || 0) * 1000), // Convert Unix timestamp
            onChain: true,
            transactionHash: undefined, // We don't store this in the contract
            ipfsHash: sr.ipfsHash ? String(sr.ipfsHash) : undefined,
            ipfsUrl: sr.ipfsHash
              ? recordingService.getPlaybackUrl(String(sr.ipfsHash))
              : undefined,
            fileSize: Number(sr.fileSize || 0),
            // Required properties from VoiceRecording
            description: String(sr.description || ""),
            format: "mp3" as const,
            quality: "medium" as const,
            tags: sr.tags ? Array.from(sr.tags) : [],
            isPublic: Boolean(sr.isPublic),
            participantConsent: Boolean(sr.participantConsent),
            isAnonymized: Boolean(sr.isAnonymized),
            voiceObfuscated: Boolean(sr.voiceObfuscated),
            isCompleted: Boolean(sr.isCompleted),
          })
        );
    } catch (error) {
      console.error("Failed to load Starknet recordings:", error);
      return [];
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  // Load all recordings (local + Starknet)
  const loadAllRecordings = async (userAddress: string) => {
    const localRecordings = loadLocalRecordings(userAddress);
    const starknetRecordings = await loadStarknetRecordings(userAddress);

    // Merge recordings, avoiding duplicates based on transaction hash or IPFS hash
    const allRecordings = [...localRecordings];

    starknetRecordings.forEach((starknetRec: Recording) => {
      const exists = allRecordings.some(
        (localRec: Recording) =>
          (localRec.transactionHash &&
            localRec.transactionHash === starknetRec.transactionHash) ||
          (localRec.ipfsHash && localRec.ipfsHash === starknetRec.ipfsHash)
      );

      if (!exists) {
        allRecordings.push(starknetRec);
      }
    });

    // Sort by timestamp (newest first)
    allRecordings.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));

    setRecordings(allRecordings);
  };

  // Recording management functions
  const updateRecording = (id: string, updates: Partial<Recording>) => {
    const updatedRecordings = recordings.map((recording: Recording) =>
      recording.id === id ? { ...recording, ...updates } : recording
    );
    setRecordings(updatedRecordings);

    // Save to local storage if user is connected
    if (address) {
      saveLocalRecordings(address, updatedRecordings);
    }
  };

  const toggleRecordingVisibility = (id: string) => {
    const recording = recordings.find((r: Recording) => r.id === id);
    if (recording) {
      updateRecording(id, { isHidden: !recording.isHidden });
    }
  };

  const startEditingTitle = (recording: Recording) => {
    setEditingRecording(recording.id);
    setEditTitle(recording.customTitle || recording.title);
  };

  const saveEditedTitle = () => {
    if (editingRecording && editTitle.trim()) {
      updateRecording(editingRecording, { customTitle: editTitle.trim() });
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

  // Initialize recording service
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Create IPFS service (you'll need to set environment variables)
        const ipfsService = createIPFSService();

        // Create Starknet service
        const starknetService = createStarknetRecordingService();

        // Create recording service
        const service = createRecordingService(ipfsService, starknetService);
        setRecordingService(service);

        // Test IPFS connection
        const isConnected = await ipfsService.testConnection();
        if (!isConnected) {
          console.warn("IPFS connection test failed - uploads may not work");
        }
      } catch (error) {
        console.error("Failed to initialize recording services:", error);
      }
    };

    initializeServices();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop());
      }
      if (recordingService) {
        recordingService.dispose();
      }
    };
  }, []);

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

  // Load recordings when wallet connects
  useEffect(() => {
    if (isConnected && address && recordingService) {
      loadAllRecordings(address);
    } else if (!isConnected) {
      // Clear recordings when wallet disconnects
      setRecordings([]);
    }
  }, [isConnected, address, recordingService]);

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
        const recording: Recording = {
          id: Date.now().toString(),
          title: mission
            ? mission.title
            : `Recording ${new Date().toLocaleTimeString()}`,
          blob,
          duration,
          timestamp: new Date(),
          onChain: false,
          missionContext: mission
            ? {
                missionId: mission.id,
                title: mission.title,
                description: mission.description,
                topic: mission.topic,
                difficulty: mission.difficulty,
                reward: mission.reward,
                targetDuration: mission.targetDuration,
                examples: mission.examples,
                contextSuggestions: mission.contextSuggestions,
                acceptedAt: new Date(),
              }
            : undefined,
          // Required properties from VoiceRecording
          description: mission?.description || "",
          fileSize: blob.size,
          format: "mp3" as const,
          quality: "medium" as const,
          tags: mission?.tags || [],
          isPublic: true,
          participantConsent: false,
          isAnonymized: false,
          voiceObfuscated: false,
          isCompleted: false,
        };

        setCurrentRecording(recording);
        setShowSaveOptions(true);
        setTitle(recording.title);
      };

      // Start recording
      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setDuration(0);

      // Start waveform visualization
      const updateWaveform = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const normalizedData = Array.from(dataArray).map(
            (value) => value / 255
          );
          setWaveformData(normalizedData.slice(0, 50)); // Show first 50 frequency bins
        }
      };

      // Start duration timer
      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
        updateWaveform();
      }, 100);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording. Please check microphone permissions.");
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
        streamRef.current
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop());
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const saveRecording = async () => {
    if (!currentRecording || !currentRecording.blob) {
      alert("No recording to save");
      return;
    }

    if (!recordingService) {
      alert("Recording service not initialized");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a title for your recording");
      return;
    }

    setIsUploading(true);
    setUploadProgress(null);

    try {
      const result = await recordingService.processRecording(
        currentRecording.blob,
        {
          title: title.trim(),
          description: mission ? mission.description : "",
          isPublic,
          tags: mission ? [mission.topic] : [],
          quality: "medium",
          convertAudio: true,
          missionContext: mission
            ? {
                missionId: mission.id,
                title: mission.title,
                description: mission.description,
                topic: mission.topic,
                difficulty: mission.difficulty,
                reward: mission.reward,
                targetDuration: mission.targetDuration,
                examples: mission.examples,
                contextSuggestions: mission.contextSuggestions,
                acceptedAt: new Date(),
              }
            : undefined,
        },
        account || undefined,
        (progress: PipelineProgress) => {
          setUploadProgress(progress);
        }
      );

      if (result.success) {
        const updatedRecording: Recording = {
          ...currentRecording,
          title: title.trim(),
          onChain: !!result.transactionHash,
          transactionHash: result.transactionHash,
          ipfsHash: result.ipfsHash,
          ipfsUrl: result.ipfsUrl,
          fileSize: currentRecording.blob.size,
          isCompleted: !!mission,
          completedAt: mission ? new Date() : undefined,
        };

        const newRecordings = [...recordings, updatedRecording];
        setRecordings(newRecordings);

        // Save to local storage if user is connected
        if (address) {
          saveLocalRecordings(address, newRecordings);
        }

        setCurrentRecording(null);
        setShowSaveOptions(false);
        setTitle("");
        setIsPublic(false);
        setUploadProgress(null);

        const message = result.transactionHash
          ? "Recording saved successfully to IPFS and Starknet!"
          : "Recording saved to IPFS! Connect wallet to store on Starknet.";

        alert(message);
      } else {
        throw new Error(result.error || "Failed to save recording");
      }
    } catch (error) {
      console.error("Error saving recording:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save recording";
      alert(`Failed to save recording: ${errorMessage}`);
      setUploadProgress({
        stage: "error",
        progress: 0,
        message: "Save failed",
        error: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderWaveform = () => {
    if (!isRecording && waveformData.length === 0) {
      return (
        <div className="h-24 bg-[#2A2A2A] rounded-lg flex items-center justify-center">
          <p className="text-gray-400">
            Waveform will appear here during recording
          </p>
        </div>
      );
    }

    return (
      <div className="h-24 bg-[#2A2A2A] rounded-lg flex items-end justify-center gap-1 p-2">
        {waveformData.map((value: number, index: number) => (
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
    <div className="max-w-4xl mx-auto voisss-section-spacing">
      {/* Mission Context */}
      {mission && (
        <div className="mb-8">
          <MissionRecordingInterface
            mission={mission}
          />
        </div>
      )}

      {/* Header Section */}
      <div className="voisss-card text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] rounded-full mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
              <path d="M12 18v4" />
              <path d="M8 22h8" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Starknet Recording Studio
          </h1>
          <p className="text-gray-400 text-base sm:text-lg px-4">
            Record high-quality audio and store metadata on Starknet blockchain
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {isConnected ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">
                Wallet Connected
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-yellow-400 text-sm font-medium">
                Connect wallet to save on-chain
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Recording Interface */}
      <div className="voisss-card">
        {/* Waveform Visualization */}
        <div className="mb-8">{renderWaveform()}</div>

        {/* Duration Display */}
        {(isRecording || duration > 0) && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#2A2A2A] rounded-xl border border-[#3A3A3A]">
              <div className="text-4xl font-mono text-white">
                {formatDuration(duration)}
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 text-red-400">
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">REC</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex justify-center mb-8">
          {!isRecording && !showSaveOptions && (
            <button
              onClick={startRecording}
              className="group relative w-20 h-20 bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-[#7C5DFA]/25"
            >
              <svg
                className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-200"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <path d="M12 18v4" />
                <path d="M8 22h8" />
              </svg>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-400 whitespace-nowrap">
                Click to start recording
              </div>
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="group relative w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-red-500/25"
            >
              <svg
                className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-200"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-400 whitespace-nowrap">
                Click to stop
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Save Options */}
      {showSaveOptions && currentRecording && (
        <div className="voisss-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                Recording Complete!
              </h3>
              <p className="text-gray-400">
                Configure your recording settings below
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Recording Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                placeholder="Enter a descriptive title for your recording..."
                className="w-full px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-xl text-white placeholder-gray-500 focus:border-[#7C5DFA] focus:ring-1 focus:ring-[#7C5DFA] transition-colors voisss-mobile-input"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#2A2A2A] rounded-xl border border-[#3A3A3A]">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setIsPublic(e.target.checked)
                }
                className="w-5 h-5 text-[#7C5DFA] bg-[#1A1A1A] border-[#3A3A3A] rounded focus:ring-[#7C5DFA] focus:ring-2"
              />
              <div>
                <label
                  htmlFor="isPublic"
                  className="text-white font-medium cursor-pointer"
                >
                  Make this recording public
                </label>
                <p className="text-sm text-gray-400">
                  Public recordings can be discovered and played by other users
                </p>
              </div>
            </div>

            {/* IPFS Permanence Notice */}
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="w-5 h-5 text-blue-400 mt-0.5">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <p className="text-blue-400 text-sm font-medium">
                  Permanent Storage
                </p>
                <p className="text-blue-300/80 text-xs mt-1">
                  Your recording will be stored permanently on IPFS and cannot
                  be deleted. You can hide it from your feed but the file
                  remains accessible via its hash.
                </p>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress && (
              <div className="p-6 bg-[#2A2A2A] rounded-xl border border-[#3A3A3A]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {uploadProgress.stage === "error" ? (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
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
                      </div>
                    ) : uploadProgress.stage === "complete" ? (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-[#7C5DFA] border-t-transparent rounded-full animate-spin"></div>
                    )}
                    <span className="text-white font-medium">
                      {uploadProgress.message}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400 font-mono">
                    {uploadProgress.progress}%
                  </span>
                </div>
                <div className="w-full bg-[#1A1A1A] rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      uploadProgress.stage === "error"
                        ? "bg-red-500"
                        : uploadProgress.stage === "complete"
                        ? "bg-green-500"
                        : "bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF]"
                    }`}
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
                {uploadProgress.error && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">
                      {uploadProgress.error}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={saveRecording}
                disabled={isUploading || !title.trim() || !recordingService}
                className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white font-semibold rounded-xl hover:from-[#6B4CE6] hover:to-[#8B7AFF] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    {isConnected ? "Save to IPFS + Starknet" : "Save to IPFS"}
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  if (currentRecording?.blob) {
                    const url = URL.createObjectURL(currentRecording.blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${title || "recording"}.webm`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                }}
                className="px-4 sm:px-6 py-3 sm:py-4 bg-[#2A2A2A] border border-[#3A3A3A] text-white font-semibold rounded-xl hover:bg-[#3A3A3A] transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                disabled={!currentRecording?.blob}
              >
                <svg
                  className="w-5 h-5"
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
      )}

      {/* Recordings List */}
      {(recordings.length > 0 || isLoadingRecordings) && (
        <div className="voisss-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] rounded-full flex items-center justify-center">
              {isLoadingRecordings ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                Your Recordings
              </h3>
              <p className="text-gray-400">
                {isLoadingRecordings
                  ? "Loading recordings from Starknet..."
                  : `${visibleRecordings.length} recording${
                      visibleRecordings.length !== 1 ? "s" : ""
                    } visible${
                      recordings.length !== visibleRecordings.length
                        ? ` (${
                            recordings.length - visibleRecordings.length
                          } hidden)`
                        : ""
                    }`}
              </p>
            </div>

            {/* Filter Controls */}
            {recordings.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <button
                  onClick={() => setShowHidden(!showHidden)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    showHidden
                      ? "bg-[#7C5DFA] text-white"
                      : "bg-[#2A2A2A] text-gray-400 hover:text-white"
                  }`}
                >
                  {showHidden ? "Hide Hidden" : "Show Hidden"} (
                  {recordings.length - visibleRecordings.length})
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {visibleRecordings.map((recording: Recording) => (
              <div key={recording.id} className="voisss-recording-card">
                <div className="voisss-recording-header">
                  <div className="voisss-recording-content">
                    <div className="flex items-center gap-3 mb-3">
                      {editingRecording === recording.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => setEditTitle(e.target.value)}
                            className="flex-1 px-3 py-1 bg-[#1A1A1A] border border-[#3A3A3A] rounded text-white text-lg font-semibold focus:border-[#7C5DFA] focus:ring-1 focus:ring-[#7C5DFA] voisss-mobile-input"
                            onKeyDown={(
                              e: React.KeyboardEvent<HTMLInputElement>
                            ) => {
                              if (e.key === "Enter") saveEditedTitle();
                              if (e.key === "Escape") cancelEditingTitle();
                            }}
                            autoFocus
                          />
                          <button
                            onClick={saveEditedTitle}
                            className="p-1 text-green-400 hover:text-green-300"
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={cancelEditingTitle}
                            className="p-1 text-red-400 hover:text-red-300"
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <h4 className="text-lg font-semibold text-white">
                            {getDisplayTitle(recording)}
                          </h4>
                          <button
                            onClick={() => startEditingTitle(recording)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                            title="Edit title"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                        </>
                      )}
                      <div className="flex items-center gap-2">
                        {recording.onChain && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-green-400 text-xs font-medium">
                              On-chain
                            </span>
                          </div>
                        )}
                        {recording.ipfsHash && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                            <svg
                              className="w-3 h-3 text-blue-400"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                            <span className="text-blue-400 text-xs font-medium">
                              IPFS
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="voisss-metadata-grid mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{formatDuration(recording.duration)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
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
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{formatFileSize(recording.fileSize || 0)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>{recording.timestamp?.toLocaleDateString() || 'Unknown date'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{recording.timestamp?.toLocaleTimeString() || 'Unknown time'}</span>
                      </div>
                    </div>

                    {/* Transaction and IPFS Details */}
                    {(recording.transactionHash || recording.ipfsHash) && (
                      <div className="space-y-2 mb-4">
                        {recording.transactionHash && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 font-medium">
                              TX:
                            </span>
                            <code className="voisss-hash-display text-gray-400">
                              {typeof recording.transactionHash === "string"
                                ? `${recording.transactionHash.slice(
                                    0,
                                    10
                                  )}...${recording.transactionHash.slice(-6)}`
                                : String(recording.transactionHash)}
                            </code>
                          </div>
                        )}
                        {recording.ipfsHash && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 font-medium">
                              IPFS:
                            </span>
                            <code className="voisss-hash-display text-gray-400">
                              {typeof recording.ipfsHash === "string"
                                ? `${recording.ipfsHash.slice(
                                    0,
                                    10
                                  )}...${recording.ipfsHash.slice(-6)}`
                                : String(recording.ipfsHash)}
                            </code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="voisss-action-buttons">
                    <button
                      onClick={() => toggleRecordingVisibility(recording.id)}
                      className={`${
                        recording.isHidden
                          ? "voisss-action-btn-warning"
                          : "voisss-action-btn-tertiary"
                      }`}
                      title={
                        recording.isHidden ? "Show in feed" : "Hide from feed"
                      }
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {recording.isHidden ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        )}
                      </svg>
                      {recording.isHidden ? "Show" : "Hide"}
                    </button>
                    <button
                      onClick={() => {
                        let audioUrl: string;

                        if (recording.ipfsUrl && recordingService) {
                          // Play from IPFS
                          audioUrl = recordingService.getPlaybackUrl(
                            recording.ipfsHash!
                          );
                        } else if (recording.blob) {
                          // Play from local blob
                          audioUrl = URL.createObjectURL(recording.blob);
                        } else {
                          alert("Audio not available for playback");
                          return;
                        }

                        const audio = new Audio(audioUrl);
                        audio.play().catch((error) => {
                          console.error("Playback failed:", error);
                          alert(
                            "Failed to play audio. The file may not be available."
                          );
                        });

                        // Clean up blob URL if it was created
                        if (recording.blob && !recording.ipfsUrl) {
                          audio.onended = () => URL.revokeObjectURL(audioUrl);
                        }
                      }}
                      className="voisss-action-btn-primary"
                      disabled={!recording.blob && !recording.ipfsHash}
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
                    {recording.ipfsUrl && (
                      <button
                        onClick={() => {
                          if (recordingService) {
                            const ipfsUrl = recordingService.getPlaybackUrl(
                              recording.ipfsHash!
                            );
                            window.open(ipfsUrl, "_blank");
                          }
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
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        View on IPFS
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
