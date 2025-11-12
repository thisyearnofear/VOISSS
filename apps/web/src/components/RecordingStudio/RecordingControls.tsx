import React from 'react';

interface RecordingControlsProps {
  isRecording: boolean;
  isLoading: boolean;
  isPaused: boolean;
  showSaveOptions: boolean;
  onStartRecording: () => void;
  onPauseResume: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
}

export default function RecordingControls({
  isRecording,
  isLoading,
  isPaused,
  showSaveOptions,
  onStartRecording,
  onPauseResume,
  onStopRecording,
  onCancelRecording,
}: RecordingControlsProps) {
  return (
    <div className="flex justify-center items-center gap-4 mb-8">
      {!isRecording && !showSaveOptions && (
        <button
          onClick={onStartRecording}
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
            onClick={onPauseResume}
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
            onClick={onStopRecording}
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
          onClick={onCancelRecording}
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
  );
}