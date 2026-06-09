import { NextRequest, NextResponse } from "next/server";
import { getServerEngagementService } from "@/lib/engagement-server";

export async function POST(req: NextRequest) {
  try {
    const { notificationId } = await req.json();
    if (!notificationId) {
      return NextResponse.json({ success: false, error: "notificationId required" }, { status: 400 });
    }
    const service = getServerEngagementService();
    await service.markNotificationRead(notificationId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to mark notification read" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
