/**
 * useDynamicWallet — UI hook for Runtime Dynamic agentic wallet
 *
 * Talks to:
 *  GET  /api/agents/dynamic-wallet?agentAddress=0x...
 *  POST /api/agents/dynamic-wallet  { agentAddress, action?:"create"|"sign", message? }
 *
 * All signing is server-side (MPC or EOA fallback via viem).
 * Hook never handles private keys or key shares.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useBaseAccount } from "./useBaseAccount";

export type DynamicWalletMode = "mpc" | "eoa-fallback" | "none";
export interface DynamicWalletInfo {
  address: `0x${string}`;
  createdAt: string;
  environmentId: string;
}
export interface DynamicWalletStatus {
  configured: boolean;
  mode: DynamicWalletMode;
  hasApiToken?: boolean;
  hasEnvironmentId?: boolean;
  hasFallbackKey?: boolean;
  hasPassword?: boolean;
  scheme?: string;
}

export interface UseDynamicWalletResult {
  status: DynamicWalletStatus | null;
  wallet: DynamicWalletInfo | null;
  hasWallet: boolean;
  isLoading: boolean;
  isCreating: boolean;
  isSigning: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createWallet: () => Promise<DynamicWalletInfo | null>;
  signMessage: (message: string) => Promise<{ signature: string; signer: string; method: DynamicWalletMode } | null>;
}

export function useDynamicWallet(explicitAddress?: string): UseDynamicWalletResult {
  const { universalAddress, isConnected } = useBaseAccount();
  const agentAddress = useMemo(
    () => (explicitAddress && /^0x[a-fA-F0-9]{40}$/.test(explicitAddress) ? explicitAddress : isConnected && universalAddress && /^0x[a-fA-F0-9]{40}$/.test(universalAddress) ? universalAddress : null),
    [explicitAddress, isConnected, universalAddress]
  );

  const [status, setStatus] = useState<DynamicWalletStatus | null>(null);
  const [wallet, setWallet] = useState<DynamicWalletInfo | null>(null);
  const [hasWallet, setHasWallet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!agentAddress) {
      // Still fetch global status for the chips
      try {
        const r = await fetch("/api/agents/dynamic-wallet", { cache: "no-store" });
        const j = (await r.json()) as { status?: DynamicWalletStatus; configured?: boolean; mode?: DynamicWalletMode };
        if (j.status) setStatus(j.status);
        else if (j.configured != null) setStatus({ configured: !!j.configured, mode: j.mode ?? "none" });
      } catch {}
      setWallet(null);
      setHasWallet(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/dynamic-wallet?agentAddress=${agentAddress}`, { cache: "no-store" });
      const data = (await res.json()) as {
        success: boolean;
        configured?: boolean;
        mode?: DynamicWalletMode;
        status?: DynamicWalletStatus;
        wallet?: DynamicWalletInfo | null;
        hasWallet?: boolean;
        error?: string;
      };
      if (!res.ok || !data.success) throw new Error(data.error ?? `HTTP ${res.status}`);
      setStatus(data.status ?? { configured: !!data.configured, mode: data.mode ?? "none" });
      setWallet((data.wallet as DynamicWalletInfo | null) ?? null);
      setHasWallet(!!data.hasWallet);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [agentAddress]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const createWallet = useCallback(async (): Promise<DynamicWalletInfo | null> => {
    if (!agentAddress) {
      setError("Connect wallet first");
      return null;
    }
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/dynamic-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentAddress }),
      });
      const data = (await res.json()) as { success: boolean; wallet?: DynamicWalletInfo; error?: string; hint?: string };
      if (!res.ok || !data.success) throw new Error(data.error ? `${data.error}${data.hint ? ` — ${data.hint}` : ""}` : `HTTP ${res.status}`);
      const w = (data.wallet as DynamicWalletInfo) ?? null;
      if (w) {
        setWallet(w);
        setHasWallet(true);
      }
      await fetchStatus();
      return w;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [agentAddress, fetchStatus]);

  const signMessage = useCallback(
    async (message: string) => {
      if (!agentAddress) {
        setError("Connect wallet first");
        return null;
      }
      setIsSigning(true);
      setError(null);
      try {
        const res = await fetch("/api/agents/dynamic-wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentAddress, action: "sign", message }),
        });
        const data = (await res.json()) as { success: boolean; signature?: string; signer?: string; method?: DynamicWalletMode; error?: string };
        if (!res.ok || !data.success) throw new Error(data.error ?? `HTTP ${res.status}`);
        return { signature: data.signature!, signer: data.signer!, method: data.method ?? "none" };
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return null;
      } finally {
        setIsSigning(false);
      }
    },
    [agentAddress]
  );

  return { status, wallet, hasWallet, isLoading, isCreating, isSigning, error, refresh: fetchStatus, createWallet, signMessage };
}
