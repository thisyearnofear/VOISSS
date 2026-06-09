import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const TrackSchema = z.object({
  code: z.string().min(1).max(16),
  visitorId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, visitorId } = TrackSchema.parse(body);

    // In production, store in database. For now, log the referral event.
    console.log(`[Referral] Tracked: code=${code}, visitor=${visitorId || "anonymous"}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to track referral" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
