
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useConnect, useDisconnect, useWalletClient } from "wagmi";
import { parseEther } from "viem";
import { base } from "viem/chains";
import {
  requestSpendPermission,
  fetchPermissions,
  getPermissionStatus,
  type SpendPermission
} from "@base-org/account/spend-permission/browser";
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  }, [isConnected, address]);

  const checkForPermission = async (userAddress: string) => {
    if (!walletClient || !SPENDER_ADDRESS) return;
    
    try {
      console.log('🔍 Checking for spend permission...');
      setIsLoadingPermissions(true);
      
      const permissions = await fetchPermissions({
        account: userAddress as `0x${string}`,
        chainId: base.id,
        spender: SPENDER_ADDRESS,
        provider: walletClient,
      });

      if (permissions.length > 0) {
        const permission = permissions[0];
        const status = await getPermissionStatus(permission);
        
        if (status.isActive) {
          console.log('✅ Active spend permission found');
          setCurrentPermission(permission);
          setPermissionActive(true);
          setStatus("Connected with spend permission");
          await AsyncStorage.setItem('spendPermissionHash', permission.hash);
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

  const handleConnect = () => {
    // Here you would typically open a modal to select a wallet connector
    // For now, we'll just use the first available one (e.g., WalletConnect)
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
    if (!walletClient || !universalAddress || !SPENDER_ADDRESS) {
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
        provider: walletClient,
      });

      console.log('✅ Spend permission granted:', permission);

      setCurrentPermission(permission);
      setPermissionActive(true);
      setStatus("Spend permission granted!");
      
      await AsyncStorage.setItem('spendPermissionHash', permission.hash);

    } catch (err: any) {
      console.error("❌ Permission request failed:", err);
      setPermissionError(err.message || "Failed to request permission");
      setStatus("Permission request failed");
      throw err;
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [walletClient, universalAddress]);

  const refreshPermissions = useCallback(async () => {
    if (!universalAddress) {
      setPermissionActive(false);
      setCurrentPermission(null);
      return;
    }
    
    await checkForPermission(universalAddress);
  }, [universalAddress, walletClient]);

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
