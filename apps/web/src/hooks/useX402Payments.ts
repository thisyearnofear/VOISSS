/**
 * x402 Payments Hook (Compatibility Layer)
 * 
 * This hook provides a compatibility interface for the old useX402Payments
 * while using the new unified payment system internally.
 * 
 * @deprecated Use usePayments or useServiceAccess from './usePayments' instead
 */

"use client";

import { useCallback } from "react";
import { useServiceAccess, usePayments } from "./usePayments";
import { formatUSDC, parseUSDC } from "@voisss/shared";

interface UseX402PaymentsReturn {
  /** Check if user has an active payment session for a specific content */
  hasActiveSession: (contentId: string) => boolean;
  /** Format price for display */
  formatPrice: (price: string) => string;
  /** Check if content requires payment */
  requiresPayment: (price: string | undefined) => boolean;
  /** Get payment URL for content */
  getPaymentUrl: (contentId: string, price: string) => string;
  /** Current user's tier */
  tier: string | null;
  /** Whether user has access without payment */
  hasFreeAccess: boolean;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Hook for x402 payment functionality
 * @deprecated Use usePayments or useServiceAccess instead
 */
export function useX402Payments(): UseX402PaymentsReturn {
  const { hasAccess, tier, isLoading } = useServiceAccess("voice_generation");

  const hasActiveSession = useCallback((contentId: string): boolean => {
    // Check localStorage for active sessions
    if (typeof window === "undefined") return false;
    
    try {
      const sessions = JSON.parse(localStorage.getItem("x402_sessions") || "{}");
      const session = sessions[contentId];
      
      if (!session) return false;
      
      // Check if session is still valid
      const now = Date.now();
      return session.expiresAt > now;
    } catch {
      return false;
    }
  }, []);

  const formatPrice = useCallback((price: string): string => {
    // Handle USDC (6 decimals) or ETH (18 decimals)
    try {
      const value = BigInt(price);
      // If value is very small, assume it's USDC (6 decimals)
      // Otherwise assume ETH (18 decimals)
      const isUSDC = value < BigInt("1000000000000"); // Less than 0.000001 ETH
      
      if (isUSDC) {
        return formatUSDC(value);
      } else {
        // Format as ETH
        const ethValue = Number(value) / 1e18;
        return `${ethValue.toFixed(6)} ETH`;
      }
    } catch {
      return price;
    }
  }, []);

  const requiresPayment = useCallback((price: string | undefined): boolean => {
    if (!price || price === "0") return false;
    
    try {
      const value = BigInt(price);
      return value > 0n;
    } catch {
      return false;
    }
  }, []);

  const getPaymentUrl = useCallback((contentId: string, price: string): string => {
    // Generate payment URL for the content
    const params = new URLSearchParams({
      contentId,
      price,
      callback: encodeURIComponent(window.location.href),
    });
    return `/pay?${params.toString()}`;
  }, []);

  return {
    hasActiveSession,
    formatPrice,
    requiresPayment,
    getPaymentUrl,
    tier,
    hasFreeAccess: hasAccess,
    isLoading,
  };
}

export default useX402Payments;
