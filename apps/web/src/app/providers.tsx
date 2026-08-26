"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createBaseAccountSDK } from "@base-org/account";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { base } from "viem/chains";
import { WagmiProvider } from "wagmi";
import { getConfig } from "@/wagmi";
import { AuthProvider } from "../contexts/AuthContext";
import { AssistantProvider } from "../contexts/AssistantContext";


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
  return context;
}

/**
 * BaseProvider — heavy wallet/SDK logic.
 *
 * Imported lazily via `dynamic()` so anonymous users never download
 * the ~200 KB Wagmi + viem bundle on the first paint.
 * Only pages that call `useBase()` or `<BaseProvider>` load it.
 */
export function BaseProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<ReturnType<
    ReturnType<typeof createBaseAccountSDK>["getProvider"]
  > | null>(null);
  const [sdk, setSdk] = useState<ReturnType<typeof createBaseAccountSDK> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeSDK = async () => {
      try {
        const sdkInstance = createBaseAccountSDK({
          appName: "VOISSS",
          appLogoUrl: `${window.location.origin}/logo.png`,
          appChainIds: [base.id],
        });
        const providerInstance = sdkInstance.getProvider();
        if (providerInstance) {
          setSdk(sdkInstance);
          setProvider(providerInstance);
        }
      } catch (error) {
        console.error("Base SDK initialization failed:", error);
        setSdk(null);
        setProvider(null);
      }
    };

    initializeSDK();
  }, []);

  const wagmiConfig = useMemo(() => getConfig(), []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BaseContext.Provider value={sdk && provider ? { sdk, provider } : null}>
          <AssistantProvider>
            <AuthProvider>{children}</AuthProvider>
          </AssistantProvider>
          {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </BaseContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}