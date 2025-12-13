"use client";

import { useState, useEffect, useCallback } from "react";
import { useBase } from "../app/providers";
import { parseEther } from "viem";
import { base } from "viem/chains";
import {
  requestSpendPermission,
  fetchPermissions,
  getPermissionStatus,
} from "@base-org/account/spend-permission/browser";
import { crossPlatformStorage } from "@voisss/shared";

// Type for the spend permission returned by the Base Account API  
type SpendPermission = any;

const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const SPENDER_ADDRESS = process.env.NEXT_PUBLIC_SPENDER_ADDRESS as `0x${string}`;

if (!SPENDER_ADDRESS) {
  console.warn('⚠️ NEXT_PUBLIC_SPENDER_ADDRESS not configured. Gasless transactions will not work.');
}

interface UseBaseAccountReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  universalAddress: string | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;

  // Spend permission state
  permissionActive: boolean;
  currentPermission: SpendPermission | null;
  isLoadingPermissions: boolean;
  permissionError: string | null;

  // Spend permission actions
  requestPermission: () => Promise<void>;
  refreshPermissions: () => Promise<void>;

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
  const [status, setStatus] = useState("Ready to connect");
  const [error, setError] = useState<string | null>(null);

  // Permission state
  const [permissionActive, setPermissionActive] = useState<boolean>(false);
  const [currentPermission, setCurrentPermission] = useState<SpendPermission | null>(null);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

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

        // Check for existing spend permission
        await checkForPermission(universalAddr);
      }
    } catch (err) {
      console.warn("No existing connection found");
    }
  };

  const checkForPermission = async (userAddress: string) => {
    if (!provider || !SPENDER_ADDRESS) return;

    try {
      console.log('🔍 Checking for spend permission...');
      setIsLoadingPermissions(true);

      const permissions = await fetchPermissions({
        account: userAddress as `0x${string}`,
        chainId: 8453,
        spender: SPENDER_ADDRESS,
        provider,
      });

      if (permissions.length > 0) {
        const permission = permissions[0];
        const status = await getPermissionStatus(permission);

        if (status.isActive) {
          console.log('✅ Active spend permission found');
          setCurrentPermission(permission);
          setPermissionActive(true);
          setStatus("Connected with spend permission");

          // Store permission hash using cross-platform storage
          await crossPlatformStorage.setItem('spendPermissionHash', (permission as any).hash);
        } else {
          console.log('⚠️ Permission exists but is not active');
          setPermissionActive(false);
          setStatus("Connected (permission inactive)");
        }
      } else {
        console.log('⚠️ No spend permission found');
        setPermissionActive(false);
        setStatus("Connected (no permission)");
      }
    } catch (err) {
      console.error("❌ Failed to check permission:", err);
      setPermissionError("Failed to check spend permission");
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const connect = useCallback(async () => {
    if (isConnecting || !provider) return;

    setIsConnecting(true);
    setError(null);
    setStatus("Connecting...");

    try {
      const accounts = await provider.request({
        method: "eth_requestAccounts",
        params: [],
      }) as string[];

      const universalAddr = accounts[0];
      setUniversalAddress(universalAddr);
      setIsConnected(true);
      setStatus("Connected");

      // Check for existing permission
      await checkForPermission(universalAddr);

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
    setCurrentPermission(null);
    setPermissionActive(false);
    setStatus("Disconnected");
    setError(null);
    await crossPlatformStorage.removeItem('spendPermissionHash');
  }, []);

  const requestPermission = useCallback(async () => {
    if (!provider || !universalAddress || !SPENDER_ADDRESS) {
      throw new Error("Not connected or spender not configured");
    }

    try {
      setStatus("Requesting spend permission...");
      setIsLoadingPermissions(true);
      setPermissionError(null);

      console.log('📝 Requesting spend permission for gasless transactions...');

      // Request spend permission (ONE-TIME POPUP)
      const permission = await requestSpendPermission({
        account: universalAddress as `0x${string}`,
        spender: SPENDER_ADDRESS,
        token: NATIVE_TOKEN,
        chainId: 8453,
        allowance: parseEther("10"), // 10 ETH max per period
        periodInDays: 30, // Monthly reset
        provider,
      });

      console.log('✅ Spend permission granted:', permission);

      setCurrentPermission(permission);
      setPermissionActive(true);
      setStatus("Spend permission granted!");

      // Store permission hash using cross-platform storage
      await crossPlatformStorage.setItem('spendPermissionHash', (permission as any).hash);

    } catch (err: any) {
      console.error("❌ Permission request failed:", err);
      setPermissionError(err.message || "Failed to request permission");
      setStatus("Permission request failed");
      throw err;
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [provider, universalAddress]);

  const refreshPermissions = useCallback(async () => {
    if (!universalAddress) {
      setPermissionActive(false);
      setCurrentPermission(null);
      return;
    }

    await checkForPermission(universalAddress);
  }, [universalAddress, provider]);

  return {
    isConnected,
    isConnecting,
    universalAddress,
    connect,
    disconnect,
    permissionActive,
    currentPermission,
    isLoadingPermissions,
    permissionError,
    requestPermission,
    refreshPermissions,
    status,
    error,
  };
}