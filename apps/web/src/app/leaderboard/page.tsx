"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { webEngagementService } from "../../services/engagement";
import { Leaderboard, LeaderboardEntry } from "@voisss/shared/types/engagement";

export default function LeaderboardPage() {
  const { address } = useAuth();
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [period, setPeriod] = useState<Leaderboard["period"]>("weekly");
  const [category, setCategory] = useState<Leaderboard["category"]>("earnings");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [period, category, address]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const board = await webEngagementService.getLeaderboard(period, category);
      setLeaderboard(board);

      if (address) {
        const rank = await webEngagementService.getUserRank(address, period, category);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🏆 Leaderboard</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Leaderboard["period"])}
                className="border rounded px-3 py-2"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="all-time">All Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Leaderboard["category"])}
                className="border rounded px-3 py-2"
              >
                <option value="earnings">Earnings</option>
                <option value="quality">Quality</option>
                <option value="volume">Volume</option>
                <option value="streak">Streak</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Rank */}
        {userRank && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-lg font-semibold">
              Your Rank: <span className="text-blue-600">#{userRank}</span>
            </p>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : leaderboard && leaderboard.entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">User</th>
                    {category === "earnings" && <th className="px-4 py-3 text-right">Earned</th>}
                    {category === "quality" && <th className="px-4 py-3 text-right">Quality</th>}
                    {category === "volume" && <th className="px-4 py-3 text-right">Recordings</th>}
                    {category === "streak" && <th className="px-4 py-3 text-right">Streak</th>}
                    <th className="px-4 py-3 text-right">Achievements</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.entries.map((entry) => (
                    <tr
                      key={entry.userId}
                      className={`border-t ${
                        entry.userId === address ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-bold">
                          {entry.rank <= 3 ? (
                            <span className="text-2xl">
                              {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                            </span>
                          ) : (
                            `#${entry.rank}`
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{entry.username}</td>
                      {category === "earnings" && (
                        <td className="px-4 py-3 text-right">
                          {formatTokens(entry.totalEarned)} tokens
                        </td>
                      )}
                      {category === "quality" && (
                        <td className="px-4 py-3 text-right">{entry.qualityScore.toFixed(1)}</td>
                      )}
                      {category === "volume" && (
                        <td className="px-4 py-3 text-right">{entry.recordingsCount}</td>
                      )}
                      {category === "streak" && (
                        <td className="px-4 py-3 text-right">{entry.streakDays} days</td>
                      )}
                      <td className="px-4 py-3 text-right">{entry.achievementCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">No data available</div>
          )}
        </div>

        {leaderboard && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Total participants: {leaderboard.totalParticipants} • Last updated:{" "}
            {new Date(leaderboard.lastUpdated).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
