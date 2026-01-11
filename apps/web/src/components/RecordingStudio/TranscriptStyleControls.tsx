'use client';

import React from 'react';

export type TranscriptFont = 'Sans' | 'Serif' | 'Mono';
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
  { label: 'Standard', value: 'Sans', className: 'font-sans' },
  { label: 'Classic', value: 'Serif', className: 'font-serif' },
  { label: 'Mono', value: 'Mono', className: 'font-mono' },
];

export const TRANSCRIPT_THEMES = [
  {
    id: 'voisss',
    label: 'Voisss',
    background: '#000000',  // Pure black for stark contrast
    textInactive: '#555555',  // Mid-gray for visibility
    textActive: '#FF006B',  // Hot pink electric
    textPast: '#FFFFFF',  // Pure white
  },
  {
    id: 'blue-white',
    label: 'Electric',
    background: '#000000',  // Pure black
    textInactive: '#555555',  // Mid-gray visible
    textActive: '#00D9FF',  // Electric cyan
    textPast: '#FFFFFF',  // Pure white
  },
  {
    id: 'paper',
    label: 'Neon',
    background: '#000000',  // Pure black
    textInactive: '#555555',  // Mid-gray
    textActive: '#39FF14',  // Neon green
    textPast: '#FFFFFF',  // Pure white
  },
  {
    id: 'cyber',
    label: 'Magenta',
    background: '#000000',  // Pure black
    textInactive: '#444444',  // Dark gray but readable
    textActive: '#FF00FF',  // Pure magenta
    textPast: '#FFFFFF',  // Pure white
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
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border transition-all ${style.fontFamily === font.value
                ? 'bg-white text-black border-white'
                : 'bg-[#1A1A1A] text-gray-400 border-[#333] hover:border-gray-500'
                } ${font.className}`}
            >
              {font.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Colors */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Colors</label>

        {/* Custom Color Overrides */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Backdrop</label>
            <div className="relative group">
              <input
                type="color"
                value={style.theme.background}
                onChange={(e) => onChange({
                  ...style,
                  theme: { ...style.theme, id: 'custom', background: e.target.value }
                })}
                className="w-full h-9 bg-[#1A1A1A] cursor-pointer rounded-lg border border-[#333] hover:border-gray-500 transition-colors appearance-none p-1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Text</label>
            <div className="relative group">
              <input
                type="color"
                value={style.theme.textPast}
                onChange={(e) => onChange({
                  ...style,
                  theme: { ...style.theme, id: 'custom', textPast: e.target.value }
                })}
                className="w-full h-9 bg-[#1A1A1A] cursor-pointer rounded-lg border border-[#333] hover:border-gray-500 transition-colors appearance-none p-1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Highlight</label>
            <div className="relative group">
              <input
                type="color"
                value={style.theme.textActive}
                onChange={(e) => onChange({
                  ...style,
                  theme: { ...style.theme, id: 'custom', textActive: e.target.value }
                })}
                className="w-full h-9 bg-[#1A1A1A] cursor-pointer rounded-lg border border-[#333] hover:border-gray-500 transition-colors appearance-none p-1"
              />
            </div>
          </div>
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
              className={`px-3 py-2 rounded-lg text-xs border transition-all flex items-center justify-center gap-2 ${style.animation === anim.value
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
