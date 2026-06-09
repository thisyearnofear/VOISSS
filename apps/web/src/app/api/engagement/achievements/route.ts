import { NextRequest, NextResponse } from "next/server";
import { getServerEngagementService } from "@/lib/engagement-server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
  }
  try {
    const service = getServerEngagementService();
    const achievements = await service.db.getWhere(
      "user_achievements",
      (ua: { userId: string }) => ua.userId === userId
    );
    return NextResponse.json({ success: true, data: achievements });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to get achievements" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }
    const service = getServerEngagementService();
    const newAchievements = await service.checkAchievements(userId);
    return NextResponse.json({ success: true, data: newAchievements });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to check achievements" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
