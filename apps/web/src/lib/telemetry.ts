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
const CLIENT_KEY = "voisss_telemetry_client";
const MAX_QUEUE = 200;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function getClientId(): string {
  if (!isBrowser()) return "anonymous";
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

function getQueue(): TelemetryEvent[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pushQueue(events: TelemetryEvent[]) {
  if (!isBrowser() || events.length === 0) return;
  const queue = getQueue();
  queue.push(...events);
  // Bound the queue — drop oldest first so a failed flush can't grow storage.
  const trimmed = queue.length > MAX_QUEUE ? queue.slice(queue.length - MAX_QUEUE) : queue;
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(trimmed));
  } catch { /* quota — drop silently */ }
}

/** Remove the first `count` events (the batch we just flushed). */
function dropSent(count: number) {
  if (!isBrowser()) return;
  try {
    const queue = getQueue();
    const rest = queue.slice(count);
    if (rest.length === 0) localStorage.removeItem(EVENTS_KEY);
    else localStorage.setItem(EVENTS_KEY, JSON.stringify(rest));
  } catch { /* noop */ }
}

let flushing = false;
async function flush() {
  if (!isBrowser() || flushing) return;
  const queue = getQueue();
  if (queue.length === 0) return;
  flushing = true;
  // Send in one batch (server chunks to GA limits). Only drop on success —
  // a failed flush must be retried, not silently lost.
  const batch = queue.slice(0, MAX_QUEUE);
  try {
    const res = await fetch("/api/analytics/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: getClientId(), events: batch }),
      keepalive: true,
    });
    if (res.ok) dropSent(batch.length);
  } catch { /* non-critical — retry on next tick */ }
  finally {
    flushing = false;
  }
}

let flushTimer: ReturnType<typeof setInterval> | null = null;
function scheduleFlush() {
  if (!isBrowser() || flushTimer) return;
  flushTimer = setInterval(() => void flush(), 5000);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush();
  });
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", () => void flush());
  }
  scheduleFlush();
}

export function initTelemetry() {
  if (typeof window === "undefined") return;
  if (!window.__voisss_telemetry_loaded) {
    window.__voisss_telemetry_loaded = Date.now();
  }
  scheduleFlush();
}

function elapsed(): number {
  return typeof window !== "undefined" && window.__voisss_telemetry_loaded
    ? Date.now() - window.__voisss_telemetry_loaded
    : 0;
}

function page(): string | undefined {
  return typeof location !== "undefined" ? location.pathname : undefined;
}

export function trackHeroDemoClick() {
  if (!isBrowser()) return;
  pushQueue([{ event: "hero_demo_click", ts: Date.now(), page: page(), elapsed: elapsed() }]);
}

export function trackVoiceSelected(voiceId: string) {
  if (!isBrowser()) return;
  pushQueue([{ event: "voice_selected", ts: Date.now(), page: page(), voiceId, elapsed: elapsed() }]);
}

export function trackGenerationStarted(voiceId: string) {
  if (!isBrowser()) return;
  pushQueue([{ event: "generation_started", ts: Date.now(), page: page(), voiceId, elapsed: elapsed() }]);
}

export function trackGenerationSucceeded(voiceId: string) {
  if (!isBrowser()) return;
  pushQueue([{ event: "generation_succeeded", ts: Date.now(), page: page(), voiceId, elapsed: elapsed() }]);
}

export function trackGenerationFailed(voiceId: string, error: string) {
  if (!isBrowser()) return;
  pushQueue([{ event: "generation_failed", ts: Date.now(), page: page(), voiceId, elapsed: elapsed(), error: error.slice(0, 300) }]);
}

export function trackFirstPlayback(voiceId: string) {
  if (!isBrowser()) return;
  pushQueue([{ event: "first_playback", ts: Date.now(), page: page(), voiceId, elapsed: elapsed() }]);
}

export function trackPaymentInitiated(pack: string, amount: number) {
  if (!isBrowser()) return;
  pushQueue([{ event: "payment_initiated", ts: Date.now(), page: page(), pack, amount }]);
}

export function trackPaymentCompleted(pack: string, amount: number) {
  if (!isBrowser()) return;
  pushQueue([{ event: "payment_completed", ts: Date.now(), page: page(), pack, amount }]);
}

export function flushNow() { return flush(); }

declare global {
  interface Window {
    __voisss_telemetry_loaded?: number;
  }
}
