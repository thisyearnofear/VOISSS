/**
 * POST /api/analytics/funnel
 *
 * Receives batched telemetry events from clients and forwards them to
 * Google Analytics 4 via the Measurement Protocol (if configured).
 *
 * GA4 MP requires BOTH `measurement_id` AND `api_secret` (server-side
 * secret from GA Admin → Data Streams → Measurement Protocol API secrets).
 * Without the secret every hit fails — so when unconfigured we persist
 * locally (dev log) and still return ok: the browser path is fire-and-forget.
 */
import { NextRequest, NextResponse } from "next/server";

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

interface FlushRequest {
  clientId?: string;
  events: TelemetryEvent[];
}

// GA4 MP accepts max 25 events per request; keep payloads small.
const GA_MAX_BATCH = 25;
// MP event names must start with a letter, letters/numbers/underscores only.
const GA_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;
const ALLOWED_EVENTS = new Set([
  "hero_demo_click",
  "voice_selected",
  "generation_started",
  "generation_succeeded",
  "generation_failed",
  "first_playback",
  "payment_initiated",
  "payment_completed",
]);

function sanitizeEvent(evt: TelemetryEvent): { name: string; params: Record<string, string | number | boolean> } | null {
  const name = (evt.event || "").slice(0, 40);
  if (!ALLOWED_EVENTS.has(name) || !GA_NAME_RE.test(name)) return null;
  const params: Record<string, string | number | boolean> = {};
  if (evt.page) params.page = String(evt.page).slice(0, 200);
  if (evt.voiceId) params.voice_id = String(evt.voiceId).slice(0, 100);
  if (typeof evt.elapsed === "number" && Number.isFinite(evt.elapsed)) {
    params.elapsed_ms = Math.max(0, Math.round(evt.elapsed));
  }
  if (evt.error) params.error = String(evt.error).slice(0, 200);
  if (evt.pack) params.pack = String(evt.pack).slice(0, 50);
  if (typeof evt.amount === "number" && Number.isFinite(evt.amount)) params.amount = evt.amount;
  // Engagement event — must affect bounce/session timing, so NOT non_interaction.
  params.engagement_time_msec = 100;
  return { name, params };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: FlushRequest;
  try {
    body = (await request.json()) as FlushRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const events = body.events;

  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ ok: true });
  }
  if (events.length > 200) {
    return NextResponse.json({ ok: false, error: "Batch too large" }, { status: 413 });
  }

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const apiSecret = process.env.GA_API_SECRET;
  const forwarded = gaId && apiSecret;
  // Stable client id: prefer the browser-generated UUID; fall back safely.
  const clientId =
    typeof body.clientId === "string" && body.clientId.length >= 8
      ? body.clientId.slice(0, 100)
      : "anonymous";

  // Validate + sanitize before any network call.
  const valid = events
    .filter((e) => e && typeof e.event === "string")
    .map(sanitizeEvent)
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .slice(0, 200);

  if (forwarded) {
    for (const batch of chunk(valid, GA_MAX_BATCH)) {
      try {
        await fetch(
          `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(gaId!)}&api_secret=${encodeURIComponent(apiSecret!)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ client_id: clientId, events: batch }),
          }
        );
      } catch {
        /* non-critical */
      }
    }
  } else if (process.env.NODE_ENV === "development") {
    for (const evt of valid) console.log("[telemetry]", evt.name, evt.params);
  }

  return NextResponse.json({ ok: true, received: events.length, accepted: valid.length, forwarded: Boolean(forwarded) });
}

export const dynamic = "force-dynamic";
