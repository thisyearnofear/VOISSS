"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import {
  createIPFSService,
  createStarknetRecordingService,
  createRecordingService,
} from "@voisss/shared";

// Local interfaces until exports are fixed
interface RecordingMetadata {
  title: string;
  description: string;
  ipfsHash: string;
  duration: number;
  fileSize: number;
  isPublic: boolean;
  tags: string[];
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

interface Recording {
  id: string;
  title: string;
  blob?: Blob; // Optional for IPFS-stored recordings
  duration: number;
  timestamp: Date;
  onChain?: boolean;
  transactionHash?: string;
  ipfsHash?: string;
  ipfsUrl?: string;
  fileSize?: number;
}

export default function StarknetRecordingStudio() {
  const { address, isConnected, account } = useAccount();
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recordingService) {
        recordingService.dispose();
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

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const recording: Recording = {
          id: Date.now().toString(),
          title: `Recording ${new Date().toLocaleTimeString()}`,
          blob,
          duration,
          timestamp: new Date(),
          onChain: false,
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
        streamRef.current.getTracks().forEach((track) => track.stop());
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
          description: "",
          isPublic,
          tags: [],
          quality: "medium",
          convertAudio: true,
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
        };

        setRecordings((prev) => [...prev, updatedRecording]);
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
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          🎤 Starknet Recording Studio
        </h2>
        <p className="text-gray-400">
          Record high-quality audio and store metadata on Starknet
        </p>
        {!isConnected && (
          <p className="text-yellow-400 text-sm mt-2">
            ⚠️ Connect your wallet to save recordings on-chain
          </p>
        )}
      </div>

      {/* Waveform Visualization */}
      <div className="mb-8">{renderWaveform()}</div>

      {/* Duration Display */}
      {(isRecording || duration > 0) && (
        <div className="text-center mb-6">
          <div className="text-3xl font-mono text-white">
            {formatDuration(duration)}
          </div>
          {isRecording && (
            <div className="text-red-400 text-sm mt-1 animate-pulse">
              ● Recording...
            </div>
          )}
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex justify-center mb-8">
        {!isRecording && !showSaveOptions && (
          <button
            onClick={startRecording}
            className="voisss-recording-button idle"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
              <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
              <path d="M12 18v4" />
              <path d="M8 22h8" />
            </svg>
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="voisss-recording-button recording"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        )}
      </div>

      {/* Save Options */}
      {showSaveOptions && currentRecording && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Recording Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter recording title..."
              className="voisss-input w-full"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-[#7C5DFA] bg-[#2A2A2A] border-[#3A3A3A] rounded focus:ring-[#7C5DFA]"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-300">
              Make this recording public
            </label>
          </div>

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="mb-4 p-4 bg-[#2A2A2A] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">
                  {uploadProgress.message}
                </span>
                <span className="text-sm text-gray-400">
                  {uploadProgress.progress}%
                </span>
              </div>
              <div className="w-full bg-[#1A1A1A] rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    uploadProgress.stage === "error"
                      ? "bg-red-500"
                      : "bg-[#7C5DFA]"
                  }`}
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
              {uploadProgress.error && (
                <p className="text-red-400 text-sm mt-2">
                  {uploadProgress.error}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={saveRecording}
              disabled={isUploading || !title.trim() || !recordingService}
              className="voisss-btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading
                ? "Saving..."
                : isConnected
                ? "Save to IPFS + Starknet"
                : "Save to IPFS"}
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
              className="voisss-btn-primary flex-1"
              disabled={!currentRecording?.blob}
            >
              Download
            </button>
          </div>
        </div>
      )}

      {/* Recordings List */}
      {recordings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Your Recordings ({recordings.length})
          </h3>
          <div className="space-y-3">
            {recordings.map((recording) => (
              <div key={recording.id} className="voisss-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">
                      {recording.title}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {formatDuration(recording.duration)} •{" "}
                      {recording.fileSize && formatFileSize(recording.fileSize)}{" "}
                      • {recording.timestamp.toLocaleString()}
                      {recording.onChain && (
                        <span className="ml-2 text-green-400">✓ On-chain</span>
                      )}
                      {recording.ipfsHash && (
                        <span className="ml-2 text-blue-400">📁 IPFS</span>
                      )}
                    </p>
                    {recording.transactionHash && (
                      <p className="text-xs text-gray-500 font-mono">
                        TX: {recording.transactionHash}
                      </p>
                    )}
                    {recording.ipfsHash && (
                      <p className="text-xs text-gray-500 font-mono">
                        IPFS: {recording.ipfsHash}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
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
                      className="voisss-btn-primary"
                      disabled={!recording.blob && !recording.ipfsHash}
                    >
                      Play
                    </button>
                    {recording.ipfsUrl && (
                      <a
                        href={recording.ipfsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="voisss-btn-secondary text-center flex items-center"
                      >
                        View on IPFS
                      </a>
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
