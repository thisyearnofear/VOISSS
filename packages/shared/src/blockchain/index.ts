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
