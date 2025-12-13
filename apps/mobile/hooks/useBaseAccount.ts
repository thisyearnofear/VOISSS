"use client";

import 'react-native-get-random-values';
import { polyfillWebCrypto } from 'expo-standard-web-crypto';
// Polyfill web crypto immediately
polyfillWebCrypto();

import { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useDisconnect, useWalletClient } from "wagmi";
import { parseEther } from "viem";
import { base } from "viem/chains";
// Use our local wrapper that handles the runtime import
import {
  requestSpendPermission,
  fetchPermissions,
  getPermissionStatus,
  getHash
} from "../utils/baseSpendPermission";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the SpendPermission interface locally since it's not easily exported
interface SpendPermission {
  account: string;
  spender: string;
  token: string;
  allowance: bigint;
  period: number;
  start: number;
  end: number;
  salt: bigint;
  extraData: string;
  signature?: string; // Signature might be present
}

// Minimal Provider Interface expected by the SDK
interface SDKProviderInterface {
  request(args: { method: string; params?: any[] | object }): Promise<unknown>;
  on?(event: string, listener: (...args: any[]) => void): void;
  removeListener?(event: string, listener: (...args: any[]) => void): void;
  disconnect?(): Promise<void>;
  emit?: (event: string, ...args: any[]) => void;
}

// --- TODO: This needs to be configured in a shared file ---
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
  connect: () => void;
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
  // Wagmi hooks for wallet connection
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  // Get wallet client which we will adapt to a Provider
  const { data: walletClient } = useWalletClient();

  const [universalAddress, setUniversalAddress] = useState<string | null>(null);
  const [status, setStatus] = useState("Ready to connect");
  const [error, setError] = useState<string | null>(null);

  // Permission state
  const [permissionActive, setPermissionActive] = useState<boolean>(false);
  const [currentPermission, setCurrentPermission] = useState<SpendPermission | null>(null);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      setUniversalAddress(address);
      setStatus("Connected");
      checkForPermission(address);
    } else {
      setUniversalAddress(null);
      setIsLoadingPermissions(false);
      setPermissionActive(false);
      setCurrentPermission(null);
    }
  }, [isConnected, address, walletClient]);

  // Adapter for WalletClient to ProviderInterface
  const getProvider = useCallback((): SDKProviderInterface | null => {
    if (!walletClient) return null;

    // Check if the transport has a request method (EIP-1193ish)
    // Most viem walletClients have .request directly
    return {
      request: (args: { method: string; params?: any[] | object }) => walletClient.request(args as any),
      // Stub event methods to satisfy interface if checked at runtime
      on: () => { },
      removeListener: () => { },
      disconnect: async () => { },
      emit: () => { },
    } as any;
  }, [walletClient]);

  const checkForPermission = async (userAddress: string) => {
    const provider = getProvider();
    if (!provider || !SPENDER_ADDRESS) return;

    try {
      console.log('🔍 Checking for spend permission...');
      setIsLoadingPermissions(true);

      const permissions = await fetchPermissions({
        account: userAddress as `0x${string}`,
        chainId: base.id,
        spender: SPENDER_ADDRESS,
        provider: provider as any,
      });

      if (permissions && permissions.length > 0) {
        // Cast to our local interface
        const permission = permissions[0] as unknown as SpendPermission;
        const status = await getPermissionStatus(permission as any);

        if (status.isActive) {
          console.log('✅ Active spend permission found');
          setCurrentPermission(permission);
          setPermissionActive(true);
          setStatus("Connected with spend permission");

          // Get hash using the helper
          const hash = await getHash({ permission: permission as any, chainId: base.id });
          await AsyncStorage.setItem('spendPermissionHash', hash);
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
      // Don't set error state here to avoid blocking UI, just log it
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const handleConnect = () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  const handleDisconnect = useCallback(async () => {
    disconnect();
    await AsyncStorage.removeItem('spendPermissionHash');
  }, [disconnect]);

  const requestPermission = useCallback(async () => {
    const provider = getProvider();
    if (!provider || !universalAddress || !SPENDER_ADDRESS) {
      throw new Error("Not connected or spender not configured");
    }

    try {
      setStatus("Requesting spend permission...");
      setIsLoadingPermissions(true);
      setPermissionError(null);

      console.log('📝 Requesting spend permission for gasless transactions...');

      const permission = await requestSpendPermission({
        account: universalAddress as `0x${string}`,
        spender: SPENDER_ADDRESS,
        token: NATIVE_TOKEN,
        chainId: base.id,
        allowance: parseEther("10"), // 10 ETH max per period
        periodInDays: 30, // Monthly reset
        provider: provider as any,
      });

      console.log('✅ Spend permission granted:', permission);

      // Cast and save
      const typedPermission = permission as unknown as SpendPermission;
      setCurrentPermission(typedPermission);
      setPermissionActive(true);
      setStatus("Spend permission granted!");

      const hash = await getHash({ permission: permission as any, chainId: base.id });
      await AsyncStorage.setItem('spendPermissionHash', hash);

    } catch (err: any) {
      console.error("❌ Permission request failed:", err);
      setPermissionError(err.message || "Failed to request permission");
      setStatus("Permission request failed");
      throw err;
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [getProvider, universalAddress]);

  const refreshPermissions = useCallback(async () => {
    if (!universalAddress) {
      setPermissionActive(false);
      setCurrentPermission(null);
      return;
    }

    await checkForPermission(universalAddress);
  }, [universalAddress, getProvider]);

  return {
    isConnected,
    isConnecting,
    universalAddress: universalAddress as string | null,
    connect: handleConnect,
    disconnect: handleDisconnect,
    permissionActive,
    currentPermission,
    isLoadingPermissions,
    permissionError,
    requestPermission,
    refreshPermissions,
    status,
    error: error as string | null,
  };
}
