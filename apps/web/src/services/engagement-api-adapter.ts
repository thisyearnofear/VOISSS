import type {
  EngagementService,
  UserStreak,
  Notification,
  UserEngagementMetrics,
  UserAchievement,
  Leaderboard,
  ReferralCode,
  ShareEvent,
  ReferralConversion,
  Achievement,
} from "@voisss/shared";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "API error");
  return json.data as T;
}

class ApiEngagementAdapter {
  async getStreak(userId: string): Promise<UserStreak> {
    return apiFetch<UserStreak>(`/api/engagement?action=streak&userId=${encodeURIComponent(userId)}`);
  }

  async updateStreak(userId: string): Promise<UserStreak> {
    return apiFetch<UserStreak>("/api/engagement", {
      method: "POST",
      body: JSON.stringify({ action: "update-streak", userId }),
    });
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return apiFetch<Notification[]>(`/api/engagement?action=notifications&userId=${encodeURIComponent(userId)}`);
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await apiFetch("/api/engagement", {
      method: "POST",
      body: JSON.stringify({ action: "mark-read", notificationId }),
    });
  }

  async getUserMetrics(userId: string): Promise<UserEngagementMetrics> {
    return apiFetch<UserEngagementMetrics>(`/api/engagement?action=metrics&userId=${encodeURIComponent(userId)}`);
  }

  async updateUserMetrics(userId: string): Promise<UserEngagementMetrics> {
    return apiFetch<UserEngagementMetrics>(`/api/engagement?action=metrics&userId=${encodeURIComponent(userId)}`);
  }

  async checkAchievements(userId: string): Promise<UserAchievement[]> {
    return apiFetch<UserAchievement[]>("/api/engagement", {
      method: "POST",
      body: JSON.stringify({ action: "check-achievements", userId }),
    });
  }

  async getLeaderboard(period: Leaderboard["period"], category?: Leaderboard["category"]): Promise<Leaderboard> {
    const params = new URLSearchParams({ action: "leaderboard", period, category: category || "earnings" });
    const { leaderboard } = await apiFetch<{ leaderboard: Leaderboard }>(`/api/engagement?${params}`);
    return leaderboard;
  }

  async getUserRank(userId: string, period: Leaderboard["period"], category?: Leaderboard["category"]): Promise<number | null> {
    const params = new URLSearchParams({ action: "leaderboard", period, category: category || "earnings", userId });
    const { userRank } = await apiFetch<{ userRank: number | null }>(`/api/engagement?${params}`);
    return userRank;
  }

  async generateReferralCode(userId: string, recordingId?: string): Promise<ReferralCode> {
    const res = await fetch("/api/referral/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, recordingId: recordingId || userId }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Failed to generate referral code");
    const { code } = json.data as { code: string };
    return { code, referrerId: userId, recordingId, createdAt: new Date(), currentUses: 0 };
  }

  async trackShare(
    userId: string,
    recordingId: string,
    platform: ShareEvent["platform"],
    referralCode: string
  ): Promise<ShareEvent> {
    return apiFetch<ShareEvent>("/api/engagement", {
      method: "POST",
      body: JSON.stringify({ action: "track-share", userId, recordingId, platform, referralCode }),
    });
  }

  async trackReferralClick(referralCode: string): Promise<void> {
    await fetch("/api/referral/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: referralCode }),
    });
  }

  async convertReferral(referralCode: string, newUserId: string): Promise<ReferralConversion | null> {
    return apiFetch<ReferralConversion | null>("/api/engagement", {
      method: "POST",
      body: JSON.stringify({ action: "convert-referral", referralCode, userId: newUserId }),
    });
  }

  async getAchievementsCatalog(): Promise<Achievement[]> {
    return apiFetch<Achievement[]>("/api/engagement?action=achievements-catalog");
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return apiFetch<UserAchievement[]>(`/api/engagement?action=achievements&userId=${encodeURIComponent(userId)}`);
  }
}

export const apiEngagementService = new ApiEngagementAdapter() as unknown as EngagementService & {
  getAchievementsCatalog: () => Promise<Achievement[]>;
  getUserAchievements: (userId: string) => Promise<UserAchievement[]>;
};
