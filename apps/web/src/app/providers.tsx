"use client";

import {
  StarknetConfig,
  publicProvider,
  argent,
  braavos,
  jsonRpcProvider,
} from "@starknet-react/core";
import { sepolia, mainnet } from "@starknet-react/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "../lib/query-client";

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  const connectors = [argent(), braavos()];

  // Custom RPC provider with explicit Sepolia configuration
  const provider = jsonRpcProvider({
    rpc: (chain) => {
      if (chain.id === sepolia.id) {
        return {
          nodeUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL ||
                   'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
        };
      }
      return {
        nodeUrl: 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7',
      };
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <StarknetConfig
        chains={[sepolia, mainnet]}
        provider={provider}
        connectors={connectors}
        autoConnect
      >
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </StarknetConfig>
    </QueryClientProvider>
  );
}
