/**
 * useEngagement Hook
 * SINGLE SOURCE OF TRUTH for engagement features in React components
 * 
 * ENHANCEMENT FIRST: Provides clean API for all engagement mechanics
 * PERFORMANT: Caching and optimistic updates
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { EngagementService } from '../services/engagement-service';
import {
  UserStreak,
  Leaderboard,
  UserAchievement,
  Notification,
  UserEngagementMetrics,
  ShareEvent,
} from '../types/engagement';

export interface UseEngagementOptions {
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
}

export interface UseEngagementReturn {
  // Streak
  streak: UserStreak | null;
  updateStreak: () => Promise<void>;
  
  // Referrals
  generateReferralCode: (recordingId?: string) => Promise<string>;
  trackShare: (recordingId: string, platform: ShareEvent['platform']) => Promise<void>;
  
  // Leaderboard
  leaderboard: Leaderboard | null;
  userRank: number | null;
  refreshLeaderboard: (period?: Leaderboard['period']) => Promise<void>;
  
  // Achievements
  achievements: UserAchievement[];
  checkAchievements: () => Promise<void>;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markRead: (notificationId: string) => Promise<void>;
  
  // Metrics
  metrics: UserEngagementMetrics | null;
  refreshMetrics: () => Promise<void>;
  
  // State
  loading: boolean;
  error: string | null;
}

export function useEngagement(
  engagementService: EngagementService,
  options: UseEngagementOptions = {}
): UseEngagementReturn {
  const { userId, autoRefresh = false, refreshInterval = 60000 } = options;

  // State
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [metrics, setMetrics] = useState<UserEngagementMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Load initial data
  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [streakData, notifData, metricsData] = await Promise.all([
          engagementService.getStreak(userId),
          engagementService.getUserNotifications(userId),
          engagementService.getUserMetrics(userId),
        ]);

        setStreak(streakData);
        setNotifications(notifData);
        setMetrics(metricsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load engagement data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, engagementService]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !userId) return;

    const interval = setInterval(async () => {
      try {
        const [notifData, metricsData] = await Promise.all([
          engagementService.getUserNotifications(userId),
          engagementService.getUserMetrics(userId),
        ]);

        setNotifications(notifData);
        setMetrics(metricsData);
      } catch (err) {
        console.error('Auto-refresh failed:', err);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, userId, refreshInterval, engagementService]);

  // Streak methods
  const updateStreak = useCallback(async () => {
    if (!userId) return;

    try {
      const updated = await engagementService.updateStreak(userId);
      setStreak(updated);
      
      // Check for new achievements
      await checkAchievements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update streak');
    }
  }, [userId, engagementService]);

  // Referral methods
  const generateReferralCode = useCallback(
    async (recordingId?: string): Promise<string> => {
      if (!userId) throw new Error('User ID required');

      const code = await engagementService.generateReferralCode(userId, recordingId);
      return code.code;
    },
    [userId, engagementService]
  );

  const trackShare = useCallback(
    async (recordingId: string, platform: ShareEvent['platform']) => {
      if (!userId) return;

      try {
        const referralCode = await generateReferralCode(recordingId);
        await engagementService.trackShare(userId, recordingId, platform, referralCode);
        
        // Refresh metrics
        const updated = await engagementService.updateUserMetrics(userId);
        setMetrics(updated);
      } catch (err) {
        console.error('Failed to track share:', err);
      }
    },
    [userId, generateReferralCode, engagementService]
  );

  // Leaderboard methods
  const refreshLeaderboard = useCallback(
    async (period: Leaderboard['period'] = 'weekly') => {
      try {
        const [board, rank] = await Promise.all([
          engagementService.getLeaderboard(period),
          userId ? engagementService.getUserRank(userId, period) : Promise.resolve(null),
        ]);

        setLeaderboard(board);
        setUserRank(rank);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      }
    },
    [userId, engagementService]
  );

  // Achievement methods
  const checkAchievements = useCallback(async () => {
    if (!userId) return;

    try {
      const newAchievements = await engagementService.checkAchievements(userId);
      
      if (newAchievements.length > 0) {
        // Refresh achievements list
        setAchievements((prev) => [...prev, ...newAchievements]);
        
        // Refresh notifications
        const notifs = await engagementService.getUserNotifications(userId);
        setNotifications(notifs);
      }
    } catch (err) {
      console.error('Failed to check achievements:', err);
    }
  }, [userId, engagementService]);

  // Notification methods
  const markRead = useCallback(
    async (notificationId: string) => {
      try {
        await engagementService.markNotificationRead(notificationId);
        
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n
          )
        );
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    },
    [engagementService]
  );

  // Metrics methods
  const refreshMetrics = useCallback(async () => {
    if (!userId) return;

    try {
      const updated = await engagementService.updateUserMetrics(userId);
      setMetrics(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh metrics');
    }
  }, [userId, engagementService]);

  return {
    // Streak
    streak,
    updateStreak,
    
    // Referrals
    generateReferralCode,
    trackShare,
    
    // Leaderboard
    leaderboard,
    userRank,
    refreshLeaderboard,
    
    // Achievements
    achievements,
    checkAchievements,
    
    // Notifications
    notifications,
    unreadCount,
    markRead,
    
    // Metrics
    metrics,
    refreshMetrics,
    
    // State
    loading,
    error,
  };
}
