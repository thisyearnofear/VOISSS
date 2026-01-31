"use client";

import { useState, useCallback, useEffect } from "react";
import { useBaseAccount } from "./useBaseAccount";

export interface X402Payment {
  amount: string; // in wei
  receiver: string;
  asset: string; // token contract address or "ETH"
}

export interface X402Session {
  id: string;
  userAddress: string;
  recordingId: string;
  paidAt: number;
  expiresAt: number;
}

const SESSION_STORAGE_KEY = "voisss_x402_sessions";

export function useX402Payments() {
  const { universalAddress: address } = useBaseAccount();
  const [activeSessions, setActiveSessions] = useState<X402Session[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load sessions from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        const sessions: X402Session[] = JSON.parse(stored);
        // Filter out expired sessions
        const now = Date.now();
        const valid = sessions.filter((s) => s.expiresAt > now);
        setActiveSessions(valid);
      } catch (e) {
        console.error("Failed to parse x402 sessions:", e);
      }
    }
  }, []);

  // Save sessions to storage
  const saveSessions = useCallback((sessions: X402Session[]) => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
    setActiveSessions(sessions);
  }, []);

  // Check if user has an active session for a recording
  const hasActiveSession = useCallback(
    (recordingId: string): boolean => {
      if (!address) return false;
      const now = Date.now();
      return activeSessions.some(
        (s) =>
          s.recordingId === recordingId &&
          s.userAddress === address &&
          s.expiresAt > now
      );
    },
    [activeSessions, address]
  );

  // Initiate x402 payment
  const initiatePayment = useCallback(
    async (payment: X402Payment, recordingId: string): Promise<boolean> => {
      if (!address || !window.ethereum) {
        throw new Error("Wallet not connected");
      }

      setIsProcessing(true);

      try {
        // For ETH payments
        if (payment.asset === "ETH" || payment.asset === "0x0000000000000000000000000000000000000000") {
          const tx = await (window.ethereum as any).request({
            method: "eth_sendTransaction",
            params: [
              {
                from: address,
                to: payment.receiver,
                value: payment.amount,
                data: "0x", // x402 marker
              },
            ],
          });

          // Wait for transaction confirmation (simplified)
          // In production, you'd poll for confirmation
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Create session (24h access)
          const session: X402Session = {
            id: `session_${Date.now()}`,
            userAddress: address,
            recordingId,
            paidAt: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          };

          const updated = [...activeSessions, session];
          saveSessions(updated);

          return true;
        }

        // For ERC-20 token payments, you'd need to call the token contract
        throw new Error("ERC-20 payments not yet implemented");
      } finally {
        setIsProcessing(false);
      }
    },
    [address, activeSessions, saveSessions]
  );

  // Clear expired sessions
  const clearExpiredSessions = useCallback(() => {
    const now = Date.now();
    const valid = activeSessions.filter((s) => s.expiresAt > now);
    if (valid.length !== activeSessions.length) {
      saveSessions(valid);
    }
  }, [activeSessions, saveSessions]);

  // Check if content requires payment
  const requiresPayment = useCallback((x402Price?: string): boolean => {
    if (!x402Price) return false;
    try {
      const price = BigInt(x402Price);
      return price > BigInt(0);
    } catch {
      return false;
    }
  }, []);

  // Format price for display (wei to ETH)
  const formatPrice = useCallback((weiAmount: string): string => {
    try {
      const wei = BigInt(weiAmount);
      const eth = Number(wei) / 1e18;
      return eth.toFixed(4);
    } catch {
      return "0";
    }
  }, []);

  return {
    hasActiveSession,
    initiatePayment,
    isProcessing,
    requiresPayment,
    formatPrice,
    clearExpiredSessions,
    activeSessions,
  };
}
