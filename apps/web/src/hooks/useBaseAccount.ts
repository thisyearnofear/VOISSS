"use client";

import { useState, useEffect, useCallback } from "react";
import { useBase } from "../app/providers";
import { crossPlatformStorage } from "@voisss/shared";

const STORAGE_KEY = "voisss_base_account_address";
const SUB_ACCOUNT_KEY = "voisss_sub_account_address";

interface UseBaseAccountReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  universalAddress: string | null;
  subAccountAddress: string | null;
  connectionState: "idle" | "checking" | "connected" | "disconnected";

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;

  // Signing
  signTypedData: (typedData: any) => Promise<string>;

  // Sub Account state
  hasSubAccount: boolean;
  isCreatingSubAccount: boolean;
  subAccountError: string | null;

  // Sub Account actions
  createSubAccount: () => Promise<void>;
  refreshSubAccount: () => Promise<void>;

  // Status
  status: string;
  error: string | null;
}

export function useBaseAccount(): UseBaseAccountReturn {
  const context = useBase();
  const provider = context?.provider ?? null;

  const [connectionState, setConnectionState] = useState<
    "idle" | "checking" | "connected" | "disconnected"
  >("checking");
  const [universalAddress, setUniversalAddress] = useState<string | null>(null);
  const [subAccountAddress, setSubAccountAddress] = useState<string | null>(
    null
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState("Checking connection...");
  const [error, setError] = useState<string | null>(null);

  // Sub Account state
  const [hasSubAccount, setHasSubAccount] = useState<boolean>(false);
  const [isCreatingSubAccount, setIsCreatingSubAccount] = useState(false);
  const [subAccountError, setSubAccountError] = useState<string | null>(null);

  const checkForSubAccount = useCallback(
    async (userAddress: string) => {
      if (!provider) return;

      try {
        if (process.env.NODE_ENV === "development") {
          console.log("🔍 Checking for Sub Account...");
        }

        const result = (await provider.request({
          method: "wallet_getSubAccounts",
          params: [
            {
              account: userAddress,
              domain:
                typeof window !== "undefined" ? window.location.origin : "",
            },
          ],
        })) as { subAccounts: Array<{ address: string }> };

        if (result.subAccounts && result.subAccounts.length > 0) {
          const subAccount = result.subAccounts[0];
          if (process.env.NODE_ENV === "development") {
            console.log("✅ Sub Account found:", subAccount.address);
          }
          setSubAccountAddress(subAccount.address);
          setHasSubAccount(true);
          setStatus("Connected with Sub Account");

          // Store Sub Account address
          await crossPlatformStorage.setItem(
            SUB_ACCOUNT_KEY,
            subAccount.address
          );
        } else {
          if (process.env.NODE_ENV === "development") {
            console.log("⚠️ No Sub Account found");
          }
          setHasSubAccount(false);
          setStatus("Connected (no Sub Account)");
        }
      } catch (err) {
        // Silently handle Sub Account check failures - they're optional
        if (process.env.NODE_ENV === "development") {
          console.warn("Sub Account check failed:", err);
        }
        setHasSubAccount(false);
        setStatus("Connected (no Sub Account)");
      }
    },
    [provider]
  );

  const checkExistingConnection = useCallback(async () => {
    if (!provider) return;

    try {
      setConnectionState("checking");

      const accounts = (await provider.request({
        method: "eth_accounts",
        params: [],
      })) as string[];

      if (accounts.length > 0) {
        const universalAddr = accounts[0];
        setUniversalAddress(universalAddr);
        setConnectionState("connected");
        setStatus("Connected");

        // Persist to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, universalAddr);
        }

        // Check for existing Sub Account
        await checkForSubAccount(universalAddr);
      } else {
        // Check localStorage as fallback
        if (typeof window !== "undefined") {
          const storedAddress = localStorage.getItem(STORAGE_KEY);
          if (storedAddress) {
            setUniversalAddress(storedAddress);
            setConnectionState("connected");
            setStatus("Connected");
            await checkForSubAccount(storedAddress);
            return;
          }
        }

        setConnectionState("disconnected");
        setStatus("Not connected");
      }
    } catch (err) {
      console.warn("Error checking connection:", err);
      setConnectionState("disconnected");
      setStatus("Not connected");
    }
  }, [provider, checkForSubAccount]);

  // Check for existing connection on mount
  useEffect(() => {
    checkExistingConnection();
  }, [checkExistingConnection]);

  const connect = useCallback(async () => {
    if (isConnecting || !provider) return;

    setIsConnecting(true);
    setError(null);
    setStatus("Connecting...");

    try {
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
        params: [],
      })) as string[];

      const universalAddr = accounts[0];
      setUniversalAddress(universalAddr);
      setConnectionState("connected");
      setStatus("Connected");

      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, universalAddr);
      }

      // Check for existing Sub Account
      await checkForSubAccount(universalAddr);
    } catch (err) {
      console.error("Connection failed:", err);
      setError(err instanceof Error ? err.message : "Connection failed");
      setStatus("Connection failed");
      setConnectionState("disconnected");
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, provider, checkForSubAccount]);

  const disconnect = useCallback(async () => {
    setConnectionState("disconnected");
    setUniversalAddress(null);
    setSubAccountAddress(null);
    setHasSubAccount(false);
    setStatus("Disconnected");
    setError(null);

    // Clear storage
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SUB_ACCOUNT_KEY);
    }
    await crossPlatformStorage.removeItem(SUB_ACCOUNT_KEY);
  }, []);

  const createSubAccount = useCallback(async () => {
    if (!provider || !universalAddress) {
      throw new Error("Not connected to Base Account");
    }

    setIsCreatingSubAccount(true);
    setSubAccountError(null);

    try {
      if (process.env.NODE_ENV === "development") {
        console.log("🔨 Creating Sub Account...");
      }

      const subAccount = (await provider.request({
        method: "wallet_addSubAccount",
        params: [
          {
            account: {
              type: "create",
            },
          },
        ],
      })) as { address: string };

      if (process.env.NODE_ENV === "development") {
        console.log("✅ Sub Account created:", subAccount.address);
      }
      setSubAccountAddress(subAccount.address);
      setHasSubAccount(true);
      setStatus("Connected with Sub Account");

      // Store Sub Account address
      await crossPlatformStorage.setItem(SUB_ACCOUNT_KEY, subAccount.address);
    } catch (err) {
      console.error("❌ Failed to create Sub Account:", err);
      setSubAccountError(
        err instanceof Error ? err.message : "Failed to create Sub Account"
      );
      throw err;
    } finally {
      setIsCreatingSubAccount(false);
    }
  }, [provider, universalAddress]);

  const refreshSubAccount = useCallback(async () => {
    if (!universalAddress) return;
    await checkForSubAccount(universalAddress);
  }, [universalAddress, checkForSubAccount]);

  // Sign typed data (EIP-712)
  const signTypedData = useCallback(async (typedData: any): Promise<string> => {
    if (!provider || !universalAddress) {
      throw new Error("Not connected to wallet");
    }

    try {
      const signature = await provider.request({
        method: "eth_signTypedData_v4",
        params: [universalAddress, JSON.stringify(typedData)],
      }) as string;

      return signature;
    } catch (err) {
      console.error("Failed to sign typed data:", err);
      throw err instanceof Error ? err : new Error("Failed to sign");
    }
  }, [provider, universalAddress]);

  return {
    // Connection state
    isConnected: connectionState === "connected",
    isConnecting,
    universalAddress,
    subAccountAddress,
    connectionState,

    // Actions
    connect,
    disconnect,

    // Signing
    signTypedData,

    // Sub Account state
    hasSubAccount,
    isCreatingSubAccount,
    subAccountError,

    // Sub Account actions
    createSubAccount,
    refreshSubAccount,

    // Status
    status,
    error,
  };
}
