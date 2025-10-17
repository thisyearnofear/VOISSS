"use client";

import { useState, useEffect, useCallback } from "react";
import { useBase } from "../app/providers";
import { parseUnits } from "viem";
import { base } from "viem/chains";
import { requestSpendPermission, fetchPermissions, prepareRevokeCallData } from "@base-org/account/spend-permission";

const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

interface SubAccount {
  address: `0x${string}`;
  factory?: `0x${string}`;
  factoryData?: `0x${string}`;
}

interface UseBaseAccountReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  universalAddress: string | null;
  subAccount: SubAccount | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Transaction methods
  sendCalls: (calls: Array<{ to: string; data: string; value?: string }>) => Promise<string>;
  
  // Spend permission helpers
  getSpendPermissions?: () => Promise<any[]>;
  hasSpendPermission?: () => Promise<boolean>;
  revokeSpendPermission?: () => Promise<string>;
  updateSpendAllowance?: (amountEth: string) => Promise<void>;
  
  // Status
  status: string;
  error: string | null;
}

export function useBaseAccount(): UseBaseAccountReturn {
  const context = useBase();
  const provider = context?.provider ?? null;
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [universalAddress, setUniversalAddress] = useState<string | null>(null);
  const [subAccount, setSubAccount] = useState<SubAccount | null>(null);
  const [status, setStatus] = useState("Ready to connect");
  const [error, setError] = useState<string | null>(null);

  // Helper: ensure Sub Account has Auto Spend Permission
  const ensureAutoSpendPermission = useCallback(async (subAddr: `0x${string}`) => {
    if (!provider || !universalAddress) return;
    try {
      setStatus("Granting Auto Spend Permission...");
  
      // Check existing permissions first
      const existing = await fetchPermissions({
        account: universalAddress as `0x${string}`,
        spender: subAddr,
        chainId: base.id,
        provider,
      });
      if (existing && existing.length > 0) {
        setStatus("Auto Spend Permission already exists");
        return;
      }
  
      await requestSpendPermission({
        account: universalAddress as `0x${string}`,
        spender: subAddr,
        token: NATIVE_TOKEN,
        chainId: base.id,
        allowance: parseUnits("0.01", 18), // default allowance for audio transforms
        periodInDays: 30,
        provider,
      });
  
      setStatus("Auto Spend Permission granted");
    } catch (err) {
      console.warn("Spend permission grant failed:", err);
      setStatus("Auto Spend Permission not granted");
    }
  }, [provider, universalAddress]);

  // Check for existing connection on mount
  useEffect(() => {
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    if (!provider) return;
    try {
      const accounts = await provider.request({
        method: "eth_accounts",
        params: [],
      }) as string[];

      if (accounts.length > 0) {
        const universalAddr = accounts[0];
        setUniversalAddress(universalAddr);
        setIsConnected(true);
        setStatus("Connected");

        // Check for existing sub account
        await checkForSubAccount(universalAddr);
      }
    } catch (err) {
      console.warn("No existing connection found");
    }
  };

  const checkForSubAccount = async (universalAddr: string) => {
    if (!provider) return;
    try {
      const response = await provider.request({
        method: "wallet_getSubAccounts",
        params: [{
          account: universalAddr,
          domain: window.location.origin,
        }],
      }) as { subAccounts: SubAccount[] };

      const existing = response.subAccounts[0];
      if (existing) {
        setSubAccount(existing);
        setStatus("Connected with Sub Account");
        // Ensure Auto Spend Permission exists
        await ensureAutoSpendPermission(existing.address);
      } else {
        // Auto-create sub account since we have creation: 'on-connect'
        await createSubAccount();
      }
    } catch (err) {
      console.warn("Failed to check for sub account:", err);
    }
  };

  const createSubAccount = async () => {
    if (!provider) return;
    try {
      setStatus("Creating Sub Account...");
      
      const newSubAccount = await provider.request({
        method: "wallet_addSubAccount",
        params: [{
          account: { type: 'create' },
        }],
      }) as SubAccount;

      setSubAccount(newSubAccount);
      setStatus("Sub Account created successfully!");

      // Grant Auto Spend Permission for the new Sub Account
      await ensureAutoSpendPermission(newSubAccount.address);
    } catch (err) {
      console.error("Sub Account creation failed:", err);
      setError("Failed to create Sub Account");
      setStatus("Sub Account creation failed");
    }
  };

  const connect = useCallback(async () => {
    if (isConnecting || !provider) return;
    
    setIsConnecting(true);
    setError(null);
    setStatus("Connecting...");

    try {
      // Connect to Base Account
      const accounts = await provider.request({
        method: "eth_requestAccounts",
        params: [],
      }) as string[];

      const universalAddr = accounts[0];
      setUniversalAddress(universalAddr);
      setIsConnected(true);
      setStatus("Connected");

      // Check for existing sub account or create one
      await checkForSubAccount(universalAddr);
      
    } catch (err: any) {
      console.error("Connection failed:", err);
      setError(err.message || "Connection failed");
      setStatus("Connection failed");
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, provider]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setUniversalAddress(null);
    setSubAccount(null);
    setStatus("Disconnected");
    setError(null);
  }, []);

  const sendCalls = useCallback(async (calls: Array<{ to: string; data: string; value?: string }>) => {
    if (!provider) {
      throw new Error("Provider not initialized");
    }
    if (!subAccount) {
      throw new Error("Sub Account not available");
    }

    setStatus("Sending transaction...");

    try {
      const callsId = await provider.request({
        method: "wallet_sendCalls",
        params: [{
          version: "2.0",
          atomicRequired: true,
          chainId: `0x${(8453).toString(16)}`, // Base mainnet
          from: subAccount.address,
          calls: calls.map(call => ({
            to: call.to,
            data: call.data,
            value: call.value || "0x0",
          })),
          capabilities: {
            // TODO: Add paymaster URL for sponsored transactions
            // paymasterUrl: "https://paymaster.base.org",
          },
        }],
      }) as string;

      setStatus("Transaction sent successfully!");
      return callsId;
    } catch (err: any) {
      console.error("Transaction failed:", err);
      setError(err.message || "Transaction failed");
      setStatus("Transaction failed");
      throw err;
    }
  }, [subAccount, provider]);

  // Spend permission helper methods
  const getSpendPermissions = useCallback(async () => {
    if (!provider || !universalAddress || !subAccount) return [] as any[];
    try {
      return await fetchPermissions({
        account: universalAddress as `0x${string}`,
        spender: subAccount.address,
        chainId: base.id,
        provider,
      });
    } catch (err) {
      console.warn("fetchPermissions failed:", err);
      return [] as any[];
    }
  }, [provider, universalAddress, subAccount]);

  const hasSpendPermission = useCallback(async () => {
    const perms = await getSpendPermissions();
    return perms.length > 0;
  }, [getSpendPermissions]);
  const revokeSpendPermission = useCallback(async () => {
    const perms = await getSpendPermissions();
    if (!perms || perms.length === 0) {
      throw new Error("No existing spend permission to revoke");
    }
    const calls = await prepareRevokeCallData(perms[0]);
    return await sendCalls((calls as unknown) as Array<{ to: string; data: string; value?: string }>);
  }, [getSpendPermissions, sendCalls]);
  
  const updateSpendAllowance = useCallback(async (amountEth: string) => {
    if (!provider || !universalAddress || !subAccount) {
      throw new Error("Not connected");
    }
    const allowance = parseUnits(amountEth, 18);
    await requestSpendPermission({
      account: universalAddress as `0x${string}`,
      spender: subAccount.address,
      token: NATIVE_TOKEN,
      chainId: base.id,
      allowance,
      periodInDays: 30,
      provider,
    });
  }, [provider, universalAddress, subAccount]);

  return {
    isConnected,
    isConnecting,
    universalAddress,
    subAccount,
    connect,
    disconnect,
    sendCalls,
    // spend permission helpers
    getSpendPermissions,
    hasSpendPermission,
    revokeSpendPermission,
    updateSpendAllowance,
    status,
    error,
  };
}