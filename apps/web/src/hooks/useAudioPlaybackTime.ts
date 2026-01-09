'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook: useAudioPlaybackTime
 * 
 * Provides reliable audio playback time tracking via:
 * 1. Primary: native `timeupdate` event (ground truth)
 * 2. Secondary: RAF interpolation (smooth between updates)
 * 3. Fallback: seeking/play/pause events
 * 
 * Principles:
 * - Single source of truth (timeupdate is native, reliable)
 * - Minimal re-renders (only updates when time actually changes)
 * - Smooth highlighting (RAF interpolates between timeupdate events)
 * - Clean separation (hook handles timing, component handles rendering)
 */
export function useAudioPlaybackTime(
  audioRef: React.RefObject<HTMLAudioElement>,
  onTimeChange: (timeMs: number) => void
) {
  const lastTimeRef = useRef(-1);
  const rafIdRef = useRef<number>();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Helper: ms conversion
    const toMs = (seconds: number) => Math.max(0, Math.round(seconds * 1000));

    // Helper: trigger time change if different from last
    const updateIfChanged = (currentTime: number) => {
      if (currentTime !== lastTimeRef.current) {
        lastTimeRef.current = currentTime;
        onTimeChange(toMs(currentTime));
      }
    };

    // Primary: timeupdate event (native, reliable, ~30ms intervals)
    const handleTimeUpdate = () => {
      updateIfChanged(audio.currentTime);
    };

    // Secondary: RAF interpolation (smooth between timeupdate events)
    const rafUpdate = () => {
      updateIfChanged(audio.currentTime);
      if (!audio.paused) {
        rafIdRef.current = requestAnimationFrame(rafUpdate);
      }
    };

    // Start RAF loop when playing
    const handlePlay = () => {
      if (rafIdRef.current === undefined) {
        rafIdRef.current = requestAnimationFrame(rafUpdate);
      }
    };

    // Stop RAF loop when paused
    const handlePause = () => {
      if (rafIdRef.current !== undefined) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = undefined;
      }
      // Final update on pause
      updateIfChanged(audio.currentTime);
    };

    // Seeking: immediate update (skip RAF throttling)
    const handleSeeking = () => {
      updateIfChanged(audio.currentTime);
    };

    // Register all handlers
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('seeking', handleSeeking);

    // Cleanup
    return () => {
      if (rafIdRef.current !== undefined) {
        cancelAnimationFrame(rafIdRef.current);
      }
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('seeking', handleSeeking);
    };
  }, [audioRef, onTimeChange]);
}
