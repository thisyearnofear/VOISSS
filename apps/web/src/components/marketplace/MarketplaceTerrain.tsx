"use client";

import { useEffect, useState } from "react";
import VoiceTerrain from "../VoiceTerrain";
import { getVoiceEnergy, onVoicePulse } from "@/lib/terrain-bus";

/**
 * MarketplaceTerrain — the same field as the homepage, sandboxed to the
 * marketplace hero and wired to the voice cards below.
 *
 * Preview any voice and this answers: ribbons swell, the field drifts cyan,
 * pollen lifts. It turns browsing from reading a list into using the product.
 *
 * No extra state churn — it reads the bus on an interval only to refresh a
 * small caption, and subscribes for discrete pulses.
 */
export default function MarketplaceTerrain() {
  const [live, setLive] = useState(false);
  const [settles, setSettles] = useState(0);

  useEffect(() => {
    const unsubscribe = onVoicePulse((pulse) => {
      if (pulse === "settle") setSettles((n) => n + 1);
    });

    // Cheap poll: the terrain owns the animation loop, this only drives a
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
      className="voisss-terrain-bg voisss-container-lines voisss-specular relative mb-5 overflow-hidden rounded-2xl"
      data-reveal
    >
      <div className="relative h-[150px] sm:h-[172px]">
        <VoiceTerrain />
        <div className="voisss-progressive-blur" aria-hidden />

        <div className="relative z-10 flex h-full flex-col justify-between p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex h-5 items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[10px] font-mono font-bold tracking-[0.12em] text-white/60">
              01 — Voices
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-white/35">
              <span
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  live ? "bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.7)]" : "bg-white/25"
                }`}
                aria-hidden
              />
              {live ? "Voice speaking — field live" : "Idle — preview a voice to wake it"}
            </span>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-2">
            <p className="max-w-[46ch] text-xs leading-relaxed text-zinc-400">
              Every voice here is licensed and settled on Base. Press{" "}
              <span className="text-white">Preview</span> on any card — the field answers because a real
              human voice is playing.
            </p>
            <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-[0.12em] text-white/30">
              {settles > 0 ? `${settles} settle${settles > 1 ? "s" : ""} previewed` : "70/30 on chain"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
