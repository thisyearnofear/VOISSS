import React from 'react';

interface RecordingTitleProps {
  recordingTitle: string;
  onTitleChange: (title: string) => void;
}

export default function RecordingTitle({ recordingTitle, onTitleChange }: RecordingTitleProps) {
  return (
    <div className="mb-6">
      <label
        htmlFor="title"
        className="block text-lg font-bold text-[#7C5DFA] mb-2 text-center"
      >
        Recording Title
      </label>
      <input
        type="text"
        id="title"
        value={recordingTitle}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Give your recording a memorable name..."
        className="voisss-input w-full border-purple-500 focus:ring-purple-500 placeholder-gray-400"
      />
    </div>
  );
}