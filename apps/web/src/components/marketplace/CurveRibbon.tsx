"use client";

import { useMemo } from "react";
import type { MarketplaceVoice } from "@/lib/marketplace-indexer";

/**
 * CurveRibbon — gaspoorf/curve-gallery lineage
 *
 * Not the 48-curve explorer; a single curated stroke per card: an ink-pulled
 * control-point curve that reads as "this voice has a shape". The path is
 * seeded from the voice so the loom keeps memory; the drag/playing state
 * bends the control point. Zero JS on idle — just SVG.
 */

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function CurveRibbon({
  voice,
  playing,
  tear,
}: {
  voice: MarketplaceVoice;
  playing: boolean;
  tear: number;
}) {
  const d = useMemo(() => {
    const h = hash(voice.id);
    const r = (n: number) => {
      // cheap LCG from hash
      let x = (h + n * 2654435761) >>> 0;
      x ^= x >>> 16;
      x = Math.imul(x, 0x85ebca6b) >>> 0;
      return (x & 0xffff) / 0xffff;
    };
    const cpx = 180 + (r(1) - 0.5) * 80 + tear * 18;
    const cpy = 90 + (r(2) - 0.5) * 56 + (playing ? Math.sin(r(3) * 6) * 6 : 0);
    const cp2x = 420 + (r(4) - 0.5) * 60 - tear * 12;
    const cp2y = 150 + (r(5) - 0.5) * 40;
    // M 24 120 C 180 64, 320 184, 616 120 — but warped per voice
    return `M 24 ${118 + r(6) * 8} C ${cpx} ${cpy}, ${cp2x} ${cp2y}, 616 ${118 - r(7) * 6}`;
  }, [voice.id, playing, tear]);

  return (
    <svg viewBox="0 0 640 240" aria-hidden className="pointer-events-none block h-6 w-full" focusable="false">
      <path d={d} fill="none" stroke="rgba(214,255,42,0.22)" strokeWidth={1.2} strokeLinecap="round" />
      <path
        d={d}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={0.9}
        strokeLinecap="round"
        style={{ transform: "translateY(1px)" }}
      />
    </svg>
  );
}
