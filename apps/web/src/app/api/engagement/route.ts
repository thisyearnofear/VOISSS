import { NextRequest, NextResponse } from "next/server";
import { getServerEngagementService } from "@/lib/engagement-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action");
  const userId = searchParams.get("userId");

  try {
    const service = getServerEngagementService();

    switch (action) {
      case "metrics": {
        if (!userId) {
          return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
        }
        const metrics = await service.getUserMetrics(userId);
        return NextResponse.json({ success: true, data: metrics });
      }

      case "achievements": {
        if (!userId) {
          return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
        }
        const achievements = await service.db.getWhere(
          "user_achievements",
          (ua: { userId: string }) => ua.userId === userId
        );
        return NextResponse.json({ success: true, data: achievements });
      }

      case "achievements-catalog": {
        await service.ensureInitialized();
        const catalog = service.achievementsCache || (await service.db.getAll("achievements"));
        return NextResponse.json({ success: true, data: catalog });
      }

      case "streak": {
        if (!userId) {
          return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
        }
        const streak = await service.getStreak(userId);
        return NextResponse.json({ success: true, data: streak });
      }

      case "leaderboard": {
        const period = (searchParams.get("period") || "weekly") as "daily" | "weekly" | "monthly" | "all-time";
        const category = (searchParams.get("category") || "earnings") as "earnings" | "quality" | "volume" | "streak";
        const [leaderboard, userRank] = await Promise.all([
          service.getLeaderboard(period, category),
          userId ? service.getUserRank(userId, period, category) : Promise.resolve(null),
        ]);
        return NextResponse.json({ success: true, data: { leaderboard, userRank } });
      }

      case "notifications": {
        if (!userId) {
          return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
        }
        const notifications = await service.getUserNotifications(userId);
        return NextResponse.json({ success: true, data: notifications });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use: metrics, achievements, streak, leaderboard, or notifications" },
          { status: 400 }
        );
    }
  } catch {
    return NextResponse.json({ success: false, error: "Failed to process engagement request" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, notificationId, referralCode, recordingId, platform } = body;

    const service = getServerEngagementService();

    switch (action) {
      case "check-achievements": {
        if (!userId) {
          return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
        }
        const newAchievements = await service.checkAchievements(userId);
        return NextResponse.json({ success: true, data: newAchievements });
      }

      case "update-streak": {
        if (!userId) {
          return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
        }
        const streak = await service.updateStreak(userId);
        return NextResponse.json({ success: true, data: streak });
      }

      case "mark-read": {
        if (!notificationId) {
          return NextResponse.json({ success: false, error: "notificationId required" }, { status: 400 });
        }
        await service.markNotificationRead(notificationId);
        return NextResponse.json({ success: true });
      }

      case "convert-referral": {
        if (!referralCode || !userId) {
          return NextResponse.json({ success: false, error: "referralCode and userId required" }, { status: 400 });
        }
        const conversion = await service.convertReferral(referralCode, userId);
        return NextResponse.json({ success: true, data: conversion });
      }

      case "track-share": {
        if (!userId || !recordingId || !platform || !referralCode) {
          return NextResponse.json(
            { success: false, error: "userId, recordingId, platform, and referralCode required" },
            { status: 400 }
          );
        }
        const shareEvent = await service.trackShare(userId, recordingId, platform, referralCode);
        return NextResponse.json({ success: true, data: shareEvent });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action. Use: check-achievements, update-streak, mark-read, convert-referral, or track-share" },
          { status: 400 }
        );
    }
  } catch {
    return NextResponse.json({ success: false, error: "Failed to process engagement request" }, { status: 500 });
  }
}
