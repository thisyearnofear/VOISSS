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
  
  // ============================================
  // zkEVM Privacy Methods
  // ============================================
  
  /**
   * Check if current chain supports zkEVM privacy features
   */
  hasZkEVMSupport(): boolean {
    const adapter = this.getAdapter();
    return 'generateZkProof' in adapter && 
           'verifyZkProof' in adapter && 
           'createPrivateContent' in adapter;
  }
  
  /**
   * Generate zk proof for private content ownership
   * Only available on chains that support zkEVM (currently Scroll)
   */
  async generateZkProof(data: string, userAddress: string): Promise<{proof: string, publicSignals: string[]}> {
    const adapter = this.getAdapter();
    
    if (!this.hasZkEVMSupport()) {
      throw new Error(`zkEVM privacy features are not supported on ${this.currentChain} chain`);
    }
    
    return adapter.generateZkProof!(data, userAddress);
  }
  
  /**
   * Verify zk proof on-chain
   * Only available on chains that support zkEVM (currently Scroll)
   */
  async verifyZkProof(proof: string, publicSignals: string[]): Promise<boolean> {
    const adapter = this.getAdapter();
    
    if (!this.hasZkEVMSupport()) {
      throw new Error(`zkEVM privacy features are not supported on ${this.currentChain} chain`);
    }
    
    return adapter.verifyZkProof!(proof, publicSignals);
  }
  
  /**
   * Create private content with zk proof
   * Only available on chains that support zkEVM (currently Scroll)
   */
  async createPrivateContent(encryptedDataHash: string, zkProof: string, userAddress: string): Promise<{transactionHash: string, contentId: string}> {
    const adapter = this.getAdapter();
    
    if (!this.hasZkEVMSupport()) {
      throw new Error(`zkEVM privacy features are not supported on ${this.currentChain} chain`);
    }
    
    return adapter.createPrivateContent!(encryptedDataHash, zkProof, userAddress);
  }
  
  /**
   * Complete privacy workflow: Encrypt → Generate Proof → Verify → Store
   * Automatically handles the full zkEVM privacy lifecycle
   */
  async createPrivateRecording(audioDataHash: string, userAddress: string): Promise<{
    encryptedDataHash: string;
    zkProof: string;
    publicSignals: string[];
    transactionHash: string;
    contentId: string;
  }> {
    const adapter = this.getAdapter();
    
    if (!this.hasZkEVMSupport()) {
      throw new Error(`zkEVM privacy features are not supported on ${this.currentChain} chain`);
    }
    
    // Check if adapter has the complete privacy workflow method
    if ('createPrivateRecording' in adapter && typeof adapter.createPrivateRecording === 'function') {
      return adapter.createPrivateRecording!(audioDataHash, userAddress);
    }
    
    // Fallback to manual workflow
    const encryptedDataHash = 'encrypted-' + audioDataHash;
    const { proof: zkProof, publicSignals } = await this.generateZkProof(encryptedDataHash, userAddress);
    const isValid = await this.verifyZkProof(zkProof, publicSignals);
    
    if (!isValid) {
      throw new Error('zk proof verification failed');
    }
    
    return this.createPrivateContent(encryptedDataHash, zkProof, userAddress);
  }
  
  /**
   * Create private recording with metadata
   * Enhanced version that includes metadata in the privacy workflow
   */
  async createPrivateRecordingWithMetadata(
    audioDataHash: string, 
    userAddress: string,
    metadata: BaseRecordingMetadata
  ): Promise<{
    encryptedDataHash: string;
    zkProof: string;
    publicSignals: string[];
    transactionHash: string;
    contentId: string;
    metadata: BaseRecordingMetadata;
  }> {
    // Include metadata in the encrypted data
    const metadataString = JSON.stringify(metadata);
    const dataWithMetadata = `${audioDataHash}:${metadataString}`;
    
    const result = await this.createPrivateRecording(dataWithMetadata, userAddress);
    
    return { ...result, metadata };
  }
  
  // ============================================
  // VRF-Based Community Voting
  // ============================================
  
  /**
   * Create a community vote using VRF for fair selection
   * Used for challenge winners, featured content, etc.
   */
  async createCommunityVote(
    voteOptions: string[],
    voteTitle: string,
    voteDescription: string,
    userAddress: string
  ): Promise<{
    voteId: string;
    transactionHash: string;
    randomSeed: bigint;
    proof: string;
  }> {
    if (!this.hasVRFSupport()) {
      throw new Error(`VRF-based voting requires VRF support, not available on ${this.currentChain}`);
    }
    
    try {
      console.log(`🗳️ Creating community vote: ${voteTitle}`);
      
      // Generate random seed using VRF for fairness
      const { randomNumber: randomSeed, proof } = await this.getVerifiableRandomNumber(userAddress);
      
      // Mock vote creation for now
      const voteId = 'vote-' + Math.random().toString(36).substring(2, 15);
      const transactionHash = '0x' + Math.random().toString(16).substring(2, 66);
      
      console.log(`✅ Community vote created`);
      console.log(`   Vote ID: ${voteId}`);
      console.log(`   Options: ${voteOptions.length}`);
      console.log(`   Random seed: ${randomSeed.toString()}`);
      
      return { voteId, transactionHash, randomSeed, proof };
      
    } catch (error) {
      console.error('Community vote creation failed:', error);
      throw new Error(`Failed to create community vote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Cast a vote in a community vote
   */
  async castVote(
    voteId: string,
    selectedOption: string,
    userAddress: string
  ): Promise<{
    success: boolean;
    transactionHash: string;
    voteReceipt: string;
  }> {
    try {
      console.log(`🗳️ Casting vote in vote: ${voteId}`);
      console.log(`   Selected: ${selectedOption}`);
      
      // Mock vote casting for now
      const transactionHash = '0x' + Math.random().toString(16).substring(2, 66);
      const voteReceipt = 'receipt-' + Math.random().toString(36).substring(2, 15);
      
      console.log(`✅ Vote cast successfully`);
      
      return { success: true, transactionHash, voteReceipt };
      
    } catch (error) {
      console.error('Vote casting failed:', error);
      throw new Error(`Failed to cast vote: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Determine vote winner using VRF for fair selection
   */
  async determineVoteWinner(
    voteId: string,
    voteOptions: string[],
    votesCast: Record<string, number>
  ): Promise<{
    winningOption: string;
    winnerIndex: number;
    randomSeed: bigint;
    proof: string;
    isTie: boolean;
  }> {
    if (!this.hasVRFSupport()) {
      throw new Error(`VRF-based voting requires VRF support, not available on ${this.currentChain}`);
    }
    
    try {
      console.log(`🎉 Determining vote winner for: ${voteId}`);
      
      // Use VRF for fair winner selection in case of tie
      const { randomNumber: randomSeed, proof } = await this.getVerifiableRandomNumber('vote-system');
      
      // Find the option with most votes
      const maxVotes = Math.max(...Object.values(votesCast));
      const winningOptions = Object.entries(votesCast)
        .filter(([_, votes]) => votes === maxVotes)
        .map(([option]) => option);
      
      let winningOption: string;
      let winnerIndex: number;
      let isTie = false;
      
      if (winningOptions.length === 1) {
        // Clear winner
        winningOption = winningOptions[0];
        winnerIndex = voteOptions.indexOf(winningOption);
        isTie = false;
      } else {
        // Tie - use VRF for fair selection
        isTie = true;
        const randomIndex = Number(randomSeed % BigInt(winningOptions.length));
        winningOption = winningOptions[randomIndex];
        winnerIndex = voteOptions.indexOf(winningOption);
        
        console.log(`⚖️ Tie broken using VRF: selected option ${randomIndex}`);
      }
      
      console.log(`✅ Vote winner determined`);
      console.log(`   Winner: ${winningOption}`);
      console.log(`   Votes: ${votesCast[winningOption] || 0}`);
      console.log(`   Tie: ${isTie}`);
      
      return { winningOption, winnerIndex, randomSeed, proof, isTie };
      
    } catch (error) {
      console.error('Vote winner determination failed:', error);
      throw new Error(`Failed to determine vote winner: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Select challenge winner using VRF for fairness
   * Used for Scroll voice challenges
   */
  async selectChallengeWinner(
    challengeId: string,
    participants: string[],
    submissions: string[]
  ): Promise<{
    winnerAddress: string;
    winningSubmission: string;
    randomSeed: bigint;
    proof: string;
  }> {
    if (!this.hasVRFSupport()) {
      throw new Error(`VRF-based winner selection requires VRF support, not available on ${this.currentChain}`);
    }
    
    try {
      console.log(`🏆 Selecting challenge winner for: ${challengeId}`);
      console.log(`   Participants: ${participants.length}`);
      console.log(`   Submissions: ${submissions.length}`);
      
      // Use VRF for fair winner selection
      const { randomNumber: randomSeed, proof } = await this.getVerifiableRandomNumber(challengeId);
      
      // Select winner using VRF
      const winnerIndex = Number(randomSeed % BigInt(participants.length));
      const winnerAddress = participants[winnerIndex];
      const winningSubmission = submissions[winnerIndex];
      
      console.log(`✅ Challenge winner selected`);
      console.log(`   Winner: ${winnerAddress}`);
      console.log(`   Submission: ${winningSubmission}`);
      console.log(`   VRF proof: ${proof.substring(0, 20)}...`);
      
      return { winnerAddress, winningSubmission, randomSeed, proof };
      
    } catch (error) {
      console.error('Challenge winner selection failed:', error);
      throw new Error(`Failed to select challenge winner: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
