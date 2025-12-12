import { BaseChainConfig } from './base';

export const SCROLL_CHAINS = {
  MAINNET: {
    chainId: '534352',
    chainName: 'Scroll Mainnet',
    rpcUrl: 'https://rpc.scroll.io/',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    explorerUrl: 'https://scrollscan.com/',
    isTestnet: false,
  },
  SEPOLIA: {
    chainId: '534351',
    chainName: 'Scroll Sepolia Testnet',
    rpcUrl: 'https://sepolia-rpc.scroll.io/',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    explorerUrl: 'https://sepolia.scrollscan.com/',
    isTestnet: true,
  },
} as const satisfies Record<string, BaseChainConfig>;

export type ScrollChain = keyof typeof SCROLL_CHAINS;
