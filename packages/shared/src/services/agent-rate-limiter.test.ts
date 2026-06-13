/**
 * AgentRateLimiter — covers the in-memory fallback path.
 *
 * The burst window (10s, with a small burstSize) is more restrictive
 * than the per-minute request limit, so for tight-loop tests the burst
 * check fires first. We use vi.useFakeTimers() to advance the clock
 * past the burst window when we want to exercise the per-minute
 * limit directly.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AgentRateLimiter, getAgentRateLimiter } from './agent-rate-limiter';

describe('AgentRateLimiter — burst check', () => {
  let limiter: AgentRateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new AgentRateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows up to burstSize requests within the burst window', async () => {
    const config = limiter['limits'].unregistered;
    for (let i = 0; i < config.burstSize; i++) {
      const r = await limiter.checkLimits('agent-burst', 'unregistered', { characters: 1 });
      expect(r.allowed).toBe(true);
    }
  });

  it('rejects the request that exceeds burstSize within the window', async () => {
    const config = limiter['limits'].unregistered;
    for (let i = 0; i < config.burstSize; i++) {
      await limiter.checkLimits('agent-burst', 'unregistered', { characters: 1 });
    }
    const over = await limiter.checkLimits('agent-burst', 'unregistered', { characters: 1 });
    expect(over.allowed).toBe(false);
    expect(over.reason).toMatch(/Burst/i);
    expect(over.retryAfter).toBeGreaterThan(0);
  });

  it('allows another request after the burst window passes', async () => {
    const config = limiter['limits'].unregistered;
    for (let i = 0; i < config.burstSize; i++) {
      await limiter.checkLimits('agent-burst', 'unregistered', { characters: 1 });
    }
    // Advance past the burst window (10s).
    vi.advanceTimersByTime(config.burstWindowMs + 1);
    const after = await limiter.checkLimits('agent-burst', 'unregistered', { characters: 1 });
    expect(after.allowed).toBe(true);
  });
});

describe('AgentRateLimiter — per-minute request limit (after burst window)', () => {
  let limiter: AgentRateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new AgentRateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects once the per-minute request limit is hit, after the burst window has expired', async () => {
    const config = limiter['limits'].unregistered;
    const window = config.burstWindowMs;
    let allowedCount = 0;
    let deniedAt: number | null = null;

    for (let i = 0; i < config.requestsPerMinute + 1; i++) {
      // Move the clock past the burst window between requests so
      // burst does not short-circuit. This is artificial, but it's
      // the only way to exercise the per-minute check in unit time.
      vi.advanceTimersByTime(window + 1);
      const r = await limiter.checkLimits('agent-min', 'unregistered', { characters: 1 });
      if (r.allowed) allowedCount++;
      else if (deniedAt === null) deniedAt = i;
    }
    expect(allowedCount).toBe(config.requestsPerMinute);
    expect(deniedAt).toBe(config.requestsPerMinute);
  });
});

describe('AgentRateLimiter — character budget', () => {
  let limiter: AgentRateLimiter;

  beforeEach(() => {
    limiter = new AgentRateLimiter();
  });

  it('rejects when the per-minute character budget is exhausted', async () => {
    const config = limiter['limits'].unregistered;
    // First request consumes the full character budget.
    const first = await limiter.checkLimits('agent-chars', 'unregistered', {
      characters: config.maxCharactersPerMinute,
    });
    expect(first.allowed).toBe(true);
    // Second request, even with one more character, should be denied.
    const second = await limiter.checkLimits('agent-chars', 'unregistered', { characters: 1 });
    expect(second.allowed).toBe(false);
    expect(second.reason).toMatch(/Character/i);
  });
});

describe('AgentRateLimiter — cost budget', () => {
  let limiter: AgentRateLimiter;

  beforeEach(() => {
    limiter = new AgentRateLimiter();
  });

  it('rejects when the per-minute cost budget is exhausted', async () => {
    const config = limiter['limits'].unregistered;
    const first = await limiter.checkLimits('agent-cost', 'unregistered', {
      cost: config.maxCostPerMinute,
    });
    expect(first.allowed).toBe(true);
    const second = await limiter.checkLimits('agent-cost', 'unregistered', { cost: 1n });
    expect(second.allowed).toBe(false);
    expect(second.reason).toMatch(/Cost/i);
  });
});

describe('AgentRateLimiter — per-agent isolation', () => {
  let limiter: AgentRateLimiter;

  beforeEach(() => {
    limiter = new AgentRateLimiter();
  });

  it('does not let one agent consume another agent\'s budget', async () => {
    const config = limiter['limits'].unregistered;
    // Exhaust agent-a.
    const r = await limiter.checkLimits('agent-a', 'unregistered', {
      characters: config.maxCharactersPerMinute,
    });
    expect(r.allowed).toBe(true);
    // Agent-b should still be allowed.
    const other = await limiter.checkLimits('agent-b', 'unregistered', { characters: 10 });
    expect(other.allowed).toBe(true);
  });
});

describe('AgentRateLimiter — tier-based limits', () => {
  let limiter: AgentRateLimiter;

  beforeEach(() => {
    limiter = new AgentRateLimiter();
  });

  it('premium has higher limits than unregistered', () => {
    const prem = limiter['limits'].premium;
    const unreg = limiter['limits'].unregistered;
    expect(prem.burstSize).toBeGreaterThan(unreg.burstSize);
    expect(prem.requestsPerMinute).toBeGreaterThan(unreg.requestsPerMinute);
    expect(prem.maxCharactersPerMinute).toBeGreaterThan(unreg.maxCharactersPerMinute);
    expect(prem.maxCostPerMinute).toBeGreaterThan(unreg.maxCostPerMinute);
  });

  it('verified is more permissive than registered which is more permissive than unregistered', () => {
    const l = limiter['limits'];
    expect(l.verified.requestsPerMinute).toBeGreaterThan(l.registered.requestsPerMinute);
    expect(l.registered.requestsPerMinute).toBeGreaterThan(l.unregistered.requestsPerMinute);
  });
});

describe('AgentRateLimiter — result envelope', () => {
  it('returns the configured limits in the result envelope and the rate-limit headers', async () => {
    const limiter = new AgentRateLimiter();
    const res = await limiter.checkLimits('agent-envelope', 'unregistered', { characters: 10 });
    expect(res.limits.requests.max).toBe(limiter['limits'].unregistered.requestsPerMinute);
    expect(res.limits.requests.window).toBe('minute');
    expect(res.headers['X-RateLimit-Requests-Limit']).toBeDefined();
    expect(res.headers['X-RateLimit-Cost-Limit']).toBeDefined();
    expect(res.headers['X-RateLimit-Characters-Limit']).toBeDefined();
  });
});

describe('AgentRateLimiter — singleton (getAgentRateLimiter)', () => {
  it('returns the same instance for repeated calls', () => {
    const a = getAgentRateLimiter();
    const b = getAgentRateLimiter();
    expect(a).toBe(b);
  });
});
