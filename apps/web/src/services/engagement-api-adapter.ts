import type {
  EngagementService,
  UserStreak,
  Notification,
  UserEngagementMetrics,
  UserAchievement,
  Leaderboard,
  ReferralCode,
  ShareEvent,
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
    const code = `${userId.slice(0, 6).toUpperCase()}_${Date.now().toString(36)}`;
    return { code, referrerId: userId, recordingId, createdAt: new Date(), currentUses: 0 };
  }

  async trackShare(_userId: string, _recordingId: string, _platform: ShareEvent["platform"], _referralCode: string): Promise<ShareEvent> {
    return { id: `share_${Date.now()}`, userId: _userId, recordingId: _recordingId, platform: _platform, referralCode: _referralCode, sharedAt: new Date(), clicks: 0, conversions: 0 };
  }
}

export const apiEngagementService = new ApiEngagementAdapter() as unknown as EngagementService;
