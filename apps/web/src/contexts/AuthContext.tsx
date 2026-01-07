"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useBaseAccount } from '../hooks/useBaseAccount';
import { useBase } from '../app/providers';
import { PLATFORM_CONFIG, meetsCreatorRequirements } from '@voisss/shared/config/platform';

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isCheckingSession: boolean;
  address: string | null;
  subAccount: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
  
  // Creator Eligibility
  creatorBalance: bigint | null;
  isCreatorEligible: boolean;
  isCheckingEligibility: boolean;
  eligibilityError: string | null;
  refreshCreatorStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const baseContext = useBase();
  const {
    isConnected,
    universalAddress,
    connect,
    disconnect
  } = useBaseAccount();

  // Global auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionAddress, setSessionAddress] = useState<string | null>(null);

  // Creator eligibility state
  const [creatorBalance, setCreatorBalance] = useState<bigint | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  // Check for existing session on app load
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Check if we have a valid session cookie
        const response = await fetch('/api/auth/verify-session', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            setSessionAddress(data.address || null);
          }
        }
      } catch (error) {
        // Silent failure - user will need to sign in
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkExistingSession();

    // Safety timeout - don't leave isCheckingSession as true forever
    const timeout = setTimeout(() => {
      setIsCheckingSession(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  // Sync authentication state with Base Account connection
  useEffect(() => {
    // Only sync if we're not checking session
    if (!isCheckingSession) {
      if (isConnected && !isAuthenticated) {
        setIsAuthenticated(true);
      } else if (!isConnected && isAuthenticated && !isAuthenticating && !sessionAddress) {
        // Only clear auth if we're sure there's no Base Account connection,
        // we're not in the middle of a sign-in process,
        // AND we don't have a valid session address from a restored session
        setIsAuthenticated(false);
      }
    }
  }, [isConnected, isCheckingSession, isAuthenticated, isAuthenticating, sessionAddress]);

  // Fetch creator eligibility when address changes
  const refreshCreatorStatus = useCallback(async () => {
    const addressToCheck = universalAddress || sessionAddress;
    if (!addressToCheck) {
      setCreatorBalance(null);
      return;
    }

    setIsCheckingEligibility(true);
    setEligibilityError(null);

    try {
      const response = await fetch('/api/user/token-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: addressToCheck,
          tokenAddress: PLATFORM_CONFIG.token.address,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch token balance');
      }

      const data = await response.json();
      setCreatorBalance(BigInt(data.balance || 0));
    } catch (err) {
      console.error('Error fetching creator balance:', err);
      setEligibilityError(err instanceof Error ? err.message : 'Unknown error');
      setCreatorBalance(BigInt(0));
    } finally {
      setIsCheckingEligibility(false);
    }
  }, [universalAddress, sessionAddress]);

  // Check eligibility when authenticated address changes
  useEffect(() => {
    const addressToCheck = universalAddress || sessionAddress;
    if (addressToCheck && isAuthenticated) {
      refreshCreatorStatus();
    }
  }, [universalAddress, sessionAddress, isAuthenticated, refreshCreatorStatus]);

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
          subAccount: address, // Use the address directly since we don't have a subAccount object
        }),
      });

      if (!verifyRes.ok) {
        const error = await verifyRes.json();
        throw new Error(error.details || 'Authentication failed');
      }

      console.log('✅ Signed in with Base Account successfully');
      setIsAuthenticated(true);

    } catch (err) {
      console.error('Sign in failed:', err);
      setError(err instanceof Error ? err.message : 'Sign in failed');
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, [baseContext, isConnected, connect]);

  const signOut = useCallback(async () => {
    try {
      // Clear session cookie
      await fetch('/api/auth/logout', { method: 'POST' });

      // Disconnect wallet
      if (disconnect) {
        await disconnect();
      }

      setIsAuthenticated(false);
      setSessionAddress(null);
      setError(null);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }, [disconnect]);

  const value: AuthContextType = {
    isAuthenticated,
    isAuthenticating,
    isCheckingSession,
    address: universalAddress || sessionAddress || null,
    subAccount: universalAddress || sessionAddress || null,
    signIn,
    signOut,
    error,
    creatorBalance,
    isCreatorEligible: creatorBalance !== null ? meetsCreatorRequirements(creatorBalance) : false,
    isCheckingEligibility,
    eligibilityError,
    refreshCreatorStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}