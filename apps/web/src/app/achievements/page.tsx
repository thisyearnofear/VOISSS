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
      setAchievements(allAchievements.sort((a: Achievement, b: Achievement) => a.order - b.order));

      if (address) {
        // Get user's unlocked achievements
        const userAchs = await webEngagementService.db.getWhere<UserAchievement>(
          "user_achievements",
          (ua: UserAchievement) => ua.userId === address
        );
        const map = new Map<string, UserAchievement>(userAchs.map((ua: UserAchievement) => [ua.achievementId, ua]));
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

  const unlockedCount = achievements.filter((ach) => userAchievements.has(ach.id)).length;

  return (
    <div className="min-h-screen bg-[#0A0A0A] voisss-bg-grid voisss-bg-noise text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 voisss-gradient-text">Achievements</h1>
        <p className="text-gray-400 mb-8">
          {unlockedCount} of {achievements.length} unlocked
        </p>

        {/* Filter — sharp inline strip */}
        <div className="flex flex-wrap gap-1 mb-8 border-b border-[#2A2A2A] pb-4">
          {(["all", "recordings", "earnings", "streak", "social", "quality", "special"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 text-sm transition ${
                filter === cat
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Achievements List */}
        {loading ? (
          <div className="space-y-0 divide-y divide-[#2A2A2A]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-5 py-5 px-4 animate-pulse">
                <div className="w-10 h-10 bg-[#2A2A2A] rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 w-48 bg-[#2A2A2A] rounded" />
                  <div className="h-3 w-32 bg-[#2A2A2A] rounded" />
                </div>
                <div className="flex-shrink-0">
                  <div className="h-4 w-16 bg-[#2A2A2A] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-[#2A2A2A]">
            {filteredAchievements.map((achievement) => {
              const userAch = userAchievements.get(achievement.id);
              const isUnlocked = !!userAch;
              const isSecret = achievement.isSecret && !isUnlocked;

              return (
                <div
                  key={achievement.id}
                  className={`flex items-start gap-5 py-5 px-4 transition ${
                    isUnlocked ? "opacity-100" : "opacity-50"
                  } ${isUnlocked ? "border-l-2 border-l-green-500/60 pl-[14px]" : "border-l-2 border-l-transparent pl-[14px]"}`}
                >
                  <div className="text-3xl flex-shrink-0 mt-0.5">
                    {isSecret ? "🔒" : achievement.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-bold text-white">
                        {isSecret ? "Secret Achievement" : achievement.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        achievement.tier === 'platinum' ? 'text-purple-400 bg-purple-500/10' :
                        achievement.tier === 'gold' ? 'text-yellow-400 bg-yellow-500/10' :
                        achievement.tier === 'silver' ? 'text-gray-300 bg-gray-500/10' :
                        'text-orange-400 bg-orange-500/10'
                      }`}>
                        {achievement.tier}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {isSecret ? "Complete hidden requirements to unlock" : achievement.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    {!isSecret && (
                      <div className="text-sm font-mono text-gray-400">
                        {achievement.reward.tokens} tok
                      </div>
                    )}
                    {achievement.reward.multiplier && (
                      <div className="text-xs text-green-400 font-mono">
                        +{((achievement.reward.multiplier - 1) * 100).toFixed(0)}%
                      </div>
                    )}
                    {isUnlocked && userAch && (
                      <div className="text-[10px] text-green-500 mt-1 font-mono">
                        {new Date(userAch.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
