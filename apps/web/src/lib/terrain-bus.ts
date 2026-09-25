/**
 * terrain-bus — the one channel that makes VOISSS feel alive.
 *
 * A deliberately tiny pub/sub (no React state, no re-renders) that lets any
 * audio surface drive the hero's VoiceTerrain:
 *
 *   setVoiceEnergy(0..1)  → continuous swell while a licensed voice speaks
 *   pulseVoice('lift')    → a voice started (field rises)
 *   pulseVoice('settle')  → an agent paid (70/30 split sweeps the field)
 *
 * Why a bus instead of Web Audio analysis: routing playback through
 * MediaElementSource silences cross-origin audio (IPFS gateways) and would
 * change how previews play. Reacting to the real playback lifecycle keeps
 * `Try this voice` exactly as it is today — zero regression risk — while the
 * terrain still moves *because* a voice is speaking.
 *
 * The terrain reads getVoiceEnergy() inside its existing rAF (no subscription),
 * and subscribes only for discrete pulses. Module-level, SSR-safe.
 */

export type VoicePulse = "lift" | "settle";

type PulseListener = (pulse: VoicePulse) => void;

let energy = 0;
let lastAt = 0;
const listeners = new Set<PulseListener>();
let settleSplit = 0.7; // 0..1 — the draggable 70/30, read by VoiceTerrain every frame

/** Publishes 0..1 voice energy. Values decay if the caller stops reporting. */
export function setVoiceEnergy(level: number) {
  const clamped = level <= 0 ? 0 : level >= 1 ? 1 : level;
  energy = clamped;
  lastAt = typeof performance !== "undefined" ? performance.now() : Date.now();
}

/** Current energy, auto-decaying ~1.2s after the last report so a lost audio
 *  element can never leave the field stuck in an energized state. */
export function getVoiceEnergy(): number {
  if (energy === 0) return 0;
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const stale = now - lastAt;
  if (stale > 1200) {
    energy = 0;
    return 0;
  }
  // graceful tail after the last report
  if (stale > 260) {
    return energy * Math.max(0, 1 - (stale - 260) / 940);
  }
  return energy;
}

/** Current inspectable split (0..1). VoiceTerrain reads this every rAF. */
export function getSettleSplit(): number {
  return settleSplit;
}
/** Move the split — settlement is an object you can drag. Clamped 0.15..0.85 so neither side vanishes. */
export function setSettleSplit(ratio: number) {
  settleSplit = ratio <= 0.15 ? 0.15 : ratio >= 0.85 ? 0.85 : ratio;
}

/** Fire a discrete moment the field should acknowledge. */
export function pulseVoice(pulse: VoicePulse) {
  if (listeners.size === 0) return;
  for (const fn of listeners) {
    try {
      fn(pulse);
    } catch {
      // a broken listener must never break playback
    }
  }
}

/**
 * Track a playing <audio> element and publish a speech-like energy envelope.
 *
 * Deliberately NOT Web Audio analysis: `createMediaElementSource` silences
 * cross-origin (IPFS gateway) audio and changes how playback behaves. The
 * envelope derives from `currentTime`, so playback stays byte-for-byte
 * unchanged while the terrain still moves *because* a voice is speaking.
 *
 * Returns a stop function. Always call it on pause/ended/unmount.
 */
export function trackPlaybackEnergy(audio: HTMLAudioElement): () => void {
  const publish = () => {
    if (audio.paused || audio.ended) {
      setVoiceEnergy(0);
      return;
    }
    const ct = audio.currentTime;
    // layered sines → speech-like rhythm: deterministic, cheap, no analyser
    const env =
      0.3 +
      0.3 * Math.abs(Math.sin(ct * 5.7)) +
      0.22 * Math.abs(Math.sin(ct * 12.9 + 1.1)) +
      0.18 * Math.abs(Math.sin(ct * 2.3 + 0.4));
    setVoiceEnergy(Math.min(1, env));
  };

  publish();
  if (typeof window === "undefined") return () => {};
  const id = window.setInterval(publish, 60);
  return () => {
    window.clearInterval(id);
    setVoiceEnergy(0);
  };
}

/** Subscribe to discrete pulses. Returns an unsubscribe function. */
export function onVoicePulse(fn: PulseListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
