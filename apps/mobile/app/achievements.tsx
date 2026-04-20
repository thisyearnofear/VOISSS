import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { mobileEngagementService } from "../services/engagement";
import { Achievement, UserAchievement } from "@voisss/shared/types/engagement";
import { useAuth } from "../contexts/AuthContext";

export default function AchievementsScreen() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<Map<string, UserAchievement>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Achievement["category"] | "all">("all");

  useEffect(() => {
    loadAchievements();
  }, [user]);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const allAchievements = await mobileEngagementService.db.getAll<Achievement>("achievements");
      setAchievements(allAchievements.sort((a, b) => a.order - b.order));

      if (user?.uid) {
        const userAchs = await mobileEngagementService.db.getWhere<UserAchievement>(
          "user_achievements",
          (ua) => ua.userId === user.uid
        );
        const map = new Map(userAchs.map((ua) => [ua.achievementId, ua]));
        setUserAchievements(map);
      }
    } catch (error) {
      console.error("Failed to load achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter(
    (ach) => filter === "all" || ach.category === filter
  );

  const getTierColor = (tier: Achievement["tier"]) => {
    switch (tier) {
      case "bronze": return "#D97706";
      case "silver": return "#6B7280";
      case "gold": return "#CA8A04";
      case "platinum": return "#7C3AED";
      default: return "#6B7280";
    }
  };

  const unlockedCount = achievements.filter((ach) => userAchievements.has(ach.id)).length;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🏆 Achievements</Text>
      <Text style={styles.subtitle}>
        {unlockedCount} of {achievements.length} unlocked
      </Text>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(["all", "recordings", "earnings", "streak", "social", "quality", "special"] as const).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterButton, filter === cat && styles.filterButtonActive]}
              onPress={() => setFilter(cat)}
            >
              <Text style={[styles.filterButtonText, filter === cat && styles.filterButtonTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Achievements */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <View style={styles.achievementsGrid}>
          {filteredAchievements.map((achievement) => {
            const userAch = userAchievements.get(achievement.id);
            const isUnlocked = !!userAch;
            const isSecret = achievement.isSecret && !isUnlocked;

            return (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  isUnlocked && styles.achievementCardUnlocked,
                  !isUnlocked && styles.achievementCardLocked,
                ]}
              >
                <View style={styles.achievementHeader}>
                  <Text style={styles.achievementIcon}>{isSecret ? "🔒" : achievement.icon}</Text>
                  <View style={[styles.tierBadge, { backgroundColor: getTierColor(achievement.tier) }]}>
                    <Text style={styles.tierText}>{achievement.tier.toUpperCase()}</Text>
                  </View>
                </View>

                <Text style={styles.achievementTitle}>
                  {isSecret ? "Secret Achievement" : achievement.title}
                </Text>
                <Text style={styles.achievementDescription}>
                  {isSecret ? "Complete hidden requirements to unlock" : achievement.description}
                </Text>

                {!isSecret && (
                  <View style={styles.rewardSection}>
                    <Text style={styles.rewardText}>
                      Reward: {achievement.reward.tokens} tokens
                    </Text>
                    {achievement.reward.multiplier && (
                      <Text style={styles.bonusText}>
                        +{((achievement.reward.multiplier - 1) * 100).toFixed(0)}% multiplier
                      </Text>
                    )}
                  </View>
                )}

                {isUnlocked && userAch && (
                  <View style={styles.unlockedSection}>
                    <Text style={styles.unlockedText}>
                      ✓ Unlocked {new Date(userAch.unlockedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#333",
  },
  filterButtonTextActive: {
    color: "white",
    fontWeight: "600",
  },
  loader: {
    padding: 40,
  },
  achievementsGrid: {
    gap: 16,
  },
  achievementCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  achievementCardUnlocked: {
    borderWidth: 2,
    borderColor: "#10B981",
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  achievementIcon: {
    fontSize: 40,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tierText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  rewardSection: {
    marginBottom: 8,
  },
  rewardText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  bonusText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
  unlockedSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  unlockedText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
});
