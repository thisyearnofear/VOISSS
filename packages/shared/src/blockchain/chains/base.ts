export interface BaseChainConfig {
  chainId: string;
  chainName: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  explorerUrl: string;
  isTestnet: boolean;
}

export interface ChainAdapter {
  connectWallet(): Promise<string>;
  disconnectWallet(): Promise<void>;
  signTransaction(tx: any): Promise<string>;
  getBalance(address: string): Promise<string>;
  switchChain(chainId: string): Promise<void>;
  getCurrentChainId(): Promise<string>;
  
  // Payment-related methods for tipping functionality
  sendTransaction(to: string, amount: string, tokenAddress?: string): Promise<string>;
  estimateGasCost(tx: any): Promise<string>;
  getTokenBalance(address: string, tokenAddress: string): Promise<string>;
}

export interface TipTransaction {
  from: string;
  to: string;
  amount: string;
  token?: string; // Optional token address for ERC20 tips
  chain: string;
  network: string;
  timestamp: number;
  message?: string;
}

export type SupportedChains = 'starknet' | 'scroll' | 'ethereum';
