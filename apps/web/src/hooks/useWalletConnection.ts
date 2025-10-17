"use client";

import { useEffect, useState } from 'react';
import { useAccount } from '@starknet-react/core';

/**
 * Custom hook to handle wallet connection state persistence
 * Helps debug and ensure wallet state is properly maintained across page navigation
 */
export function useWalletConnection() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const [connectionState, setConnectionState] = useState({
    address: null as string | null,
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    hasHydrated: false,
  });

  // Track connection state changes
  useEffect(() => {
    setConnectionState({
      address: address || null,
      isConnected: !!isConnected,
      isConnecting: !!isConnecting,
      isReconnecting: !!isReconnecting,
      hasHydrated: true,
    });

    // Debug logging
    console.log('🔗 Wallet Connection State:', {
      address,
      isConnected,
      isConnecting,
      isReconnecting,
      timestamp: new Date().toISOString(),
    });
  }, [address, isConnected, isConnecting, isReconnecting]);

  // Log when wallet state changes
  useEffect(() => {
    if (connectionState.hasHydrated) {
      if (isConnected && address) {
        console.log('✅ Wallet connected:', address);
      } else if (!isConnected && connectionState.address) {
        console.log('❌ Wallet disconnected');
      }
    }
  }, [isConnected, address, connectionState.hasHydrated, connectionState.address]);

  return {
    address,
    isConnected,
    isConnecting,
    isReconnecting,
    hasHydrated: connectionState.hasHydrated,
    connectionState,
  };
}