import { BaseChainConfig, ChainAdapter, SupportedChains, TipTransaction } from './chains/base';
import { STARKNET_CHAINS, StarknetChain } from './chains/starknet';
import { SCROLL_CHAINS, ScrollChain } from './chains/scroll';
import { StarknetAdapter } from './adapters/starknetAdapter';
import { ScrollAdapter } from './adapters/scrollAdapter';

export * from './chains/base';
export * from './chains/starknet';
export * from './chains/scroll';

export const ALL_CHAINS = {
  starknet: STARKNET_CHAINS,
  scroll: SCROLL_CHAINS,
} as const satisfies Record<SupportedChains, Record<string, BaseChainConfig>>;

export type AllChains = {
  starknet: StarknetChain;
  scroll: ScrollChain;
  ethereum: never; // Add ethereum to satisfy the type, but it won't be used
};

export interface BlockchainServiceConfig {
  defaultChain: SupportedChains;
  defaultNetwork: string; // e.g., 'MAINNET', 'TESTNET', 'SEPOLIA'
  adapters: Record<SupportedChains, ChainAdapter>;
}

class BlockchainService {
  private config: BlockchainServiceConfig;
  private currentChain: SupportedChains;
  private currentNetwork: string;

  constructor(config: BlockchainServiceConfig) {
    this.config = config;
    this.currentChain = config.defaultChain;
    this.currentNetwork = config.defaultNetwork;
  }

  getCurrentChainConfig(): BaseChainConfig {
    const chainConfig = ALL_CHAINS[this.currentChain][this.currentNetwork as keyof typeof ALL_CHAINS[SupportedChains]];
    if (!chainConfig) {
      throw new Error(`Chain configuration not found for ${this.currentChain}:${this.currentNetwork}`);
    }
    return chainConfig;
  }

  async getCurrentChainId(): Promise<string> {
    return this.getCurrentChainConfig().chainId;
  }

  getAdapter(): ChainAdapter {
    return this.config.adapters[this.currentChain];
  }

  async switchChain(chain: SupportedChains, network: string): Promise<void> {
    if (!ALL_CHAINS[chain][network as keyof typeof ALL_CHAINS[SupportedChains]]) {
      throw new Error(`Chain ${chain}:${network} is not supported`);
    }
    
    this.currentChain = chain;
    this.currentNetwork = network;
    
    // Chain-specific switching logic would go here
    await this.getAdapter().switchChain(
      ALL_CHAINS[chain][network as keyof typeof ALL_CHAINS[SupportedChains]].chainId
    );
  }

  async connectWallet(): Promise<string> {
    return this.getAdapter().connectWallet();
  }

  async disconnectWallet(): Promise<void> {
    return this.getAdapter().disconnectWallet();
  }

  async signTransaction(tx: any): Promise<string> {
    return this.getAdapter().signTransaction(tx);
  }

  async getBalance(address: string): Promise<string> {
    return this.getAdapter().getBalance(address);
  }
  
  // Tipping and payment functionality
  async sendTip(to: string, amount: string, tokenAddress?: string): Promise<string> {
    const from = await this.connectWallet();
    const chainConfig = await this.getCurrentChainConfig();
    
    const tipTx: TipTransaction = {
      from,
      to,
      amount,
      token: tokenAddress,
      chain: this.currentChain,
      network: this.currentNetwork,
      timestamp: Date.now(),
    };
    
    return this.getAdapter().sendTransaction(to, amount, tokenAddress);
  }
  
  async estimateTipCost(amount: string, tokenAddress?: string): Promise<string> {
    const mockTx = {
      to: '0xrecipient',
      amount,
      token: tokenAddress,
    };
    return this.getAdapter().estimateGasCost(mockTx);
  }
  
  /**
   * Get recommended gas price for current chain
   * Falls back to default if not supported
   */
  async getRecommendedGasPrice(): Promise<string> {
    const adapter = this.getAdapter();
    
    // Check if adapter supports gas optimization (currently only Scroll)
    if ('getRecommendedGasPrice' in adapter && typeof adapter.getRecommendedGasPrice === 'function') {
      return adapter.getRecommendedGasPrice();
    }
    
    // Default gas price for chains without optimization
    return '20000000000'; // 20 Gwei
  }
  
  /**
   * Estimate total transaction cost including gas
   * Only available for gas-optimized chains (currently Scroll)
   */
  async estimateTotalTransactionCost(tx: any): Promise<{
    gasLimit: string;
    gasPrice: string;
    totalCost: string;
    isOptimized: boolean;
  }> {
    const adapter = this.getAdapter();
    
    // Check if adapter supports advanced gas estimation
    if ('estimateTotalTransactionCost' in adapter && typeof adapter.estimateTotalTransactionCost === 'function') {
      const result = await adapter.estimateTotalTransactionCost(tx);
      return { ...result, isOptimized: true };
    }
    
    // Fallback for non-optimized chains
    const gasLimit = await this.estimateTipCost(tx.amount, tx.token);
    const gasPrice = await this.getRecommendedGasPrice();
    const totalCost = (BigInt(gasLimit) * BigInt(gasPrice)).toString();
    
    return { gasLimit, gasPrice, totalCost, isOptimized: false };
  }
  
  /**
   * Compare gas costs between chains
   * Useful for showing Scroll's cost advantage
   */
  async compareChainGasCosts(tx: any): Promise<{
    currentChain: {
      chain: string;
      gasLimit: string;
      gasPrice: string;
      totalCost: string;
      isOptimized: boolean;
    };
    comparisonChain?: {
      chain: string;
      gasLimit: string;
      gasPrice: string;
      totalCost: string;
      isOptimized: boolean;
    };
    savingsPercentage?: number;
  }> {
    // Get current chain estimation
    const currentEstimation = await this.estimateTotalTransactionCost(tx);
    
    // For now, we'll compare with a mock Ethereum-like chain
    // In future, this could compare with actual Starknet costs
    const mockEthereumGasLimit = '21000'; // Standard Ethereum gas limit
    const mockEthereumGasPrice = '30000000000'; // 30 Gwei
    const mockEthereumTotalCost = (BigInt(mockEthereumGasLimit) * BigInt(mockEthereumGasPrice)).toString();
    
    // Calculate savings if current chain is optimized
    let savingsPercentage: number | undefined;
    if (currentEstimation.isOptimized) {
      const ethereumCost = BigInt(mockEthereumTotalCost);
      const currentCost = BigInt(currentEstimation.totalCost);
      savingsPercentage = ethereumCost > currentCost
        ? Number(((ethereumCost - currentCost) * 100n) / ethereumCost)
        : undefined;
    }
    
    return {
      currentChain: {
        chain: this.currentChain,
        ...currentEstimation
      },
      comparisonChain: {
        chain: 'ethereum',
        gasLimit: mockEthereumGasLimit,
        gasPrice: mockEthereumGasPrice,
        totalCost: mockEthereumTotalCost,
        isOptimized: false
      },
      savingsPercentage
    };
  }
  
  // ============================================
  // VRF (Verifiable Random Function) Methods
  // ============================================
  
  /**
   * Check if current chain supports VRF
   */
  hasVRFSupport(): boolean {
    const adapter = this.getAdapter();
    return 'requestRandomness' in adapter && 'getRandomnessResult' in adapter;
  }
  
  /**
   * Request randomness from chain's VRF service
   * Only available on chains that support VRF (currently Scroll)
   */
  async requestRandomness(userAddress: string, callback?: string): Promise<{requestId: string, transactionHash: string}> {
    const adapter = this.getAdapter();
    
    if (!this.hasVRFSupport()) {
      throw new Error(`VRF is not supported on ${this.currentChain} chain`);
    }
    
    return adapter.requestRandomness!(userAddress, callback);
  }
  
  /**
   * Get randomness result from chain's VRF service
   * Only available on chains that support VRF (currently Scroll)
   */
  async getRandomnessResult(requestId: string): Promise<{randomNumber: bigint, proof: string}> {
    const adapter = this.getAdapter();
    
    if (!this.hasVRFSupport()) {
      throw new Error(`VRF is not supported on ${this.currentChain} chain`);
    }
    
    return adapter.getRandomnessResult!(requestId);
  }
  
  /**
   * Complete VRF workflow: Request and get random number
   * Automatically handles the full VRF lifecycle
   */
  async getVerifiableRandomNumber(userAddress: string): Promise<{randomNumber: bigint, proof: string, requestId: string}> {
    const adapter = this.getAdapter();
    
    if (!this.hasVRFSupport()) {
      throw new Error(`VRF is not supported on ${this.currentChain} chain`);
    }
    
    // Check if adapter has the complete VRF workflow method
    if ('getVerifiableRandomNumber' in adapter && typeof adapter.getVerifiableRandomNumber === 'function') {
      return adapter.getVerifiableRandomNumber!(userAddress);
    }
    
    // Fallback to manual workflow
    const { requestId } = await this.requestRandomness(userAddress);
    const { randomNumber, proof } = await this.getRandomnessResult(requestId);
    
    return { randomNumber, proof, requestId };
  }
  
  /**
   * Get random voice style using VRF for fair selection
   * Used in "Surprise Me" feature
   */
  async getRandomVoiceStyle(userAddress: string, voiceStyles: any[]): Promise<{style: any, randomNumber: bigint, proof: string}> {
    if (!this.hasVRFSupport()) {
      // Fallback to client-side randomness if VRF not available
      console.warn(`VRF not available on ${this.currentChain}, using client-side randomness`);
      const randomIndex = Math.floor(Math.random() * voiceStyles.length);
      return {
        style: voiceStyles[randomIndex],
        randomNumber: BigInt(randomIndex),
        proof: 'client-side-randomness'
      };
    }
    
    const adapter = this.getAdapter();
    
    // Check if adapter has the voice style helper method
    if ('getRandomVoiceStyle' in adapter && typeof adapter.getRandomVoiceStyle === 'function') {
      return adapter.getRandomVoiceStyle!(userAddress, voiceStyles);
    }
    
    // Fallback to generic VRF workflow
    const { randomNumber, proof } = await this.getVerifiableRandomNumber(userAddress);
    const randomIndex = Number(randomNumber % BigInt(voiceStyles.length));
    
    return { style: voiceStyles[randomIndex], randomNumber, proof };
  }
  
  /**
   * Generate fair random reward using VRF
   * Used for gamification and community features
   */
  async generateFairReward(userAddress: string, rewardOptions: string[]): Promise<{reward: string, randomNumber: bigint, proof: string}> {
    if (!this.hasVRFSupport()) {
      // Fallback to client-side randomness if VRF not available
      console.warn(`VRF not available on ${this.currentChain}, using client-side randomness`);
      const randomIndex = Math.floor(Math.random() * rewardOptions.length);
      return {
        reward: rewardOptions[randomIndex],
        randomNumber: BigInt(randomIndex),
        proof: 'client-side-randomness'
      };
    }
    
    const adapter = this.getAdapter();
    
    // Check if adapter has the reward helper method
    if ('generateFairReward' in adapter && typeof adapter.generateFairReward === 'function') {
      return adapter.generateFairReward!(userAddress, rewardOptions);
    }
    
    // Fallback to generic VRF workflow
    const { randomNumber, proof } = await this.getVerifiableRandomNumber(userAddress);
    const randomIndex = Number(randomNumber % BigInt(rewardOptions.length));
    
    return { reward: rewardOptions[randomIndex], randomNumber, proof };
  }
  
  async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
    return this.getAdapter().getTokenBalance(address, tokenAddress);
  }
}

export const blockchainService = new BlockchainService({
  defaultChain: 'starknet',
  defaultNetwork: 'TESTNET',
  adapters: {
    starknet: new StarknetAdapter(),
    scroll: new ScrollAdapter(),
    ethereum: new StarknetAdapter(), // Temporary for type safety
  },
});

export default BlockchainService;
