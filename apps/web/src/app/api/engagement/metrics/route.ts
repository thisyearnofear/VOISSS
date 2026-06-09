import { NextRequest, NextResponse } from "next/server";
import { getServerEngagementService } from "@/lib/engagement-server";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
  }
  try {
    const service = getServerEngagementService();
    const metrics = await service.getUserMetrics(userId);
    return NextResponse.json({ success: true, data: metrics });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to get metrics" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
