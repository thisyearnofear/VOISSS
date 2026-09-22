import type { MarketplaceVoice } from "@/lib/marketplace-indexer";

/**
 * Pure helpers for the single-voice listening room
 * (/marketplace/voices/[voiceId]). Kept component-free so the server page,
 * client room, and node tests can all import them.
 */

export function voiceDisplayName(voice: MarketplaceVoice): string {
  return voice.metadata?.title || voice.id;
}

/** Catalog price is micro-USDC per month — render as dollars. */
export function formatMonthlyPriceUsdc(price: string): string {
  const micro = Number.parseInt(price, 10);
  if (!Number.isFinite(micro) || micro < 0) return "0.00";
  return (micro / 1_000_000).toFixed(2);
}

/** Per-character rate derived from the monthly micro-USDC price. */
export function formatPerCharacterRate(price: string): string {
  const micro = Number.parseInt(price, 10);
  if (!Number.isFinite(micro) || micro < 0) return "0.0000000";
  if (micro === 1) return "0.000001";
  return (micro / 10_000_000).toFixed(7);
}

export function isEvmAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

export interface VoiceSpecRow {
  label: string;
  value: string;
}

/** Specs disclosure rows — profile fields fall back to catalog defaults. */
export function voiceSpecRows(voice: MarketplaceVoice): VoiceSpecRow[] {
  const rows: VoiceSpecRow[] = [
    { label: "Language", value: voice.voiceProfile?.language || "English" },
    { label: "Accent", value: voice.voiceProfile?.accent || "Neutral" },
  ];
  if (voice.voiceProfile?.tone) {
    rows.push({ label: "Tone", value: voice.voiceProfile.tone });
  }
  if (voice.voiceProfile?.pitch) {
    rows.push({ label: "Pitch", value: voice.voiceProfile.pitch });
  }
  rows.push({
    label: "License",
    value: voice.licenseType === "exclusive" ? "Exclusive" : "Non-exclusive",
  });
  rows.push({
    label: "Monthly",
    value: `$${formatMonthlyPriceUsdc(voice.price)}/mo`,
  });
  rows.push({
    label: "Per character",
    value: `$${formatPerCharacterRate(voice.price)}`,
  });
  return rows;
}

/** Curated fallback voices so shared detail links never dead-end when the
 *  catalog API is unreachable. Demo voices carry no uploaded sample — the
 *  try-your-script preview (via contractVoiceId) is their audition path. */
export const DEMO_VOICES: Record<string, MarketplaceVoice> = {
  "demo-rachel": {
    id: "demo-rachel",
    contractVoiceId: "21m00Tcm4TlvDq8ikWAM",
    contributorAddress: "0xDEMO",
    price: "1",
    licenseType: "non-exclusive",
    voiceProfile: { tone: "Rachel", language: "en-US", accent: "American" },
    metadata: { title: "Rachel" },
    stats: { views: 100, purchases: 50, usageCount: 1000 },
    status: "approved",
    trust: {
      badge: "Demo voice",
      status: "provenance",
      source: "catalog",
      details:
        "Demo catalog voice. Audition it with your own script below; licensing terms are shown for illustration.",
    },
    provenance: { source: "catalog" },
  },
  "demo-antoni": {
    id: "demo-antoni",
    contractVoiceId: "ErXwobaYiN019PkySvjV",
    contributorAddress: "0xDEMO",
    price: "1",
    licenseType: "non-exclusive",
    voiceProfile: { tone: "Antoni", language: "en-US", accent: "American" },
    metadata: { title: "Antoni" },
    stats: { views: 100, purchases: 50, usageCount: 1000 },
    status: "approved",
    trust: {
      badge: "Demo voice",
      status: "provenance",
      source: "catalog",
      details:
        "Demo catalog voice. Audition it with your own script below; licensing terms are shown for illustration.",
    },
    provenance: { source: "catalog" },
  },
  "demo-bella": {
    id: "demo-bella",
    contractVoiceId: "EXAVITQu4vr4xnSDxMaL",
    contributorAddress: "0xDEMO",
    price: "1",
    licenseType: "non-exclusive",
    voiceProfile: { tone: "Bella", language: "en-US", accent: "American" },
    metadata: { title: "Bella" },
    stats: { views: 100, purchases: 50, usageCount: 1000 },
    status: "approved",
    trust: {
      badge: "Demo voice",
      status: "provenance",
      source: "catalog",
      details:
        "Demo catalog voice. Audition it with your own script below; licensing terms are shown for illustration.",
    },
    provenance: { source: "catalog" },
  },
};
