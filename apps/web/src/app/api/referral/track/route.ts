import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerEngagementService } from "@/lib/engagement-server";

const TrackSchema = z.object({
  code: z.string().min(1).max(64),
  visitorId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = TrackSchema.parse(body);
    const service = getServerEngagementService();
    await service.trackReferralClick(code);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to track referral" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
