/**
 * Unified Payment Types
 * 
 * Single source of truth for all payment-related types.
 * Supports: prepaid credits, token-gated tiers, and x402 USDC payments.
 * 
 * Design Principles:
 * - USDC is the standard unit of account (6 decimals)
 * - All costs normalized to USDC for comparison
 * - Clear separation between payment methods
 */

import { z } from 'zod';
import { TokenTier } from '../../config/tokenAccess';

// ============================================================================
// PAYMENT METHOD ENUMS
// ============================================================================

export type PaymentMethod = 'credits' | 'tier' | 'x402' | 'none';

export type ServiceType = 
  | 'voice_generation' 
  | 'voice_transformation' 
  | 'dubbing' 
  | 'transcription'
  | 'storage'
  | 'video_export'
  | 'nft_mint'
  | 'white_label_export';

// ============================================================================
// USDC CONSTANTS
// ============================================================================

export const USDC_DECIMALS = 6;
export const USDC_ADDRESS = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  baseSepolia: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
} as const;

// ============================================================================
// COST CONFIGURATION
// ============================================================================

// ============================================================================
// TIERED PRICING & DISCOUNTS
// ============================================================================

/**
 * Discounts applied to service costs based on token tier.
 * Higher tiers get deeper discounts for services not already covered.
 */
export const TIER_DISCOUNTS: Record<TokenTier, number> = {
  none: 0,        // 0% discount
  basic: 0.1,     // 10% discount
  pro: 0.25,      // 25% discount
  premium: 0.5,   // 50% discount
};

/**
 * Addresses whitelisted for free platform use (beta testers, owners, etc.)
 * Returns 100% discount regardless of tier.
 */
export const WHITELISTED_ADDRESSES = new Set([
  '0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c'.toLowerCase(), // Owner/Platform address
  '0x1234567890123456789012345678901234567890'.toLowerCase(), // Test address
  '0x55A5705453Ee82c742274154136Fce8149597058'.toLowerCase(), // New Whitelisted Address
]);

export interface ServiceCost {
  service: ServiceType;
  baseCost: bigint; // in USDC wei (6 decimals)
  unit: 'fixed' | 'per_character' | 'per_second' | 'per_request';
  unitCost?: bigint; // for per-unit pricing
  minCost?: bigint;
  maxCost?: bigint;
}

// Service costs in USDC (6 decimals)
export const SERVICE_COSTS: Record<ServiceType, ServiceCost> = {
  voice_generation: {
    service: 'voice_generation',
    baseCost: 0n,
    unit: 'per_character',
    unitCost: 1n, // $0.000001 per character (1 micro-USDC)
    minCost: 100n, // $0.0001 minimum
    maxCost: 100000n, // $0.10 maximum per request
  },
  voice_transformation: {
    service: 'voice_transformation',
    baseCost: 1000n, // $0.001 base
    unit: 'per_second',
    unitCost: 10n, // $0.00001 per second
    minCost: 1000n,
    maxCost: 50000n,
  },
  dubbing: {
    service: 'dubbing',
    baseCost: 5000n, // $0.005 base
    unit: 'per_second',
    unitCost: 50n, // $0.00005 per second
    minCost: 5000n,
    maxCost: 100000n,
  },
  transcription: {
    service: 'transcription',
    baseCost: 0n,
    unit: 'per_second',
    unitCost: 1n, // $0.000001 per second
    minCost: 100n,
    maxCost: 50000n,
  },
  storage: {
    service: 'storage',
    baseCost: 0n,
    unit: 'fixed',
    minCost: 0n,
    maxCost: 0n, // Included in other services
  },
  video_export: {
    service: 'video_export',
    baseCost: 500000n, // $0.50 base
    unit: 'fixed',
    minCost: 500000n,
    maxCost: 500000n,
  },
  nft_mint: {
    service: 'nft_mint',
    baseCost: 200000n, // $0.20 base
    unit: 'fixed',
    minCost: 200000n,
    maxCost: 200000n,
  },
  white_label_export: {
    service: 'white_label_export',
    baseCost: 1000000n, // $1.00 base
    unit: 'fixed',
    minCost: 1000000n,
    maxCost: 1000000n,
  },
};

// ============================================================================
// PAYMENT REQUEST/RESPONSE TYPES
// ============================================================================

export interface PaymentRequest {
  userAddress: string;
  service: ServiceType;
  quantity: number; // characters, seconds, or 1 for fixed
  metadata?: {
    recordingId?: string;
    agentAddress?: string;
    voiceId?: string;
    [key: string]: any;
  };
}

export interface PaymentResult {
  success: boolean;
  method: PaymentMethod;
  txHash?: string;
  remainingCredits?: bigint; // in USDC wei
  tier?: TokenTier;
  baseCost: bigint; // original cost before discount
  cost: bigint; // actual cost paid (after discount)
  discountApplied?: number; // decimal (0.25 = 25%)
  error?: string;
  fallbackAvailable?: boolean;
}

export interface PaymentQuote {
  service: ServiceType;
  quantity: number;
  baseCost: bigint; // original cost before discount
  estimatedCost: bigint; // actual cost after discount
  unitCost: bigint;
  discountPercent: number; // percentage (25 = 25%)
  availableMethods: PaymentMethod[];
  recommendedMethod: PaymentMethod;
  // Method-specific details
  creditsAvailable?: bigint;
  currentTier?: TokenTier;
  tierCoversService?: boolean;
}

// ============================================================================
// PREPAID CREDITS TYPES
// ============================================================================

export interface AgentCreditAccount {
  address: string;
  usdcBalance: bigint; // in USDC wei
  usdcLocked: bigint;
  totalSpent: bigint;
  lastTopUp: Date | null;
  isActive: boolean;
}

export type PaymentPreference = 'credits_first' | 'x402_only' | 'tier_if_available';

// ============================================================================
// X402-SPECIFIC TYPES
// ============================================================================

export interface X402PaymentConfig {
  facilitatorUrl: string;
  network: 'base' | 'base-sepolia';
  usdcAddress: string;
  maxTimeoutSeconds: number;
}

export const DEFAULT_X402_CONFIG: X402PaymentConfig = {
  facilitatorUrl: 'https://x402.org/facilitator',
  network: 'base',
  usdcAddress: USDC_ADDRESS.base,
  maxTimeoutSeconds: 60,
};

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const PaymentRequestSchema = z.object({
  userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  service: z.enum([
    'voice_generation',
    'voice_transformation',
    'dubbing',
    'transcription',
    'storage',
    'video_export',
    'nft_mint',
    'white_label_export',
  ]),
  quantity: z.number().int().positive(),
  metadata: z.record(z.any()).optional(),
});

export const PaymentQuoteSchema = z.object({
  service: z.string(),
  quantity: z.number(),
  baseCost: z.string(),
  estimatedCost: z.string(), // bigint as string
  unitCost: z.string(),
  discountPercent: z.number(),
  availableMethods: z.array(z.enum(['credits', 'tier', 'x402', 'none'])),
  recommendedMethod: z.enum(['credits', 'tier', 'x402', 'none']),
  creditsAvailable: z.string().optional(),
  currentTier: z.enum(['none', 'basic', 'pro', 'premium']).optional(),
  tierCoversService: z.boolean().optional(),
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate service cost in USDC wei
 */
export function calculateServiceCost(
  service: ServiceType,
  quantity: number,
  tier: TokenTier = 'none',
  address?: string
): { baseCost: bigint; discountedCost: bigint; discountPercent: number } {
  const config = SERVICE_COSTS[service];
  if (!config) return { baseCost: 0n, discountedCost: 0n, discountPercent: 0 };

  let cost = config.baseCost;

  if (config.unit !== 'fixed' && config.unitCost) {
    cost += config.unitCost * BigInt(quantity);
  }

  // Apply min/max bounds
  if (config.minCost && cost < config.minCost) {
    cost = config.minCost;
  }
  if (config.maxCost && cost > config.maxCost) {
    cost = config.maxCost;
  }

  // Check whitelist first (100% discount)
  if (address && WHITELISTED_ADDRESSES.has(address.toLowerCase())) {
    return {
      baseCost: cost,
      discountedCost: 0n,
      discountPercent: 100,
    };
  }

  // Apply discount based on tier
  const discountRate = TIER_DISCOUNTS[tier];
  const discountAmount = (cost * BigInt(Math.floor(discountRate * 100))) / 100n;
  const discountedCost = cost - discountAmount;

  return {
    baseCost: cost,
    discountedCost,
    discountPercent: Math.floor(discountRate * 100),
  };
}

/**
 * Format USDC amount for display (wei to decimal)
 */
export function formatUSDC(amount: bigint): string {
  const divisor = BigInt(10) ** BigInt(USDC_DECIMALS);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  
  if (fraction === 0n) {
    return `$${whole.toString()}`;
  }
  
  const fractionStr = fraction.toString().padStart(USDC_DECIMALS, '0').replace(/0+$/, '');
  return `$${whole.toString()}.${fractionStr}`;
}

/**
 * Parse USDC amount from decimal string to wei
 */
export function parseUSDC(amount: string): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(USDC_DECIMALS, '0').slice(0, USDC_DECIMALS);
  return BigInt(whole) * BigInt(10) ** BigInt(USDC_DECIMALS) + BigInt(paddedFraction);
}

/**
 * Convert price string (e.g., "$0.01") to USDC wei
 */
export function priceStringToUSDC(price: string): bigint {
  const match = price.match(/\$?([\d.]+)/);
  if (!match) return 0n;
  return parseUSDC(match[1]);
}
