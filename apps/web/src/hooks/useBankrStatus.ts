/**
 * useBankrStatus — tiny hook for the Runtime Bankr chip / dashboard
 *
 * GET /api/bankr?view=status is safe to call without credentials; it returns
 * configured/llmConfigured + masked key. GET ?view=portfolio needs the key and
 * 503s when not configured — this hook never treats that as a hard error.
 */

"use client";

import { useCallback, useEffect, useState } from "react";

export interface BankrStatus {
  configured: boolean;
  llmConfigured: boolean;
  apiKeyMasked: string | null;
  llmKeyMasked: string | null;
  apiBase: string;
  llmBase: string;
  docs: { cli: string; walletApi: string; agentApi: string; llmGateway: string; tokenLaunch: string; skill: string };
}

export interface UseBankrStatusResult {
  status: BankrStatus | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBankrStatus(): UseBankrStatusResult {
  const [status, setStatus] = useState<BankrStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bankr", { cache: "no-store" });
      const data = (await res.json()) as { success: boolean; status?: BankrStatus; error?: string };
      if (!res.ok && !data.status) throw new Error(data.error ?? `HTTP ${res.status}`);
      // success:true → status is at data.status; on 503 the same shape is returned with success:false
      if (data.status) setStatus(data.status);
      else setStatus(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, isLoading, error, refresh };
}
