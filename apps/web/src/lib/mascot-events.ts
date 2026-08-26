"use client";

/* ─────────────────────────────────────────────────────────────────────────────
 * MASCOT EVENT WIRING — listen to app events and react with mood changes
 *
 * This hook creates a global event bus for app-wide events that the mascot
 * should react to. Any component can dispatch events and all subscribed
 * components (including the mascot) will update.
 *
 * Usage:
 *   import { MascotEvents, publishAppEvent } from "@/lib/mascot-events";
 *   // In your component's JSX:
 *   <MascotEvents />
 *   // When something happens:
 *   publishAppEvent("voice:generate", { voiceId: "abc" });
 *   publishAppEvent("payment:success", { amount: 10 });
 *   publishAppEvent("recording:complete", { title: "Hello world" });
 *   publishAppEvent("error", { message: "Something went wrong" });
 *   publishAppEvent("acp:bid", { offeringId: "xyz", confidence: 85 });
 * ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import { MascotMood, publishMoodEvent } from "@/components/VoissMascot";

export { publishMoodEvent };
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

/** Dispatch an event to all mascot subscribers */
export function publishAppEvent(event: AppEvent): void {
  for (const fn of QUEUE) fn(event);
}

/** Map events to mascot moods */
function eventToMood(event: AppEvent): [MascotMood, string] {
  switch (event.type) {
    case "voice:generate":
      return ["listen", `generating voice ${event.voiceId}`];
    case "voice:complete":
      return ["happy", `voice generated ${event.voiceId}`];
    case "payment:success":
      return ["celebrate", `payment $${event.amount} successful`];
    case "payment:error":
      return ["think", `payment error: ${event.message}`];
    case "recording:complete":
      return ["happy", `recording "${event.title}" complete`];
    case "error":
      return ["think", `error: ${event.message}`];
    case "acp:bid":
      return event.confidence >= 80 ? ["celebrate", `high-confidence bid ${event.confidence}%`] : ["think", `bid ${event.confidence}%`];
    case "acp:started":
      return ["listen", "ACP listener started"];
    case "acp:stopped":
      return ["wave", "ACP listener stopped"];
    case "license:purchased":
      return ["celebrate", `voice licensed ${event.voiceId}`];
    case "credits:purchased":
      return ["celebrate", `credits pack ${event.pack} purchased`];
  }
}

let _currentMood: MascotMood = "wave";
let _moodReason: string | null = null;

export function MascotEvents() {
  const handlerRef = useRef<(event: AppEvent) => void>(() => {});

  useEffect(() => {
    const handler = (event: AppEvent) => {
      const [mood, reason] = eventToMood(event);
      _currentMood = mood;
      _moodReason = reason;
      publishMoodEvent(mood, reason);
    };
    handlerRef.current = handler;
    QUEUE.add(handler);
    return () => {
      QUEUE.delete(handler);
    };
  }, []);

  return null;
}

/** Track which events have been published for debugging */
export function useEventLogger(prefix = "mascot") {
  useEffect(() => {
    const handler = (event: AppEvent) => {
      console.log(`[${prefix}]`, event.type, event);
    };
    QUEUE.add(handler);
    return () => {
      QUEUE.delete(handler);
    };
  }, [prefix]);
}