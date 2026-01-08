'use client';

import React from 'react';
import type { TimedWord } from '@voisss/shared/types/transcript';
import type { TranscriptAnimation } from './TranscriptStyleControls';

/**
 * VOISSS-style karaoke renderer:
 * - Renders words as continuous text (no "chips")
 * - Uses configurable animations and colors
 * - Designed to be small and dependency-free
 */
export function VoisssKaraokeLine(props: {
  words: TimedWord[];
  activeWordIndex: number;
  /** 0..1 fill for the active word; null disables progressive fill */
  activeFill?: number | null;
  highlightColor: string;
  mutedColor: string;
  pastColor: string;
  animation?: TranscriptAnimation;
}) {
  const {
    words,
    activeWordIndex,
    activeFill = null,
    highlightColor,
    mutedColor,
    pastColor,
    animation = 'cut'
  } = props;

  return (
    <div className="flex flex-wrap justify-center gap-x-2 gap-y-2 tracking-tight">
      {words.map((w, idx) => {
        const isPast = activeWordIndex >= 0 && idx < activeWordIndex;
        const isActive = idx === activeWordIndex;

        // Determine base color
        const color = isPast ? pastColor : mutedColor;

        // Calculate fill percentage
        const fillPct = isActive && typeof activeFill === 'number'
          ? Math.max(0, Math.min(100, Math.round(activeFill * 100)))
          : 100;

        // Base styles for all animations
        let activeStyle: React.CSSProperties = {
          color,
          transition: 'color 150ms ease, transform 150ms ease, opacity 150ms ease',
        };

        if (isActive) {
          switch (animation) {
            case 'pop':
              activeStyle = {
                backgroundImage: `linear-gradient(90deg, ${highlightColor} 0%, ${highlightColor} ${fillPct}%, ${mutedColor} ${fillPct}%, ${mutedColor} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                transform: 'scale(1.15)',
                fontWeight: 'bold',
                textShadow: `0 0 20px ${highlightColor}40`,
                transition: 'transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // spring-like
              };
              break;

            case 'fade':
              activeStyle = {
                color: highlightColor,
                opacity: 1,
                transform: 'scale(1.02)',
                textShadow: `0 0 10px ${highlightColor}20`,
                transition: 'color 0.3s ease, transform 0.3s ease',
              };
              break;

            case 'highlight':
              // Highlight pen style - background color behind text with progressive fill
              activeStyle = {
                color: highlightColor === '#000000' ? '#fff' : pastColor,
                backgroundImage: `linear-gradient(90deg, ${highlightColor} 0%, ${highlightColor} ${fillPct}%, transparent ${fillPct}%, transparent 100%)`,
                backgroundColor: 'rgba(128,128,128,0.1)', // Subtle "track" for the highlight
                borderRadius: '4px',
                padding: '0 4px',
                margin: '0 -2px',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone',
              };
              break;

            case 'cut':
            default:
              // Standard sharp cut (default)
              activeStyle = {
                backgroundImage: `linear-gradient(90deg, ${highlightColor} 0%, ${highlightColor} ${fillPct}%, ${mutedColor} ${fillPct}%, ${mutedColor} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                transition: 'none', // Sharp movement
              };
              break;
          }
        }

        return (
          <span key={`${idx}-${w.word}`} style={activeStyle}>
            {w.word}
          </span>
        );
      })}
    </div>
  );
}
