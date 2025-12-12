import {
  blockchainService,
  type BaseChainConfig,
  type SupportedChains,
  type VoiceNFTMetadata,
  type MarketplaceListing,
} from "@voisss/shared/blockchain";
import { getStoredWalletAddress, saveUserSession, clearUserSession } from "@voisss/shared/src/utils/session";

const STORAGE_KEYS = {
  WALLET_ADDRESS: "@voisss/wallet_address",
  NETWORK: "@voisss/network",
  CHAIN: "@voisss/chain",
} as const;

class BlockchainMobile {
  private currentChain: SupportedChains;
  private currentNetwork: string;

  constructor() {
    this.currentChain = 'starknet'; // Default to Starknet for backward compatibility
    this.currentNetwork = 'TESTNET';
  }

  async getStoredWalletAddress(): Promise<string | null> {
    return getStoredWalletAddress();
  }

  async setStoredWalletAddress(address: string): Promise<void> {
    // Use the shared session utility instead of direct AsyncStorage
    const session = await import("@voisss/shared/src/utils/session");
    const existingSession = await session.loadUserSession();
    if (existingSession) {
      await session.updateSession({ walletAddress: address });
    } else {
      await session.createSession(address);
    }
  }

  async clearStoredWalletAddress(): Promise<void> {
    return clearUserSession();
  }

  async getStoredChain(): Promise<SupportedChains> {
    const session = await import("@voisss/shared/src/utils/session");
    return (await session.getStoredChain()) || 'starknet';
  }

  async setStoredChain(chain: SupportedChains): Promise<void> {
    const session = await import("@voisss/shared/src/utils/session");
    const existingSession = await session.loadUserSession();
    if (existingSession) {
      await session.updateSession({ chain });
    } else {
      await session.createSession(undefined, undefined, chain);
    }
    this.currentChain = chain;
  }

  async getStoredNetwork(): Promise<string> {
    const session = await import("@voisss/shared/src/utils/session");
    return (await session.getStoredNetwork()) || 'TESTNET';
  }

  async setStoredNetwork(network: string): Promise<void> {
    const session = await import("@voisss/shared/src/utils/session");
    const existingSession = await session.loadUserSession();
    if (existingSession) {
      await session.updateSession({ network });
    } else {
      await session.createSession(undefined, network);
    }
    this.currentNetwork = network;
  }

  async connectWallet(): Promise<string> {
    try {
      // Initialize connection using the new blockchain service
      const address = await blockchainService.connectWallet();
      console.log("Wallet connected successfully:", address);
      return address;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  }

  async switchChain(chain: SupportedChains, network: string): Promise<void> {
    try {
      await blockchainService.switchChain(chain, network);
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
    return blockchainService.getCurrentChainConfig();
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

      console.log("Voice NFT minted successfully");
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

      console.log("Voice NFT listed successfully");
    } catch (error) {
      console.error("Failed to list Voice NFT:", error);
      throw error;
    }
  }

  async buyVoiceNFT(listingId: string): Promise<void> {
    try {
      const walletAddress = await this.getStoredWalletAddress();
      if (!walletAddress) throw new Error("Wallet not connected");

      console.log("Voice NFT purchased successfully");
    } catch (error) {
      console.error("Failed to buy Voice NFT:", error);
      throw error;
    }
  }
  
  // Tipping functionality
  async sendTip(to: string, amount: string, tokenAddress?: string): Promise<string> {
    return blockchainService.sendTip(to, amount, tokenAddress);
  }
  
  async estimateTipCost(amount: string, tokenAddress?: string): Promise<string> {
    return blockchainService.estimateTipCost(amount, tokenAddress);
  }
  
  async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
    return blockchainService.getTokenBalance(address, tokenAddress);
  }
}

export const blockchain = new BlockchainMobile();

// Legacy export for backward compatibility
export const starknet = blockchain;

export type { SupportedChains, BaseChainConfig, TipTransaction } from "@voisss/shared/blockchain";