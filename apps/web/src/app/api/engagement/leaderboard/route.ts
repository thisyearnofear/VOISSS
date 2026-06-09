import { NextRequest, NextResponse } from "next/server";
import { getServerEngagementService } from "@/lib/engagement-server";

export async function GET(req: NextRequest) {
  const period = (req.nextUrl.searchParams.get("period") || "weekly") as "daily" | "weekly" | "monthly" | "all-time";
  const category = (req.nextUrl.searchParams.get("category") || "earnings") as "earnings" | "quality" | "volume" | "streak";
  const userId = req.nextUrl.searchParams.get("userId");

  try {
    const service = getServerEngagementService();
    const [leaderboard, userRank] = await Promise.all([
      service.getLeaderboard(period, category),
      userId ? service.getUserRank(userId, period, category) : Promise.resolve(null),
    ]);
    return NextResponse.json({ success: true, data: { leaderboard, userRank } });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to get leaderboard" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
