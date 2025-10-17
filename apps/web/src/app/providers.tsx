"use client";

import React, { useEffect, useState } from "react";
import { createBaseAccountSDK } from "@base-org/account";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { base } from "viem/chains";

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
        const sdkInstance = createBaseAccountSDK({
          appName: 'VOISSS - Gasless Voice Platform',
          appLogoUrl: 'https://voisss.app/logo.png',
          appChainIds: [base.id],
          subAccounts: {
            creation: 'on-connect',        // Auto-create sub account
            defaultAccount: 'sub'          // Use sub account by default
          },
          // TODO: Add paymaster URL for sponsored transactions
          // paymasterUrls: {
          //   [base.id]: 'https://paymaster.base.org'
          // }
        });

        // Get the provider
        const providerInstance = sdkInstance.getProvider();
        setSdk(sdkInstance);
        setProvider(providerInstance);
      } catch (error) {
        console.error("SDK initialization failed:", error);
      }
    };

    initializeSDK();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
  <BaseContext.Provider value={sdk && provider ? { sdk, provider } : null}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
  </BaseContext.Provider>
  </QueryClientProvider>
  );
}