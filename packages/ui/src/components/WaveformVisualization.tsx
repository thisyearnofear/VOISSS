import React, { useEffect, useRef } from 'react';

interface WaveformVisualizationProps {
  audioData?: number[];
  currentTime?: number;
  duration?: number;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function WaveformVisualization({
  audioData = [],
  currentTime = 0,
  duration = 0,
  width = 300,
  height = 60,
  color = '#7C5DFA',
  backgroundColor = '#2A2A35',
  className,
  style
}: WaveformVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Generate mock audio data if not provided
    const data = audioData.length > 0 ? audioData : generateMockAudioData(width);
    
    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    const barWidth = width / data.length;
    const centerY = height / 2;

    ctx.fillStyle = color;
    data.forEach((value, index) => {
      const barHeight = (value / 255) * (height * 0.8);
      const x = index * barWidth;
      const y = centerY - barHeight / 2;
      
      ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
    });

    // Draw progress indicator
    if (duration > 0) {
      const progress = (currentTime / duration) * width;
      ctx.fillStyle = '#4E7BFF';
      ctx.fillRect(progress, 0, 2, height);
    }
  }, [audioData, currentTime, duration, width, height, color, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        borderRadius: '8px',
        ...style
      }}
    />
  );
}

function generateMockAudioData(length: number): number[] {
  const data: number[] = [];
  for (let i = 0; i < length; i++) {
    // Generate realistic audio waveform data
    const amplitude = Math.sin(i * 0.1) * 0.5 + Math.random() * 0.3;
    data.push(Math.floor(amplitude * 255));
  }
  return data;
}

export default WaveformVisualization;
