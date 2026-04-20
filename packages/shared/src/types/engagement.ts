/**
 * Engagement & Virality Types
 * SINGLE SOURCE OF TRUTH for all engagement mechanics
 * 
 * Consolidates: referrals, streaks, leaderboards, achievements, notifications
 */

import { z } from 'zod';

// ===== REFERRAL SYSTEM =====

export const ReferralCodeSchema = z.object({
  code: z.string(), // unique code (e.g., "ALICE_REC123")
  referrerId: z.string(), // user who created the code
  recordingId: z.string().optional(), // if sharing specific recording
  createdAt: z.union([z.date(), z.string()]),
  expiresAt: z.union([z.date(), z.string()]).optional(),
  maxUses: z.number().optional(),
  currentUses: z.number().default(0),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const ReferralConversionSchema = z.object({
  id: z.string(),
  referralCode: z.string(),
  referrerId: z.string(),
  refereeId: z.string(), // new user who signed up
  convertedAt: z.union([z.date(), z.string()]),
  rewardStatus: z.enum(['pending', 'distributed', 'failed']),
  referrerReward: z.string(), // token amount
  refereeReward: z.string(), // token amount
  source: z.enum(['recording_share', 'direct_link', 'social_media']),
});

export const ShareEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  recordingId: z.string(),
  platform: z.enum(['whatsapp', 'telegram', 'twitter', 'farcaster', 'copy']),
  referralCode: z.string(),
  sharedAt: z.union([z.date(), z.string()]),
  clicks: z.number().default(0),
  conversions: z.number().default(0),
});

export type ReferralCode = z.infer<typeof ReferralCodeSchema>;
export type ReferralConversion = z.infer<typeof ReferralConversionSchema>;
export type ShareEvent = z.infer<typeof ShareEventSchema>;

// ===== STREAK SYSTEM =====

export const UserStreakSchema = z.object({
  userId: z.string(),
  currentStreak: z.number().default(0),
  longestStreak: z.number().default(0),
  lastRecordingDate: z.union([z.date(), z.string()]).optional(),
  streakStartDate: z.union([z.date(), z.string()]).optional(),
  streakFreezeUsed: z.boolean().default(false), // one free pass per month
  lastFreezeResetDate: z.union([z.date(), z.string()]).optional(),
  milestones: z.object({
    day7: z.boolean().default(false),
    day30: z.boolean().default(false),
    day100: z.boolean().default(false),
    day365: z.boolean().default(false),
  }),
  totalRecordings: z.number().default(0),
  updatedAt: z.union([z.date(), z.string()]),
});

export type UserStreak = z.infer<typeof UserStreakSchema>;

// ===== LEADERBOARD SYSTEM =====

export const LeaderboardEntrySchema = z.object({
  rank: z.number(),
  userId: z.string(),
  username: z.string().optional(),
  displayName: z.string().optional(),
  totalEarned: z.string(), // token amount
  recordingsCount: z.number(),
  qualityScore: z.number().min(0).max(100),
  streakDays: z.number(),
  achievementCount: z.number(),
  lastActive: z.union([z.date(), z.string()]),
});

export const LeaderboardSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'all-time']),
  category: z.enum(['earnings', 'quality', 'volume', 'streak']).optional(),
  entries: z.array(LeaderboardEntrySchema),
  lastUpdated: z.union([z.date(), z.string()]),
  totalParticipants: z.number(),
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type Leaderboard = z.infer<typeof LeaderboardSchema>;

// ===== ACHIEVEMENT SYSTEM =====

export const AchievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(), // emoji or icon name
  category: z.enum(['recordings', 'earnings', 'quality', 'social', 'streak', 'special']),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  requirement: z.object({
    type: z.enum([
      'recordings_count',
      'total_earned',
      'streak_days',
      'quality_score',
      'referrals',
      'shares',
      'missions_completed',
      'featured_count',
    ]),
    threshold: z.number(),
    timeframe: z.enum(['all-time', 'monthly', 'weekly']).optional(),
  }),
  reward: z.object({
    tokens: z.string().optional(),
    badge: z.string().optional(),
    title: z.string().optional(), // special title to display
    multiplier: z.number().optional(), // reward multiplier bonus
  }),
  isSecret: z.boolean().default(false), // hidden until unlocked
  order: z.number(), // display order
});

export const UserAchievementSchema = z.object({
  userId: z.string(),
  achievementId: z.string(),
  unlockedAt: z.union([z.date(), z.string()]),
  progress: z.number().min(0).max(100), // percentage progress
  claimed: z.boolean().default(false),
  claimedAt: z.union([z.date(), z.string()]).optional(),
});

export type Achievement = z.infer<typeof AchievementSchema>;
export type UserAchievement = z.infer<typeof UserAchievementSchema>;

// ===== NOTIFICATION SYSTEM =====

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum([
    'mission_expiring',
    'mission_new',
    'reward_ready',
    'reward_claimed',
    'achievement_unlocked',
    'streak_reminder',
    'streak_broken',
    'referral_converted',
    'featured_content',
    'leaderboard_rank',
    'friend_activity',
    'system_announcement',
  ]),
  title: z.string(),
  body: z.string(),
  data: z.record(z.string(), z.any()).optional(), // additional context
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  read: z.boolean().default(false),
  readAt: z.union([z.date(), z.string()]).optional(),
  actionUrl: z.string().optional(), // deep link or URL
  createdAt: z.union([z.date(), z.string()]),
  expiresAt: z.union([z.date(), z.string()]).optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// ===== DAILY REWARDS =====

export const DailyRewardSchema = z.object({
  day: z.number().min(1).max(7), // day in the week cycle
  reward: z.string(), // token amount
  bonus: z.string().optional(), // extra reward for streak
  claimed: z.boolean().default(false),
  claimableAt: z.union([z.date(), z.string()]),
  claimedAt: z.union([z.date(), z.string()]).optional(),
});

export const DailyRewardProgressSchema = z.object({
  userId: z.string(),
  currentDay: z.number().min(1).max(7),
  rewards: z.array(DailyRewardSchema),
  weekStartDate: z.union([z.date(), z.string()]),
  consecutiveWeeks: z.number().default(0),
  lastClaimDate: z.union([z.date(), z.string()]).optional(),
});

export type DailyReward = z.infer<typeof DailyRewardSchema>;
export type DailyRewardProgress = z.infer<typeof DailyRewardProgressSchema>;

// ===== ENGAGEMENT ANALYTICS =====

export const UserEngagementMetricsSchema = z.object({
  userId: z.string(),
  // Activity metrics
  totalRecordings: z.number().default(0),
  totalShares: z.number().default(0),
  totalReferrals: z.number().default(0),
  totalMissionsCompleted: z.number().default(0),
  
  // Engagement scores
  engagementScore: z.number().min(0).max(100), // composite score
  qualityScore: z.number().min(0).max(100),
  socialScore: z.number().min(0).max(100),
  
  // Streaks
  currentStreak: z.number().default(0),
  longestStreak: z.number().default(0),
  
  // Rewards
  totalEarned: z.string(),
  totalClaimed: z.string(),
  pendingRewards: z.string(),
  
  // Social
  referralConversions: z.number().default(0),
  shareClicks: z.number().default(0),
  
  // Achievements
  achievementsUnlocked: z.number().default(0),
  achievementPoints: z.number().default(0),
  
  // Time-based
  lastActiveAt: z.union([z.date(), z.string()]),
  firstRecordingAt: z.union([z.date(), z.string()]).optional(),
  accountAge: z.number(), // days since signup
  
  // Retention
  daysActive: z.number().default(0),
  retentionRate: z.number().min(0).max(100), // percentage
  
  updatedAt: z.union([z.date(), z.string()]),
});

export type UserEngagementMetrics = z.infer<typeof UserEngagementMetricsSchema>;

// ===== CONSTANTS =====

export const REFERRAL_REWARDS = {
  REFERRER: '50', // tokens for referrer
  REFEREE: '50', // tokens for new user
} as const;

export const STREAK_REWARDS = {
  DAY_7: '100',
  DAY_30: '500',
  DAY_100: '2000',
  DAY_365: '10000',
} as const;

export const DAILY_REWARDS = {
  BASE: ['10', '15', '20', '25', '30', '40', '50'], // day 1-7
  STREAK_BONUS: '25', // extra for consecutive weeks
} as const;

export const SHARE_REWARDS = {
  FIRST_DAILY_SHARE: '5',
  VIRAL_THRESHOLD: 10, // clicks needed for bonus
  VIRAL_BONUS: '20',
} as const;
