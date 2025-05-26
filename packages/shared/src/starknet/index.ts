export type StarknetConfig = {
  networkId: string;
  nodeUrl: string;
  contractAddresses: {
    voiceNFT: string;
    marketplace: string;
  };
};

export const STARKNET_NETWORKS = {
  MAINNET: {
    networkId: "SN_MAIN",
    nodeUrl: "https://starknet-mainnet.infura.io/v3/",
    name: "Mainnet",
  },
  TESTNET: {
    networkId: "SN_GOERLI",
    nodeUrl: "https://starknet-goerli.infura.io/v3/",
    name: "Testnet (Goerli)",
  },
} as const;

export type StarknetNetwork = keyof typeof STARKNET_NETWORKS;

export interface VoiceNFTMetadata {
  title: string;
  description: string;
  duration: number;
  recordedAt: string;
  ipfsHash: string;
  creator: string;
}

export interface MarketplaceListing {
  tokenId: string;
  price: string;
  seller: string;
  isActive: boolean;
}

export const CONTRACT_ADDRESSES = {
  TESTNET: {
    voiceStorage: "0x545b48dd76469e984b5622e5841d2affa30155980829399e7ec7447012922e2",
    userRegistry: "0x52bb03f52e7c07d6f7053b0fc7c52c9e0c7d73ceb36fab93db3d7bbc578bb63",
    accessControl: "0x5db925a0dfe7ab9137121613ef66a32ceb48acbc9cc33091d804dd9feb983b5",
  },
  MAINNET: {
    voiceStorage: "0x...", // To be deployed to mainnet
    userRegistry: "0x...", // To be deployed to mainnet
    accessControl: "0x...", // To be deployed to mainnet
  },
} as const;
