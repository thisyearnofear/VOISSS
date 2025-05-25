import { useState, useEffect, useCallback } from 'react';
import { Account, Provider, Contract, RpcProvider } from 'starknet';

interface StarknetState {
  isConnected: boolean;
  isConnecting: boolean;
  account: Account | null;
  provider: Provider | null;
  error: string | null;
}

interface StarknetActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  getBalance: () => Promise<string | null>;
}

const STARKNET_MAINNET_RPC = 'https://starknet-mainnet.public.blastapi.io';
const STARKNET_TESTNET_RPC = 'https://starknet-sepolia.public.blastapi.io';

export function useStarknet(): StarknetState & StarknetActions {
  const [state, setState] = useState<StarknetState>({
    isConnected: false,
    isConnecting: false,
    account: null,
    provider: null,
    error: null,
  });

  // Initialize provider on mount
  useEffect(() => {
    const provider = new RpcProvider({
      nodeUrl: STARKNET_TESTNET_RPC, // Using testnet for development
    });
    
    setState(prev => ({
      ...prev,
      provider,
    }));
  }, []);

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      // For mobile, we'll simulate a connection for now
      // In a real implementation, you'd integrate with a mobile wallet
      // like ArgentX mobile or Braavos mobile
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, create a mock account
      // In production, this would come from the wallet connection
      const mockAccount = new Account(
        state.provider!,
        '0x1234567890abcdef', // Mock address
        '0x1234567890abcdef'  // Mock private key (never do this in production!)
      );
      
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        account: mockAccount,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect',
      }));
    }
  }, [state.provider]);

  const disconnect = useCallback(() => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      account: null,
      error: null,
    }));
  }, []);

  const getBalance = useCallback(async (): Promise<string | null> => {
    if (!state.account || !state.provider) {
      return null;
    }

    try {
      // Get ETH balance (ETH contract address on Starknet)
      const ethContractAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      
      // This is a simplified balance check
      // In a real app, you'd use the proper contract ABI
      const balance = await state.provider.getBalance(state.account.address);
      return balance.toString();
    } catch (error) {
      console.error('Failed to get balance:', error);
      return null;
    }
  }, [state.account, state.provider]);

  return {
    ...state,
    connect,
    disconnect,
    getBalance,
  };
}

// Hook for just the connection status (used in the layout)
export function useStarknetStatus() {
  const { isConnected, isConnecting, error } = useStarknet();
  return { isConnected, isConnecting, error };
}
