"use client";

/* ─────────────────────────────────────────────────────────────────────────────
 * APP EVENT BUS — lightweight pub/sub for cross-surface signals
 *
 * Any component can dispatch events; subscribers (telemetry, toasts, future
 * listeners) react without prop-drilling. The animated-mascot subscriber was
 * removed with the mascot cull — the bus itself stays because the wedge
 * funnel (sell → generate → marketplace) publishes lifecycle events here.
 * ───────────────────────────────────────────────────────────────────────────── */

export type AppEvent =
  | { type: "voice:generate"; voiceId: string }
  | { type: "voice:complete"; voiceId: string }
  | { type: "payment:success"; amount: number }
  | { type: "payment:error"; message: string }
  | { type: "recording:complete"; title: string }
  | { type: "error"; message: string }
  | { type: "acp:bid"; offeringId: string; confidence: number }
  | { type: "acp:started" }
  | { type: "acp:stopped" }
  | { type: "license:purchased"; voiceId: string }
  | { type: "credits:purchased"; pack: string };

const QUEUE = /* @__PURE__ */ new Set<(event: AppEvent) => void>();

/** Dispatch an event to all subscribers */
export function publishAppEvent(event: AppEvent): void {
  for (const fn of QUEUE) fn(event);
}

export { publishAppEvent as publishMoodEvent };

export function MascotEvents() {
  return null;
}