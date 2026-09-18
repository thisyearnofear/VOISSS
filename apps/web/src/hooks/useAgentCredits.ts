/**
 * useAgentCredits — live hook for dashboard / marketplace balance chips
 *
 * GET /api/agents/credits?agentAddress=0x... → { balance, balanceFormatted, quote }
 * Also surfaces tier + discount + recommended payment method so chips can
 * explain *why* the balance matters (per-char cost, tier savings).
 *
 * No chain reads here — that stays in wagmi useBalance for wallet USDC.
 * This hook owns the VOISSS internal credit balance only.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useBaseAccount } from "./useBaseAccount";

export interface AgentCreditsBalance {
  usdcBalance: string; // wei
  usdcLocked: string;
  totalSpent: string;
  lastTopUp: string | null;
}

export interface AgentCreditsQuote {
  currentTier: string;
  discountPercent: number;
  unitCost: string;
  sampleCost: string;
  availableMethods: string[];
  recommendedMethod: string;
}

export interface UseAgentCreditsResult {
  address: `0x${string}` | null;
  balance: AgentCreditsBalance | null;
  balanceFormatted: string | null;
  balanceWei: string | null;
  quote: AgentCreditsQuote | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  hasBalance: boolean;
  isEmpty: boolean;
}

export function useAgentCredits(explicitAddress?: string): UseAgentCreditsResult {
  const { address: wagmiAddress } = useAccount();
  const { universalAddress } = useBaseAccount();

  const address = useMemo<`0x${string}` | null>(() => {
    const cand =
      explicitAddress && /^0x[a-fA-F0-9]{40}$/.test(explicitAddress)
        ? explicitAddress
        : wagmiAddress && /^0x[a-fA-F0-9]{40}$/.test(wagmiAddress)
          ? wagmiAddress
          : universalAddress && /^0x[a-fA-F0-9]{40}$/.test(universalAddress)
            ? universalAddress
            : null;
    return cand as `0x${string}` | null;
  }, [explicitAddress, wagmiAddress, universalAddress]);

  const [balance, setBalance] = useState<AgentCreditsBalance | null>(null);
  const [balanceFormatted, setBalanceFormatted] = useState<string | null>(null);
  const [balanceWei, setBalanceWei] = useState<string | null>(null);
  const [quote, setQuote] = useState<AgentCreditsQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    if (!address) {
      setBalance(null);
      setBalanceFormatted(null);
      setBalanceWei(null);
      setQuote(null);
      setError(null);
      return;
    }
    const isFirst = balance === null && !error;
    if (isFirst) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const r = await fetch(`/api/agents/credits?agentAddress=${address}`, { cache: "no-store" });
      const j = (await r.json()) as {
        success?: boolean;
        data?: {
          balance?: AgentCreditsBalance;
          balanceFormatted?: string;
          balanceWei?: string;
          quote?: AgentCreditsQuote | null;
        };
        error?: string;
      };
      if (!r.ok || !j.success || !j.data) throw new Error(j.error ?? `HTTP ${r.status}`);
      setBalance(j.data.balance ?? null);
      setBalanceFormatted(j.data.balanceFormatted ?? null);
      setBalanceWei(j.data.balanceWei ?? j.data.balance?.usdcBalance ?? null);
      setQuote(j.data.quote ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [address, balance, error]);

  useEffect(() => {
    void fetchCredits();
  }, [fetchCredits]);

  // refresh when tab becomes visible — cheap, keeps dashboard honest
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && address) void fetchCredits();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [address, fetchCredits]);

  const hasBalance = useMemo(() => {
    if (!balance) return false;
    try {
      return BigInt(balance.usdcBalance) > 0n;
    } catch {
      return false;
    }
  }, [balance]);

  const isEmpty = !isLoading && !!address && !hasBalance && !error;

  return {
    address,
    balance,
    balanceFormatted,
    balanceWei,
    quote,
    isLoading,
    isRefreshing,
    error,
    refresh: fetchCredits,
    hasBalance,
    isEmpty,
  };
}
