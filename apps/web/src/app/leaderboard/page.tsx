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
    <div className="min-h-screen bg-[#0A0A0A] voisss-bg-grid voisss-bg-noise text-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 voisss-gradient-text">Leaderboard</h1>

        {/* Filters — sharp inline */}
        <div className="flex flex-wrap gap-6 mb-8 pb-4 border-b border-[#2A2A2A]">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Leaderboard["period"])}
              className="bg-[#0A0A0A] border border-[#2A2A2A] text-white rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#3A3A3A]"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="all-time">All Time</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Leaderboard["category"])}
              className="bg-[#0A0A0A] border border-[#2A2A2A] text-white rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#3A3A3A]"
            >
              <option value="earnings">Earnings</option>
              <option value="quality">Quality</option>
              <option value="volume">Volume</option>
              <option value="streak">Streak</option>
            </select>
          </div>
        </div>

        {/* User Rank — sharp accent bar */}
        {userRank && (
          <div className="border-l-2 border-l-indigo-500 bg-indigo-500/5 px-5 py-3 mb-6">
            <p className="text-sm text-white">
              Your Rank: <span className="text-indigo-400 font-mono font-bold text-lg">#{userRank}</span>
            </p>
          </div>
        )}

        {/* Leaderboard Table — terminal style, no card wrapper */}
        <div className="border border-[#2A2A2A] rounded-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : leaderboard && leaderboard.entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0A0A0A]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">#</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">User</th>
                    {category === "earnings" && <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Earned</th>}
                    {category === "quality" && <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Quality</th>}
                    {category === "volume" && <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recordings</th>}
                    {category === "streak" && <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Streak</th>}
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Achievements</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.entries.map((entry) => (
                    <tr
                      key={entry.userId}
                      className={`border-t border-[#1A1A1A] transition-colors hover:bg-white/[0.02] ${
                        entry.userId === address ? "bg-indigo-500/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-bold">
                          {entry.rank <= 3 ? (
                            <span className="text-2xl">
                              {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                            </span>
                          ) : (
                            <span className="text-gray-500 font-mono text-sm">{entry.rank}</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-white text-sm font-mono">{entry.username}</td>
                      {category === "earnings" && (
                        <td className="px-4 py-3 text-right text-gray-300 font-mono text-sm">
                          {formatTokens(entry.totalEarned)}
                        </td>
                      )}
                      {category === "quality" && (
                        <td className="px-4 py-3 text-right text-gray-300 font-mono text-sm">{entry.qualityScore.toFixed(1)}</td>
                      )}
                      {category === "volume" && (
                        <td className="px-4 py-3 text-right text-gray-300 font-mono text-sm">{entry.recordingsCount}</td>
                      )}
                      {category === "streak" && (
                        <td className="px-4 py-3 text-right text-gray-300 font-mono text-sm">{entry.streakDays}d</td>
                      )}
                      <td className="px-4 py-3 text-right text-gray-300 font-mono text-sm">{entry.achievementCount}</td>
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
          <p className="text-xs text-gray-600 mt-4 text-center font-mono">
            {leaderboard.totalParticipants} participants &middot; updated {new Date(leaderboard.lastUpdated).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
