"use client";

import React, { useId, useMemo } from "react";

export function SignalRibbon({ playing }: { playing: boolean }) {
  const gradientId = useId();
  const strokes = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        const offset = (i / 39 - 0.5) * 64;
        return {
          d: `M 32 ${126 + offset * 0.7} C 116 ${126 + offset * 0.7}, 155 ${38 + offset * 0.55}, 232 ${44 + offset} C 318 ${50 + offset}, 326 ${196 - offset}, 412 ${190 - offset * 0.55} C 496 ${184 - offset * 0.55}, 525 ${116 + offset * 0.5}, 608 ${116 + offset * 0.5}`,
          opacity: 0.24 + 0.56 * Math.sin((Math.PI * (i + 0.5)) / 40),
        };
      }),
    []
  );

  return (
    <svg
      viewBox="0 0 640 240"
      aria-hidden="true"
      className={`lr-ribbon${playing ? " lr-ribbon-playing" : ""}`}
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="currentColor" />
          <stop offset="100%" stopColor="var(--lr-ribbon-to, var(--lr-accent))" />
        </linearGradient>
      </defs>
      {strokes.map((s, i) => (
        <path
          key={i}
          d={s.d}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity={s.opacity}
        />
      ))}
    </svg>
  );
}
