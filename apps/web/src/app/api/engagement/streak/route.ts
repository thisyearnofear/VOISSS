import { NextRequest, NextResponse } from "next/server";
import { getServerEngagementService } from "@/lib/engagement-server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
  }
  try {
    const service = getServerEngagementService();
    const streak = await service.getStreak(userId);
    return NextResponse.json({ success: true, data: streak });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to get streak" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }
    const service = getServerEngagementService();
    const streak = await service.updateStreak(userId);
    return NextResponse.json({ success: true, data: streak });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update streak" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
