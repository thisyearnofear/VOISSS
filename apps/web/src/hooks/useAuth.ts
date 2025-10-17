/**
 * Unified auth hook - single source of truth for authentication
 * Handles wallet connection + signature-based auth
 */

import { useCallback, useState } from 'react';
import { useBaseAccount } from './useBaseAccount';
import { useBase } from '../app/providers';
import { buildSignInMessage } from '../lib/auth';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  address: string | null;
  subAccount: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

// Typed shape for Base Account `wallet_connect` response
type WalletConnectResponse = {
  accounts: Array<{
    address: string;
    capabilities: {
      signInWithEthereum?: {
        message: string;
        signature: `0x${string}`;
      };
    };
  }>;
};

export function useAuth(): UseAuthReturn {
  const baseContext = useBase();
  const {
    isConnected,
    universalAddress,
    subAccount,
    connect,
    disconnect
  } = useBaseAccount();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      // Ensure Base SDK provider is available
      if (!baseContext || !baseContext.provider) {
        throw new Error('Base Account SDK not initialized. Please refresh the page.');
      }

      const provider = baseContext.provider;

      // Ensure wallet is connected (creates Sub Account if configured)
      if (!isConnected && connect) {
        await connect();
      }

      if (!provider) {
        throw new Error('Base Account provider not available');
      }

      // Request server-generated nonce to prevent replay attacks
      const nonceRes = await fetch('/api/auth/nonce', { method: 'POST' });
      if (!nonceRes.ok) {
        throw new Error(`Failed to fetch nonce: ${nonceRes.status}`);
      }
      const nonceData = await nonceRes.json();
      const nonce: string = nonceData?.nonce;
      if (!nonce || typeof nonce !== 'string') {
        throw new Error('Invalid nonce response from server');
      }

      // Connect and authenticate using Base Account's wallet_connect method
      const result = await provider.request({
        method: 'wallet_connect',
        params: [{
          version: '1',
          capabilities: {
            signInWithEthereum: {
              nonce,
              chainId: '0x2105' // Base Mainnet (8453)
            }
          }
        }]
      }) as WalletConnectResponse;

      if (!result?.accounts?.length) {
        throw new Error('No account returned from Base provider');
      }

      const account = result.accounts[0];
      const { address } = account;
      const siew = account.capabilities.signInWithEthereum;
      if (!siew) {
        throw new Error('signInWithEthereum capability missing in response');
      }
      const { message, signature } = siew;

      // Send authentication data to backend for session creation
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          message,
          signature,
          nonce,
          subAccount: subAccount?.address,
        }),
      });

      if (!verifyRes.ok) {
        const error = await verifyRes.json();
        throw new Error(error.details || 'Authentication failed');
      }

      console.log('✅ Signed in with Base Account successfully');

    } catch (err) {
      console.error('Sign in failed:', err);
      setError(err instanceof Error ? err.message : 'Sign in failed');
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, [baseContext, subAccount, isConnected, connect]);

  const signOut = useCallback(async () => {
    try {
      // Clear session cookie
      await fetch('/api/auth/logout', { method: 'POST' });

      // Disconnect wallet
      if (disconnect) {
        await disconnect();
      }
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }, [disconnect]);

  return {
    isAuthenticated: isConnected || false, // Simple: connected = authenticated
    isAuthenticating,
    address: universalAddress || null,
    subAccount: subAccount?.address || null,
    signIn,
    signOut,
    error,
  };
}
