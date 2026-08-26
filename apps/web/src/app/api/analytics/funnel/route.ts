/**
 * POST /api/analytics/funnel
 *
 * Receives batched telemetry events from clients and batches them to
 * Google Analytics (if configured) or stores in a local in-memory buffer.
 *
 * This endpoint is fire-and-forget from the client side — the browser
 * only sends every 5s and never blocks on the response.
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
  events: TelemetryEvent[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body: FlushRequest = await request.json();
  const events = body.events;

  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  for (const evt of events) {
    // Google Analytics 4 HTTP payload
    if (gaId) {
      try {
        await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${gaId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: evt.voiceId || "anonymous",
            events: [
              {
                name: evt.event,
                params: {
                  page: evt.page,
                  voice_id: evt.voiceId,
                  elapsed_ms: evt.elapsed,
                  error: evt.error,
                  pack: evt.pack,
                  amount: evt.amount,
                  // Non-interaction to not affect bounce rate
                  non_interaction: true,
                },
              },
            ],
          }),
        });
      } catch {
        /* non-critical */
      }
    }

    // Local debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("[telemetry]", evt.event, evt);
    }
  }

  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
