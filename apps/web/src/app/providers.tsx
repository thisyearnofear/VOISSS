"use client";

import {
  StarknetConfig,
  publicProvider,
  argent,
  braavos,
} from "@starknet-react/core";
import { sepolia, mainnet } from "@starknet-react/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "../lib/query-client";

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  const connectors = [argent(), braavos()];

  return (
    <QueryClientProvider client={queryClient}>
      <StarknetConfig
        chains={[sepolia, mainnet]}
        provider={publicProvider()}
        connectors={connectors}
      >
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </StarknetConfig>
    </QueryClientProvider>
  );
}
