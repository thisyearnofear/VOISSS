"use client";

import { StarknetConfig, publicProvider } from "@starknet-react/core";
import { sepolia, mainnet } from "@starknet-react/chains";

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  return (
    <StarknetConfig chains={[sepolia, mainnet]} provider={publicProvider()}>
      {children}
    </StarknetConfig>
  );
}
