/**
 * First-win conversion telemetry.
 *
 * Tracks a funnel from first paint through successful generation → playback.
 * All events are local-only (no third-party SDKs) and batched to a
 * /api/analytics/funnel endpoint so the browser never blocks on network.
 *
 * Events tracked:
 *   - hero_demo_click       — user clicks "Try this voice" on homepage
 *   - voice_selected        — user picks a voice in the playground
 *   - generation_started    — vocalize POST sent
 *   - generation_succeeded  — audio URL returned
 *   - generation_failed     — error response
 *   - first_playback        — audio element .play() resolves
 *   - elapsed_to_first_win  — ms from page load → playback
 */

interface TelemetryEvent {
  event: string;
  ts: number;
  page?: string;
  voiceId?: string;
  elapsed?: number;
  error?: string;
  pack?: string;
  amount?: number;
}

const EVENTS_KEY = "voisss_telemetry_queue";

function getQueue(): TelemetryEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function pushQueue(events: TelemetryEvent[]) {
  const queue = getQueue();
  queue.push(...events);
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(queue));
  } catch { /* quota — drop silently */ }
}

function clearQueue() {
  try { localStorage.removeItem(EVENTS_KEY); } catch { /* noop */ }
}

async function flush() {
  const queue = getQueue();
  if (queue.length === 0) return;
  try {
    await fetch("/api/analytics/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: queue }),
    });
  } catch { /* non-critical */ }
  clearQueue();
}

let flushTimer: ReturnType<typeof setInterval> | null = null;
function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setInterval(flush, 5000);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  scheduleFlush();
}

export function initTelemetry() {
  if (typeof window === "undefined") return;
  window.__voisss_telemetry_loaded = Date.now();
}

function elapsed(): number {
  return typeof window !== "undefined" && window.__voisss_telemetry_loaded
    ? Date.now() - window.__voisss_telemetry_loaded
    : Infinity;
}

export function trackHeroDemoClick() {
  pushQueue([{ event: "hero_demo_click", ts: Date.now(), page: location.pathname, elapsed: elapsed() }]);
}

export function trackVoiceSelected(voiceId: string) {
  pushQueue([{ event: "voice_selected", ts: Date.now(), page: location.pathname, voiceId, elapsed: elapsed() }]);
}

export function trackGenerationStarted(voiceId: string) {
  pushQueue([{ event: "generation_started", ts: Date.now(), page: location.pathname, voiceId, elapsed: elapsed() }]);
}

export function trackGenerationSucceeded(voiceId: string) {
  pushQueue([{ event: "generation_succeeded", ts: Date.now(), page: location.pathname, voiceId, elapsed: elapsed() }]);
}

export function trackGenerationFailed(voiceId: string, error: string) {
  pushQueue([{ event: "generation_failed", ts: Date.now(), page: location.pathname, voiceId, elapsed: elapsed(), error }]);
}

export function trackFirstPlayback(voiceId: string) {
  pushQueue([{ event: "first_playback", ts: Date.now(), page: location.pathname, voiceId, elapsed: elapsed() }]);
}

export function trackPaymentInitiated(pack: string, amount: number) {
  pushQueue([{ event: "payment_initiated", ts: Date.now(), page: location.pathname, pack, amount }]);
}

export function trackPaymentCompleted(pack: string, amount: number) {
  pushQueue([{ event: "payment_completed", ts: Date.now(), page: location.pathname, pack, amount }]);
}

export function flushNow() { return flush(); }

declare global {
  interface Window {
    __voisss_telemetry_loaded?: number;
  }
}
