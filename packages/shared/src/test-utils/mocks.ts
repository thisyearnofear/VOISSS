/**
 * Test Utilities - Mock Implementations
 * 
 * Simple mock implementations for testing that follow our core principles:
 * - ENHANCEMENT FIRST: Extend existing interfaces
 * - DRY: Reusable mock patterns
 * - MODULAR: Independent mock services
 */

import { ChainAdapter, GasOptimizedChainAdapter, VRFChainAdapter, ZkEVMChainAdapter } from '../blockchain/chains/base';
import { SCROLL_CHAINS } from '../blockchain/chains/scroll';

/**
 * Mock Chain Adapter for testing
 * Implements all optional interfaces for comprehensive testing
 */
export class MockChainAdapter implements ChainAdapter, GasOptimizedChainAdapter, VRFChainAdapter, ZkEVMChainAdapter {
  private mockResponses: Record<string, any> = {};
  private callHistory: string[] = [];

  constructor() {
    // Set default mock responses
    this.setDefaultResponses();
  }

  private setDefaultResponses(): void {
    this.mockResponses = {
      connectWallet: '0xmockaddress1234567890',
      getBalance: '1000000000000000000', // 1 ETH
      getCurrentChainId: SCROLL_CHAINS.SEPOLIA.chainId,
      sendTransaction: '0xmocktransaction1234567890',
      estimateGasCost: '15000', // Scroll gas limit
      getTokenBalance: '5000000000000000000', // 5 tokens
      getRecommendedGasPrice: '10000000000', // 10 Gwei
      estimateTotalTransactionCost: {
        gasLimit: '15000',
        gasPrice: '10000000000',
        totalCost: '150000000000000',
      },
      requestRandomness: {
        requestId: 'mock-request-123',
        transactionHash: '0xmockvrftx1234567890',
      },
      getRandomnessResult: {
        randomNumber: BigInt(42),
        proof: 'mock-proof-abc123',
      },
      generateZkProof: {
        proof: 'mock-zk-proof-xyz789',
        publicSignals: ['mock-data-hash', '0xmockaddress'],
      },
      verifyZkProof: true,
      createPrivateContent: {
        transactionHash: '0xmockprivate1234567890',
        contentId: 'mock-private-content-123',
      },
    };
  }

  // Record all method calls for verification
  private recordCall(method: string, args: any[] = []): void {
    this.callHistory.push(`${method}(${args.length > 0 ? JSON.stringify(args) : ''})`);
  }

  // Get call history for testing
  getCallHistory(): string[] {
    return this.callHistory;
  }

  // Clear call history
  clearCallHistory(): void {
    this.callHistory = [];
  }

  // Set custom response for testing specific scenarios
  setResponse(method: string, response: any): void {
    this.mockResponses[method] = response;
  }

  // Reset to default responses
  resetResponses(): void {
    this.setDefaultResponses();
  }

  // ChainAdapter methods
  async connectWallet(): Promise<string> {
    this.recordCall('connectWallet');
    return this.mockResponses.connectWallet;
  }

  async disconnectWallet(): Promise<void> {
    this.recordCall('disconnectWallet');
  }

  async signTransaction(tx: any): Promise<string> {
    this.recordCall('signTransaction', [tx]);
    return this.mockResponses.sendTransaction;
  }

  async getBalance(address: string): Promise<string> {
    this.recordCall('getBalance', [address]);
    return this.mockResponses.getBalance;
  }

  async switchChain(chainId: string): Promise<void> {
    this.recordCall('switchChain', [chainId]);
  }

  async getCurrentChainId(): Promise<string> {
    this.recordCall('getCurrentChainId');
    return this.mockResponses.getCurrentChainId;
  }

  async sendTransaction(to: string, amount: string, tokenAddress?: string): Promise<string> {
    this.recordCall('sendTransaction', [to, amount, tokenAddress]);
    return this.mockResponses.sendTransaction;
  }

  async estimateGasCost(tx: any): Promise<string> {
    this.recordCall('estimateGasCost', [tx]);
    return this.mockResponses.estimateGasCost;
  }

  async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
    this.recordCall('getTokenBalance', [address, tokenAddress]);
    return this.mockResponses.getTokenBalance;
  }

  // GasOptimizedChainAdapter methods
  async getRecommendedGasPrice(): Promise<string> {
    this.recordCall('getRecommendedGasPrice');
    return this.mockResponses.getRecommendedGasPrice;
  }

  async estimateTotalTransactionCost(tx: any): Promise<{gasLimit: string, gasPrice: string, totalCost: string}> {
    this.recordCall('estimateTotalTransactionCost', [tx]);
    return this.mockResponses.estimateTotalTransactionCost;
  }

  // VRFChainAdapter methods
  async requestRandomness(userAddress: string, callback?: string): Promise<{requestId: string, transactionHash: string}> {
    this.recordCall('requestRandomness', [userAddress, callback]);
    return this.mockResponses.requestRandomness;
  }

  async getRandomnessResult(requestId: string): Promise<{randomNumber: bigint, proof: string}> {
    this.recordCall('getRandomnessResult', [requestId]);
    return this.mockResponses.getRandomnessResult;
  }

  // ZkEVMChainAdapter methods
  async generateZkProof(data: string, userAddress: string): Promise<{proof: string, publicSignals: string[]}> {
    this.recordCall('generateZkProof', [data, userAddress]);
    return this.mockResponses.generateZkProof;
  }

  async verifyZkProof(proof: string, publicSignals: string[]): Promise<boolean> {
    this.recordCall('verifyZkProof', [proof, publicSignals]);
    return this.mockResponses.verifyZkProof;
  }

  async createPrivateContent(encryptedDataHash: string, zkProof: string, userAddress: string): Promise<{transactionHash: string, contentId: string}> {
    this.recordCall('createPrivateContent', [encryptedDataHash, zkProof, userAddress]);
    return this.mockResponses.createPrivateContent;
  }

  // Helper method to simulate VRF-based random voice selection
  async getRandomVoiceStyle(userAddress: string, voiceStyles: any[]): Promise<{style: any, randomNumber: bigint, proof: string}> {
    this.recordCall('getRandomVoiceStyle', [userAddress, voiceStyles]);
    const randomIndex = Number(this.mockResponses.getRandomnessResult.randomNumber) % voiceStyles.length;
    return {
      style: voiceStyles[randomIndex],
      randomNumber: this.mockResponses.getRandomnessResult.randomNumber,
      proof: this.mockResponses.getRandomnessResult.proof,
    };
  }
}

/**
 * Create mock blockchain service for testing
 */
export function createMockBlockchainService(chain: 'scroll' | 'starknet' = 'scroll'): any {
  const mockAdapter = new MockChainAdapter();
  
  return {
    getAdapter: () => mockAdapter,
    hasVRFSupport: () => true,
    hasZkEVMSupport: () => true,
    // Add other service methods as needed for testing
  };
}