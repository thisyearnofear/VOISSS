"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAccount } from "@starknet-react/core";

interface RecordingMetadata {
  title: string;
  description: string;
  ipfsHash: string;
  duration: number;
  fileSize: number;
  isPublic: boolean;
  tags: string[];
}

interface Recording {
  id: string;
  title: string;
  blob: Blob;
  duration: number;
  timestamp: Date;
  onChain?: boolean;
  transactionHash?: string;
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
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
    if (!currentRecording || !isConnected || !address) {
      alert("Please connect your wallet to save recordings on-chain");
      return;
    }

    setIsUploading(true);

    try {
      // In a real implementation, you would:
      // 1. Upload audio file to IPFS
      // 2. Get IPFS hash
      // 3. Store metadata on Starknet

      // For demo purposes, we'll simulate this
      const ipfsHash = `Qm${Math.random().toString(36).substring(2, 15)}`;

      const metadata: RecordingMetadata = {
        title,
        description: "",
        ipfsHash,
        duration: currentRecording.duration,
        fileSize: currentRecording.blob.size,
        isPublic,
        tags: [],
      };

      // Simulate contract interaction for demo
      console.log("Storing recording metadata on Starknet:", metadata);

      // For demo, we'll just add it to local state with mock transaction hash
      const updatedRecording: Recording = {
        ...currentRecording,
        title,
        onChain: isConnected,
        transactionHash: isConnected
          ? `0x${Math.random().toString(16).substring(2, 18)}`
          : undefined,
      };

      setRecordings((prev) => [...prev, updatedRecording]);
      setCurrentRecording(null);
      setShowSaveOptions(false);
      setTitle("");
      setIsPublic(false);

      alert(
        "Recording saved successfully! (Demo mode - not actually on-chain yet)"
      );
    } catch (error) {
      console.error("Error saving recording:", error);
      alert("Failed to save recording");
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

          <div className="flex gap-3">
            <button
              onClick={saveRecording}
              disabled={isUploading || !title.trim()}
              className="voisss-btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Saving..." : "Save to Starknet"}
            </button>
            <button
              onClick={() => {
                const url = URL.createObjectURL(currentRecording.blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${title || "recording"}.webm`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="voisss-btn-primary flex-1"
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
                      {recording.timestamp.toLocaleString()}
                      {recording.onChain && (
                        <span className="ml-2 text-green-400">✓ On-chain</span>
                      )}
                    </p>
                    {recording.transactionHash && (
                      <p className="text-xs text-gray-500 font-mono">
                        TX: {recording.transactionHash}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const audio = new Audio(
                          URL.createObjectURL(recording.blob)
                        );
                        audio.play();
                      }}
                      className="voisss-btn-primary"
                    >
                      Play
                    </button>
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
