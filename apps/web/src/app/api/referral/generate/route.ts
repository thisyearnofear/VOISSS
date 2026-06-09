import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const GenerateSchema = z.object({
  userId: z.string().min(1),
  recordingId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, recordingId } = GenerateSchema.parse(body);
    const code = Buffer.from(`${userId}:${recordingId}`).toString("base64url").slice(0, 8);
    return NextResponse.json({ success: true, data: { code } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Failed to generate referral code" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
