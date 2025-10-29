
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";
import { queryClient } from "./lib/query-client";

// 1. Get a project ID from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set");
}

// 2. Create wagmi config
const metadata = {
  name: "VOISSS",
  description: "VOISSS Mobile App",
  url: "https://voisss.app", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    walletConnect({ projectId, metadata, showQrModal: false }),
  ],
  ssr: false, // Important for React Native
});


export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

