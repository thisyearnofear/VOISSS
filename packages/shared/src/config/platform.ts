/**
 * Platform Configuration
 * Centralized settings for mission creation, rewards, and creator requirements
 * 
 * Note: Token access tiers are defined in tokenAccess.ts (holds $voisss)
 * $papajams is used here for mission creator minimum and reward distribution
 */

export interface PapajamsTokenConfig {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  chain: 'base' | 'starknet';
}

export interface CreatorRequirements {
  minTokenBalance: bigint; // in token units (not wei/smallest unit)
  minTokenDecimals: number; // for display purposes
}

export interface RewardStructure {
  fixedPerMission: number; // fixed reward amount per mission in tokens
  milestoneDistribution: {
    [key: string]: number; // percentage of reward pool for each milestone
  };
}

export interface MissionConfig {
  maxDuration: number; // seconds
  minDuration: number; // seconds
  defaultExpirationDays: number;
  maxParticipants: number;
  autoPublish: boolean; // missions are published immediately after creation
}

export interface PlatformConfigType {
  papajamsToken: PapajamsTokenConfig;
  creatorRequirements: CreatorRequirements;
  rewards: RewardStructure;
  missions: MissionConfig;
  environment: 'development' | 'staging' | 'production';
}

/**
 * Platform Configuration - Centrally managed
 * Change token/requirements here instead of scattered throughout the codebase
 */
export const PLATFORM_CONFIG: PlatformConfigType = {
  papajamsToken: {
    symbol: process.env.NEXT_PUBLIC_REWARD_TOKEN_SYMBOL || 'papajams',
    address: (process.env.NEXT_PUBLIC_REWARD_TOKEN_ADDRESS || '0x2e9be99b199c874bd403f1b70fcaa9f11f47b96c') as `0x${string}`,
    decimals: parseInt(process.env.NEXT_PUBLIC_REWARD_TOKEN_DECIMALS || '18'),
    chain: 'base',
  },
  creatorRequirements: {
    minTokenBalance: BigInt(process.env.NEXT_PUBLIC_CREATOR_MIN_BALANCE || '1000000'), // 1M papajams by default
    minTokenDecimals: parseInt(process.env.NEXT_PUBLIC_REWARD_TOKEN_DECIMALS || '18'),
  },
  rewards: {
    fixedPerMission: parseInt(process.env.NEXT_PUBLIC_FIXED_REWARD_PER_MISSION || '10'), // 10 tokens
    milestoneDistribution: {
      'submission': 0.5,      // 50% for completing and submitting
      'quality_approved': 0.3, // 30% for passing quality threshold
      'featured': 0.2,        // 20% bonus if featured in highlight reel
    },
  },
  missions: {
    maxDuration: 600,        // 10 minutes max
    minDuration: 30,         // 30 seconds min
    defaultExpirationDays: 14,
    maxParticipants: 100,
    autoPublish: true,
  },
  environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
};

/**
 * Utility function to get reward amount for specific milestone
 */
export function getRewardForMilestone(
  milestone: keyof typeof PLATFORM_CONFIG.rewards.milestoneDistribution
): number {
  const percentage = PLATFORM_CONFIG.rewards.milestoneDistribution[milestone];
  return Math.floor(PLATFORM_CONFIG.rewards.fixedPerMission * percentage);
}

/**
 * Validate if address has enough tokens to create mission
 */
export function meetsCreatorRequirements(tokenBalance: bigint): boolean {
  return tokenBalance >= PLATFORM_CONFIG.creatorRequirements.minTokenBalance;
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: number | bigint): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  const divisor = Math.pow(10, PLATFORM_CONFIG.papajamsToken.decimals);
  return (num / divisor).toFixed(2);
}

/**
 * Get display symbol with prefix
 */
export function getTokenDisplaySymbol(): string {
  return `$${PLATFORM_CONFIG.papajamsToken.symbol}`;
}

/**
 * Calculate reward based on engagement metrics
 * Base reward + bonuses for views, likes, comments
 * 
 * Formula:
 * - Base: mission.baseReward
 * - Per view: 0.001 tokens (100 views = 0.1 tokens)
 * - Per like: 0.05 tokens (20 likes = 1 token)
 * - Per comment: 0.1 tokens (10 comments = 1 token)
 */
export function calculateEngagementReward(
  baseReward: number,
  views: number = 0,
  likes: number = 0,
  comments: number = 0
): number {
  const viewBonus = Math.floor(views * 0.001);
  const likeBonus = Math.floor(likes * 0.05);
  const commentBonus = Math.floor(comments * 0.1);
  
  return baseReward + viewBonus + likeBonus + commentBonus;
}

/**
 * Calculate split between $papajams and $voisss based on mission reward
 * 70% $papajams (creator stake), 30% $voisss (platform)
 */
export function calculateRewardSplit(totalReward: number): {
  papajams: number;
  voisss: number;
} {
  const papajams = Math.floor(totalReward * 0.7);
  const voisss = Math.floor(totalReward * 0.3);
  
  return { papajams, voisss };
}
