
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { walletConnectorService } from "@voisss/shared";
import { queryClient } from "./lib/query-client";

// 1. Get a project ID from https://cloud.walletconnect.com
const projectId = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID is not set");
}

// 2. Initialize wallet connectors
walletConnectorService.initializeWalletConnectors([base], projectId);

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: walletConnectorService.getConnectors(http()),
  ssr: false, // Important for React Native
});


export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

