/**
 * Payment Services - Unified Exports
 * 
 * Single entry point for all payment functionality in VOISSS.
 * 
 * Usage:
 *   import { PaymentRouter, getQuote, formatUSDC } from '@voisss/shared/payment';
 *   
 *   const router = getPaymentRouter({ preference: 'credits_first', x402PayTo: '0x...' });
 *   const quote = await router.getQuote(userAddress, 'voice_generation', 1000);
 *   const result = await router.process({ userAddress, service: 'voice_generation', quantity: 1000 });
 */

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export {
  // Types
  type PaymentMethod,
  type ServiceType,
  type ServiceCost,
  type PaymentRequest,
  type PaymentResult,
  type PaymentQuote,
  type AgentCreditAccount,
  type PaymentPreference,
  type X402PaymentConfig,
  
  // Constants
  USDC_DECIMALS,
  USDC_ADDRESS,
  SERVICE_COSTS,
  DEFAULT_X402_CONFIG,
  PaymentRequestSchema,
  PaymentQuoteSchema,
  
  // Utilities
  calculateServiceCost,
  formatUSDC,
  parseUSDC,
  priceStringToUSDC,
} from './types';

// ============================================================================
// X402 CLIENT
// ============================================================================

export {
  X402Client,
  X402_CONSTANTS,
  getX402Client,
  createX402Client,
  resetX402Client,
  
  // Types
  type X402Config,
  type X402PaymentRequirements,
  type X402PaymentPayload,
  
  // Server helpers
  createPaymentRequiredResponse,
  parsePaymentHeader,
  createPaymentSuccessResponse,
} from './x402Client';

// ============================================================================
// PAYMENT ROUTER
// ============================================================================

export {
  PaymentRouter,
  getPaymentRouter,
  createPaymentRouter,
  resetPaymentRouter,
  type PaymentRouterConfig,
} from './PaymentRouter';
