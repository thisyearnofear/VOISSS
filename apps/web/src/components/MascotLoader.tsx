"use client";

import VoissMascot, { MascotMood, MascotSize } from "./VoissMascot";

/* Loading indicator built on the animated mascot. The "listen" mood keeps the
 * waveform crest active, reading as "working on it". */

export interface MascotLoaderProps {
  label?: string | null;
  mood?: MascotMood;
  size?: MascotSize;
  className?: string;
}

export default function MascotLoader({
  label = "Loading…",
  mood = "listen",
  size = "md",
  className = "",
}: MascotLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 py-10 ${className}`}
    >
      <VoissMascot mood={mood} size={size} />
      {label && <p className="text-sm text-gray-400">{label}</p>}
      <span className="sr-only">Loading</span>
    </div>
  );
}
