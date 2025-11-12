import React from 'react';

interface DurationDisplayProps {
  duration: number;
}

export default function DurationDisplay({ duration }: DurationDisplayProps) {
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="text-center mb-8">
      <div className="text-6xl font-mono text-white mb-2">
        {formatDuration(duration)}
      </div>
    </div>
  );
}