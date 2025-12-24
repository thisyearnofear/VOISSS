'use client';

import React from 'react';
import type { TimedWord } from '@voisss/shared/types/transcript';

/**
 * VOISSS-style karaoke renderer:
 * - Renders words as continuous text (no "chips")
 * - Uses a subtle highlight sweep via CSS gradient mask per word
 * - Designed to be small and dependency-free
 */
export function VoisssKaraokeLine(props: {
  words: TimedWord[];
  activeWordIndex: number;
  /** 0..1 fill for the active word; null disables progressive fill */
  activeFill?: number | null;
  highlightColor: string;
  mutedColor: string;
}) {
  const { words, activeWordIndex, activeFill = null, highlightColor, mutedColor } = props;

  return (
    <div className="flex flex-wrap justify-center gap-x-2 gap-y-2 tracking-tight">
      {words.map((w, idx) => {
        const isPast = activeWordIndex >= 0 && idx < activeWordIndex;
        const isActive = idx === activeWordIndex;

        // Past words = primary text; future words = muted; active word gets a soft highlight sweep.
        const color = isPast ? '#FFFFFF' : mutedColor;

        const fillPct = isActive && typeof activeFill === 'number' ? Math.max(0, Math.min(100, Math.round(activeFill * 100))) : 100;

        const activeStyle: React.CSSProperties = isActive
          ? {
              // Progressive fill: highlightColor up to fillPct, then white.
              backgroundImage: `linear-gradient(90deg, ${highlightColor} 0%, ${highlightColor} ${fillPct}%, #FFFFFF ${fillPct}%, #FFFFFF 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: `0 0 18px ${highlightColor}33`,
              transform: 'translateZ(0) scale(1.03)',
              transition: 'transform 180ms ease, text-shadow 180ms ease',
            }
          : {
              color,
              transition: 'color 180ms ease',
            };

        return (
          <span key={`${idx}-${w.word}`} style={activeStyle}>
            {w.word}
          </span>
        );
      })}
    </div>
  );
}
