import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';

export interface ReputationMetrics {
  totalJobs: number;
  completedJobs: number;
  rejectedJobs: number;
  totalEarningsUSDC: number;
  averageRating: number;
  lastJobAt: string;
  successRate: number;
}

export interface ReputationProfile {
  agentId: string;
  metrics: ReputationMetrics;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  history: Array<{
    jobId: string;
    status: 'completed' | 'rejected' | 'disputed';
    rating?: number;
    timestamp: string;
  }>;
}

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum'] as const;

function computeTier(metrics: ReputationMetrics): ReputationProfile['tier'] {
  if (metrics.completedJobs > 100 && metrics.successRate > 95) return 'platinum';
  if (metrics.completedJobs > 50 && metrics.successRate > 90) return 'gold';
  if (metrics.completedJobs > 10 && metrics.successRate > 80) return 'silver';
  return 'bronze';
}

export class AgentReputationService {
  private profiles = new Map<string, ReputationProfile>();
  private storagePath: string;

  constructor(storagePath?: string) {
    this.storagePath = storagePath || join(process.cwd(), '.data', 'reputation.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (existsSync(this.storagePath)) {
        const raw = readFileSync(this.storagePath, 'utf-8');
        const data = JSON.parse(raw) as Record<string, ReputationProfile>;
        for (const [id, profile] of Object.entries(data)) {
          this.profiles.set(id, profile);
        }
      }
    } catch (error) {
      console.error('[Reputation] Failed to load profiles from disk:', error);
    }
  }

  private saveToDisk(): void {
    try {
      const dir = dirname(this.storagePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const data: Record<string, ReputationProfile> = {};
      for (const [id, profile] of this.profiles) {
        data[id] = profile;
      }
      writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[Reputation] Failed to save profiles to disk:', error);
    }
  }

  getProfile(agentId: string): ReputationProfile {
    let profile = this.profiles.get(agentId);
    if (!profile) {
      profile = {
        agentId,
        metrics: {
          totalJobs: 0,
          completedJobs: 0,
          rejectedJobs: 0,
          totalEarningsUSDC: 0,
          averageRating: 0,
          lastJobAt: new Date().toISOString(),
          successRate: 0,
        },
        tier: 'bronze',
        history: [],
      };
      this.profiles.set(agentId, profile);
    }
    return profile;
  }

  recordJobEvent(agentId: string, event: {
    jobId: string;
    status: 'completed' | 'rejected' | 'disputed';
    earning?: number;
    rating?: number;
  }): void {
    const profile = this.getProfile(agentId);
    const { metrics } = profile;

    metrics.totalJobs++;
    if (event.status === 'completed') {
      metrics.completedJobs++;
      metrics.totalEarningsUSDC += event.earning || 0;
    } else if (event.status === 'rejected') {
      metrics.rejectedJobs++;
    }

    if (event.rating && metrics.completedJobs > 0) {
      const totalRatings = metrics.completedJobs;
      metrics.averageRating = ((metrics.averageRating * (totalRatings - 1)) + event.rating) / totalRatings;
    }

    metrics.successRate = metrics.totalJobs > 0
      ? (metrics.completedJobs / metrics.totalJobs) * 100
      : 0;
    metrics.lastJobAt = new Date().toISOString();

    const newTier = computeTier(metrics);
    const oldTierIdx = TIER_ORDER.indexOf(profile.tier);
    const newTierIdx = TIER_ORDER.indexOf(newTier);
    if (newTierIdx !== oldTierIdx) {
      const direction = newTierIdx > oldTierIdx ? 'promoted' : 'demoted';
      console.log(`[Reputation] Agent ${agentId} ${direction}: ${profile.tier} -> ${newTier}`);
      profile.tier = newTier;
    }

    profile.history.push({
      jobId: event.jobId,
      status: event.status,
      rating: event.rating,
      timestamp: metrics.lastJobAt,
    });

    if (profile.history.length > 100) {
      profile.history.shift();
    }

    console.log(`[Reputation] Updated ${agentId}: Success Rate ${metrics.successRate.toFixed(1)}% | Tier ${profile.tier.toUpperCase()}`);
    this.saveToDisk();
  }
}

let reputationInstance: AgentReputationService | null = null;

export function getAgentReputationService(storagePath?: string): AgentReputationService {
  if (!reputationInstance) {
    reputationInstance = new AgentReputationService(storagePath);
  }
  return reputationInstance;
}
