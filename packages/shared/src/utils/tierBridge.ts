/**
 * Tier Bridge — Single source of truth for tier system mapping.
 *
 * VOISSS has two complementary tier axes:
 *
 *   TokenTier   — blockchain holding tier (none/basic/pro/premium)
 *                 Derived from on-chain $VOISSS balance via TokenAccessService.
 *                 Used by: PaymentRouter, useStudioSettings, useTokenAccess.
 *
 *   UserTier    — session/freemium tier (guest/free/premium)
 *                 Derived from wallet connection + premium flag.
 *                 Used by: freemiumStore in web app.
 *
 * This module is the ONLY place that defines how they map to each other.
 * Import from here rather than duplicating enum values anywhere.
 */

import type { TokenTier } from '../config/tokenAccess';

// ─── UserTier ────────────────────────────────────────────────────────────────
// guest  = no wallet connected
// free   = wallet connected, no meaningful token balance
// premium = wallet connected + holds ≥ basic tier of $VOISSS

export type UserTier = 'guest' | 'free' | 'premium';

// ─── Mappings ─────────────────────────────────────────────────────────────────

/**
 * Maps a TokenTier (on-chain) to the equivalent UserTier (session).
 * "basic" or above → 'premium' in the freemium model.
 */
export const TOKEN_TIER_TO_USER_TIER: Record<TokenTier, UserTier> = {
  none: 'free',
  basic: 'premium',
  pro: 'premium',
  premium: 'premium',
};

/**
 * Derive a UserTier from connection state + on-chain token tier.
 * This is the canonical derivation function — use everywhere instead of
 * duplicating if/else chains.
 *
 * @param isConnected   - wallet is connected
 * @param tokenTier     - on-chain token holding tier (null = not yet loaded)
 */
export function deriveUserTier(
  isConnected: boolean,
  tokenTier: TokenTier | null
): UserTier {
  if (!isConnected) return 'guest';
  if (!tokenTier || tokenTier === 'none') return 'free';
  return TOKEN_TIER_TO_USER_TIER[tokenTier];
}

/**
 * Maps a UserTier back to the minimum TokenTier it implies.
 * Useful for feature-gate checks that only know about UserTier.
 */
export const USER_TIER_TO_MIN_TOKEN_TIER: Record<UserTier, TokenTier> = {
  guest: 'none',
  free: 'none',
  premium: 'basic',
};

/**
 * Returns true if a UserTier meets or exceeds the required UserTier.
 */
const USER_TIER_ORDER: Record<UserTier, number> = {
  guest: 0,
  free: 1,
  premium: 2,
};

export function userTierMeetsRequirement(
  current: UserTier,
  required: UserTier
): boolean {
  return USER_TIER_ORDER[current] >= USER_TIER_ORDER[required];
}

/**
 * Returns true if a TokenTier meets or exceeds the required TokenTier.
 */
const TOKEN_TIER_ORDER: Record<TokenTier, number> = {
  none: 0,
  basic: 1,
  pro: 2,
  premium: 3,
};

export function tokenTierMeetsRequirement(
  current: TokenTier,
  required: TokenTier
): boolean {
  return TOKEN_TIER_ORDER[current] >= TOKEN_TIER_ORDER[required];
}
