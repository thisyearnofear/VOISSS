import { describe, expect, it } from 'vitest';
import type { MarketplaceVoice } from '@/lib/marketplace-indexer';
import {
  DEMO_VOICES,
  formatMonthlyPriceUsdc,
  formatPerCharacterRate,
  isEvmAddress,
  voiceDisplayName,
  voiceSpecRows,
} from '@/lib/voice-detail';

function makeVoice(overrides: Partial<MarketplaceVoice> = {}): MarketplaceVoice {
  return {
    id: 'voice-1',
    contractVoiceId: 'contract-1',
    contributorAddress: '0x1234567890abcdef1234567890abcdef12345678',
    price: '1000000',
    licenseType: 'non-exclusive',
    voiceProfile: {},
    metadata: {},
    stats: { views: 0, purchases: 0, usageCount: 0 },
    status: 'approved',
    trust: {
      badge: 'Verified',
      status: 'verified',
      source: 'catalog',
      details: 'details',
    },
    provenance: { source: 'catalog' },
    ...overrides,
  };
}

describe('formatMonthlyPriceUsdc', () => {
  it('converts micro-USDC to a fixed two-decimal dollar string', () => {
    expect(formatMonthlyPriceUsdc('1000000')).toBe('1.00');
    expect(formatMonthlyPriceUsdc('2500000')).toBe('2.50');
    expect(formatMonthlyPriceUsdc('1')).toBe('0.00');
  });

  it('falls back to 0.00 for garbage, empty, and negative input', () => {
    expect(formatMonthlyPriceUsdc('')).toBe('0.00');
    expect(formatMonthlyPriceUsdc('abc')).toBe('0.00');
    expect(formatMonthlyPriceUsdc('-5')).toBe('0.00');
  });
});

describe('formatPerCharacterRate', () => {
  it('preserves the display special case for the 1-micro-USDC floor', () => {
    expect(formatPerCharacterRate('1')).toBe('0.000001');
  });

  it('derives the rate from the monthly price otherwise', () => {
    expect(formatPerCharacterRate('1000000')).toBe('0.1000000');
    expect(formatPerCharacterRate('20000000')).toBe('2.0000000');
  });

  it('falls back to zero for garbage, empty, and negative input', () => {
    expect(formatPerCharacterRate('')).toBe('0.0000000');
    expect(formatPerCharacterRate('abc')).toBe('0.0000000');
    expect(formatPerCharacterRate('-5')).toBe('0.0000000');
  });
});

describe('isEvmAddress', () => {
  it('accepts 40-hex 0x-prefixed addresses in either case', () => {
    expect(isEvmAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
    expect(isEvmAddress('0xABCDEF1234567890ABCDEF1234567890ABCDEF12')).toBe(true);
  });

  it('rejects placeholders, short strings, and non-hex input', () => {
    expect(isEvmAddress('0xDEMO')).toBe(false);
    expect(isEvmAddress('0x1234')).toBe(false);
    expect(isEvmAddress('1234567890abcdef1234567890abcdef12345678')).toBe(false);
    expect(isEvmAddress('')).toBe(false);
  });
});

describe('voiceDisplayName', () => {
  it('prefers the metadata title and falls back to the id', () => {
    expect(voiceDisplayName(makeVoice({ metadata: { title: 'Rachel' } }))).toBe('Rachel');
    expect(voiceDisplayName(makeVoice())).toBe('voice-1');
  });
});

describe('voiceSpecRows', () => {
  it('falls back to catalog defaults for missing profile fields', () => {
    const rows = voiceSpecRows(makeVoice());
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));
    expect(byLabel['Language']).toBe('English');
    expect(byLabel['Accent']).toBe('Neutral');
    expect(byLabel['License']).toBe('Non-exclusive');
    expect(byLabel['Monthly']).toBe('$1.00/mo');
    expect(byLabel['Per character']).toBe('$0.1000000');
    expect(byLabel['Tone']).toBeUndefined();
    expect(byLabel['Pitch']).toBeUndefined();
  });

  it('includes tone and pitch only when present, and renders exclusive licenses', () => {
    const rows = voiceSpecRows(
      makeVoice({
        licenseType: 'exclusive',
        voiceProfile: { tone: 'Warm', pitch: 'Low' },
      })
    );
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));
    expect(byLabel['Tone']).toBe('Warm');
    expect(byLabel['Pitch']).toBe('Low');
    expect(byLabel['License']).toBe('Exclusive');
  });
});

describe('DEMO_VOICES', () => {
  it('keys match voice ids and every entry is a complete marketplace voice', () => {
    for (const [key, voice] of Object.entries(DEMO_VOICES)) {
      expect(voice.id).toBe(key);
      expect(voice.contractVoiceId.length).toBeGreaterThan(0);
      expect(voice.status).toBe('approved');
      expect(voice.trust.badge.length).toBeGreaterThan(0);
      expect(voice.provenance.source).toBeDefined();
      expect(voice.metadata?.title?.length).toBeGreaterThan(0);
    }
  });

  it('contains the three curated demo voices', () => {
    expect(Object.keys(DEMO_VOICES).sort()).toEqual([
      'demo-antoni',
      'demo-bella',
      'demo-rachel',
    ]);
  });
});
