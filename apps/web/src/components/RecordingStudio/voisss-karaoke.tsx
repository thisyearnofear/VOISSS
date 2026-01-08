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

        // Determine base color with enhanced contrast
        const color = isPast ? pastColor : mutedColor;

        // Calculate fill percentage
        const fillPct = isActive && typeof activeFill === 'number'
          ? Math.max(0, Math.min(100, Math.round(activeFill * 100)))
          : 100;

        // Base styles for all animations with sharp typography
        let activeStyle: React.CSSProperties = {
          color,
          fontWeight: '900',  // Maximum boldness
          transition: 'color 150ms ease, transform 150ms ease, opacity 150ms ease',
          letterSpacing: '-0.02em',  // Tighter letters for sharpness
        };

        if (isActive) {
          switch (animation) {
            case 'pop':
              activeStyle = {
                backgroundImage: `linear-gradient(90deg, ${highlightColor} 0%, ${highlightColor} ${fillPct}%, ${mutedColor} ${fillPct}%, ${mutedColor} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                transform: `scale(${1.2 + (fillPct / 100) * 0.15})`,
                fontWeight: '900',
                textShadow: `0 0 40px ${highlightColor}90, 0 0 20px ${highlightColor}70`,
                transition: 'transform 0.05s ease-out, filter 0.1s ease',
                filter: 'brightness(1.5) contrast(1.3)',
              };
              break;

            case 'fade':
              activeStyle = {
                color: highlightColor,
                opacity: 1,
                transform: 'scale(1.08)',
                fontWeight: '900',
                textShadow: `0 0 30px ${highlightColor}80, 0 0 15px ${highlightColor}60`,
                transition: 'all 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
                filter: 'brightness(1.3) drop-shadow(0 0 12px ${highlightColor}50)',
              };
              break;

            case 'highlight':
              // Highlight pen style - background color behind text with progressive fill
              activeStyle = {
                color: '#FFFFFF',
                backgroundImage: `linear-gradient(90deg, ${highlightColor} 0%, ${highlightColor} ${fillPct}%, rgba(50,50,50,0.3) ${fillPct}%, rgba(50,50,50,0.3) 100%)`,
                borderRadius: '4px',
                padding: '0.15em 0.35em',
                margin: '0 -0.1em',
                fontWeight: '900',
                boxShadow: `0 6px 20px ${highlightColor}70, inset 0 0 10px ${highlightColor}30`,
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone',
                filter: 'brightness(1.2)',
              };
              break;

            case 'cut':
            default:
              // Standard sharp cut (default) - ultra-vivid with glow and max contrast
              activeStyle = {
                backgroundImage: `linear-gradient(90deg, ${highlightColor} 0%, ${highlightColor} ${fillPct}%, ${mutedColor} ${fillPct}%, ${mutedColor} 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                fontWeight: '900',
                filter: 'brightness(1.4) contrast(1.2)',
                textShadow: fillPct > 0 ? `0 0 25px ${highlightColor}80, 0 0 12px ${highlightColor}60` : 'none',
                transition: 'none',
                transform: 'scale(1.02)',  // Subtle scale for boldness
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
