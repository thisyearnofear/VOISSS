/**
 * Mobile-compatible blockchain utilities for VOISSS
 * 
 * Note: This file avoids importing the blockchainService singleton from @voisss/shared
 * because it uses adapters that may have Node.js dependencies (starknet SDK with node:crypto).
 * Instead, we import only safe types and chain configurations.
 */
import {
  type BaseChainConfig,
  ALL_CHAINS,
} from "../types";

// Mobile-compatible chain types (excludes ethereum which is not in ALL_CHAINS)
export type MobileSupportedChains = keyof typeof ALL_CHAINS; // 'starknet' | 'scroll'

// Re-export types for local use
export type VoiceNFTMetadata = {
  title: string;
  description: string;
  duration: number;
  recordedAt: string;
  ipfsHash: string;
  creator: string;
};

export type MarketplaceListing = {
  tokenId: string;
  price: string;
  seller: string;
  isActive: boolean;
};

export type TipTransaction = {
  from: string;
  to: string;
  amount: string;
  token?: string;
  chain: MobileSupportedChains;
  network: string;
  timestamp: number;
  message?: string;
};

const STORAGE_KEYS = {
  WALLET_ADDRESS: "@voisss/wallet_address",
  NETWORK: "@voisss/network",
  CHAIN: "@voisss/chain",
} as const;

// Simple storage implementation for mobile
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    // In a real React Native app, we would use AsyncStorage
    // For now, using a simple in-memory store for demo purposes
    return (globalThis as any)[key] || null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    // In a real React Native app, we would use AsyncStorage
    (globalThis as any)[key] = value;
  },
  removeItem: async (key: string): Promise<void> => {
    // In a real React Native app, we would use AsyncStorage
    delete (globalThis as any)[key];
  }
};

async function getStoredWalletAddress(): Promise<string | null> {
  return await storage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
}

class BlockchainMobile {
  private currentChain: MobileSupportedChains;
  private currentNetwork: string;

  constructor() {
    this.currentChain = 'starknet'; // Default to Starknet for backward compatibility
    this.currentNetwork = 'TESTNET';
  }

  async getStoredWalletAddress(): Promise<string | null> {
    return await getStoredWalletAddress();
  }

  async setStoredWalletAddress(address: string): Promise<void> {
    // Mobile-isolated storage
    return Promise.resolve();
  }

  async clearStoredWalletAddress(): Promise<void> {
    // Mobile-isolated storage
    return Promise.resolve();
  }

  async getStoredChain(): Promise<MobileSupportedChains> {
    // Default to starknet
    return 'starknet';
  }

  async setStoredChain(chain: MobileSupportedChains): Promise<void> {
    this.currentChain = chain;
  }

  async getStoredNetwork(): Promise<string> {
    return 'TESTNET';
  }

  async setStoredNetwork(network: string): Promise<void> {
    // Mobile-isolated storage
    return Promise.resolve();
    this.currentNetwork = network;
  }

  async connectWallet(): Promise<string> {
    // TODO: Implement React Native wallet connection
    // This should use WalletConnect or similar for mobile
    console.warn("Mobile wallet connection not yet implemented");
    throw new Error("Mobile wallet connection not yet implemented. Please use WalletConnect integration.");
  }

  async switchChain(chain: MobileSupportedChains, network: string): Promise<void> {
    try {
      // Validate chain and network
      if (!(chain in ALL_CHAINS)) {
        throw new Error(`Chain ${chain} is not supported on mobile`);
      }
      const chainConfigs = ALL_CHAINS[chain];
      const chainConfig = chainConfigs[network as keyof typeof chainConfigs];
      if (!chainConfig) {
        throw new Error(`Network ${network} is not supported for chain ${chain}`);
      }

      await this.setStoredChain(chain);
      await this.setStoredNetwork(network);
      this.currentChain = chain;
      this.currentNetwork = network;
      console.log(`Switched to ${chain}:${network} successfully`);
    } catch (error) {
      console.error("Failed to switch chain:", error);
      throw error;
    }
  }

  async getCurrentChainConfig(): Promise<BaseChainConfig> {
    const chainConfigs = ALL_CHAINS[this.currentChain];
    const config = chainConfigs[this.currentNetwork as keyof typeof chainConfigs];
    if (!config) {
      throw new Error(`Chain configuration not found for ${this.currentChain}:${this.currentNetwork}`);
    }
    return config;
  }

  async disconnectWallet(): Promise<void> {
    try {
      await this.clearStoredWalletAddress();
      console.log("Wallet disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      throw error;
    }
  }

  async mintVoiceNFT(metadata: VoiceNFTMetadata): Promise<void> {
    try {
      const walletAddress = await this.getStoredWalletAddress();
      if (!walletAddress) throw new Error("Wallet not connected");

      // TODO: Implement mobile-compatible NFT minting
      console.log("Voice NFT minting not yet implemented for mobile");
    } catch (error) {
      console.error("Failed to mint Voice NFT:", error);
      throw error;
    }
  }

  async listVoiceNFT(tokenId: string, price: string): Promise<void> {
    try {
      const walletAddress = await this.getStoredWalletAddress();
      if (!walletAddress) throw new Error("Wallet not connected");

      const listing: MarketplaceListing = {
        tokenId,
        price,
        seller: walletAddress,
        isActive: true,
      };

      // TODO: Implement mobile-compatible NFT listing
      console.log("Voice NFT listing not yet implemented for mobile", listing);
    } catch (error) {
      console.error("Failed to list Voice NFT:", error);
      throw error;
    }
  }

  async buyVoiceNFT(listingId: string): Promise<void> {
    try {
      const walletAddress = await this.getStoredWalletAddress();
      if (!walletAddress) throw new Error("Wallet not connected");

      // TODO: Implement mobile-compatible NFT purchasing
      console.log("Voice NFT purchasing not yet implemented for mobile");
    } catch (error) {
      console.error("Failed to buy Voice NFT:", error);
      throw error;
    }
  }

  // Tipping functionality
  async sendTip(to: string, amount: string, tokenAddress?: string): Promise<string> {
    // TODO: Implement mobile-compatible tipping via WalletConnect
    console.warn("Tipping not yet implemented for mobile");
    throw new Error("Tipping not yet implemented for mobile");
  }

  async estimateTipCost(amount: string, tokenAddress?: string): Promise<string> {
    // Return a mock estimate for now
    return '21000'; // Base gas limit
  }

  async getBalance(address: string): Promise<string> {
    // TODO: Implement mobile-compatible balance checking
    console.warn("Native balance checking not yet implemented for mobile");
    return '0';
  }

  async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
    // TODO: Implement mobile-compatible balance checking
    console.warn("Token balance checking not yet implemented for mobile");
    return '0';
  }
}

export const blockchain = new BlockchainMobile();

// Legacy export for backward compatibility
export const starknet = blockchain;

export type { BaseChainConfig };

// Re-export MobileSupportedChains as SupportedChains for backward compatibility
export type SupportedChains = MobileSupportedChains;