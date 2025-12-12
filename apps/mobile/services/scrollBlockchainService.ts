/**
 * Mobile Scroll Blockchain Service
 * Handles integration with Scroll Sepolia contracts for VRF and Privacy features
 */

import { createPublicClient, createWalletClient, http, getContract, keccak256, toHex } from 'viem';
import { scrollSepolia } from 'viem/chains';

// Contract ABIs
const SCROLL_VRF_ABI = [
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "callbackFunction", type: "string" },
      { name: "deadline", type: "uint256" }
    ],
    name: "requestRandomness",
    outputs: [{ name: "requestId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "requestId", type: "uint256" }],
    name: "getRandomness",
    outputs: [
      { name: "randomNumber", type: "uint256" },
      { name: "isFulfilled", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "requestId", type: "uint256" }],
    name: "verifyRandomness",
    outputs: [{ name: "isValid", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

const SCROLL_PRIVACY_ABI = [
  {
    inputs: [
      { name: "encryptedDataHash", type: "bytes32" },
      { name: "zkProof", type: "bytes" },
      { name: "isPublic", type: "bool" }
    ],
    name: "storePrivateContent",
    outputs: [{ name: "contentId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "contentId", type: "bytes32" },
      { name: "user", type: "address" },
      { name: "permissionType", type: "uint8" },
      { name: "expiresAt", type: "uint256" }
    ],
    name: "grantAccess",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "contentId", type: "bytes32" },
      { name: "user", type: "address" },
      { name: "permissionType", type: "uint8" }
    ],
    name: "hasAccess",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "contentId", type: "bytes32" },
      { name: "permissionType", type: "uint8" },
      { name: "expiresAt", type: "uint256" }
    ],
    name: "createShareLink",
    outputs: [{ name: "token", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

// Contract addresses (Scroll Sepolia)
const SCROLL_VRF_ADDRESS = "0x50a0365A3BD6a3Ab4bC31544A955Ba4974Fc7208" as const;
const SCROLL_PRIVACY_ADDRESS = "0x0abD2343311985Fd1e0159CE39792483b908C03a" as const;

export interface ScrollVRFRequest {
  requestId: bigint;
  randomNumber: bigint;
  isFulfilled: boolean;
  timestamp: number;
}

export interface ScrollPrivacyContent {
  contentId: string;
  ipfsHash: string;
  isPublic: boolean;
  createdAt: number;
  createdBy: string;
}

export class ScrollBlockchainService {
  private publicClient;
  private walletClient: any = null;
  private userAddress: string | null = null;

  constructor() {
    // Initialize public client for reading
    this.publicClient = createPublicClient({
      chain: scrollSepolia,
      transport: http('https://sepolia-rpc.scroll.io/')
    });
    console.log('✅ Scroll Blockchain Service initialized');
  }

  /**
   * Connect wallet for write operations
   */
  async connectWallet(account: any): Promise<void> {
    try {
      this.walletClient = createWalletClient({
        chain: scrollSepolia,
        transport: http('https://sepolia-rpc.scroll.io/'),
        account
      });
      this.userAddress = account.address;
      console.log(`✅ Wallet connected: ${this.userAddress}`);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  /**
   * Request randomness from ScrollVRF
   * Used for fair voice style selection
   */
  async requestVRF(userId: string): Promise<ScrollVRFRequest> {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet not connected');
      }

      console.log(`🎲 Requesting VRF for user: ${userId}`);

      // 1 hour deadline
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const hash = await this.walletClient.writeContract({
        address: SCROLL_VRF_ADDRESS,
        abi: SCROLL_VRF_ABI,
        functionName: 'requestRandomness',
        args: [userId, 'voice-selection', BigInt(deadline)]
      });

      console.log(`📝 VRF request tx: ${hash}`);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`✅ VRF request confirmed`);

      // Get the request ID from logs or return a placeholder
      // In production, you'd parse the event logs to get the requestId
      const requestId = BigInt(Math.floor(Math.random() * 1000000));

      return {
        requestId,
        randomNumber: BigInt(0),
        isFulfilled: false,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('VRF request failed:', error);
      throw new Error('Failed to request randomness');
    }
  }

  /**
   * Get VRF result for voice selection
   */
  async getVRFResult(requestId: bigint): Promise<{
    randomNumber: bigint;
    isFulfilled: boolean;
  }> {
    try {
      const result = await this.publicClient.readContract({
        address: SCROLL_VRF_ADDRESS,
        abi: SCROLL_VRF_ABI,
        functionName: 'getRandomness',
        args: [requestId]
      });

      return {
        randomNumber: result[0],
        isFulfilled: result[1]
      };
    } catch (error) {
      console.error('Failed to get VRF result:', error);
      throw error;
    }
  }

  /**
   * Select random voice style using VRF
   * Fair selection based on blockchain randomness
   */
  async selectRandomVoiceStyle(
    voiceStyles: Array<{ id: string; name: string }>,
    requestId: bigint
  ): Promise<{ id: string; name: string; vrfProof: string }> {
    try {
      const result = await this.getVRFResult(requestId);

      if (!result.isFulfilled) {
        throw new Error('VRF result not yet fulfilled');
      }

      // Use modulo to select a voice style
      const randomIndex = Number(result.randomNumber % BigInt(voiceStyles.length));
      const selectedStyle = voiceStyles[randomIndex];

      console.log(`🎤 Selected voice style: ${selectedStyle.name}`);

      return {
        ...selectedStyle,
        vrfProof: `vrf-${requestId}-${result.randomNumber}`
      };
    } catch (error) {
      console.error('Voice style selection failed:', error);
      throw error;
    }
  }

  /**
   * Store private recording on ScrollPrivacy
   */
  async storePrivateRecording(
    ipfsHash: string,
    isPublic: boolean = false
  ): Promise<ScrollPrivacyContent> {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet not connected');
      }

      console.log(`🔒 Storing private recording: ${ipfsHash}`);

      // Create encrypted data hash from IPFS hash
      const encryptedDataHash = keccak256(toHex(ipfsHash));
      
      // Create simple zk proof (placeholder for now)
      const zkProof = toHex('scroll-zk-proof');

      const hash = await this.walletClient.writeContract({
        address: SCROLL_PRIVACY_ADDRESS,
        abi: SCROLL_PRIVACY_ABI,
        functionName: 'storePrivateContent',
        args: [encryptedDataHash, zkProof, isPublic]
      });

      console.log(`📝 Privacy storage tx: ${hash}`);

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`✅ Recording stored on Scroll Privacy`);

      return {
        contentId: encryptedDataHash,
        ipfsHash,
        isPublic,
        createdAt: Date.now(),
        createdBy: this.userAddress || ''
      };
    } catch (error) {
      console.error('Failed to store private recording:', error);
      throw new Error('Failed to store recording on Scroll');
    }
  }

  /**
   * Grant access to private recording
   */
  async grantAccess(
    contentId: string,
    userAddress: string,
    permissionType: 0 | 1 | 2 = 0, // 0: view, 1: download, 2: share
    expirationDays: number = 0 // 0 = no expiration
  ): Promise<string> {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet not connected');
      }

      const expiresAt = expirationDays > 0
        ? Math.floor(Date.now() / 1000) + (expirationDays * 86400)
        : 0;

      console.log(`🔑 Granting access to ${userAddress} for ${expirationDays} days`);

      const hash = await this.walletClient.writeContract({
        address: SCROLL_PRIVACY_ADDRESS,
        abi: SCROLL_PRIVACY_ABI,
        functionName: 'grantAccess',
        args: [contentId as `0x${string}`, userAddress as `0x${string}`, permissionType, BigInt(expiresAt)]
      });

      console.log(`📝 Access grant tx: ${hash}`);

      await this.publicClient.waitForTransactionReceipt({ hash });
      console.log(`✅ Access granted successfully`);

      return hash;
    } catch (error) {
      console.error('Failed to grant access:', error);
      throw new Error('Failed to grant access');
    }
  }

  /**
   * Check if user has access to content
   */
  async checkAccess(
    contentId: string,
    userAddress: string,
    permissionType: 0 | 1 | 2 = 0
  ): Promise<boolean> {
    try {
      const hasAccess = await this.publicClient.readContract({
        address: SCROLL_PRIVACY_ADDRESS,
        abi: SCROLL_PRIVACY_ABI,
        functionName: 'hasAccess',
        args: [contentId as `0x${string}`, userAddress as `0x${string}`, permissionType]
      });

      return hasAccess as boolean;
    } catch (error) {
      console.error('Failed to check access:', error);
      return false;
    }
  }

  /**
   * Create share link for recording
   */
  async createShareLink(
    contentId: string,
    permissionType: 0 | 1 | 2 = 0,
    expirationDays: number = 7
  ): Promise<string> {
    try {
      if (!this.walletClient) {
        throw new Error('Wallet not connected');
      }

      const expiresAt = Math.floor(Date.now() / 1000) + (expirationDays * 86400);

      console.log(`🔗 Creating share link for ${expirationDays} days`);

      const shareToken = await this.walletClient.writeContract({
        address: SCROLL_PRIVACY_ADDRESS,
        abi: SCROLL_PRIVACY_ABI,
        functionName: 'createShareLink',
        args: [contentId as `0x${string}`, permissionType, BigInt(expiresAt)]
      });

      console.log(`✅ Share link created: ${shareToken}`);

      return shareToken;
    } catch (error) {
      console.error('Failed to create share link:', error);
      throw new Error('Failed to create share link');
    }
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return {
      name: 'Scroll Sepolia',
      chainId: scrollSepolia.id,
      rpc: 'https://sepolia-rpc.scroll.io/',
      vrfContract: SCROLL_VRF_ADDRESS,
      privacyContract: SCROLL_PRIVACY_ADDRESS
    };
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.walletClient !== null && this.userAddress !== null;
  }

  /**
   * Get connected user address
   */
  getUserAddress(): string | null {
    return this.userAddress;
  }
}

export const scrollBlockchainService = new ScrollBlockchainService();
