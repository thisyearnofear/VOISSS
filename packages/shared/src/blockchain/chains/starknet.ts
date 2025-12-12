import { BaseChainConfig } from './base';

export const STARKNET_CHAINS = {
  MAINNET: {
    chainId: 'SN_MAIN',
    chainName: 'Starknet Mainnet',
    rpcUrl: 'https://starknet-mainnet.infura.io/v3/',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    explorerUrl: 'https://starkscan.co/',
    isTestnet: false,
  },
  TESTNET: {
    chainId: 'SN_GOERLI',
    chainName: 'Starknet Goerli Testnet',
    rpcUrl: 'https://starknet-goerli.infura.io/v3/',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    explorerUrl: 'https://testnet.starkscan.co/',
    isTestnet: true,
  },
} as const satisfies Record<string, BaseChainConfig>;

export type StarknetChain = keyof typeof STARKNET_CHAINS;
