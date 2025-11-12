import React from 'react';

interface AudioPreviewProps {
  previewUrl: string | null;
  audioBlob: Blob | null;
  formatFileSize: (bytes: number) => string;
}

export default function AudioPreview({ previewUrl, audioBlob, formatFileSize }: AudioPreviewProps) {
  if (!previewUrl) return null;

  return (
    <div className="mb-6 p-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-white font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 text-[#7C5DFA]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Preview Recording
          </h4>
          <p className="text-gray-400 text-sm">Listen to your recorded audio</p>
        </div>
        {audioBlob && (
          <span className="text-xs text-gray-500">{formatFileSize(audioBlob.size)}</span>
        )}
      </div>
      <audio controls src={previewUrl} className="w-full h-8" />
    </div>
  );
}