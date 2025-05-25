import React, { useEffect, useRef } from "react";
import { cn } from "../utils/cn";

export interface WaveformVisualizerProps {
  audioData?: number[];
  isRecording?: boolean;
  className?: string;
  height?: number;
  barCount?: number;
  color?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioData = [],
  isRecording = false,
  className,
  height = 60,
  barCount = 40,
  color = "#7C5DFA",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const { width, height: canvasHeight } = canvas;
      ctx.clearRect(0, 0, width, canvasHeight);

      const barWidth = width / barCount;
      const maxBarHeight = canvasHeight * 0.8;

      for (let i = 0; i < barCount; i++) {
        let barHeight;
        
        if (isRecording) {
          // Animated bars for recording
          barHeight = Math.random() * maxBarHeight * 0.7 + maxBarHeight * 0.1;
        } else if (audioData.length > 0) {
          // Use actual audio data
          const dataIndex = Math.floor((i / barCount) * audioData.length);
          const amplitude = audioData[dataIndex] || 0;
          barHeight = amplitude * maxBarHeight;
        } else {
          // Static minimal bars
          barHeight = maxBarHeight * 0.1;
        }

        const x = i * barWidth;
        const y = (canvasHeight - barHeight) / 2;

        // Create gradient
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + "80");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }

      if (isRecording) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioData, isRecording, barCount, color, height]);

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <canvas
        ref={canvasRef}
        width={300}
        height={height}
        className="w-full max-w-md"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};
