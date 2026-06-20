import { describe, it, expect } from 'vitest';
import {
  calculateServiceCost,
  SERVICE_COSTS,
  formatUSDC,
  parseUSDC,
  priceStringToUSDC,
} from './types';

describe('calculateServiceCost', () => {
  it('calculates cost for voice_generation per character', () => {
    const result = calculateServiceCost('voice_generation', 1000);
    expect(result.baseCost).toBe(1000n); // 1000 * 1n = 1000 USDC wei = $0.001
    expect(result.discountedCost).toBe(1000n);
    expect(result.discountPercent).toBe(0);
  });

  it('applies minimum cost for small quantities', () => {
    const result = calculateServiceCost('voice_generation', 1);
    expect(result.baseCost).toBe(10n); // minCost = 10 USDC wei
  });

  it('applies maximum cost for large quantities', () => {
    const result = calculateServiceCost('voice_generation', 1_000_000);
    expect(result.baseCost).toBe(10000n); // maxCost = 10,000 USDC wei = $0.01
  });

  it('applies tier discount', () => {
    const result = calculateServiceCost('voice_generation', 1000, 'pro');
    expect(result.discountPercent).toBe(25);
    expect(result.discountedCost).toBe(750n); // 1000 - 25%
  });

  it('premium tier gets 50% discount', () => {
    const result = calculateServiceCost('voice_generation', 1000, 'premium');
    expect(result.discountPercent).toBe(50);
    expect(result.discountedCost).toBe(500n);
  });

  it('whitelisted address gets 100% discount', () => {
    const result = calculateServiceCost(
      'voice_generation',
      1000,
      'none',
      '0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c',
    );
    expect(result.discountPercent).toBe(100);
    expect(result.discountedCost).toBe(0n);
  });

  it('video_export is a fixed cost', () => {
    const result = calculateServiceCost('video_export', 1);
    expect(result.baseCost).toBe(500000n); // $0.50
  });

  it('voice_generation with basic tier gets 10% discount', () => {
    const result = calculateServiceCost('voice_generation', 1000, 'basic');
    expect(result.discountedCost).toBe(900n);
  });
});

describe('formatUSDC', () => {
  it('formats whole dollars', () => {
    expect(formatUSDC(1000000n)).toBe('$1');
  });

  it('formats micro amounts', () => {
    expect(formatUSDC(1n)).toBe('$0.000001');
  });

  it('formats mixed amounts', () => {
    expect(formatUSDC(1500000n)).toBe('$1.5');
  });

  it('handles zero', () => {
    expect(formatUSDC(0n)).toBe('$0');
  });
});

describe('parseUSDC', () => {
  it('parses whole dollar', () => {
    expect(parseUSDC('1')).toBe(1000000n);
  });

  it('parses decimal', () => {
    expect(parseUSDC('1.50')).toBe(1500000n);
  });

  it('parses micro amounts', () => {
    expect(parseUSDC('0.000001')).toBe(1n);
  });

  it('parses zero', () => {
    expect(parseUSDC('0')).toBe(0n);
  });
});

describe('priceStringToUSDC', () => {
  it('parses $ prefix', () => {
    expect(priceStringToUSDC('$0.01')).toBe(10000n);
  });

  it('parses without prefix', () => {
    expect(priceStringToUSDC('0.01')).toBe(10000n);
  });

  it('handles empty string', () => {
    expect(priceStringToUSDC('')).toBe(0n);
  });
});

describe('SERVICE_COSTS voice_generation pricing', () => {
  const vg = SERVICE_COSTS.voice_generation;
  it('has correct base cost', () => {
    expect(vg.unitCost).toBe(1n); // $0.000001 per char
  });

  it('has sane minimum', () => {
    expect(vg.minCost).toBe(10n); // $0.00001
  });

  it('has sane maximum', () => {
    expect(vg.maxCost).toBe(10000n); // $0.01
  });
});
