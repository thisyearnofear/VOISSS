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
import { Leaderboard, LeaderboardEntry } from "@voisss/shared/types/engagement";
import { useAuth } from "../contexts/AuthContext";

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [period, setPeriod] = useState<Leaderboard["period"]>("weekly");
  const [category, setCategory] = useState<Leaderboard["category"]>("earnings");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [period, category, user]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const board = await mobileEngagementService.getLeaderboard(period, category);
      setLeaderboard(board);

      if (user?.uid) {
        const rank = await mobileEngagementService.getUserRank(user.uid, period, category);
        setUserRank(rank);
      }
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTokens = (amount: string) => {
    return new Intl.NumberFormat().format(Number(amount));
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🏆 Leaderboard</Text>

      {/* Filters */}
      <View style={styles.filters}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Period</Text>
          <View style={styles.filterButtons}>
            {(["daily", "weekly", "monthly", "all-time"] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.filterButton, period === p && styles.filterButtonActive]}
                onPress={() => setPeriod(p)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    period === p && styles.filterButtonTextActive,
                  ]}
                >
                  {p === "all-time" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Category</Text>
          <View style={styles.filterButtons}>
            {(["earnings", "quality", "volume", "streak"] as const).map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.filterButton, category === c && styles.filterButtonActive]}
                onPress={() => setCategory(c)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    category === c && styles.filterButtonTextActive,
                  ]}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* User Rank */}
      {userRank && (
        <View style={styles.userRankCard}>
          <Text style={styles.userRankText}>
            Your Rank: <Text style={styles.userRankValue}>#{userRank}</Text>
          </Text>
        </View>
      )}

      {/* Leaderboard */}
      <View style={styles.leaderboardCard}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        ) : leaderboard && leaderboard.entries.length > 0 ? (
          leaderboard.entries.map((entry) => (
            <View
              key={entry.userId}
              style={[
                styles.entryRow,
                entry.userId === user?.uid && styles.entryRowHighlight,
              ]}
            >
              <Text style={styles.entryRank}>{getRankEmoji(entry.rank)}</Text>
              <View style={styles.entryInfo}>
                <Text style={styles.entryUsername}>{entry.username}</Text>
                {category === "earnings" && (
                  <Text style={styles.entryValue}>
                    {formatTokens(entry.totalEarned)} tokens
                  </Text>
                )}
                {category === "quality" && (
                  <Text style={styles.entryValue}>
                    Quality: {entry.qualityScore.toFixed(1)}
                  </Text>
                )}
                {category === "volume" && (
                  <Text style={styles.entryValue}>
                    {entry.recordingsCount} recordings
                  </Text>
                )}
                {category === "streak" && (
                  <Text style={styles.entryValue}>{entry.streakDays} days</Text>
                )}
              </View>
              <Text style={styles.entryAchievements}>
                🏆 {entry.achievementCount}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No data available</Text>
        )}
      </View>

      {leaderboard && (
        <Text style={styles.footer}>
          Total participants: {leaderboard.totalParticipants} •{" "}
          {new Date(leaderboard.lastUpdated).toLocaleString()}
        </Text>
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
    marginBottom: 20,
  },
  filters: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#666",
  },
  filterButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
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
  userRankCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#90CAF9",
  },
  userRankText: {
    fontSize: 16,
    fontWeight: "600",
  },
  userRankValue: {
    color: "#1976D2",
    fontSize: 18,
  },
  leaderboardCard: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  loader: {
    padding: 40,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  entryRowHighlight: {
    backgroundColor: "#E3F2FD",
  },
  entryRank: {
    fontSize: 20,
    fontWeight: "bold",
    width: 50,
  },
  entryInfo: {
    flex: 1,
  },
  entryUsername: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  entryValue: {
    fontSize: 14,
    color: "#666",
  },
  entryAchievements: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    padding: 40,
    color: "#999",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    marginBottom: 20,
  },
});
