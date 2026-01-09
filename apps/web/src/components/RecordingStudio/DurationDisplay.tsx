import React from 'react';
import { MAX_RECORDING_DURATION_MS } from '../../hooks/useWebAudioRecording';

interface DurationDisplayProps {
  duration: number;
  isRecording?: boolean;
}

export default function DurationDisplay({ duration, isRecording = false }: DurationDisplayProps) {
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const maxDurationSeconds = MAX_RECORDING_DURATION_MS / 1000;
  const currentSeconds = duration / 1000;
  const isNearLimit = isRecording && currentSeconds >= maxDurationSeconds - 10;
  const remainingSeconds = Math.max(0, maxDurationSeconds - currentSeconds);

  return (
    <div className="text-center mb-8">
      <div className={`text-6xl font-mono mb-2 transition-colors ${isNearLimit ? 'text-red-400 animate-pulse' : 'text-white'
        }`}>
        {formatDuration(duration)}
      </div>
      {isRecording && (
        <div className={`text-sm ${isNearLimit ? 'text-red-400' : 'text-gray-500'}`}>
          {isNearLimit
            ? `⏱️ ${Math.ceil(remainingSeconds)}s remaining`
            : `Max: ${formatDuration(MAX_RECORDING_DURATION_MS)}`
          }
        </div>
      )}
    </div>
  );
}