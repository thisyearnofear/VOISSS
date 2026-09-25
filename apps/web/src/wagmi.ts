import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';

export function getConfig() {
  const connectors = [];

  // 1) Injected (MetaMask / Rabby / Brave / Phantom) — browse-first users, zero friction
  connectors.push(injected());

  // 2) Coinbase Smart Wallet — preference "all" so Base stays primary, not gate.
  //    Users get Sub Accounts as an opt-in upgrade, not a requirement.
  try {
    connectors.push(
      coinbaseWallet({
        appName: 'VOISSS',
        preference: 'all',
        overrideIsMetaMask: false,
      })
    );
  } catch (error) {
    console.warn('Coinbase Wallet connector initialization failed:', error);
  }

  // 3) WalletConnect — mobile + Farcaster Mini App + deep-link handling
  const wcProjectId =
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (wcProjectId) {
    try {
      connectors.push(
        walletConnect({
          projectId: wcProjectId,
          showQrModal: true,
          metadata: {
            name: 'VOISSS',
            description: 'License authentic human voices for AI agents — on Base.',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://voisss.netlify.app',
            icons: ['https://voisss.netlify.app/logo.png'],
          },
        })
      );
    } catch (error) {
      console.warn('WalletConnect connector initialization failed:', error);
    }
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
