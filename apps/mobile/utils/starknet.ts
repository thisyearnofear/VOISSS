import {
  STARKNET_NETWORKS,
  type StarknetConfig,
  type VoiceNFTMetadata,
  type MarketplaceListing,
} from "@voisss/shared/starknet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Nostr } from "starknet";

const STORAGE_KEYS = {
  WALLET_ADDRESS: "@voisss/wallet_address",
  NETWORK: "@voisss/network",
} as const;

class StarknetMobile {
  private config: StarknetConfig;
  private nostr: Nostr;

  constructor(config: StarknetConfig) {
    this.config = config;
    this.nostr = new Nostr();
  }

  async getStoredWalletAddress(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
  }

  async setStoredWalletAddress(address: string): Promise<void> {
    return AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address);
  }

  async clearStoredWalletAddress(): Promise<void> {
    return AsyncStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
  }

  async getStoredNetwork(): Promise<string> {
    const network = await AsyncStorage.getItem(STORAGE_KEYS.NETWORK);
    return network || STARKNET_NETWORKS.TESTNET.networkId;
  }

  async setStoredNetwork(networkId: string): Promise<void> {
    return AsyncStorage.setItem(STORAGE_KEYS.NETWORK, networkId);
  }

  async connectWallet(): Promise<void> {
    try {
      // Generate a new key pair for the wallet
      const keyPair = this.nostr.keysService.generateKeyPair();
      await this.setStoredWalletAddress(keyPair.public);

      // Initialize connection to Starknet network
      await this.nostr.relaysService.init({
        relaysUrl: [this.config.nodeUrl],
      });

      console.log("Wallet connected successfully:", keyPair.public);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      await this.clearStoredWalletAddress();
      await this.nostr.relaysService.disconnectFromRelays();
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

      // Create a new event for minting NFT
      const event = this.nostr.createEvent({
        kind: 1,
        content: JSON.stringify(metadata),
        tags: [
          ["p", walletAddress],
          ["t", "mint_voice_nft"],
        ],
      });

      // Send the event to the network
      await this.nostr.relaysService.sendEventToRelaysAsync(event);
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

      // Create a new event for listing NFT
      const event = this.nostr.createEvent({
        kind: 1,
        content: JSON.stringify(listing),
        tags: [
          ["p", walletAddress],
          ["t", "list_voice_nft"],
          ["token_id", tokenId],
        ],
      });

      // Send the event to the network
      await this.nostr.relaysService.sendEventToRelaysAsync(event);
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

      // Create a new event for buying NFT
      const event = this.nostr.createEvent({
        kind: 1,
        content: JSON.stringify({ listingId }),
        tags: [
          ["p", walletAddress],
          ["t", "buy_voice_nft"],
          ["listing_id", listingId],
        ],
      });

      // Send the event to the network
      await this.nostr.relaysService.sendEventToRelaysAsync(event);
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
