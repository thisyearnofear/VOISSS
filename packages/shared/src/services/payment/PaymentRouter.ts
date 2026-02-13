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
  USDC_DECIMALS,
} from './types';
import { getX402Client, X402PaymentPayload, X402PaymentRequirements } from './x402Client';
import { TokenTier, VOISSS_TOKEN_ACCESS } from '../../config/tokenAccess';
import { getTokenAccessService } from '../token/TokenAccessService';

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
    voice_generation: 10_000, // 10k characters
    voice_transformation: 300, // 5 minutes
    dubbing: 0, // Not included
    transcription: 600, // 10 minutes
    storage: 100_000_000, // 100MB
    video_export: 0,
    nft_mint: 0,
    white_label_export: 0,
  },
  pro: {
    voice_generation: 100_000, // 100k characters
    voice_transformation: 3_600, // 1 hour
    dubbing: 600, // 10 minutes
    transcription: 3_600, // 1 hour
    storage: 1_000_000_000, // 1GB
    video_export: 0,
    nft_mint: 0,
    white_label_export: 0,
  },
  premium: {
    voice_generation: 1_000_000, // 1M characters
    voice_transformation: 36_000, // 10 hours
    dubbing: 3_600, // 1 hour
    transcription: 36_000, // 10 hours
    storage: 10_000_000_000, // 10GB
    video_export: 100, // 100 exports
    nft_mint: 100, // 100 mints
    white_label_export: 100, // 100 exports
  },
};

// ============================================================================
// USAGE TRACKING (Simple in-memory, replace with Redis in production)
// ============================================================================

type UsageKey = `${string}:${string}:${string}`; // address:service:date

class UsageTracker {
  private usage = new Map<UsageKey, number>();
  private readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  getUsage(address: string, service: ServiceType): number {
    const date = new Date().toISOString().split('T')[0];
    const key: UsageKey = `${address.toLowerCase()}:${service}:${date}`;
    return this.usage.get(key) ?? 0;
  }

  recordUsage(address: string, service: ServiceType, amount: number): void {
    const date = new Date().toISOString().split('T')[0];
    const key: UsageKey = `${address.toLowerCase()}:${service}:${date}`;
    const current = this.usage.get(key) ?? 0;
    this.usage.set(key, current + amount);
    
    // Cleanup old entries periodically (simplified)
    if (Math.random() < 0.01) {
      this.cleanup();
    }
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.TTL_MS;
    // In production, use Redis with TTL instead
    // This is a simplified implementation
  }
}

const usageTracker = new UsageTracker();

// ============================================================================
// CREDIT ACCOUNT STORE (Replace with database in production)
// ============================================================================

class CreditAccountStore {
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
    if (!account || account.usdcBalance < amount) {
      return false;
    }
    
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

const creditStore = new CreditAccountStore();

// ============================================================================
// PAYMENT ROUTER CLASS
// ============================================================================

export interface PaymentRouterConfig {
  preference: PaymentPreference;
  x402PayTo: string; // Address to receive x402 payments
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

  /**
   * Get a quote for a service before paying
   * Determines available payment methods and recommends the best one
   */
  async getQuote(
    userAddress: string,
    service: ServiceType,
    quantity: number
  ): Promise<PaymentQuote> {
    const tier = await this.getUserTier(userAddress);
    const { baseCost, discountedCost, discountPercent } = calculateServiceCost(service, quantity, tier, userAddress);
    const config = await this.getServiceCostConfig(service);

    // Check all available methods
    const availableMethods: PaymentMethod[] = [];
    
    // 1. Check credits
    const credits = await this.getAvailableCredits(userAddress);
    if (credits >= discountedCost) {
      availableMethods.push('credits');
    }

    // 2. Check tier coverage (free usage)
    const tierCovers = this.tierCoversService(tier, service, userAddress, quantity);
    if (tierCovers || discountedCost === 0n) {
      availableMethods.push('tier');
    }

    // 3. x402 is always available as fallback (if they have USDC)
    availableMethods.push('x402');

    // Determine recommended method based on preference
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

  /**
   * Process a payment using the best available method
   */
  async process(request: PaymentRequest): Promise<PaymentResult> {
    const { userAddress, service, quantity } = request;
    
    // Get quote to determine best method and discounted cost
    const quote = await this.getQuote(userAddress, service, quantity);
    const cost = quote.estimatedCost;

    // Try methods in priority order
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

  /**
   * Process a payment with x402 (server-side verification)
   * Call this after client has signed and sent the payment
   */
  async processX402Payment(
    userAddress: string,
    service: ServiceType,
    quantity: number,
    payment: X402PaymentPayload,
    requirements: X402PaymentRequirements
  ): Promise<PaymentResult> {
    const tier = await this.getUserTier(userAddress);
    const { baseCost, discountedCost, discountPercent } = calculateServiceCost(service, quantity, tier, userAddress);

    // Verify payment with facilitator
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

    // Record usage for tracking
    usageTracker.recordUsage(userAddress, service, quantity);

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
    const account = await creditStore.getAccount(address);
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

  private tierCoversService(
    tier: TokenTier,
    service: ServiceType,
    address: string,
    quantity: number
  ): boolean {
    // Check if service is in tier coverage
    const coveredServices = TIER_SERVICE_COVERAGE[tier];
    if (!coveredServices.includes(service)) {
      return false;
    }

    // Check daily usage limits
    const currentUsage = usageTracker.getUsage(address, service);
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
    // If cost is 0 (whitelisted or tier covered), always prefer tier
    if (cost === 0n && available.includes('tier')) {
      return 'tier';
    }

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
        // Default: credits → tier → x402
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
    const success = await creditStore.deductCredits(address, discountedCost);
    
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
    
    // Record the usage
    usageTracker.recordUsage(address, service, quantity);

    return {
      success: true,
      method: 'tier',
      tier,
      baseCost,
      cost: 0n, // No direct cost for tier access
      discountApplied: 1.0, // 100% discount
    };
  }

  // ========================================================================
  // ADMIN METHODS (for credit management)
  // ========================================================================

  async depositCredits(address: string, amount: bigint): Promise<void> {
    let account = await creditStore.getAccount(address);
    if (!account) {
      account = await creditStore.createAccount(address);
    }
    await creditStore.addCredits(address, amount);
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

// Reset singleton (useful for testing)
export function resetPaymentRouter(): void {
  paymentRouter = null;
}
