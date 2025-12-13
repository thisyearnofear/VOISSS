import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { walletConnectorService } from '@voisss/shared';

// Initialize wallet connectors for web
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
if (projectId) {
  walletConnectorService.initializeWalletConnectors([base, baseSepolia], projectId);
}

export function getConfig() {
  return createConfig({
    chains: [base, baseSepolia],
    connectors: walletConnectorService.getConnectors(http()),
    ssr: true,
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
    },
  });
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
