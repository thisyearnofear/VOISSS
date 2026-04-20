"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { webEngagementService } from "../../services/engagement";
import { Achievement, UserAchievement } from "@voisss/shared/types/engagement";

export default function AchievementsPage() {
  const { address } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<Map<string, UserAchievement>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Achievement["category"] | "all">("all");

  useEffect(() => {
    loadAchievements();
  }, [address]);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      // Get all achievements from database
      const allAchievements = await webEngagementService.db.getAll<Achievement>("achievements");
      setAchievements(allAchievements.sort((a, b) => a.order - b.order));

      if (address) {
        // Get user's unlocked achievements
        const userAchs = await webEngagementService.db.getWhere<UserAchievement>(
          "user_achievements",
          (ua) => ua.userId === address
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
      case "bronze": return "text-orange-600 bg-orange-50";
      case "silver": return "text-gray-600 bg-gray-50";
      case "gold": return "text-yellow-600 bg-yellow-50";
      case "platinum": return "text-purple-600 bg-purple-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const unlockedCount = achievements.filter((ach) => userAchievements.has(ach.id)).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">🏆 Achievements</h1>
        <p className="text-gray-600 mb-8">
          {unlockedCount} of {achievements.length} unlocked
        </p>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {(["all", "recordings", "earnings", "streak", "social", "quality", "special"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === cat
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements.map((achievement) => {
              const userAch = userAchievements.get(achievement.id);
              const isUnlocked = !!userAch;
              const isSecret = achievement.isSecret && !isUnlocked;

              return (
                <div
                  key={achievement.id}
                  className={`bg-white rounded-lg shadow p-6 transition ${
                    isUnlocked ? "border-2 border-green-400" : "opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{isSecret ? "🔒" : achievement.icon}</div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getTierColor(achievement.tier)}`}>
                      {achievement.tier.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-2">
                    {isSecret ? "Secret Achievement" : achievement.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {isSecret ? "Complete hidden requirements to unlock" : achievement.description}
                  </p>

                  {!isSecret && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Reward:</span>
                        <span className="font-semibold">{achievement.reward.tokens} tokens</span>
                      </div>
                      {achievement.reward.multiplier && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Bonus:</span>
                          <span className="font-semibold text-green-600">
                            {((achievement.reward.multiplier - 1) * 100).toFixed(0)}% multiplier
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {isUnlocked && userAch && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-green-600 font-semibold">
                        ✓ Unlocked {new Date(userAch.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
