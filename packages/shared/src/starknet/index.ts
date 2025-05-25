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
    voiceNFT: "0x...",
    marketplace: "0x...",
  },
  MAINNET: {
    voiceNFT: "0x...",
    marketplace: "0x...",
  },
} as const;
