/**
 * WaveformVisualization
 *
 * Single waveform canvas component for all VOISSS surfaces.
 * Replaces the former WaveformVisualizer (deleted — was a subset).
 *
 * Modes
 * ──────
 * isRecording=true   → animated bars (rAF loop)
 * audioData provided → renders real amplitude data
 * neither            → renders static minimal bars
 *
 * Progress playhead is drawn when currentTime + duration are provided.
 */

import React, { useEffect, useRef } from 'react';
import { cn } from '../utils/cn';

export interface WaveformVisualizationProps {
  // Real audio data (normalised 0-1 per bar, or raw 0-255 values)
  audioData?: number[];
  // Live recording mode — animates bars with rAF
  isRecording?: boolean;
  // Playback progress
  currentTime?: number;
  duration?: number;
  // Layout
  height?: number;
  barCount?: number;
  width?: number;
  // Colours
  color?: string;
  backgroundColor?: string;
  progressColor?: string;
  // Styling pass-throughs
  className?: string;
  style?: React.CSSProperties;
}

export function WaveformVisualization({
  audioData = [],
  isRecording = false,
  currentTime = 0,
  duration = 0,
  height = 60,
  barCount = 40,
  width,                        // optional explicit px width; defaults to CSS 100%
  color = '#7C5DFA',
  backgroundColor = 'transparent',
  progressColor = '#4E7BFF',
  className,
  style,
}: WaveformVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Background
      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, W, H);
      }

      const bars = barCount;
      const barWidth = W / bars;
      const maxBarHeight = H * 0.8;
      const centerY = H / 2;

      for (let i = 0; i < bars; i++) {
        let barH: number;

        if (isRecording) {
          // Animated: random oscillation
          barH = Math.random() * maxBarHeight * 0.7 + maxBarHeight * 0.1;
        } else if (audioData.length > 0) {
          const dataIndex = Math.floor((i / bars) * audioData.length);
          const raw = audioData[dataIndex] ?? 0;
          // Support both normalised (0-1) and raw (0-255) values
          const normalised = raw > 1 ? raw / 255 : raw;
          barH = normalised * maxBarHeight;
        } else {
          barH = maxBarHeight * 0.1;
        }

        const x = i * barWidth;
        const y = centerY - barH / 2;

        // Gradient bar (top → bottom)
        const gradient = ctx.createLinearGradient(0, y, 0, y + barH);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, `${color}80`);
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, Math.max(barWidth - 2, 1), barH);
      }

      // Progress playhead
      if (duration > 0 && currentTime > 0) {
        const progress = (currentTime / duration) * W;
        ctx.fillStyle = progressColor;
        ctx.fillRect(progress, 0, 2, H);
      }

      if (isRecording) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [audioData, isRecording, currentTime, duration, barCount, color, backgroundColor, progressColor]);

  return (
    <div className={cn('flex items-center justify-center', className)} style={style}>
      <canvas
        ref={canvasRef}
        width={width ?? 300}
        height={height}
        className="w-full max-w-full"
        style={{ height: `${height}px`, borderRadius: '8px' }}
      />
    </div>
  );
}

export default WaveformVisualization;
