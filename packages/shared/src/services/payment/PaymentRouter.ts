/**
 * Unified Payment Router
 *
 * Single entry point for all payments in VOISSS.
 * Routes to: prepaid credits, token-gated tiers, or x402 USDC.
 *
 * Core Principles:
 * - Single source of truth for payment logic
 * - USDC as standard unit of account
 * - Clear method priority: credits → tier → x402
 * - Graceful fallbacks
 */

import {
  PaymentRequest,
  PaymentResult,
  PaymentQuote,
  PaymentMethod,
  ServiceType,
  calculateServiceCost,
  formatUSDC,
  AgentCreditAccount,
  PaymentPreference,
  getPartnerTier,
} from './types';
import { getX402Client, X402PaymentPayload, X402PaymentRequirements } from './x402Client';
import { TokenTier } from '../../config/tokenAccess';
import { getTokenAccessService } from '../token/TokenAccessService';
import { RedisUsageTracker, InMemoryUsageTracker, getTracker } from './RedisUsageTracker';

// ============================================================================
// TIER-SERVICE MAPPING
// ============================================================================

/**
 * Which services are covered by each tier (no additional payment needed)
 */
const TIER_SERVICE_COVERAGE: Record<TokenTier, ServiceType[]> = {
  none: [],
  basic: ['voice_generation', 'voice_transformation', 'transcription'],
  pro: ['voice_generation', 'voice_transformation', 'dubbing', 'transcription', 'storage'],
  premium: [
    'voice_generation',
    'voice_transformation',
    'dubbing',
    'transcription',
    'storage',
    'video_export',
    'white_label_export',
  ],
};

/**
 * Daily usage limits per tier (resets every 24h)
 */
const TIER_DAILY_LIMITS: Record<TokenTier, Record<ServiceType, number>> = {
  none: {
    voice_generation: 0,
    voice_transformation: 0,
    dubbing: 0,
    transcription: 0,
    storage: 0,
    video_export: 0,
    nft_mint: 0,
    white_label_export: 0,
  },
  basic: {
    voice_generation: 10_000,
    voice_transformation: 300,
    dubbing: 0,
    transcription: 600,
    storage: 100_000_000,
    video_export: 0,
    nft_mint: 0,
    white_label_export: 0,
  },
  pro: {
    voice_generation: 100_000,
    voice_transformation: 3_600,
    dubbing: 600,
    transcription: 3_600,
    storage: 1_000_000_000,
    video_export: 0,
    nft_mint: 0,
    white_label_export: 0,
  },
  premium: {
    voice_generation: 1_000_000,
    voice_transformation: 36_000,
    dubbing: 3_600,
    transcription: 36_000,
    storage: 10_000_000_000,
    video_export: 100,
    nft_mint: 100,
    white_label_export: 100,
  },
};

// ============================================================================
// ASYNC USAGE HELPERS
// All usage calls go through async helpers - no silent sync/Redis mismatch
// ============================================================================

async function getUsage(address: string, service: string): Promise<number> {
  const t = getTracker();
  if (t instanceof RedisUsageTracker) {
    return t.getUsage(address, service);
  }
  return (t as InMemoryUsageTracker).getUsage(address, service);
}

async function recordUsage(address: string, service: string, amount: number): Promise<void> {
  const t = getTracker();
  if (t instanceof RedisUsageTracker) {
    await t.recordUsage(address, service, amount);
  } else {
    (t as InMemoryUsageTracker).recordUsage(address, service, amount);
  }
}

// ============================================================================
// CREDIT ACCOUNT STORE
//
// ⚠️  DEV-ONLY: This in-memory store is intentionally ephemeral for local
// development. In production, wire `CreditAccountStore` to the on-chain
// AgentRegistry contract (0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c) which
// already manages USDC credit balances durably on Base mainnet.
// The interface below is the contract that the on-chain adapter must satisfy.
// ============================================================================

export interface ICreditAccountStore {
  getAccount(address: string): Promise<AgentCreditAccount | null>;
  createAccount(address: string): Promise<AgentCreditAccount>;
  deductCredits(address: string, amount: bigint): Promise<boolean>;
  addCredits(address: string, amount: bigint): Promise<void>;
}

class InMemoryCreditAccountStore implements ICreditAccountStore {
  private accounts = new Map<string, AgentCreditAccount>();

  async getAccount(address: string): Promise<AgentCreditAccount | null> {
    return this.accounts.get(address.toLowerCase()) ?? null;
  }

  async createAccount(address: string): Promise<AgentCreditAccount> {
    const account: AgentCreditAccount = {
      address,
      usdcBalance: 0n,
      usdcLocked: 0n,
      totalSpent: 0n,
      lastTopUp: null,
      isActive: true,
    };
    this.accounts.set(address.toLowerCase(), account);
    return account;
  }

  async deductCredits(address: string, amount: bigint): Promise<boolean> {
    const account = await this.getAccount(address);
    if (!account || account.usdcBalance < amount) return false;
    account.usdcBalance -= amount;
    account.totalSpent += amount;
    this.accounts.set(address.toLowerCase(), account);
    return true;
  }

  async addCredits(address: string, amount: bigint): Promise<void> {
    const account = await this.getAccount(address);
    if (account) {
      account.usdcBalance += amount;
      account.lastTopUp = new Date();
      this.accounts.set(address.toLowerCase(), account);
    }
  }
}

// Default to in-memory; swap via setActiveCreditStore() at app bootstrap
let activeCreditStore: ICreditAccountStore = new InMemoryCreditAccountStore();

/**
 * Swap in a production-backed credit store (e.g. on-chain AgentRegistry adapter).
 * Call this once at app bootstrap before any payment is processed.
 */
export function setActiveCreditStore(store: ICreditAccountStore): void {
  activeCreditStore = store;
}

// ============================================================================
// PAYMENT ROUTER CLASS
// ============================================================================

export interface PaymentRouterConfig {
  preference: PaymentPreference;
  x402PayTo: string;
}

export class PaymentRouter {
  private config: PaymentRouterConfig;
  private x402Client = getX402Client();
  private tokenService = getTokenAccessService();

  constructor(config: PaymentRouterConfig) {
    this.config = config;
  }

  // ========================================================================
  // QUOTE GENERATION
  // ========================================================================

  async getQuote(
    userAddress: string,
    service: ServiceType,
    quantity: number
  ): Promise<PaymentQuote> {
    const tier = await this.getUserTier(userAddress);
    const { baseCost, discountedCost, discountPercent } = calculateServiceCost(service, quantity, tier, userAddress);
    const config = await this.getServiceCostConfig(service);

    const availableMethods: PaymentMethod[] = [];

    const credits = await this.getAvailableCredits(userAddress);
    if (credits >= discountedCost) availableMethods.push('credits');

    const tierCovers = await this.tierCoversService(tier, service, userAddress, quantity);
    if (tierCovers || discountedCost === 0n) availableMethods.push('tier');

    availableMethods.push('x402');

    const recommendedMethod = this.selectBestMethod(
      availableMethods,
      this.config.preference,
      credits,
      discountedCost,
      userAddress
    );

    return {
      service,
      quantity,
      baseCost,
      estimatedCost: discountedCost,
      unitCost: config.unitCost ?? 0n,
      discountPercent,
      availableMethods,
      recommendedMethod,
      creditsAvailable: credits,
      currentTier: tier,
      tierCoversService: tierCovers || discountedCost === 0n,
    };
  }

  // ========================================================================
  // PAYMENT PROCESSING
  // ========================================================================

  async process(request: PaymentRequest): Promise<PaymentResult> {
    const { userAddress, service, quantity } = request;
    const quote = await this.getQuote(userAddress, service, quantity);
    const cost = quote.estimatedCost;

    switch (quote.recommendedMethod) {
      case 'credits':
        return this.processCreditPayment(userAddress, quote.baseCost, cost, quote.discountPercent);
      case 'tier':
        return this.processTierAccess(userAddress, service, quantity, quote.baseCost);
      case 'x402':
        return {
          success: false,
          method: 'none',
          baseCost: quote.baseCost,
          cost,
          discountApplied: quote.discountPercent / 100,
          error: 'x402 payment requires client-side signing',
          fallbackAvailable: true,
        };
      default:
        return {
          success: false,
          method: 'none',
          baseCost: quote.baseCost,
          cost,
          error: 'No payment method available',
        };
    }
  }

  async processX402Payment(
    userAddress: string,
    service: ServiceType,
    quantity: number,
    payment: X402PaymentPayload,
    requirements: X402PaymentRequirements
  ): Promise<PaymentResult> {
    const tier = await this.getUserTier(userAddress);
    const { baseCost, discountedCost, discountPercent } = calculateServiceCost(service, quantity, tier, userAddress);

    const verification = await this.x402Client.verifyPayment(payment, requirements);

    if (!verification.success) {
      return {
        success: false,
        method: 'x402',
        baseCost,
        cost: discountedCost,
        discountApplied: discountPercent / 100,
        error: verification.error || 'Payment verification failed',
      };
    }

    await recordUsage(userAddress, service, quantity);

    return {
      success: true,
      method: 'x402',
      txHash: verification.txHash,
      baseCost,
      cost: discountedCost,
      discountApplied: discountPercent / 100,
    };
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private async getAvailableCredits(address: string): Promise<bigint> {
    const account = await activeCreditStore.getAccount(address);
    return account?.usdcBalance ?? 0n;
  }

  private async getUserTier(address: string): Promise<TokenTier> {
    try {
      const balances = await this.tokenService.getTokenBalances(address);
      return balances.tier;
    } catch {
      return 'none';
    }
  }

  private async getServiceCostConfig(service: ServiceType) {
    const { SERVICE_COSTS } = await import('./types');
    return SERVICE_COSTS[service];
  }

  private async tierCoversService(
    tier: TokenTier,
    service: ServiceType,
    address: string,
    quantity: number
  ): Promise<boolean> {
    const coveredServices = TIER_SERVICE_COVERAGE[tier];
    if (!coveredServices.includes(service)) return false;

    const currentUsage = await getUsage(address, service);
    const limit = TIER_DAILY_LIMITS[tier][service];
    return currentUsage + quantity <= limit;
  }

  private selectBestMethod(
    available: PaymentMethod[],
    preference: PaymentPreference,
    creditsAvailable: bigint,
    cost: bigint,
    address?: string
  ): PaymentMethod {
    if (cost === 0n && available.includes('tier')) return 'tier';

    switch (preference) {
      case 'credits_first':
        if (available.includes('credits')) return 'credits';
        if (available.includes('tier')) return 'tier';
        return 'x402';
      case 'tier_if_available':
        if (available.includes('tier')) return 'tier';
        if (available.includes('credits')) return 'credits';
        return 'x402';
      case 'x402_only':
        return 'x402';
      default:
        if (available.includes('credits')) return 'credits';
        if (available.includes('tier')) return 'tier';
        return 'x402';
    }
  }

  private async processCreditPayment(
    address: string,
    baseCost: bigint,
    discountedCost: bigint,
    discountPercent: number
  ): Promise<PaymentResult> {
    const success = await activeCreditStore.deductCredits(address, discountedCost);

    if (!success) {
      const available = await this.getAvailableCredits(address);
      return {
        success: false,
        method: 'credits',
        baseCost,
        cost: discountedCost,
        discountApplied: discountPercent / 100,
        error: `Insufficient credits. Required: ${formatUSDC(discountedCost)}, Available: ${formatUSDC(available)}`,
        fallbackAvailable: true,
      };
    }

    const remaining = await this.getAvailableCredits(address);
    return {
      success: true,
      method: 'credits',
      baseCost,
      cost: discountedCost,
      discountApplied: discountPercent / 100,
      remainingCredits: remaining,
    };
  }

  private async processTierAccess(
    address: string,
    service: ServiceType,
    quantity: number,
    baseCost: bigint
  ): Promise<PaymentResult> {
    const tier = await this.getUserTier(address);
    await recordUsage(address, service, quantity);
    return {
      success: true,
      method: 'tier',
      tier,
      baseCost,
      cost: 0n,
      discountApplied: 1.0,
    };
  }

  // ========================================================================
  // ADMIN METHODS
  // ========================================================================

  async depositCredits(address: string, amount: bigint): Promise<void> {
    let account = await activeCreditStore.getAccount(address);
    if (!account) account = await activeCreditStore.createAccount(address);
    await activeCreditStore.addCredits(address, amount);
  }

  async getCreditBalance(address: string): Promise<bigint> {
    return this.getAvailableCredits(address);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let paymentRouter: PaymentRouter | null = null;

export function getPaymentRouter(config?: PaymentRouterConfig): PaymentRouter {
  if (!paymentRouter) {
    paymentRouter = new PaymentRouter(config ?? {
      preference: 'credits_first',
      x402PayTo: process.env.X402_PAY_TO_ADDRESS ?? '',
    });
  }
  return paymentRouter;
}

export function createPaymentRouter(config: PaymentRouterConfig): PaymentRouter {
  return new PaymentRouter(config);
}

export function resetPaymentRouter(): void {
  paymentRouter = null;
}
