/**
 * Token Service Exports
 * 
 * Centralized exports for token-related services
 * 
 * @deprecated Use '@voisss/shared/payment' for all payment-related functionality
 */

export { TokenAccessService, getTokenAccessService, createTokenAccessService } from './TokenAccessService';
export type {
    TokenBalances,
    EligibilityResult,
    AccessResult,
    TierBenefits,
} from './TokenAccessService';

// Re-export payment services for convenience
// For new code, prefer importing from '@voisss/shared/payment'
export * from '../payment';