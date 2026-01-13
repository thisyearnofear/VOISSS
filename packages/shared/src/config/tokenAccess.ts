/**
 * Unified Token Access Configuration
 * Single source of truth for $voisss holding tiers and burn actions
 * 
 * Design: Holding-first (no signing), burn-minimal (premium outputs only)
 */

export type TokenTier = 'none' | 'basic' | 'pro' | 'premium';

export interface TokenAccessConfig {
  symbol: string;
  decimals: number;
  tiers: Record<TokenTier, {
    minBalance: bigint;
    label: string;
    features: string[];
  }>;
  burnActions: {
    [key: string]: {
      cost: bigint;
      label: string;
      description: string;
    };
  };
}

/**
 * $VOISSS Token Configuration
 * Holding thresholds and burn actions
 */
export const VOISSS_TOKEN_ACCESS: TokenAccessConfig = {
  symbol: 'voisss',
  decimals: 18,

  // Holding tiers (no transaction signing required)
  tiers: {
    none: {
      minBalance: 0n,
      label: 'Freemium',
      features: [
        '1 free AI transform per session',
        'Basic recording capabilities',
        'Download/export to file',
        'VOISSS watermarked exports',
      ],
    },
    basic: {
      minBalance: BigInt('10000') * BigInt(10) ** BigInt(18), // 10k
      label: 'Basic',
      features: [
        'Unlimited AI transforms',
        'Dubbing in all languages',
        'Transcription & snippets',
        'Standard quality voices',
        'User attribution on exports',
      ],
    },
    pro: {
      minBalance: BigInt('50000') * BigInt(10) ** BigInt(18), // 50k
      label: 'Pro',
      features: [
        'All Basic features',
        'Priority processing queue',
        'Advanced voice selection',
        'Multi-language dubbing',
        'Standard on-chain saves',
        'Co-branded exports',
        'Custom styling options',
      ],
    },
    premium: {
      minBalance: BigInt('250000') * BigInt(10) ** BigInt(18), // 250k
      label: 'Premium',
      features: [
        'All Pro features',
        'VIP Lane mode (gasless saves)',
        'Creator tools & mission creation',
        'Premium voice models',
        'Batch operations',
        'White-label export eligibility',
        'Priority support',
      ],
    },
  },

  // Burn actions (transaction signing required, premium outputs only)
  burnActions: {
    video_export: {
      cost: BigInt('5000') * BigInt(10) ** BigInt(18), // 5k
      label: 'Video Export',
      description: 'Export recording as shareable transcript video',
    },
    nft_mint: {
      cost: BigInt('2000') * BigInt(10) ** BigInt(18), // 2k
      label: 'NFT Minting',
      description: 'Mint recording as on-chain artifact',
    },
    white_label_export: {
      cost: BigInt('10000') * BigInt(10) ** BigInt(18), // 10k
      label: 'White-Label Export',
      description: 'Remove VOISSS branding for commercial use',
    },
    batch_operation_overage: {
      cost: BigInt('1') * BigInt(10) ** BigInt(18), // 1 per transform
      label: 'Batch Operation Fee',
      description: 'Fee per transform beyond daily batch limit (100+/24h)',
    },
  },
};

/**
 * Get tier for a given balance
 */
export function getTierForBalance(balance: bigint): TokenTier {
  const tiers: TokenTier[] = ['premium', 'pro', 'basic', 'none'];

  for (const tier of tiers) {
    if (balance >= VOISSS_TOKEN_ACCESS.tiers[tier].minBalance) {
      return tier;
    }
  }

  return 'none';
}

/**
 * Check if balance meets minimum for tier
 */
export function meetsMinimumBalance(balance: bigint, tier: TokenTier): boolean {
  return balance >= VOISSS_TOKEN_ACCESS.tiers[tier].minBalance;
}

/**
 * Get minimum balance needed for tier (in base units)
 */
export function getMinBalanceForTier(tier: TokenTier): bigint {
  return VOISSS_TOKEN_ACCESS.tiers[tier].minBalance;
}

/**
 * Format balance for display (wei to decimal)
 */
export function formatTokenBalance(balance: bigint, decimals: number = 18): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const wholePart = balance / divisor;
  const fractionalPart = balance % divisor;

  if (fractionalPart === 0n) {
    return wholePart.toString();
  }

  const padded = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${wholePart}.${padded}`;
}

/**
 * Check if feature is available at tier
 */
export function canAccessFeature(tier: TokenTier, feature: string): boolean {
  const tierConfig = VOISSS_TOKEN_ACCESS.tiers[tier];
  return tierConfig.features.includes(feature);
}

/**
 * Get cost of burn action
 */
export function getBurnActionCost(action: string): bigint | null {
  const burnAction = VOISSS_TOKEN_ACCESS.burnActions[action];
  return burnAction ? burnAction.cost : null;
}
/**
 * Get available templates for user based on token tier
 */
export function getAvailableTemplates(
  tier: TokenTier,
  hasPapaJamsToken: boolean = false
): any[] {
  // Import here to avoid circular dependency
  const { DEFAULT_VOISSS_TEMPLATES } = require('../types/transcript');

  return DEFAULT_VOISSS_TEMPLATES.filter((template: any) => {
    if (!template.branding) return true; // No branding requirements

    // Special case for PapaJams holders - can access pro tier features
    if (hasPapaJamsToken && template.branding.requiredTier === 'pro') {
      return true;
    }

    // Check tier requirements
    const tierOrder: TokenTier[] = ['none', 'basic', 'pro', 'premium'];
    const userTierIndex = tierOrder.indexOf(tier);
    const requiredTierIndex = tierOrder.indexOf(template.branding.requiredTier);

    return userTierIndex >= requiredTierIndex;
  });
}

/**
 * Apply user branding to template
 */
export function applyUserBranding(
  template: any, // TranscriptTemplate
  userProfile: {
    username?: string;
    pfpUrl?: string;
    displayName?: string;
    tier: TokenTier;
    hasPapaJamsToken?: boolean;
  }
): any {
  if (!template.branding) return template;

  const branding = template.branding;
  const brandedTemplate = { ...template };

  // Adjust branding based on user tier and special tokens
  if (userProfile.hasPapaJamsToken) {
    // PapaJams creators get special treatment
    brandedTemplate.branding = {
      ...branding,
      watermark: {
        ...branding.watermark,
        voisssBrandingSize: 'minimal',
        userAttributionSize: 'large',
      },
    };
  } else if (userProfile.tier === 'premium') {
    // Premium users get white-label styling
    brandedTemplate.branding = {
      ...branding,
      watermark: {
        ...branding.watermark,
        voisssBrandingSize: 'minimal',
        userAttributionSize: 'large',
      },
    };
  } else if (userProfile.tier === 'pro') {
    // Pro users get co-branded styling
    brandedTemplate.branding = {
      ...branding,
      watermark: {
        ...branding.watermark,
        voisssBrandingSize: 'standard',
        userAttributionSize: 'medium',
      },
    };
  }

  // Add user profile data for rendering
  brandedTemplate.userProfile = {
    username: userProfile.username,
    pfpUrl: userProfile.pfpUrl,
    displayName: userProfile.displayName || userProfile.username || 'User',
    badges: getUserBadges(userProfile),
  };

  return brandedTemplate;
}

/**
 * Get user badges for display
 */
function getUserBadges(userProfile: {
  tier: TokenTier;
  hasPapaJamsToken?: boolean;
}): string[] {
  const badges: string[] = [];

  if (userProfile.hasPapaJamsToken) {
    badges.push('PapaJams Creator');
  }

  if (userProfile.tier === 'premium') {
    badges.push('VOISSS Premium');
  } else if (userProfile.tier === 'pro') {
    badges.push('VOISSS Pro');
  }

  return badges;
}