"use client";

import React, { useEffect, useRef, useState } from "react";

interface RealTimeWaveformProps {
  isRecording: boolean;
  audioData?: number[];
  className?: string;
}

export default function RealTimeWaveform({ 
  isRecording, 
  audioData = [], 
  className = "" 
}: RealTimeWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [waveData, setWaveData] = useState<number[]>(new Array(50).fill(0));

  useEffect(() => {
    if (!isRecording) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Fade out animation
      const fadeOut = () => {
        setWaveData(prev => prev.map(val => val * 0.95));
        if (Math.max(...waveData) > 0.01) {
          setTimeout(fadeOut, 50);
        }
      };
      fadeOut();
      return;
    }

    const animate = () => {
      // Simulate real-time audio data if not provided
      if (audioData.length === 0) {
        setWaveData(prev => {
          const newData = [...prev];
          newData.shift();
          newData.push(Math.random() * 0.8 + 0.1);
          return newData;
        });
      } else {
        // Use actual audio data
        setWaveData(audioData.slice(-50));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, audioData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform
    const barWidth = width / waveData.length;
    
    waveData.forEach((value, index) => {
      const barHeight = value * height * 0.8;
      const x = index * barWidth;
      const y = (height - barHeight) / 2;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      if (isRecording) {
        gradient.addColorStop(0, '#7C5DFA');
        gradient.addColorStop(0.5, '#9C88FF');
        gradient.addColorStop(1, '#3B82F6');
      } else {
        gradient.addColorStop(0, '#4B5563');
        gradient.addColorStop(1, '#6B7280');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - 1, barHeight);

      // Add glow effect when recording
      if (isRecording && value > 0.3) {
        ctx.shadowColor = '#7C5DFA';
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
        ctx.shadowBlur = 0;
      }
    });

    // Draw center line
    ctx.strokeStyle = isRecording ? '#7C5DFA40' : '#4B556340';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

  }, [waveData, isRecording]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={400}
        height={100}
        className="w-full h-full rounded-lg bg-[#1A1A1A] border border-[#2A2A2A]"
      />
      
      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-red-400 font-medium">REC</span>
        </div>
      )}

      {/* Frequency labels */}
      <div className="absolute bottom-1 left-2 text-xs text-gray-500">
        0 Hz
      </div>
      <div className="absolute bottom-1 right-2 text-xs text-gray-500">
        22 kHz
      </div>
    </div>
  );
}