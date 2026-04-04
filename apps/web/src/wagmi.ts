import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { injected, coinbaseWallet } from 'wagmi/connectors';

export function getConfig() {
  // Safely create connectors, handling potential window.ethereum conflicts
  const connectors = [];
  
  // Always add injected connector
  connectors.push(injected());
  
  // Add Coinbase Wallet with error handling
  try {
    connectors.push(
      coinbaseWallet({ 
        appName: 'VOISSS', 
        preference: 'smartWalletOnly',
        // Prevent overriding existing window.ethereum
        overrideIsMetaMask: false,
      })
    );
  } catch (error) {
    console.warn('Coinbase Wallet connector initialization failed:', error);
    // Continue without Coinbase Wallet if it fails
  }

  return createConfig({
    chains: [base, baseSepolia],
    connectors,
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
