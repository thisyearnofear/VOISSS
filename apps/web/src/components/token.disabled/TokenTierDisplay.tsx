'use client';

import { TokenTier, VOISSS_TOKEN_ACCESS, formatTokenBalance } from '@voisss/shared/config/tokenAccess';
import { Crown, Zap, Lock } from 'lucide-react';

interface TokenTierDisplayProps {
  tier: TokenTier;
  balance?: bigint;
  showFeatures?: boolean;
  compact?: boolean;
}

const TIER_COLORS: Record<TokenTier, { bg: string; border: string; text: string; icon: string }> = {
  none: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    text: 'text-gray-400',
    icon: 'Lock',
  },
  basic: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    icon: 'Zap',
  },
  pro: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: 'Zap',
  },
  premium: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    icon: 'Crown',
  },
};

/**
 * Display user's current token tier and features
 * Shows which features are unlocked at their tier
 */
export function TokenTierDisplay({
  tier,
  balance,
  showFeatures = false,
  compact = false,
}: TokenTierDisplayProps) {
  const tierConfig = VOISSS_TOKEN_ACCESS.tiers[tier];
  const colors = TIER_COLORS[tier];

  if (compact) {
    return (
      <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${colors.bg} ${colors.border} ${colors.text}`}>
        {tierConfig.label}
        {balance && (
          <span className="ml-1 opacity-70">
            ({formatTokenBalance(balance, VOISSS_TOKEN_ACCESS.decimals)})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${colors.bg} ${colors.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className={`text-lg font-bold ${colors.text}`}>{tierConfig.label} Tier</h3>
          {balance && (
            <p className="text-sm text-gray-400 mt-1">
              Balance: {formatTokenBalance(balance, VOISSS_TOKEN_ACCESS.decimals)} $voisss
            </p>
          )}
        </div>
        {tier === 'premium' && <Crown className={`w-5 h-5 ${colors.text}`} />}
        {tier === 'pro' && <Zap className={`w-5 h-5 ${colors.text}`} />}
        {tier === 'basic' && <Zap className={`w-5 h-5 ${colors.text}`} />}
        {tier === 'none' && <Lock className="w-5 h-5 text-gray-500" />}
      </div>

      {showFeatures && tierConfig.features.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">Features</p>
          <ul className="space-y-1">
            {tierConfig.features.map((feature, idx) => (
              <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                <span className={`text-lg leading-none mt-0.5 ${colors.text}`}>✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Display all tiers as a comparison/upgrade guide
 */
export function TokenTierComparison() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {(['none', 'basic', 'pro', 'premium'] as TokenTier[]).map((tier) => (
        <TokenTierDisplay key={tier} tier={tier} showFeatures={true} />
      ))}
    </div>
  );
}
