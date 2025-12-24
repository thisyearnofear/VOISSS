
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/query-client";

/**
 * React Native Providers
 * 
 * Note: Wagmi is NOT used in mobile because:
 * - wagmi depends on viem → ox → CJS/ESM compatibility issues in Metro
 * - Mobile uses native wallet solutions (deep linking, WalletConnect Mobile, etc.)
 * - Web3 service (apps/mobile/services/web3-service.ts) handles blockchain ops
 */

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

