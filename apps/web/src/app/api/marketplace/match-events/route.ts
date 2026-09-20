import { NextRequest, NextResponse } from "next/server";
import {
  getIdentifier,
  getRateLimitHeaders,
  rateLimiters,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set([
  "voice_preview",
  "voice_vocalize",
  "voice_purchase_intent",
]);
const MAX_FIELD_LENGTH = 300;

function clean(value: unknown): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, MAX_FIELD_LENGTH)
    : undefined;
}

/**
 * POST /api/marketplace/match-events
 *
 * Client-side outcome events for rubric reweighting — the
 * previewed/used legs of the brief → shown → previewed → used funnel.
 * Logged as structured JSON for now; later shipped to an analytics sink
 * or aggregated store that adjusts rubric dimension weights.
 *
 * Body: { event, voiceId, archetype?, brief? }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const identifier = getIdentifier(req);
  const rateLimitCheck = await rateLimiters.standard.check(identifier);
  if (!rateLimitCheck.success) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded" },
      { status: 429, headers: getRateLimitHeaders(rateLimitCheck) }
    );
  }

  try {
    const body = await req.json();
    const event = clean(body?.event);
    if (!event || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json(
        { success: false, error: "unknown event type" },
        { status: 400 }
      );
    }

    console.log(
      JSON.stringify({
        event,
        voiceId: clean(body?.voiceId),
        archetype: clean(body?.archetype),
        brief: clean(body?.brief)?.slice(0, 200),
        at: new Date().toISOString(),
      })
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
