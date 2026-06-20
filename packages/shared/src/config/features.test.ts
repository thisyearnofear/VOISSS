import { describe, it, expect } from 'vitest';
import { PLATFORM_FEATURES } from './features';

describe('Platform feature flags', () => {
  it('gamification is disabled by default', () => {
    expect(PLATFORM_FEATURES.gamification).toBe(false);
  });

  it('missions are disabled by default', () => {
    expect(PLATFORM_FEATURES.missions).toBe(false);
  });

  it('referrals are disabled by default', () => {
    expect(PLATFORM_FEATURES.referrals).toBe(false);
  });

  it('butler is disabled by default', () => {
    expect(PLATFORM_FEATURES.butler).toBe(false);
  });

  it('insights are disabled by default', () => {
    expect(PLATFORM_FEATURES.insights).toBe(false);
  });

  it('social sharing is disabled by default', () => {
    expect(PLATFORM_FEATURES.socialSharing).toBe(false);
  });

  it('newsletter is disabled by default', () => {
    expect(PLATFORM_FEATURES.newsletter).toBe(false);
  });

  it('elevenlabs import is enabled by default', () => {
    expect(PLATFORM_FEATURES.elevenlabsImport).toBe(true);
  });
});
