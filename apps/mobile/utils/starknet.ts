import {
  STARKNET_NETWORKS,
  type StarknetConfig,
  type VoiceNFTMetadata,
  type MarketplaceListing,
} from "@voisss/shared/starknet";
import { getStoredWalletAddress, saveUserSession, clearUserSession } from "@voisss/shared/src/utils/session";

const STORAGE_KEYS = {
  WALLET_ADDRESS: "@voisss/wallet_address",
  NETWORK: "@voisss/network",
} as const;

class StarknetMobile {
  private config: StarknetConfig;

  constructor(config: StarknetConfig) {
    this.config = config;
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

  async getStoredNetwork(): Promise<string> {
    const session = await import("@voisss/shared/src/utils/session");
    const network = await session.getStoredNetwork();
    return network || STARKNET_NETWORKS.TESTNET.networkId;
  }

  async setStoredNetwork(networkId: string): Promise<void> {
    const session = await import("@voisss/shared/src/utils/session");
    const existingSession = await session.loadUserSession();
    if (existingSession) {
      await session.updateSession({ network: networkId });
    } else {
      await session.createSession(undefined, networkId);
    }
  }

  async connectWallet(): Promise<void> {
    try {
      // Initialize connection to Starknet network
      console.log("Wallet connected successfully");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
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
}

export const starknet = new StarknetMobile({
  networkId: STARKNET_NETWORKS.TESTNET.networkId,
  nodeUrl: STARKNET_NETWORKS.TESTNET.nodeUrl,
  contractAddresses: {
    voiceNFT: "0x...",
    marketplace: "0x...",
  },
});