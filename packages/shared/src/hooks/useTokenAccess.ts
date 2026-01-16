'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  type TokenTier,
  getTierForBalance,
  meetsMinimumBalance,
  getMinBalanceForTier,
  formatTokenBalance,
  canAccessFeature,
  getBurnActionCost,
  getAvailableTemplates,
  applyUserBranding,
  VOISSS_TOKEN_ACCESS,
} from '../config/tokenAccess';

export type { TokenTier };

export interface UseTokenAccessOptions {
  address?: string | null;
  tokenAddress?: string;
  chainId?: number;
  refreshInterval?: number; // ms between balance refreshes
  autoRefresh?: boolean; // automatically refresh on mount
  // Farcaster profile for branding
  fid?: number;
  username?: string;
  pfpUrl?: string;
  displayName?: string;
}

export interface UseTokenAccessResult {
  // State
  balance: bigint | null;
  tier: TokenTier;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;

  // NEW: Balance check status for UI feedback
  balanceStatus: 'loading' | 'success' | 'stale' | 'fallback' | 'error';
  
  // NEW: Info about why balance check failed (if applicable)
  fallbackInfo?: {
    type: 'cached' | 'manual_verify' | 'retry';
    message: string;
    url?: string;
  };

  // Queries
  meetsMinimum(tier: TokenTier): boolean;
  canAccess(feature: string): boolean;
  getBurnCost(action: string): bigint | null;
  getFormattedBalance(): string;
  getTierLabel(): string;
  getTierFeatures(): string[];

  // Actions
  refreshBalance(): Promise<void>;

  // Branding functions
  getAvailableTemplates(hasPapaJamsToken?: boolean): any[];
  applyUserBranding(template: any, userProfile?: { username?: string; pfpUrl?: string; displayName?: string; hasPapaJamsToken?: boolean }): any;
}

/**
 * Unified hook for token access checks
 * Replaces scattered balance checks across the app
 * 
 * Usage:
 *   const { tier, balance, canAccess, refreshBalance } = useTokenAccess({
 *     address: userAddress,
 *   });
 */
export function useTokenAccess(options: UseTokenAccessOptions = {}): UseTokenAccessResult {
  const {
    address = null,
    tokenAddress = process.env.NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS,
    chainId = parseInt(process.env.NEXT_PUBLIC_BASE_CHAIN_ID || '84532'),
    refreshInterval = 60000, // 1 minute
    autoRefresh = true,
    fid,
    username,
    pfpUrl,
    displayName,
  } = options;

  const [balance, setBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasPapaJamsToken, setHasPapaJamsToken] = useState(false);
  
  // NEW: Balance check status tracking
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<Date | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<'loading' | 'success' | 'stale' | 'fallback' | 'error'>('loading');
  const [fallbackInfo, setFallbackInfo] = useState<any>(undefined);

  /**
   * Fetch token balance from API endpoint
   * Web uses /api/user/token-balance, mobile uses fetch
   * Enhanced with fallback handling and graceful degradation
   */
  const refreshBalance = useCallback(async () => {
    if (!address) {
      setBalance(null);
      setError(null);
      setBalanceStatus('loading');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setBalanceStatus('loading');

      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      // Use unified balance endpoint
      const response = await fetch('/api/user/token-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, tokenAddress, chainId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // NEW: Check if API provided fallback options
        if (data.fallbackOptions) {
          setBalanceStatus('fallback');
          setFallbackInfo({
            type: data.fallbackOptions[0]?.type || 'manual_verify',
            message: data.error || 'Balance check temporarily unavailable',
            url: data.fallbackOptions[0]?.url,
          });
          
          // Don't throw - keep existing balance and mark as fallback
          setIsLoading(false);
          return;
        }

        throw new Error(`Balance fetch failed: ${response.statusText}`);
      }

      const balanceBigInt = BigInt(data.balance || '0');
      setBalance(balanceBigInt);
      setLastUpdated(new Date());
      setLastSuccessfulFetch(new Date());
      setBalanceStatus('success');
      setFallbackInfo(undefined);

      // Check PapaJams token if address provided
      if (address) {
        checkPapaJamsToken(address);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch balance');
      setError(error);
      
      // Handle timeout specifically
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('[useTokenAccess] Balance fetch timed out');
        setBalanceStatus('error');
        setFallbackInfo({
          type: 'retry',
          message: 'Balance check timed out. Please try again.',
          url: undefined,
        });
      } else if (lastSuccessfulFetch && Date.now() - lastSuccessfulFetch.getTime() < 5 * 60 * 1000) {
        // Check if we have recent successful data (use cache)
        setBalanceStatus('stale');
        setFallbackInfo({
          type: 'retry',
          message: 'Using cached balance (data may be outdated)',
          url: undefined,
        });
      } else {
        setBalanceStatus('error');
      }
      
      console.error('[useTokenAccess] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address, tokenAddress, chainId, lastSuccessfulFetch]);

  /**
   * Check PapaJams token holdings
   */
  const checkPapaJamsToken = useCallback(async (userAddress: string) => {
    try {
      const response = await fetch('/api/tokens/check-papajams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userAddress }),
      });

      if (response.ok) {
        const data = await response.json();
        setHasPapaJamsToken(data.hasPapaJamsToken || false);
      }
    } catch (err) {
      console.error('[useTokenAccess] PapaJams check failed:', err);
    }
  }, []);

  /**
   * Auto-refresh on mount and at intervals
   */
  useEffect(() => {
    if (!autoRefresh) return;

    refreshBalance();

    if (!address) return;

    const interval = setInterval(refreshBalance, refreshInterval);
    return () => clearInterval(interval);
  }, [address, autoRefresh, refreshInterval, refreshBalance]);

  /**
   * Determine current tier based on balance
   */
  const tier: TokenTier = balance ? getTierForBalance(balance) : 'none';

  /**
   * Query: Check if balance meets minimum for tier
   */
  const meetsMinimum = useCallback(
    (checkTier: TokenTier): boolean => {
      if (!balance) return checkTier === 'none';
      return meetsMinimumBalance(balance, checkTier);
    },
    [balance]
  );

  /**
   * Query: Check if feature is accessible at current tier
   */
  const canAccess = useCallback(
    (feature: string): boolean => {
      return canAccessFeature(tier, feature);
    },
    [tier]
  );

  /**
   * Query: Get cost of burn action
   */
  const getBurnCost = useCallback(
    (action: string): bigint | null => {
      return getBurnActionCost(action);
    },
    []
  );

  /**
   * Query: Get formatted balance string
   */
  const getFormattedBalance = useCallback((): string => {
    if (!balance) return '0';
    return formatTokenBalance(balance, VOISSS_TOKEN_ACCESS.decimals);
  }, [balance]);

  /**
   * Query: Get human-readable tier label
   */
  const getTierLabel = useCallback((): string => {
    return VOISSS_TOKEN_ACCESS.tiers[tier].label;
  }, [tier]);

  /**
   * Query: Get list of features available at tier
   */
  const getTierFeatures = useCallback((): string[] => {
    return VOISSS_TOKEN_ACCESS.tiers[tier].features;
  }, [tier]);

  return {
    // State
    balance,
    tier,
    isLoading,
    error,
    lastUpdated,
    balanceStatus,
    fallbackInfo,

    // Queries
    meetsMinimum,
    canAccess,
    getBurnCost,
    getFormattedBalance,
    getTierLabel,
    getTierFeatures,

    // Actions
    refreshBalance,

    // Branding functions
    getAvailableTemplates: useCallback((hasPapaJams?: boolean) => {
      return getAvailableTemplates(tier, hasPapaJams ?? hasPapaJamsToken);
    }, [tier, hasPapaJamsToken]),

    applyUserBranding: useCallback((template: any, userProfile?: any) => {
      const profile = userProfile || {
        username,
        pfpUrl,
        displayName: displayName || username,
        tier,
        hasPapaJamsToken,
      };
      return applyUserBranding(template, profile);
    }, [username, pfpUrl, displayName, tier, hasPapaJamsToken]),
  };
}
