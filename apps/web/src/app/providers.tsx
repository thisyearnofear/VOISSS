"use client";

import React, { useEffect, useState } from "react";
import { createBaseAccountSDK } from "@base-org/account";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { base } from "viem/chains";
import { AuthProvider } from "../contexts/AuthContext";

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

// Base context
const BaseContext = React.createContext<{
  sdk: ReturnType<typeof createBaseAccountSDK>;
  provider: ReturnType<ReturnType<typeof createBaseAccountSDK>["getProvider"]>;
} | null>(null);

export function useBase() {
  const context = React.useContext(BaseContext);
  // Return null during SSR or before SDK is initialized (client-side only SDK)
  return context;
}

export function BaseProvider({ children }: { children: React.ReactNode }) {
  // Store provider in state, initialize on client only (following Base docs pattern)
  const [provider, setProvider] = useState<ReturnType<
    ReturnType<typeof createBaseAccountSDK>["getProvider"]
  > | null>(null);
  const [sdk, setSdk] = useState<ReturnType<typeof createBaseAccountSDK> | null>(null);

  // Initialize SDK in useEffect (client-side only) - matches Base Account docs pattern
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Ensure we're in browser environment
        if (typeof window === 'undefined') return;
        
        // Get current domain for proper configuration
        const currentDomain = window.location.origin;
        
        const sdkInstance = createBaseAccountSDK({
          appName: 'VOISSS - Morph Your Voice',
          appLogoUrl: `${currentDomain}/logo.png`,
          appChainIds: [base.id],
          // Note: We use backend spender wallet for gasless transactions
          // No Sub Accounts needed - users grant spend permission to our backend
        });

        // Get the provider with error handling
        const providerInstance = sdkInstance.getProvider();
        
        // Verify provider is working
        if (providerInstance) {
          setSdk(sdkInstance);
          setProvider(providerInstance);
          console.log('Base Account SDK initialized successfully');
        } else {
          throw new Error('Provider initialization failed');
        }
      } catch (error) {
        console.error("SDK initialization failed:", error);
        // Set null values to prevent app crash
        setSdk(null);
        setProvider(null);
      }
    };

    initializeSDK();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
  <BaseContext.Provider value={sdk && provider ? { sdk, provider } : null}>
  <AuthProvider>
  {children}
  </AuthProvider>
  <ReactQueryDevtools initialIsOpen={false} />
  </BaseContext.Provider>
  </QueryClientProvider>
  );
}