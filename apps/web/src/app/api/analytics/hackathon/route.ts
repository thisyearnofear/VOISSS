/**
 * Hackathon Analytics API
 * 
 * Provides real-time analytics for OWS multi-chain voice generation
 * Used by the hackathon dashboard to display:
 * - Total agents using the service
 * - Voice generations in last 24h
 * - Revenue by chain
 * - Top agents by usage
 * - Recent activity feed
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAgentEventHub, VOISSS_EVENT_TYPES } from '@voisss/shared/services/agent-event-hub';
import { formatUSDC } from '@voisss/shared';
import { getAgentSecurityService } from '@voisss/shared/services/agent-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChainStats {
  chainId: string;
  chainName: string;
  chainType: string;
  requests: number;
  revenue: string; // USDC formatted
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

interface HackathonAnalytics {
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

/**
 * GET /api/analytics/hackathon
 * 
 * Returns analytics for the hackathon dashboard
 */
export async function GET(req: NextRequest): Promise<NextResponse<HackathonAnalytics | { error: string }>> {
  try {
    const { searchParams } = new URL(req.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    
    // Get event hub for querying events
    const eventHub = getAgentEventHub();
    
    // Calculate time range
    const endTime = Date.now();
    const startTime = endTime - (hours * 60 * 60 * 1000);
    
    // Query voice generation completed events
    const allEvents = await eventHub.getEventHistory(
      VOISSS_EVENT_TYPES.VOICE_GENERATION_COMPLETED,
      1000 // Last 1000 events
    );
    
    // Filter events by time range
    const events = allEvents.filter(event => {
      const eventTime = event.timestamp || 0;
      return eventTime >= startTime && eventTime <= endTime;
    });

    // Process events into analytics
    const analytics = processEvents(events, startTime, endTime);
    
    return NextResponse.json(analytics);
    
  } catch (error) {
    console.error('Hackathon analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

/**
 * Process events into analytics data
 */
function processEvents(events: any[], startTime: number, endTime: number): HackathonAnalytics {
  const securityService = getAgentSecurityService();
  
  // Track unique agents
  const agentSet = new Set<string>();
  
  // Track by chain
  const chainMap = new Map<string, {
    chainName: string;
    chainType: string;
    requests: number;
    revenueWei: bigint;
  }>();
  
  // Track by agent
  const agentMap = new Map<string, {
    requests: number;
    revenueWei: bigint;
    lastSeen: number;
    chains: Set<string>;
  }>();
  
  // Recent activity
  const recentActivity: RecentActivity[] = [];
  
  // Total metrics
  let totalRequests = 0;
  let totalRevenueWei = 0n;
  let owsRequests = 0;
  
  // Process each event
  for (const event of events) {
    const data = event.data;
    
    // Skip if missing required data
    if (!data.agentId || !data.cost) continue;
    
    totalRequests++;
    const costWei = BigInt(data.cost);
    totalRevenueWei += costWei;
    
    // Track unique agents
    agentSet.add(data.agentId);
    
    // Check if OWS payment
    const isOWS = data.owsChainId || data.paymentMethod?.startsWith('ows-');
    if (isOWS) owsRequests++;
    
    // Get chain info
    const chainId = data.owsChainId || 'eip155:8453'; // Default to Base
    const chainName = data.owsChain || getChainName(chainId);
    const chainType = data.owsChainType || 'evm';
    
    // Update chain stats
    if (!chainMap.has(chainId)) {
      chainMap.set(chainId, {
        chainName,
        chainType,
        requests: 0,
        revenueWei: 0n,
      });
    }
    const chainStats = chainMap.get(chainId)!;
    chainStats.requests++;
    chainStats.revenueWei += costWei;
    
    // Update agent stats
    if (!agentMap.has(data.agentId)) {
      agentMap.set(data.agentId, {
        requests: 0,
        revenueWei: 0n,
        lastSeen: 0,
        chains: new Set(),
      });
    }
    const agentStats = agentMap.get(data.agentId)!;
    agentStats.requests++;
    agentStats.revenueWei += costWei;
    agentStats.lastSeen = Math.max(agentStats.lastSeen, event.timestamp || Date.now());
    agentStats.chains.add(chainName);
    
    // Add to recent activity (keep last 50)
    if (recentActivity.length < 50) {
      // Get agent profile for reputation
      const profile = (securityService as any).getOrCreateProfile?.(data.agentId);

      recentActivity.push({
        timestamp: new Date(event.timestamp || Date.now()).toISOString(),
        agentId: truncateAddress(data.agentId),
        chain: chainName,
        chainId,
        cost: formatUSDC(costWei),
        characterCount: data.characterCount || 0,
        recordingId: data.recordingId || '',
        reputation: profile?.reputation || 0,
      });
    }
  }
  
  // Sort recent activity by timestamp (newest first)
  recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Convert chain map to array and sort by revenue
  const byChain: ChainStats[] = Array.from(chainMap.entries())
    .map(([chainId, stats]) => ({
      chainId,
      chainName: stats.chainName,
      chainType: stats.chainType,
      requests: stats.requests,
      revenue: formatUSDC(stats.revenueWei),
      revenueWei: stats.revenueWei.toString(),
      avgCost: formatUSDC(stats.requests > 0 ? stats.revenueWei / BigInt(stats.requests) : 0n),
    }))
    .sort((a, b) => Number(BigInt(b.revenueWei) - BigInt(a.revenueWei)));
  
  // Convert agent map to array and get top 10
  const topAgents: AgentStats[] = Array.from(agentMap.entries())
    .map(([agentId, stats]) => {
      // Use full agentId if we can find it in profiles, or just use stats
      // Since agentId in map might be truncated if we were using it wrong, 
      // but here agentId is full address from data.agentId.
      const profile = (securityService as any).getOrCreateProfile?.(agentId);

      return {
        agentId: truncateAddress(agentId),
        requests: stats.requests,
        revenue: formatUSDC(stats.revenueWei),
        lastSeen: new Date(stats.lastSeen).toISOString(),
        chains: Array.from(stats.chains),
        reputation: profile?.reputation || 100,
        trustScore: profile?.trustScore || 50,
      };
    })
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);
  
  // Calculate overview
  const avgCostPerRequest = totalRequests > 0 
    ? totalRevenueWei / BigInt(totalRequests)
    : 0n;
  
  const owsRequestsPercent = totalRequests > 0
    ? Math.round((owsRequests / totalRequests) * 100)
    : 0;
  
  return {
    overview: {
      totalAgents: agentSet.size,
      totalRequests24h: totalRequests,
      totalRevenue24h: formatUSDC(totalRevenueWei),
      totalRevenueWei24h: totalRevenueWei.toString(),
      avgCostPerRequest: formatUSDC(avgCostPerRequest),
      owsRequestsPercent,
    },
    byChain,
    topAgents,
    recentActivity,
    timeRange: {
      start: new Date(startTime).toISOString(),
      end: new Date(endTime).toISOString(),
    },
  };
}

/**
 * Get chain name from chain ID
 */
function getChainName(chainId: string): string {
  const chainNames: Record<string, string> = {
    'eip155:1': 'Ethereum',
    'eip155:8453': 'Base',
    'eip155:42161': 'Arbitrum',
    'eip155:10': 'Optimism',
    'eip155:137': 'Polygon',
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': 'Solana',
    'cosmos:cosmoshub-4': 'Cosmos',
    'ton:mainnet': 'TON',
    'xrpl:mainnet': 'XRP Ledger',
  };
  
  return chainNames[chainId] || chainId;
}

/**
 * Truncate address for display
 */
function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
