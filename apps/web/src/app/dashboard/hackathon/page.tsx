'use client';

/**
 * OWS Hackathon Dashboard
 * 
 * Real-time analytics dashboard showing:
 * - Multi-chain voice generation activity
 * - Revenue distribution by chain
 * - Top agents by usage
 * - Live activity feed
 */

import { useEffect, useState } from 'react';
import { Activity, TrendingUp, Users, DollarSign, Zap } from 'lucide-react';

interface ChainStats {
  chainId: string;
  chainName: string;
  chainType: string;
  requests: number;
  revenue: string;
  revenueWei: string;
  avgCost: string;
}

interface AgentStats {
  agentId: string;
  requests: number;
  revenue: string;
  lastSeen: string;
  chains: string[];
  reputation: number;
  trustScore: number;
}

interface RecentActivity {
  timestamp: string;
  agentId: string;
  chain: string;
  chainId: string;
  cost: string;
  characterCount: number;
  recordingId: string;
  reputation?: number;
}

interface Analytics {
  overview: {
    totalAgents: number;
    totalRequests24h: number;
    totalRevenue24h: string;
    totalRevenueWei24h: string;
    avgCostPerRequest: string;
    owsRequestsPercent: number;
  };
  byChain: ChainStats[];
  topAgents: AgentStats[];
  recentActivity: RecentActivity[];
  timeRange: {
    start: string;
    end: string;
  };
}

export default function HackathonDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/hackathon');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error || 'No data available'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">
            🔷 OWS Hackathon Dashboard
          </h1>
          <p className="text-gray-300">
            Real-time multi-chain voice generation analytics
          </p>
          <p className="text-sm text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Agents"
            value={analytics.overview.totalAgents.toString()}
            color="blue"
          />
          <StatCard
            icon={<Activity className="w-6 h-6" />}
            label="Requests (24h)"
            value={analytics.overview.totalRequests24h.toString()}
            color="green"
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Revenue (24h)"
            value={analytics.overview.totalRevenue24h}
            color="purple"
          />
          <StatCard
            icon={<Zap className="w-6 h-6" />}
            label="OWS Requests"
            value={`${analytics.overview.owsRequestsPercent}%`}
            color="yellow"
          />
        </div>

        {/* Chain Distribution */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Revenue by Chain
          </h2>
          
          {analytics.byChain.length === 0 ? (
            <p className="text-gray-400">No chain data yet</p>
          ) : (
            <div className="space-y-4">
              {analytics.byChain.map((chain) => (
                <ChainBar key={chain.chainId} chain={chain} />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Agents */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Top Agents</h2>
            
            {analytics.topAgents.length === 0 ? (
              <p className="text-gray-400">No agent data yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.topAgents.map((agent, index) => (
                  <div
                    key={agent.agentId}
                    className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-gray-500">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="text-white font-mono text-sm">
                          {agent.agentId}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            agent.trustScore >= 80 ? 'bg-green-500/20 text-green-400' :
                            agent.trustScore >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            Score: {agent.trustScore}
                          </span>
                          <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
                            Rep: {agent.reputation}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">
                          {agent.chains.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        {agent.requests} requests
                      </div>
                      <div className="text-sm text-gray-400">
                        {agent.revenue}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Live Activity</h2>
            
            {analytics.recentActivity.length === 0 ? (
              <p className="text-gray-400">No recent activity</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {analytics.recentActivity.map((activity, index) => (
                  <div
                    key={`${activity.recordingId}-${index}`}
                    className="p-3 bg-gray-700/30 rounded-lg text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-mono">
                        {activity.agentId}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-400">
                        {activity.chain}
                      </span>
                      {activity.reputation && (
                        <span className="text-gray-500">
                          Rep: {activity.reputation}
                        </span>
                      )}
                      <span className="text-green-400">
                        {activity.cost}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {activity.characterCount} characters
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/50',
    green: 'from-green-500/20 to-green-600/20 border-green-500/50',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/50',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm rounded-lg p-6 border`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="text-white">{icon}</div>
        <div className="text-gray-300 text-sm">{label}</div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}

// Chain Bar Component
function ChainBar({ chain }: { chain: ChainStats }) {
  const maxRevenue = 1000; // Will be calculated dynamically in real implementation
  const percentage = Math.min((parseFloat(chain.revenue) / maxRevenue) * 100, 100);

  const chainColors: Record<string, string> = {
    Base: 'bg-blue-500',
    Arbitrum: 'bg-purple-500',
    Optimism: 'bg-red-500',
    Polygon: 'bg-purple-600',
    Ethereum: 'bg-gray-400',
    Solana: 'bg-green-500',
    Cosmos: 'bg-indigo-500',
    TON: 'bg-cyan-500',
    'XRP Ledger': 'bg-blue-400',
  };

  const color = chainColors[chain.chainName] || 'bg-gray-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold">{chain.chainName}</span>
          <span className="text-xs text-gray-400 uppercase">{chain.chainType}</span>
        </div>
        <div className="text-right">
          <div className="text-white font-semibold">{chain.revenue}</div>
          <div className="text-xs text-gray-400">{chain.requests} requests</div>
        </div>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`${color} h-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-400 mt-1">
        Avg: {chain.avgCost} per request
      </div>
    </div>
  );
}
