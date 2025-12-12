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
  
  // Optional chain-specific optimizations
  getRecommendedGasPrice?(): Promise<string>;
  estimateTotalTransactionCost?(tx: any): Promise<{gasLimit: string, gasPrice: string, totalCost: string}>;
  
  // Optional VRF (Verifiable Random Function) support
  requestRandomness?(userAddress: string, callback?: string): Promise<{requestId: string, transactionHash: string}>;
  getRandomnessResult?(requestId: string): Promise<{randomNumber: bigint, proof: string}>;
  
  // Optional zkEVM Privacy support
  generateZkProof?(data: string, userAddress: string): Promise<{proof: string, publicSignals: string[]}>;
  verifyZkProof?(proof: string, publicSignals: string[]): Promise<boolean>;
  createPrivateContent?(encryptedDataHash: string, zkProof: string, userAddress: string): Promise<{transactionHash: string, contentId: string}>;
}

/**
 * Extended interface for chains that support zkEVM Privacy (currently Scroll)
 */
export interface ZkEVMChainAdapter extends ChainAdapter {
  generateZkProof(data: string, userAddress: string): Promise<{proof: string, publicSignals: string[]}>;
  verifyZkProof(proof: string, publicSignals: string[]): Promise<boolean>;
  createPrivateContent(encryptedDataHash: string, zkProof: string, userAddress: string): Promise<{transactionHash: string, contentId: string}>;
}

/**
 * Extended interface for chains that support VRF (currently Scroll)
 */
export interface VRFChainAdapter extends ChainAdapter {
  requestRandomness(userAddress: string, callback?: string): Promise<{requestId: string, transactionHash: string}>;
  getRandomnessResult(requestId: string): Promise<{randomNumber: bigint, proof: string}>;
}

/**
 * Extended interface for chains that support advanced gas optimization
 * Currently implemented by ScrollAdapter
 */
export interface GasOptimizedChainAdapter extends ChainAdapter {
  getRecommendedGasPrice(): Promise<string>;
  estimateTotalTransactionCost(tx: any): Promise<{gasLimit: string, gasPrice: string, totalCost: string}>;
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
