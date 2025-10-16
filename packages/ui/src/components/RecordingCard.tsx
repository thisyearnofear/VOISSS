import React from "react";
import { cn } from "../utils/cn";

export interface Recording {
  id: string;
  title: string;
  duration: number;
  createdAt: string;
  tags?: string[];
  isPlaying?: boolean;
  fileSize?: number;
  onChain?: boolean;
}

export interface RecordingCardProps {
  recording: Recording;
  onPlay?: (id: string) => void;
  onPause?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export const RecordingCard: React.FC<RecordingCardProps> = ({
  recording,
  onPlay,
  onPause,
  onDelete,
  className,
}) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    // Use string padding workaround for older ES versions
    const secsStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mins}:${secsStr}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Generate a simple waveform visualization
  const generateWaveform = () => {
    const barCount = 30;
    const waveform = [];
    for (let i = 0; i < barCount; i++) {
      // Create a wave-like pattern with some randomness
      const baseHeight = Math.sin(i * 0.3) * 0.5 + 0.5;
      const randomFactor = 0.2 * Math.random();
      waveform.push(Math.max(0.1, baseHeight + randomFactor));
    }
    return waveform;
  };

  const waveform = generateWaveform();
  const barWidth = 3;
  const barSpacing = 1;

  return (
    <div
      className={cn(
        "bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md",
        recording.onChain && "border-green-500/30",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-medium truncate flex-1 mr-2">
          {recording.title}
        </h3>
        <span className="text-gray-400 text-sm">
          {formatDuration(recording.duration)}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-500 text-sm">
          {formatDate(recording.createdAt)}
        </span>
        {recording.tags && recording.tags.length > 0 && (
          <div className="flex gap-1">
            {recording.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {recording.tags.length > 2 && (
              <span className="text-gray-400 text-xs">
                +{recording.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Waveform Visualization */}
      <div className="flex items-end h-8 mb-3">
        {waveform.map((height, index) => (
          <div
            key={index}
            className="bg-purple-500/30 rounded-sm mx-px"
            style={{
              width: barWidth,
              height: `${height * 24}px`,
            }}
          />
        ))}
      </div>

      {/* File size and blockchain status */}
      <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
        {recording.fileSize && (
          <span>
            {(recording.fileSize / 1024).toFixed(0)} KB
          </span>
        )}
        {recording.onChain && (
          <span className="text-green-400 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            On-chain
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => recording.isPlaying ? onPause?.(recording.id) : onPlay?.(recording.id)}
          className="flex items-center justify-center w-8 h-8 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors"
        >
          {recording.isPlaying ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex-1 bg-gray-700 rounded-full h-2">
          <div className="bg-purple-600 h-2 rounded-full w-0"></div>
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(recording.id)}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-red-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
