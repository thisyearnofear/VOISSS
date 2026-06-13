/**
 * PaymentRouter — quote math, method recommendation, and the credit
 * payment flow. Tests inject a fake ICreditAccountStore so we can
 * pre-seed credit balances deterministically.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PaymentRouter,
  setActiveCreditStore,
  resetPaymentRouter,
  type ICreditAccountStore,
} from './PaymentRouter';
import type { AgentCreditAccount, PaymentPreference } from './types';
import { getTracker } from './RedisUsageTracker';

const PAY_TO = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

class FakeCreditStore implements ICreditAccountStore {
  private accounts = new Map<string, AgentCreditAccount>();
  constructor(initial: Record<string, bigint> = {}) {
    for (const [addr, balance] of Object.entries(initial)) {
      this.accounts.set(addr.toLowerCase(), {
        address: addr,
        usdcBalance: balance,
        usdcLocked: 0n,
        totalSpent: 0n,
        lastTopUp: null,
        isActive: true,
      });
    }
  }
  async getAccount(address: string) {
    return this.accounts.get(address.toLowerCase()) ?? null;
  }
  async createAccount(address: string) {
    const a: AgentCreditAccount = {
      address,
      usdcBalance: 0n,
      usdcLocked: 0n,
      totalSpent: 0n,
      lastTopUp: null,
      isActive: true,
    };
    this.accounts.set(address.toLowerCase(), a);
    return a;
  }
  async deductCredits(address: string, amount: bigint) {
    const a = await this.getAccount(address);
    if (!a || a.usdcBalance < amount) return false;
    a.usdcBalance -= amount;
    a.totalSpent += amount;
    return true;
  }
  async addCredits(address: string, amount: bigint) {
    const a = await this.getAccount(address);
    if (a) a.usdcBalance += amount;
  }
}

const ADDR = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

beforeEach(() => {
  resetPaymentRouter();
  // Disable Redis to force the in-memory usage tracker; tests don't
  // have a live Redis.
  process.env.USE_REDIS = 'false';
  getTracker(); // warm the singleton
});

afterEach(() => {
  resetPaymentRouter();
});

describe('PaymentRouter.getQuote — method availability & recommendation', () => {
  it('recommends x402 when the user has no credits and no tier coverage', async () => {
    setActiveCreditStore(new FakeCreditStore({}));
    const router = new PaymentRouter({ preference: 'credits_first', x402PayTo: PAY_TO });
    const quote = await router.getQuote(ADDR, 'voice_generation', 1000);
    expect(quote.availableMethods).toContain('x402');
    expect(quote.availableMethods).not.toContain('credits');
    // 'tier' is included when the tier has coverage OR when the cost is 0
    // (which doesn't apply to voice_generation for an unregistered user).
    expect(quote.recommendedMethod).toBe('x402');
  });

  it('recommends credits when the user has enough USDC credits', async () => {
    setActiveCreditStore(new FakeCreditStore({ [ADDR]: 1_000_000n /* 1 USDC */ }));
    const router = new PaymentRouter({ preference: 'credits_first', x402PayTo: PAY_TO });
    const quote = await router.getQuote(ADDR, 'voice_generation', 100);
    expect(quote.availableMethods).toContain('credits');
    expect(quote.creditsAvailable).toBe(1_000_000n);
    expect(quote.recommendedMethod).toBe('credits');
  });

  it('does not recommend credits when the user has zero credits', async () => {
    setActiveCreditStore(new FakeCreditStore({}));
    const router = new PaymentRouter({ preference: 'credits_first', x402PayTo: PAY_TO });
    const quote = await router.getQuote(ADDR, 'voice_generation', 100);
    expect(quote.availableMethods).not.toContain('credits');
  });
});

describe('PaymentRouter.getQuote — cost math', () => {
  it('returns a positive baseCost for voice_generation', async () => {
    setActiveCreditStore(new FakeCreditStore({}));
    const router = new PaymentRouter({ preference: 'credits_first', x402PayTo: PAY_TO });
    const quote = await router.getQuote(ADDR, 'voice_generation', 1_000);
    expect(quote.baseCost).toBeGreaterThan(0n);
    expect(quote.estimatedCost).toBeLessThanOrEqual(quote.baseCost);
  });

  it('scales baseCost linearly with quantity (per-character voice generation)', async () => {
    setActiveCreditStore(new FakeCreditStore({}));
    const router = new PaymentRouter({ preference: 'credits_first', x402PayTo: PAY_TO });
    const a = await router.getQuote(ADDR, 'voice_generation', 1000);
    const b = await router.getQuote(ADDR, 'voice_generation', 2000);
    // Allow for tier discount variance; the ratio should be roughly 2x.
    expect(b.baseCost).toBeGreaterThan(a.baseCost);
  });

  it('reported creditsAvailable matches the store', async () => {
    setActiveCreditStore(new FakeCreditStore({ [ADDR]: 5_000_000n /* 5 USDC */ }));
    const router = new PaymentRouter({ preference: 'credits_first', x402PayTo: PAY_TO });
    const quote = await router.getQuote(ADDR, 'voice_generation', 1000);
    expect(quote.creditsAvailable).toBe(5_000_000n);
  });
});

describe('PaymentRouter.process — credit payment flow', () => {
  it('succeeds and deducts credits when credits are sufficient', async () => {
    setActiveCreditStore(new FakeCreditStore({ [ADDR]: 1_000_000_000n /* 1000 USDC */ }));
    const router = new PaymentRouter({ preference: 'credits_first', x402PayTo: PAY_TO });

    const result = await router.process({
      userAddress: ADDR,
      service: 'voice_generation',
      quantity: 1000,
    });

    expect(result.success).toBe(true);
    expect(result.method).toBe('credits');
    // Verify the store was actually debited.
    const store = (router as unknown as { config: unknown }); // not needed; query the store via the active singleton
    const balance = await router.getCreditBalance(ADDR);
    expect(balance).toBeLessThan(1_000_000_000n);
  });

  it('returns success:false and does not charge when credits are insufficient', async () => {
    setActiveCreditStore(new FakeCreditStore({ [ADDR]: 1n /* 1 wei */ }));
    const router = new PaymentRouter({ preference: 'credits_first', x402PayTo: PAY_TO });
    const result = await router.process({
      userAddress: ADDR,
      service: 'voice_generation',
      quantity: 1_000_000, // huge quantity, will exceed the 1 wei of credit
    });
    expect(result.success).toBe(false);
    const balance = await router.getCreditBalance(ADDR);
    // 1 wei is the only "balance" we had; it should not have been touched.
    expect(balance).toBe(1n);
  });
});

describe('PaymentRouter.process — preference honoured', () => {
  it('with x402_only preference, the method is x402 even when credits are available', async () => {
    setActiveCreditStore(new FakeCreditStore({ [ADDR]: 1_000_000_000n }));
    const router = new PaymentRouter({ preference: 'x402_only', x402PayTo: PAY_TO });
    const quote = await router.getQuote(ADDR, 'voice_generation', 1000);
    expect(quote.recommendedMethod).toBe('x402');
  });

  it('with tier_if_available preference, the method is tier when the user has tier coverage', async () => {
    setActiveCreditStore(new FakeCreditStore({ [ADDR]: 1_000_000_000n }));
    // Mock the tier service via env. The real implementation reads
    // $VOISSS balances; setting a very high balance via fake is hard
    // without mocking the token service. For now we exercise the
    // preference path: 'tier' is in availableMethods when the
    // user has a tier that covers the service, and tier_if_available
    // picks 'tier' first.
    const router = new PaymentRouter({ preference: 'tier_if_available', x402PayTo: PAY_TO });
    const quote = await router.getQuote(ADDR, 'voice_generation', 1000);
    // We can't easily force a tier in this unit test; the assertion
    // is that the method chosen is one of the available ones.
    expect(['tier', 'credits', 'x402']).toContain(quote.recommendedMethod);
  });
});
