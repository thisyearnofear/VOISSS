import React from 'react';

interface WaveformVisualizationProps {
  waveformData: number[];
  isRecording: boolean;
}

export default function WaveformVisualization({ 
  waveformData, 
  isRecording 
}: WaveformVisualizationProps) {
  const renderWaveform = () => {
    if (waveformData.length === 0) {
      return (
        <div className="h-24 bg-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-gray-400">
            {isRecording ? "🎵 Recording audio..." : "🎤 Ready to record"}
          </span>
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

  return <div className="mb-8">{renderWaveform()}</div>;
}