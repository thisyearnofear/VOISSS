/**
 * Engagement Service
 * SINGLE SOURCE OF TRUTH for all engagement mechanics
 * 
 * ENHANCEMENT FIRST: Consolidates referrals, streaks, achievements, notifications
 * PERFORMANT: Caching and batch operations
 * MODULAR: Clean separation of concerns
 */

import {
  ReferralCode,
  ReferralConversion,
  ShareEvent,
  UserStreak,
  Leaderboard,
  LeaderboardEntry,
  Achievement,
  UserAchievement,
  Notification,
  DailyRewardProgress,
  UserEngagementMetrics,
  REFERRAL_REWARDS,
  STREAK_REWARDS,
  DAILY_REWARDS,
  SHARE_REWARDS,
} from '../types/engagement';
import { DatabaseService, COLLECTIONS } from './database-service';

export class EngagementService {
  public db: DatabaseService;
  /** @internal */ initialized = false;
  /** @internal */ achievementsCache: Achievement[] | null = null;

  constructor(database: DatabaseService) {
    this.db = database;
  }

  async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    
    await this.db.connect();
    await this.initializeAchievements();
    this.initialized = true;
  }

  // ===== REFERRAL SYSTEM =====

  async generateReferralCode(
    userId: string,
    recordingId?: string
  ): Promise<ReferralCode> {
    await this.ensureInitialized();

    const code = `${userId.slice(0, 6).toUpperCase()}_${Date.now().toString(36)}`;
    
    const referralCode: ReferralCode = {
      code,
      referrerId: userId,
      recordingId,
      createdAt: new Date(),
      currentUses: 0,
    };

    await this.db.set('referral_codes', code, referralCode);
    return referralCode;
  }

  async trackShare(
    userId: string,
    recordingId: string,
    platform: ShareEvent['platform'],
    referralCode: string
  ): Promise<ShareEvent> {
    await this.ensureInitialized();

    const shareEvent: ShareEvent = {
      id: `share_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      userId,
      recordingId,
      platform,
      referralCode,
      sharedAt: new Date(),
      clicks: 0,
      conversions: 0,
    };

    await this.db.set('share_events', shareEvent.id, shareEvent);

    // Check if first share today - award bonus
    const today = new Date().toISOString().split('T')[0];
    const todayShares = await this.db.getWhere<ShareEvent>(
      'share_events',
      (event) => event.userId === userId && event.sharedAt.toString().startsWith(today)
    );

    if (todayShares.length === 1) {
      // First share today - award tokens
      await this.awardTokens(userId, SHARE_REWARDS.FIRST_DAILY_SHARE, 'daily_share_bonus');
    }

    return shareEvent;
  }

  async trackReferralClick(referralCode: string): Promise<void> {
    await this.ensureInitialized();

    const code = await this.db.get<ReferralCode>('referral_codes', referralCode);
    if (!code) return;

    // Increment click count on share event
    const shareEvents = await this.db.getWhere<ShareEvent>(
      'share_events',
      (event) => event.referralCode === referralCode
    );

    for (const event of shareEvents) {
      await this.db.update('share_events', event.id, {
        clicks: event.clicks + 1,
      });

      // Check for viral bonus
      if (event.clicks + 1 === SHARE_REWARDS.VIRAL_THRESHOLD) {
        await this.awardTokens(
          event.userId,
          SHARE_REWARDS.VIRAL_BONUS,
          'viral_share_bonus'
        );
        
        await this.createNotification({
          userId: event.userId,
          type: 'reward_ready',
          title: '🔥 Viral Share Bonus!',
          body: `Your recording got ${SHARE_REWARDS.VIRAL_THRESHOLD} clicks! Earned ${SHARE_REWARDS.VIRAL_BONUS} tokens.`,
          priority: 'high',
        });
      }
    }
  }

  async convertReferral(
    referralCode: string,
    newUserId: string
  ): Promise<ReferralConversion | null> {
    await this.ensureInitialized();

    const code = await this.db.get<ReferralCode>('referral_codes', referralCode);
    if (!code) return null;

    // Check if already used by this user
    const existing = await this.db.getWhere<ReferralConversion>(
      'referral_conversions',
      (conv) => conv.referralCode === referralCode && conv.refereeId === newUserId
    );
    if (existing.length > 0) return null;

    const conversion: ReferralConversion = {
      id: `conv_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      referralCode,
      referrerId: code.referrerId,
      refereeId: newUserId,
      convertedAt: new Date(),
      rewardStatus: 'pending',
      referrerReward: REFERRAL_REWARDS.REFERRER,
      refereeReward: REFERRAL_REWARDS.REFEREE,
      source: code.recordingId ? 'recording_share' : 'direct_link',
    };

    await this.db.set('referral_conversions', conversion.id, conversion);

    // Update referral code usage
    await this.db.update('referral_codes', referralCode, {
      currentUses: code.currentUses + 1,
    });

    // Update share event conversion count
    const shareEvents = await this.db.getWhere<ShareEvent>(
      'share_events',
      (event) => event.referralCode === referralCode
    );
    for (const event of shareEvents) {
      await this.db.update('share_events', event.id, {
        conversions: event.conversions + 1,
      });
    }

    // Award tokens to both users
    await this.awardTokens(code.referrerId, REFERRAL_REWARDS.REFERRER, 'referral_bonus');
    await this.awardTokens(newUserId, REFERRAL_REWARDS.REFEREE, 'signup_bonus');

    // Notify referrer
    await this.createNotification({
      userId: code.referrerId,
      type: 'referral_converted',
      title: '🎉 Referral Success!',
      body: `Someone joined using your link! You earned ${REFERRAL_REWARDS.REFERRER} tokens.`,
      priority: 'high',
    });

    // Update conversion status
    await this.db.update('referral_conversions', conversion.id, {
      rewardStatus: 'distributed',
    });

    return conversion;
  }

  // ===== STREAK SYSTEM =====

  async getStreak(userId: string): Promise<UserStreak> {
    await this.ensureInitialized();

    const streaks = await this.db.getWhere<UserStreak>(
      'user_streaks',
      (streak) => streak.userId === userId
    );

    if (streaks.length > 0) {
      return streaks[0];
    }

    // Initialize new streak
    const newStreak: UserStreak = {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      streakFreezeUsed: false,
      milestones: {
        day7: false,
        day30: false,
        day100: false,
        day365: false,
      },
      totalRecordings: 0,
      updatedAt: new Date(),
    };

    await this.db.set('user_streaks', userId, newStreak);
    return newStreak;
  }

  async updateStreak(userId: string): Promise<UserStreak> {
    await this.ensureInitialized();

    const streak = await this.getStreak(userId);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Check if already recorded today
    if (streak.lastRecordingDate?.toString().startsWith(today)) {
      return streak; // Already counted today
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = streak.currentStreak;
    
    if (!streak.lastRecordingDate) {
      // First recording ever
      newStreak = 1;
    } else if (streak.lastRecordingDate.toString().startsWith(yesterdayStr)) {
      // Consecutive day
      newStreak = streak.currentStreak + 1;
    } else {
      // Streak broken - check for freeze
      if (!streak.streakFreezeUsed) {
        // Use freeze pass
        newStreak = streak.currentStreak + 1;
        await this.db.update('user_streaks', userId, {
          streakFreezeUsed: true,
          lastFreezeResetDate: now,
        });
        
        await this.createNotification({
          userId,
          type: 'streak_reminder',
          title: '❄️ Streak Freeze Used',
          body: 'Your streak was saved! Keep recording daily to maintain it.',
          priority: 'medium',
        });
      } else {
        // Streak broken
        newStreak = 1;
        
        await this.createNotification({
          userId,
          type: 'streak_broken',
          title: '💔 Streak Broken',
          body: `Your ${streak.currentStreak}-day streak ended. Start a new one today!`,
          priority: 'medium',
        });
      }
    }

    // Check for milestone rewards
    const milestones = { ...streak.milestones };
    let rewardAwarded = false;

    if (newStreak >= 7 && !milestones.day7) {
      milestones.day7 = true;
      await this.awardTokens(userId, STREAK_REWARDS.DAY_7, 'streak_7_days');
      rewardAwarded = true;
    }
    if (newStreak >= 30 && !milestones.day30) {
      milestones.day30 = true;
      await this.awardTokens(userId, STREAK_REWARDS.DAY_30, 'streak_30_days');
      rewardAwarded = true;
    }
    if (newStreak >= 100 && !milestones.day100) {
      milestones.day100 = true;
      await this.awardTokens(userId, STREAK_REWARDS.DAY_100, 'streak_100_days');
      rewardAwarded = true;
    }
    if (newStreak >= 365 && !milestones.day365) {
      milestones.day365 = true;
      await this.awardTokens(userId, STREAK_REWARDS.DAY_365, 'streak_365_days');
      rewardAwarded = true;
    }

    if (rewardAwarded) {
      await this.createNotification({
        userId,
        type: 'achievement_unlocked',
        title: '🏆 Streak Milestone!',
        body: `${newStreak} days in a row! Keep it up!`,
        priority: 'high',
      });
    }

    // Reset freeze monthly
    if (streak.lastFreezeResetDate) {
      const lastReset = new Date(streak.lastFreezeResetDate);
      const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceReset >= 30) {
        await this.db.update('user_streaks', userId, {
          streakFreezeUsed: false,
          lastFreezeResetDate: now,
        });
      }
    }

    const updatedStreak: UserStreak = {
      ...streak,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, streak.longestStreak),
      lastRecordingDate: now,
      streakStartDate: streak.streakStartDate || now,
      milestones,
      totalRecordings: streak.totalRecordings + 1,
      updatedAt: now,
    };

    await this.db.set('user_streaks', userId, updatedStreak);
    return updatedStreak;
  }

  // ===== LEADERBOARD SYSTEM =====

  async getLeaderboard(
    period: Leaderboard['period'],
    category: Leaderboard['category'] = 'earnings',
    limit: number = 100
  ): Promise<Leaderboard> {
    await this.ensureInitialized();

    // Get all user metrics
    const allMetrics = await this.db.getAll<UserEngagementMetrics>('user_engagement_metrics');
    
    // Filter by period if needed
    const now = new Date();
    let filteredMetrics = allMetrics;

    if (period !== 'all-time') {
      const cutoffDate = new Date();
      if (period === 'daily') cutoffDate.setDate(cutoffDate.getDate() - 1);
      else if (period === 'weekly') cutoffDate.setDate(cutoffDate.getDate() - 7);
      else if (period === 'monthly') cutoffDate.setMonth(cutoffDate.getMonth() - 1);

      filteredMetrics = allMetrics.filter(
        (m) => new Date(m.lastActiveAt) >= cutoffDate
      );
    }

    // Sort by category
    const sorted = filteredMetrics.sort((a, b) => {
      switch (category) {
        case 'earnings':
          return Number(BigInt(b.totalEarned) - BigInt(a.totalEarned));
        case 'quality':
          return b.qualityScore - a.qualityScore;
        case 'volume':
          return b.totalRecordings - a.totalRecordings;
        case 'streak':
          return b.currentStreak - a.currentStreak;
        default:
          return Number(BigInt(b.totalEarned) - BigInt(a.totalEarned));
      }
    });

    // Create entries
    const entries: LeaderboardEntry[] = sorted.slice(0, limit).map((metrics, index) => ({
      rank: index + 1,
      userId: metrics.userId,
      username: metrics.userId.slice(0, 8), // Truncated for privacy
      totalEarned: metrics.totalEarned,
      recordingsCount: metrics.totalRecordings,
      qualityScore: metrics.qualityScore,
      streakDays: metrics.currentStreak,
      achievementCount: metrics.achievementsUnlocked,
      lastActive: metrics.lastActiveAt,
    }));

    return {
      period,
      category,
      entries,
      lastUpdated: now,
      totalParticipants: allMetrics.length,
    };
  }

  async getUserRank(
    userId: string,
    period: Leaderboard['period'],
    category: Leaderboard['category'] = 'earnings'
  ): Promise<number | null> {
    const leaderboard = await this.getLeaderboard(period, category, 1000);
    const entry = leaderboard.entries.find((e) => e.userId === userId);
    return entry?.rank || null;
  }

  // ===== ACHIEVEMENT SYSTEM =====

  async initializeAchievements(): Promise<void> {
    const existingCount = await this.db.count('achievements');
    if (existingCount > 0) {
      this.achievementsCache = await this.db.getAll<Achievement>('achievements');
      return;
    }

    // Define default achievements
    const achievements: Achievement[] = [
      // Recording achievements
      {
        id: 'first_recording',
        title: 'First Steps',
        description: 'Record your first voice clip',
        icon: '🎤',
        category: 'recordings',
        tier: 'bronze',
        requirement: { type: 'recordings_count', threshold: 1 },
        reward: { tokens: '10', badge: 'first_recording' },
        isSecret: false,
        order: 1,
      },
      {
        id: 'prolific_creator',
        title: 'Prolific Creator',
        description: 'Record 100 voice clips',
        icon: '🎬',
        category: 'recordings',
        tier: 'gold',
        requirement: { type: 'recordings_count', threshold: 100 },
        reward: { tokens: '500', badge: 'prolific_creator', multiplier: 1.1 },
        isSecret: false,
        order: 2,
      },
      // Earnings achievements
      {
        id: 'first_earnings',
        title: 'First Paycheck',
        description: 'Earn your first tokens',
        icon: '💰',
        category: 'earnings',
        tier: 'bronze',
        requirement: { type: 'total_earned', threshold: 1 },
        reward: { tokens: '25', badge: 'first_earnings' },
        isSecret: false,
        order: 3,
      },
      {
        id: 'high_earner',
        title: 'High Earner',
        description: 'Earn 10,000 tokens',
        icon: '💎',
        category: 'earnings',
        tier: 'platinum',
        requirement: { type: 'total_earned', threshold: 10000 },
        reward: { tokens: '1000', badge: 'high_earner', multiplier: 1.25 },
        isSecret: false,
        order: 4,
      },
      // Streak achievements
      {
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        category: 'streak',
        tier: 'silver',
        requirement: { type: 'streak_days', threshold: 7 },
        reward: { tokens: '100', badge: 'week_warrior' },
        isSecret: false,
        order: 5,
      },
      {
        id: 'century_streak',
        title: 'Century Streak',
        description: 'Maintain a 100-day streak',
        icon: '⚡',
        category: 'streak',
        tier: 'platinum',
        requirement: { type: 'streak_days', threshold: 100 },
        reward: { tokens: '2000', badge: 'century_streak', title: 'Streak Master' },
        isSecret: false,
        order: 6,
      },
      // Social achievements
      {
        id: 'social_butterfly',
        title: 'Social Butterfly',
        description: 'Refer 10 friends',
        icon: '🦋',
        category: 'social',
        tier: 'gold',
        requirement: { type: 'referrals', threshold: 10 },
        reward: { tokens: '500', badge: 'social_butterfly' },
        isSecret: false,
        order: 7,
      },
      // Quality achievements
      {
        id: 'quality_master',
        title: 'Quality Master',
        description: 'Achieve 90+ average quality score',
        icon: '⭐',
        category: 'quality',
        tier: 'platinum',
        requirement: { type: 'quality_score', threshold: 90 },
        reward: { tokens: '1000', badge: 'quality_master', multiplier: 1.2 },
        isSecret: false,
        order: 8,
      },
      // Secret achievements
      {
        id: 'night_owl',
        title: 'Night Owl',
        description: 'Record at 3 AM',
        icon: '🦉',
        category: 'special',
        tier: 'silver',
        requirement: { type: 'recordings_count', threshold: 1 }, // Special logic needed
        reward: { tokens: '50', badge: 'night_owl' },
        isSecret: true,
        order: 99,
      },
    ];

    for (const achievement of achievements) {
      await this.db.set('achievements', achievement.id, achievement);
    }

    this.achievementsCache = achievements;
  }

  async checkAchievements(userId: string): Promise<UserAchievement[]> {
    await this.ensureInitialized();

    const metrics = await this.getUserMetrics(userId);
    const streak = await this.getStreak(userId);
    const achievements = this.achievementsCache || await this.db.getAll<Achievement>('achievements');
    
    const userAchievements = await this.db.getWhere<UserAchievement>(
      'user_achievements',
      (ua) => ua.userId === userId
    );
    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    const newlyUnlocked: UserAchievement[] = [];

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let currentValue = 0;
      switch (achievement.requirement.type) {
        case 'recordings_count':
          currentValue = metrics.totalRecordings;
          break;
        case 'total_earned':
          currentValue = Number(metrics.totalEarned);
          break;
        case 'streak_days':
          currentValue = streak.currentStreak;
          break;
        case 'quality_score':
          currentValue = metrics.qualityScore;
          break;
        case 'referrals':
          currentValue = metrics.referralConversions;
          break;
        case 'shares':
          currentValue = metrics.totalShares;
          break;
      }

      const progress = Math.min(100, (currentValue / achievement.requirement.threshold) * 100);

      if (currentValue >= achievement.requirement.threshold) {
        // Achievement unlocked!
        const userAchievement: UserAchievement = {
          userId,
          achievementId: achievement.id,
          unlockedAt: new Date(),
          progress: 100,
          claimed: false,
        };

        await this.db.set(
          'user_achievements',
          `${userId}_${achievement.id}`,
          userAchievement
        );

        newlyUnlocked.push(userAchievement);

        // Award tokens
        if (achievement.reward.tokens) {
          await this.awardTokens(userId, achievement.reward.tokens, `achievement_${achievement.id}`);
        }

        // Notify user
        await this.createNotification({
          userId,
          type: 'achievement_unlocked',
          title: `🏆 ${achievement.title}`,
          body: achievement.description,
          data: { achievementId: achievement.id },
          priority: 'high',
        });
      }
    }

    return newlyUnlocked;
  }

  // ===== NOTIFICATION SYSTEM =====

  async createNotification(
    data: Omit<Notification, 'id' | 'createdAt' | 'read'>
  ): Promise<Notification> {
    await this.ensureInitialized();

    const notification: Notification = {
      ...data,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      read: false,
      createdAt: new Date(),
    };

    await this.db.set('notifications', notification.id, notification);
    return notification;
  }

  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    await this.ensureInitialized();

    const notifications = await this.db.getWhere<Notification>(
      'notifications',
      (n) => n.userId === userId && (!unreadOnly || !n.read)
    );

    return notifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    await this.ensureInitialized();
    await this.db.update('notifications', notificationId, {
      read: true,
      readAt: new Date(),
    });
  }

  // ===== USER METRICS =====

  async getUserMetrics(userId: string): Promise<UserEngagementMetrics> {
    await this.ensureInitialized();

    const existing = await this.db.get<UserEngagementMetrics>(
      'user_engagement_metrics',
      userId
    );

    if (existing) return existing;

    // Initialize new metrics
    const metrics: UserEngagementMetrics = {
      userId,
      totalRecordings: 0,
      totalShares: 0,
      totalReferrals: 0,
      totalMissionsCompleted: 0,
      engagementScore: 0,
      qualityScore: 0,
      socialScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalEarned: '0',
      totalClaimed: '0',
      pendingRewards: '0',
      referralConversions: 0,
      shareClicks: 0,
      achievementsUnlocked: 0,
      achievementPoints: 0,
      lastActiveAt: new Date(),
      accountAge: 0,
      daysActive: 0,
      retentionRate: 0,
      updatedAt: new Date(),
    };

    await this.db.set('user_engagement_metrics', userId, metrics);
    return metrics;
  }

  async updateUserMetrics(userId: string): Promise<UserEngagementMetrics> {
    await this.ensureInitialized();

    const metrics = await this.getUserMetrics(userId);
    const streak = await this.getStreak(userId);
    
    // Aggregate data from various sources
    const shareEvents = await this.db.getWhere<ShareEvent>(
      'share_events',
      (e) => e.userId === userId
    );
    const referralConversions = await this.db.getWhere<ReferralConversion>(
      'referral_conversions',
      (c) => c.referrerId === userId
    );
    const achievements = await this.db.getWhere<UserAchievement>(
      'user_achievements',
      (a) => a.userId === userId
    );

    const totalShares = shareEvents.length;
    const shareClicks = shareEvents.reduce((sum, e) => sum + e.clicks, 0);
    const referralCount = referralConversions.length;

    // Calculate engagement score (0-100)
    const engagementScore = Math.min(
      100,
      (metrics.totalRecordings * 2) +
      (totalShares * 5) +
      (referralCount * 10) +
      (streak.currentStreak * 3) +
      (achievements.length * 5)
    );

    const updated: UserEngagementMetrics = {
      ...metrics,
      totalShares,
      shareClicks,
      referralConversions: referralCount,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      achievementsUnlocked: achievements.length,
      engagementScore,
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    };

    await this.db.set('user_engagement_metrics', userId, updated);
    return updated;
  }

  // ===== HELPER METHODS =====

  async awardTokens(
    userId: string,
    amount: string,
    reason: string
  ): Promise<void> {
    // This would integrate with the reward system
    // For now, just update metrics
    const metrics = await this.getUserMetrics(userId);
    const newTotal = (BigInt(metrics.totalEarned) + BigInt(amount)).toString();
    const newPending = (BigInt(metrics.pendingRewards) + BigInt(amount)).toString();

    await this.db.update('user_engagement_metrics', userId, {
      totalEarned: newTotal,
      pendingRewards: newPending,
    });
  }
}

// Export singleton instance factory
let engagementServiceInstance: EngagementService | null = null;

export function getEngagementService(db: DatabaseService): EngagementService {
  if (!engagementServiceInstance) {
    engagementServiceInstance = new EngagementService(db);
  }
  return engagementServiceInstance;
}
