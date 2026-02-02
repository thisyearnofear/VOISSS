/**
 * Unified Payments Hook
 * 
 * Replaces useX402Payments with a comprehensive payment solution.
 * Supports: prepaid credits, token-gated tiers, and x402 USDC payments.
 * 
 * Core Principles:
 * - Single hook for all payment methods
 * - USDC as standard unit of account
 * - Automatic method selection based on availability
 * - Graceful fallbacks
 * 
 * @example
 * const { quote, pay, isLoading } = usePayments({
 *   service: 'voice_generation',
 *   quantity: 1000,
 * });
 * 
 * // Get quote first
 * const paymentQuote = await quote();
 * 
 * // Pay using best method
 * const result = await pay();
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { useBaseAccount } from "./useBaseAccount";
import { 
  PaymentQuote,
  PaymentResult,
  ServiceType,
  formatUSDC,
  calculateServiceCost,
  X402PaymentPayload,
  X402PaymentRequirements,
} from "@voisss/shared";

// ============================================================================
// TYPES
// ============================================================================

export interface UsePaymentsOptions {
  service: ServiceType;
  quantity: number;
  autoQuote?: boolean;
  metadata?: Record<string, any>;
}

export interface UsePaymentsState {
  // Loading states
  isLoading: boolean;
  isQuoting: boolean;
  isPaying: boolean;
  
  // Data
  quote: PaymentQuote | null;
  lastResult: PaymentResult | null;
  error: Error | null;
  
  // Actions
  getQuote: () => Promise<PaymentQuote | null>;
  pay: (methodOverride?: 'credits' | 'tier' | 'x402') => Promise<PaymentResult>;
  reset: () => void;
  
  // Helpers
  formatCost: (amount: bigint) => string;
  canPayWithoutX402: boolean;
}

// ============================================================================
// X402 CLIENT-SIDE PAYMENT HELPER
// ============================================================================

/**
 * Sign x402 payment using wallet
 * This must be done client-side with user's private key
 */
async function signX402Payment(
  requirements: X402PaymentRequirements,
  fromAddress: string,
  signTypedData: (data: any) => Promise<string>
): Promise<X402PaymentPayload> {
  const now = Math.floor(Date.now() / 1000);
  const validAfter = now - 60; // Valid from 1 minute ago (clock skew)
  const validBefore = now + requirements.maxTimeoutSeconds;
  
  // Generate random nonce
  const nonce = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Create EIP-712 typed data
  const typedData = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    },
    domain: {
      name: requirements.extra.name,
      version: requirements.extra.version,
      chainId: 8453, // Base mainnet
      verifyingContract: requirements.asset,
    },
    primaryType: 'TransferWithAuthorization',
    message: {
      from: fromAddress,
      to: requirements.payTo,
      value: requirements.maxAmountRequired,
      validAfter: validAfter.toString(),
      validBefore: validBefore.toString(),
      nonce,
    },
  };

  // Sign the typed data
  const signature = await signTypedData(typedData);

  return {
    signature,
    from: fromAddress,
    to: requirements.payTo,
    value: requirements.maxAmountRequired,
    validAfter: validAfter.toString(),
    validBefore: validBefore.toString(),
    nonce,
  };
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function usePayments(options: UsePaymentsOptions): UsePaymentsState {
  const { service, quantity, autoQuote = true, metadata } = options;
  const { universalAddress: address, signTypedData } = useBaseAccount();
  
  // State
  const [isQuoting, setIsQuoting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [lastResult, setLastResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const isLoading = isQuoting || isPaying;

  // ========================================================================
  // GET QUOTE
  // ========================================================================

  const getQuote = useCallback(async (): Promise<PaymentQuote | null> => {
    if (!address) {
      setError(new Error("Wallet not connected"));
      return null;
    }

    setIsQuoting(true);
    setError(null);

    try {
      const response = await fetch('/api/agents/vocalize', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get quote: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get quote');
      }

      // Construct quote from response
      const paymentQuote: PaymentQuote = {
        service,
        quantity,
        estimatedCost: BigInt(data.data.sampleCost.wei) * BigInt(quantity) / 1000n,
        unitCost: BigInt(data.data.costPerCharacter),
        availableMethods: data.data.availablePaymentMethods,
        recommendedMethod: data.data.recommendedMethod,
        creditsAvailable: data.data.creditBalance ? BigInt(data.data.creditBalance) : undefined,
        currentTier: data.data.currentTier,
        tierCoversService: data.data.availablePaymentMethods.includes('tier'),
      };

      setQuote(paymentQuote);
      return paymentQuote;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to get quote");
      setError(error);
      return null;
    } finally {
      setIsQuoting(false);
    }
  }, [address, service, quantity]);

  // ========================================================================
  // PAY
  // ========================================================================

  const pay = useCallback(async (
    methodOverride?: 'credits' | 'tier' | 'x402'
  ): Promise<PaymentResult> => {
    if (!address) {
      const error = new Error("Wallet not connected");
      setError(error);
      return { success: false, method: 'none', cost: 0n, error: error.message };
    }

    setIsPaying(true);
    setError(null);

    try {
      // Get current quote if not available
      let currentQuote = quote;
      if (!currentQuote) {
        currentQuote = await getQuote();
        if (!currentQuote) {
          throw new Error("Could not get payment quote");
        }
      }

      const method = methodOverride || currentQuote.recommendedMethod;

      // Handle x402 payment (requires client-side signing)
      if (method === 'x402') {
        if (!signTypedData) {
          throw new Error("Wallet does not support signing");
        }

        // First, get 402 response with requirements
        const checkResponse = await fetch('/api/agents/vocalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: metadata?.text || '',
            voiceId: metadata?.voiceId,
            agentAddress: address,
            options: metadata?.options,
          }),
        });

        if (checkResponse.status !== 402) {
          // Payment not required or error
          const data = await checkResponse.json();
          if (data.success) {
            // Already paid via credits/tier
            setLastResult({
              success: true,
              method: data.data.paymentMethod as any,
              cost: BigInt(data.data.cost),
              txHash: data.data.txHash,
            });
            return {
              success: true,
              method: data.data.paymentMethod as any,
              cost: BigInt(data.data.cost),
              txHash: data.data.txHash,
            };
          }
          throw new Error(data.error || 'Unexpected response');
        }

        // Parse 402 requirements from header
        const requirementsHeader = checkResponse.headers.get('X-PAYMENT-REQUIRED');
        if (!requirementsHeader) {
          throw new Error("No payment requirements in 402 response");
        }

        const requirements: X402PaymentRequirements = JSON.parse(requirementsHeader);

        // Sign payment
        const payment = await signX402Payment(requirements, address, signTypedData);

        // Retry with payment header
        const payResponse = await fetch('/api/agents/vocalize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-PAYMENT': JSON.stringify(payment),
          },
          body: JSON.stringify({
            text: metadata?.text || '',
            voiceId: metadata?.voiceId,
            agentAddress: address,
            options: metadata?.options,
          }),
        });

        const data = await payResponse.json();

        if (!data.success) {
          throw new Error(data.error || 'Payment failed');
        }

        const result: PaymentResult = {
          success: true,
          method: 'x402',
          cost: BigInt(data.data.cost),
          txHash: data.data.txHash,
        };

        setLastResult(result);
        return result;
      }

      // For credits or tier, just call the API normally
      const response = await fetch('/api/agents/vocalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: metadata?.text || '',
          voiceId: metadata?.voiceId,
          agentAddress: address,
          options: metadata?.options,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Payment failed');
      }

      const result: PaymentResult = {
        success: true,
        method: data.data.paymentMethod as any,
        cost: BigInt(data.data.cost),
        remainingCredits: data.data.creditBalance ? BigInt(data.data.creditBalance) : undefined,
        tier: data.data.tier,
      };

      setLastResult(result);
      return result;

    } catch (err) {
      const error = err instanceof Error ? err : new Error("Payment failed");
      setError(error);
      
      const result: PaymentResult = {
        success: false,
        method: 'none',
        cost: quote?.estimatedCost || calculateServiceCost(service, quantity),
        error: error.message,
      };
      
      setLastResult(result);
      return result;
    } finally {
      setIsPaying(false);
    }
  }, [address, quote, service, quantity, metadata, signTypedData, getQuote]);

  // ========================================================================
  // RESET
  // ========================================================================

  const reset = useCallback(() => {
    setQuote(null);
    setLastResult(null);
    setError(null);
    setIsQuoting(false);
    setIsPaying(false);
  }, []);

  // ========================================================================
  // HELPERS
  // ========================================================================

  const formatCost = useCallback((amount: bigint): string => {
    return formatUSDC(amount);
  }, []);

  const canPayWithoutX402 = quote?.availableMethods.includes('credits') || 
                            quote?.availableMethods.includes('tier') || 
                            false;

  // ========================================================================
  // AUTO-QUOTE
  // ========================================================================

  useEffect(() => {
    if (autoQuote && address && !quote && !isQuoting) {
      getQuote();
    }
  }, [autoQuote, address, quote, isQuoting, getQuote]);

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    isLoading,
    isQuoting,
    isPaying,
    quote,
    lastResult,
    error,
    getQuote,
    pay,
    reset,
    formatCost,
    canPayWithoutX402,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook specifically for voice generation payments
 */
export function useVoiceGenerationPayment(
  text: string,
  voiceId: string,
  autoQuote = true
) {
  return usePayments({
    service: 'voice_generation',
    quantity: text.length,
    autoQuote,
    metadata: { text, voiceId },
  });
}

/**
 * Hook for checking if user can access a service without paying
 */
export function useServiceAccess(service: ServiceType) {
  const { universalAddress: address } = useBaseAccount();
  const [hasAccess, setHasAccess] = useState(false);
  const [tier, setTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setHasAccess(false);
      setIsLoading(false);
      return;
    }

    const checkAccess = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/agents/vocalize?agentAddress=${address}`);
        const data = await response.json();
        
        if (data.success) {
          const methods = data.data.availablePaymentMethods as string[];
          setHasAccess(methods.includes('credits') || methods.includes('tier'));
          setTier(data.data.currentTier);
        }
      } catch (error) {
        console.error("Failed to check access:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [address, service]);

  return { hasAccess, tier, isLoading };
}
