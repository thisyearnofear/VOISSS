/**
 * StreakBanner Component - Mobile Native
 * ENHANCEMENT FIRST: Compact streak display for mobile
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@voisss/ui';
import { mobileEngagementService } from '../services/engagement';
import type { UserStreak } from '@voisss/shared';

interface StreakBannerProps {
  userId?: string;
  onPress?: () => void;
}

export function StreakBanner({ userId, onPress }: StreakBannerProps) {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadStreak();
  }, [userId]);

  async function loadStreak() {
    if (!userId) return;

    try {
      const streakData = await mobileEngagementService.getStreak(userId);
      setStreak(streakData);
    } catch (error) {
      console.warn('Failed to load streak:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !streak || streak.currentStreak === 0) {
    return null;
  }

  const getMilestones = () => [
    { days: 7, reward: '100', label: 'Week' },
    { days: 30, reward: '500', label: 'Month' },
    { days: 100, reward: '2000', label: 'Century' },
    { days: 365, reward: '10000', label: 'Year' },
  ];

  const nextMilestone = getMilestones().find((m) => streak.currentStreak < m.days);
  const progress = nextMilestone
    ? (streak.currentStreak / nextMilestone.days) * 100
    : 100;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔥</Text>
        </View>
        
        <View style={styles.textContainer}>
          <View style={styles.row}>
            <Text style={styles.streakNumber}>{streak.currentStreak}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
          
          {nextMilestone && (
            <Text style={styles.nextMilestone}>
              {nextMilestone.days - streak.currentStreak} days to {nextMilestone.label}
            </Text>
          )}
        </View>

        {nextMilestone && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.reward}>+{nextMilestone.reward}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.dark.text,
    marginRight: 6,
  },
  streakLabel: {
    fontSize: 14,
    color: colors.dark.textSecondary,
  },
  nextMilestone: {
    fontSize: 12,
    color: '#FF8E8E',
  },
  progressContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
  reward: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '600',
  },
});
