"use client";

import { useEffect, useState } from "react";
import VoiceTerrain from "../VoiceTerrain";
import { getVoiceEnergy, onVoicePulse, type VoicePulse } from "@/lib/terrain-bus";

/**
 * TerrainBand — reusable, sandboxed instance of the VOISSS signature field.
 *
 * One band per page, mounted in that page's own layout. It shares the global
 * terrain bus, so ANY audio surface on the page (marketplace cards, studio
 * previews, agent quickstarts) drives it — browsing becomes using the product.
 *
 * `readyLabel` gives each page its own honest idle copy. The live caption is
 * shared because the meaning is universal: a licensed voice is playing.
 */
export default function TerrainBand({
  readyLabel = "Idle — preview a voice to wake it",
  eyebrow = "Voice terrain",
  heightClass = "h-[150px] sm:h-[172px]",
  className = "",
  children,
}: {
  readyLabel?: string;
  eyebrow?: string;
  heightClass?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [live, setLive] = useState(false);
  const [settles, setSettles] = useState(0);

  useEffect(() => {
    const unsubscribe = onVoicePulse((pulse: VoicePulse) => {
      if (pulse === "settle") setSettles((n) => n + 1);
    });

    // Cheap poll: the terrain owns the animation loop; this only drives a
    // two-state caption, so we sample rather than push every frame.
    const id = window.setInterval(() => {
      setLive(getVoiceEnergy() > 0.06);
    }, 160);

    return () => {
      unsubscribe();
      window.clearInterval(id);
    };
  }, []);

  return (
    <div
      className={`voisss-terrain-bg voisss-container-lines voisss-specular relative overflow-hidden rounded-2xl ${className}`}
      data-reveal
    >
      <div className={`relative ${heightClass}`}>
        <VoiceTerrain />
        <div className="voisss-progressive-blur" aria-hidden />

        <div className="relative z-10 flex h-full flex-col justify-between p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex h-5 items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[10px] font-mono font-bold tracking-[0.12em] text-white/60">
              {eyebrow}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-white/35">
              <span
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  live ? "bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.7)]" : "bg-white/25"
                }`}
                aria-hidden
              />
              {live ? "Voice speaking — field live" : readyLabel}
            </span>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
