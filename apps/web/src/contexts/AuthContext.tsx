"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAccount, useSignMessage, useDisconnect, useConnect } from "wagmi";
import { base } from "viem/chains";
import { useBaseAccount } from "../hooks/useBaseAccount";
import { useBase } from "../app/providers";
import { buildSignInMessage } from "@/lib/auth";
import { PLATFORM_CONFIG, meetsCreatorRequirements } from "@voisss/shared/config/platform";
import { convertReferralOnSignIn } from "../utils/referral-handler";

interface AuthContextType {
  isAuthenticated: boolean;
  isConnected: boolean;
  isAuthenticating: boolean;
  isCheckingSession: boolean;
  address: string | null;
  subAccount: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  creatorBalance: bigint | null;
  isCreatorEligible: boolean;
  isCheckingEligibility: boolean;
  eligibilityError: string | null;
  refreshCreatorStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

type WalletConnectResponse = {
  accounts: Array<{ address: string; capabilities: { signInWithEthereum?: { message: string; signature: `0x${string}` } } }>;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const baseContext = useBase();
  const { isConnected: baseIsConnected, universalAddress, connect: baseConnect, disconnect: baseDisconnect } = useBaseAccount();
  const { address: wagmiAddress, isConnected: wagmiConnected, connector } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnectAsync } = useDisconnect();
  const { connectAsync, connectors } = useConnect();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);

  const [creatorBalance, setCreatorBalance] = useState<bigint | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  const combinedAddress = (wagmiAddress as string | undefined) || universalAddress || sessionAddress || null;
  const combinedIsConnected = wagmiConnected || baseIsConnected;

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const response = await fetch("/api/auth/verify-session", { method: "GET", credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            setSessionAddress(data.address || null);
          }
        }
      } catch {}
      finally { setIsCheckingSession(false); }
    };
    checkExistingSession();
    const timeout = setTimeout(() => setIsCheckingSession(false), 5000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isCheckingSession) {
      if (combinedIsConnected && !isAuthenticated && combinedAddress && !sessionAddress) {
        // connected but not authenticated — stay unauthenticated until SIWE
      } else if (!combinedIsConnected && isAuthenticated && !isAuthenticating && !sessionAddress) {
        // keep session-authenticated even when wallet disconnected (browse-first)
      }
    }
  }, [combinedIsConnected, isCheckingSession, isAuthenticated, isAuthenticating, sessionAddress, combinedAddress]);

  const refreshCreatorStatus = useCallback(async () => {
    const addressToCheck = combinedAddress;
    if (!addressToCheck) { setCreatorBalance(null); return; }
    setIsCheckingEligibility(true);
    setEligibilityError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch("/api/user/token-balance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addressToCheck, tokenAddress: PLATFORM_CONFIG.papajamsToken.address }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error("Failed to fetch token balance");
      const data = await response.json();
      setCreatorBalance(BigInt(data.balance || 0));
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") setEligibilityError("Balance check timed out");
      else setEligibilityError(err instanceof Error ? err.message : "Unknown error");
      setCreatorBalance(BigInt(0));
    } finally { setIsCheckingEligibility(false); }
  }, [combinedAddress]);

  useEffect(() => {
    if (combinedAddress && isAuthenticated) refreshCreatorStatus();
  }, [combinedAddress, isAuthenticated, refreshCreatorStatus]);

  const signIn = useCallback(async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      let addr: string | null = (wagmiAddress as string | null) || universalAddress || sessionAddress || null;

      // If no wallet connected, trigger wagmi connect (prefer CB, fallback injected)
      if (!addr) {
        const preferred = connectors.find((c) => c.id.includes("coinbaseWallet")) || connectors.find((c) => c.id === "injected") || connectors[0];
        if (!preferred) throw new Error("No wallet connector available. Install MetaMask or Coinbase Wallet.");
        const result = await connectAsync({ connector: preferred });
        addr = result.accounts[0] as string;
      }

      if (!addr) throw new Error("No wallet address available");

      const nonceRes = await fetch("/api/auth/nonce", { method: "POST" });
      if (!nonceRes.ok) throw new Error(`Failed to fetch nonce: ${nonceRes.status}`);
      const nonceData = await nonceRes.json();
      const nonce: string = nonceData?.nonce;
      if (!nonce || typeof nonce !== "string") throw new Error("Invalid nonce response");

      // Prefer Base SDK wallet_connect SIWE when on CB Smart Wallet
      const isCB = connector?.id?.includes("coinbaseWallet");
      if (isCB && baseContext?.provider) {
        try {
          const result = (await baseContext.provider.request({
            method: "wallet_connect",
            params: [{ version: "1", capabilities: { signInWithEthereum: { nonce, chainId: "0x2105" } } }],
          })) as WalletConnectResponse;
          if (result?.accounts?.length) {
            const account = result.accounts[0];
            const siew = account.capabilities.signInWithEthereum;
            if (siew) {
              const verifyRes = await fetch("/api/auth/verify", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: account.address, message: siew.message, signature: siew.signature, nonce, subAccount: account.address }),
              });
              if (!verifyRes.ok) {
                const err = await verifyRes.json();
                throw new Error(err.details || "Authentication failed");
              }
              setIsAuthenticated(true);
              setSessionAddress(account.address);
              try { await convertReferralOnSignIn(account.address); } catch {}
              return;
            }
          }
        } catch (e) {
          console.warn("Base wallet_connect fallback to personal_sign", e);
        }
      }

      // Ensure wallet is connected via Base helper if wagmi not yet
      if (!wagmiAddress && !baseIsConnected && baseConnect) {
        try { await baseConnect(); } catch {}
      }

      // Generic SIWE via personal_sign / signMessage
      const domain = typeof window !== "undefined" ? window.location.host : "voisss.netlify.app";
      const message = buildSignInMessage({ address: addr, nonce, chainId: base.id, domain });
      let signature: string;
      try {
        signature = await signMessageAsync({ message });
      } catch {
        // fallback to provider personal_sign
        const provider: any = baseContext?.provider;
        if (!provider?.request) throw new Error("No signing provider available");
        signature = await provider.request({ method: "personal_sign", params: [message, addr] });
      }

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr, message, signature, nonce, subAccount: addr }),
      });
      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.details || err.error || "Authentication failed");
      }

      setIsAuthenticated(true);
      setSessionAddress(addr);
      try { await convertReferralOnSignIn(addr); } catch {}
    } catch (err) {
      console.error("Sign in failed:", err);
      setError(err instanceof Error ? err.message : "Sign in failed");
      setIsAuthenticated(false);
      throw err;
    } finally { setIsAuthenticating(false); }
  }, [wagmiAddress, universalAddress, sessionAddress, connectors, connectAsync, connector, baseContext, signMessageAsync, baseIsConnected, baseConnect]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      try { await disconnectAsync(); } catch {}
      try { if (baseDisconnect) await baseDisconnect(); } catch {}
      setIsAuthenticated(false);
      setSessionAddress(null);
      setError(null);
    } catch (err) { console.error("Sign out failed:", err); }
  }, [disconnectAsync, baseDisconnect]);

  const value: AuthContextType = {
    isAuthenticated,
    isConnected: combinedIsConnected,
    isAuthenticating,
    isCheckingSession,
    address: combinedAddress,
    subAccount: combinedAddress,
    signIn,
    signOut,
    error,
    creatorBalance,
    isCreatorEligible: creatorBalance !== null ? meetsCreatorRequirements(creatorBalance) : false,
    isCheckingEligibility,
    eligibilityError,
    refreshCreatorStatus,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
