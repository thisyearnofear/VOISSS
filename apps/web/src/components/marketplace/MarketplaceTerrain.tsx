"use client";

import TerrainBand from "./TerrainBand";

/**
 * MarketplaceTerrain — the homepage field, sandboxed to the marketplace hero
 * and wired to the voice cards below via the shared terrain bus.
 *
 * Preview any card and the band answers: ribbons swell, the field drifts
 * cyan, pollen lifts. Browsing becomes using the product.
 */
export default function MarketplaceTerrain() {
  return (
    <TerrainBand
      eyebrow="01 — Voices"
      readyLabel="Idle — preview a voice to wake it"
      className="mb-5"
    >
      <span className="ml-auto hidden sm:inline text-[10px] font-mono uppercase tracking-[0.12em] text-white/30">
        Every voice here is licensed · settled on Base
      </span>
    </TerrainBand>
  );
}
