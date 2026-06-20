/**
 * VOISSS Feature Flags
 *
 * Centralized control for platform features.
 * Allows us to disable gamification/engagement features while focusing
 * on core marketplace and agent infrastructure.
 *
 * Set via environment variables (server-side) or NEXT_PUBLIC_ (client-side).
 * All flags default to `false` (disabled) for a clean, focused experience.
 */

export interface FeatureFlags {
  /** Missions, $PAPAJAMS rewards, and bounty system */
  missions: boolean;
  /** Streaks, achievements, leaderboards */
  gamification: boolean;
  /** Referral codes and tracking */
  referrals: boolean;
  /** Voice assistant / Flutter Butler */
  butler: boolean;
  /** Content analysis, sentiment, humanity certificates */
  insights: boolean;
  /** Social sharing features */
  socialSharing: boolean;
  /** Newsletter signup */
  newsletter: boolean;
  /** ElevenLabs voice import from external accounts */
  elevenlabsImport: boolean;
}

const ENV = typeof process !== 'undefined' ? process.env : {};

export const PLATFORM_FEATURES: FeatureFlags = {
  missions: ENV.NEXT_PUBLIC_FEATURE_MISSIONS === 'true',
  gamification: ENV.NEXT_PUBLIC_FEATURE_GAMIFICATION === 'true',
  referrals: ENV.NEXT_PUBLIC_FEATURE_REFERRALS === 'true',
  butler: ENV.NEXT_PUBLIC_FEATURE_BUTLER === 'true',
  insights: ENV.NEXT_PUBLIC_FEATURE_INSIGHTS === 'true',
  socialSharing: ENV.NEXT_PUBLIC_FEATURE_SOCIAL_SHARING === 'true',
  newsletter: ENV.NEXT_PUBLIC_FEATURE_NEWSLETTER === 'true',
  elevenlabsImport: ENV.NEXT_PUBLIC_FEATURE_ELEVENLABS_IMPORT !== 'false',
};
