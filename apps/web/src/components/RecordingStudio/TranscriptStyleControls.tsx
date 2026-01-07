'use client';

import React from 'react';

export type TranscriptFont = 'Inter' | 'Anton' | 'Syne' | 'Courier Prime';
export type TranscriptAnimation = 'cut' | 'fade' | 'pop' | 'highlight';

export interface TranscriptStyle {
  fontFamily: TranscriptFont;
  theme: {
    id: string;
    background: string;
    textInactive: string;
    textActive: string;
    textPast: string;
  };
  animation: TranscriptAnimation;
}

export const TRANSCRIPT_FONTS: { label: string; value: TranscriptFont; className: string }[] = [
  { label: 'Standard', value: 'Inter', className: 'font-sans' },
  { label: 'Loud', value: 'Anton', className: 'font-anton' },
  { label: 'Vibe', value: 'Syne', className: 'font-syne' },
  { label: 'Retro', value: 'Courier Prime', className: 'font-courier' },
];

export const TRANSCRIPT_THEMES = [
  {
    id: 'voisss',
    label: 'Voisss',
    background: '#0A0A0A',
    textInactive: '#444444',
    textActive: '#8B5CF6', // Violet
    textPast: '#FFFFFF',
  },
  {
    id: 'blue-white',
    label: 'Blue & White',
    background: '#FFFFFF',
    textInactive: '#94A3B8', // Slate 400
    textActive: '#2563EB', // Blue 600
    textPast: '#1E293B', // Slate 800
  },
  {
    id: 'paper',
    label: 'Paper',
    background: '#F8FAFC',
    textInactive: '#CBD5E1',
    textActive: '#000000',
    textPast: '#334155',
  },
  {
    id: 'cyber',
    label: 'Cyber',
    background: '#020617',
    textInactive: '#1E293B',
    textActive: '#06B6D4', // Cyan
    textPast: '#F8FAFC',
  },
];

export const TRANSCRIPT_ANIMATIONS: { label: string; value: TranscriptAnimation; icon: string }[] = [
  { label: 'Snap', value: 'cut', icon: '⚡️' },
  { label: 'Fade', value: 'fade', icon: '🌊' },
  { label: 'Pop', value: 'pop', icon: '🍿' },
  { label: 'Highlight', value: 'highlight', icon: '🖊️' },
];

interface TranscriptStyleControlsProps {
  style: TranscriptStyle;
  onChange: (style: TranscriptStyle) => void;
}

export function TranscriptStyleControls({ style, onChange }: TranscriptStyleControlsProps) {
  const updateTheme = (themeId: string) => {
    const theme = TRANSCRIPT_THEMES.find(t => t.id === themeId) || TRANSCRIPT_THEMES[0];
    onChange({ ...style, theme });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-[#2A2A2A]">
      {/* 1. Typography */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Typography</label>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TRANSCRIPT_FONTS.map((font) => (
            <button
              key={font.value}
              onClick={() => onChange({ ...style, fontFamily: font.value })}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border transition-all ${
                style.fontFamily === font.value
                  ? 'bg-white text-black border-white'
                  : 'bg-[#1A1A1A] text-gray-400 border-[#333] hover:border-gray-500'
              } ${font.className}`}
            >
              {font.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Color / Theme */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Theme</label>
        <div className="grid grid-cols-4 gap-2">
          {TRANSCRIPT_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => updateTheme(theme.id)}
              className={`group relative h-10 rounded-lg border transition-all overflow-hidden ${
                style.theme.id === theme.id
                  ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0A0A0A] border-transparent'
                  : 'border-[#333] hover:border-gray-500'
              }`}
              title={theme.label}
            >
              <div 
                className="absolute inset-0 w-full h-full"
                style={{ background: theme.background }}
              />
              <div 
                className="absolute inset-0 flex items-center justify-center font-bold text-xs"
                style={{ color: theme.textActive }}
              >
                Aa
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Motion */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Motion</label>
        <div className="grid grid-cols-2 gap-2">
          {TRANSCRIPT_ANIMATIONS.map((anim) => (
            <button
              key={anim.value}
              onClick={() => onChange({ ...style, animation: anim.value })}
              className={`px-3 py-2 rounded-lg text-xs border transition-all flex items-center justify-center gap-2 ${
                style.animation === anim.value
                  ? 'bg-[#2A2A2A] text-white border-[#7C5DFA]'
                  : 'bg-[#1A1A1A] text-gray-400 border-[#333] hover:border-gray-500'
              }`}
            >
              <span className="text-base">{anim.icon}</span>
              <span>{anim.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
