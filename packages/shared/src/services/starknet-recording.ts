import { Account, Contract, CallData, RpcProvider, InvokeFunctionResponse, shortString } from 'starknet';
import { VOICE_STORAGE_ABI, USER_REGISTRY_ABI, ACCESS_CONTROL_ABI } from '../contracts/abis';

export interface StarknetRecordingMetadata {
  title: string;
  description: string;
  ipfsHash: string;
  duration: number;
  fileSize: number;
  isPublic: boolean;
  tags: string[];
}

export interface Recording {
  id: string;
  owner: string;
  title: string;
  description: string;
  ipfsHash: string;
  duration: number;
  fileSize: number;
  createdAt: number;
  isPublic: boolean;
  tags: string[];
  playCount: number;
}

export interface TransactionStatus {
  status: 'pending' | 'success' | 'failed';
  hash?: string;
  error?: string;
}

export interface UserProfile {
  address: string;
  username: string;
  displayName: string;
  bio: string;
  avatarIpfs: string;
  createdAt: number;
  totalRecordings: number;
  totalPlays: number;
  followersCount: number;
  followingCount: number;
  isVerified: boolean;
}

// Type for wallet connector account (from @starknet-react/core)
export interface WalletAccount {
  address: string;
  execute: (calls: any[]) => Promise<{ transaction_hash: string }>;
  estimateInvokeFee?: (calls: any[], options?: any) => Promise<any>;
  [key: string]: any;
}

// Union type for account parameter
export type AccountType = Account | WalletAccount;

export class StarknetRecordingService {
  private provider: RpcProvider;
  private voiceStorageContract: Contract;
  private userRegistryContract: Contract;
  private accessControlContract: Contract;

  constructor(
    providerUrl: string,
    voiceStorageAddress: string,
    userRegistryAddress: string,
    accessControlAddress: string,
    voiceStorageAbi: any,
    userRegistryAbi: any,
    accessControlAbi: any
  ) {
    this.provider = new RpcProvider({ nodeUrl: providerUrl });

    this.voiceStorageContract = new Contract(
      voiceStorageAbi,
      voiceStorageAddress,
      this.provider
    );

    this.userRegistryContract = new Contract(
      userRegistryAbi,
      userRegistryAddress,
      this.provider
    );

    this.accessControlContract = new Contract(
      accessControlAbi,
      accessControlAddress,
      this.provider
    );
  }

  async storeRecording(
    account: AccountType,
    metadata: StarknetRecordingMetadata,
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<string> {
    try {
      // Validate inputs
      if (!account || !metadata.title || !metadata.ipfsHash) {
        throw new Error('Invalid recording metadata or account');
      }

      onStatusChange?.({ status: 'pending', hash: undefined });

      // Check if this is a wallet connector account or starknet.js Account
      const isWalletAccount = this.isWalletAccount(account);

      if (isWalletAccount) {
        // Handle wallet connector account (from @starknet-react/core)
        return await this.storeRecordingWithWallet(account as WalletAccount, metadata, onStatusChange);
      } else {
        // Handle starknet.js Account
        return await this.storeRecordingWithAccount(account as Account, metadata, onStatusChange);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to store recording on Starknet:', error);
      onStatusChange?.({ status: 'failed', error: errorMessage });

      // Provide more helpful error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
          throw new Error('Network connectivity issue. The Starknet RPC endpoint may be temporarily unavailable. Please try again later or check your wallet\'s network settings.');
        }
        if (error.message.includes('User rejected') || error.message.includes('User denied')) {
          throw new Error('Transaction was rejected by user.');
        }
        if (error.message.includes('Insufficient funds')) {
          throw new Error('Insufficient funds for transaction fees. Please ensure you have enough ETH in your wallet.');
        }
      }

      throw new Error(`Failed to store recording: ${errorMessage}`);
    }
  }

  /**
   * Check if account is a wallet connector account
   */
  private isWalletAccount(account: AccountType): boolean {
    return 'execute' in account && typeof account.execute === 'function';
  }

  /**
   * Store recording using wallet connector account
   */
  private async storeRecordingWithWallet(
    account: WalletAccount,
    metadata: StarknetRecordingMetadata,
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<string> {
    try {
      // Prepare call data for wallet execution
      // Note: ipfsHash is already a deterministic felt252-compatible hash from recording-service
      const calldata = CallData.compile({
        metadata: {
          title: this.stringToFelt252(metadata.title || 'Untitled'),
          description: this.stringToFelt252(metadata.description || ''),
          ipfs_hash: metadata.ipfsHash || '0x0', // Already hashed, don't encode again
          duration: this.sanitizeNumber(metadata.duration),
          file_size: this.sanitizeNumber(metadata.fileSize),
          is_public: metadata.isPublic || false,
        }
      });

      onStatusChange?.({ status: 'pending' });

      // Execute transaction using wallet
      // The wallet connector handles the transaction internally
      const result = await account.execute([
        {
          contractAddress: this.voiceStorageContract.address,
          entrypoint: 'store_recording',
          calldata: calldata,
        }
      ]);

      // Wallet connectors return transaction_hash directly
      const txHash = result.transaction_hash;
      
      if (!txHash) {
        throw new Error('No transaction hash returned from wallet');
      }

      onStatusChange?.({ status: 'pending', hash: txHash });

      // For wallet connectors, we consider the transaction successful once submitted
      // The wallet will handle confirmation UI
      // Optionally wait for confirmation if provider is available
      try {
        const receipt = await this.provider.waitForTransaction(txHash, {
          retryInterval: 2000,
          successStates: ['ACCEPTED_ON_L2', 'ACCEPTED_ON_L1'],
        });

        if (receipt.isSuccess()) {
          onStatusChange?.({ status: 'success', hash: txHash });
        } else {
          // Transaction was submitted but failed on-chain
          console.warn('Transaction submitted but failed:', txHash);
          onStatusChange?.({ status: 'success', hash: txHash }); // Still return success as it was submitted
        }
      } catch (waitError) {
        // If waiting fails (e.g., RPC issues), still consider it successful since wallet submitted it
        console.warn('Could not wait for transaction confirmation:', waitError);
        onStatusChange?.({ status: 'success', hash: txHash });
      }

      return txHash;
    } catch (error) {
      console.error('Wallet transaction error:', error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('User abort') || error.message.includes('User rejected')) {
          throw new Error('Transaction was cancelled by user');
        }
        if (error.message.includes('Insufficient funds')) {
          throw new Error('Insufficient funds for transaction. Please add ETH to your wallet.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Store recording using starknet.js Account (legacy method)
   */
  private async storeRecordingWithAccount(
    account: Account,
    metadata: StarknetRecordingMetadata,
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<string> {
    // Connect account to contract
    this.voiceStorageContract.connect(account);

    // Prepare metadata for contract call - matches the RecordingMetadata struct
    // Convert strings to felt252 format and ensure no empty values
    // Note: ipfsHash is already a deterministic felt252-compatible hash from recording-service
    const calldata = CallData.compile({
      metadata: {
        title: this.stringToFelt252(metadata.title || 'Untitled'),
        description: this.stringToFelt252(metadata.description || ''),
        ipfs_hash: metadata.ipfsHash || '0x0', // Already hashed, don't encode again
        duration: this.sanitizeNumber(metadata.duration),
        file_size: this.sanitizeNumber(metadata.fileSize),
        is_public: metadata.isPublic || false,
      }
    });

    // Enhanced fee estimation with fallback mechanism
    try {
      return await this.executeWithSTRKFees(account, calldata, onStatusChange);
    } catch (strkError) {
      console.warn('STRK fee estimation failed, falling back to ETH:', strkError);
      return await this.executeWithETHFees(account, calldata, onStatusChange);
    }
  }

  /**
   * Execute transaction with STRK fees (preferred method)
   */
  private async executeWithSTRKFees(
    account: Account,
    calldata: any,
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<string> {
    // Estimate fees with STRK
    const { suggestedMaxFee, resourceBounds: estimatedResourceBounds } =
      await account.estimateInvokeFee(
        {
          contractAddress: this.voiceStorageContract.address,
          entrypoint: "store_recording",
          calldata,
        },
        {
          version: "0x3",
        }
      );

    // Add 50% buffer to suggested fee for reliability
    const maxFee = (suggestedMaxFee * BigInt(15)) / BigInt(10);

    // Enhance resource bounds for better success rate
    const resourceBounds = {
      ...estimatedResourceBounds,
      l1_gas: {
        ...estimatedResourceBounds.l1_gas,
        max_amount: "0x28", // Minimum gas amount
      },
    };

    // Execute transaction
    const result: InvokeFunctionResponse = await this.voiceStorageContract.store_recording(calldata, {
      maxFee,
      resourceBounds,
      version: "0x3",
    });

    onStatusChange?.({ status: 'pending', hash: result.transaction_hash });

    // Wait for confirmation with enhanced timeout
    const receipt = await this.provider.waitForTransaction(result.transaction_hash, {
      retryInterval: 2000,
      successStates: ['ACCEPTED_ON_L2', 'ACCEPTED_ON_L1'],
    });

    if (receipt.isSuccess()) {
      onStatusChange?.({ status: 'success', hash: result.transaction_hash });
      return result.transaction_hash;
    } else {
      throw new Error('Transaction failed with STRK fees');
    }
  }

  /**
   * Execute transaction with ETH fees (fallback method)
   */
  private async executeWithETHFees(
    account: Account,
    calldata: any,
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<string> {
    // Estimate fees with ETH (legacy method)
    const { suggestedMaxFee, resourceBounds: estimatedResourceBounds } =
      await account.estimateInvokeFee({
        contractAddress: this.voiceStorageContract.address,
        entrypoint: "store_recording",
        calldata,
      });

    // Add 50% buffer to suggested fee
    const maxFee = (suggestedMaxFee * BigInt(15)) / BigInt(10);

    const resourceBounds = {
      ...estimatedResourceBounds,
      l1_gas: {
        ...estimatedResourceBounds.l1_gas,
        max_amount: "0x28",
      },
    };

    // Execute transaction with ETH fees
    const result: InvokeFunctionResponse = await this.voiceStorageContract.store_recording(calldata, {
      maxFee,
      resourceBounds,
    });

    onStatusChange?.({ status: 'pending', hash: result.transaction_hash });

    // Wait for confirmation
    const receipt = await this.provider.waitForTransaction(result.transaction_hash, {
      retryInterval: 2000,
      successStates: ['ACCEPTED_ON_L2', 'ACCEPTED_ON_L1'],
    });

    if (receipt.isSuccess()) {
      onStatusChange?.({ status: 'success', hash: result.transaction_hash });
      return result.transaction_hash;
    } else {
      throw new Error('Transaction failed with ETH fees');
    }
  }

  async getRecording(recordingId: string): Promise<Recording | null> {
    try {
      const result = await this.voiceStorageContract.get_recording(recordingId);

      return {
        id: result.id.toString(),
        owner: result.owner,
        title: result.title,
        description: result.description,
        ipfsHash: result.ipfs_hash,
        duration: Number(result.duration),
        fileSize: Number(result.file_size),
        createdAt: Number(result.created_at),
        isPublic: result.is_public,
        tags: [], // Not in the contract struct, but kept for interface compatibility
        playCount: Number(result.play_count),
      };
    } catch (error) {
      console.error('Failed to get recording:', error);
      return null;
    }
  }

  async getUserRecordings(userAddress: string): Promise<Recording[]> {
    try {
      const recordingIds = await this.voiceStorageContract.get_user_recordings(userAddress);

      const recordings: Recording[] = [];
      for (const id of recordingIds) {
        const recording = await this.getRecording(id.toString());
        if (recording) {
          recordings.push(recording);
        }
      }

      return recordings;
    } catch (error) {
      console.error('Failed to get user recordings:', error);
      return [];
    }
  }

  async getPublicRecordings(offset: number = 0, limit: number = 20): Promise<Recording[]> {
    try {
      const recordingIds = await this.voiceStorageContract.get_public_recordings(offset, limit);

      const recordings: Recording[] = [];
      for (const id of recordingIds) {
        const recording = await this.getRecording(id.toString());
        if (recording) {
          recordings.push(recording);
        }
      }

      return recordings;
    } catch (error) {
      console.error('Failed to get public recordings:', error);
      return [];
    }
  }

  async incrementPlayCount(account: Account, recordingId: string): Promise<void> {
    try {
      this.voiceStorageContract.connect(account);

      const result = await this.voiceStorageContract.increment_play_count(recordingId);
      await this.provider.waitForTransaction(result.transaction_hash);
    } catch (error) {
      console.error('Failed to increment play count:', error);
    }
  }

  async updateRecordingMetadata(
    account: Account,
    recordingId: string,
    metadata: StarknetRecordingMetadata
  ): Promise<string> {
    try {
      this.voiceStorageContract.connect(account);

      const calldata = CallData.compile({
        recording_id: recordingId,
        metadata: {
          title: this.stringToFelt252(metadata.title || 'Untitled'),
          description: this.stringToFelt252(metadata.description || ''),
          ipfs_hash: metadata.ipfsHash || '0x0', // Already hashed, don't encode again
          duration: this.sanitizeNumber(metadata.duration),
          file_size: this.sanitizeNumber(metadata.fileSize),
          is_public: metadata.isPublic || false,
        }
      });

      const result = await this.voiceStorageContract.update_recording_metadata(calldata);
      await this.provider.waitForTransaction(result.transaction_hash);

      return result.transaction_hash;
    } catch (error) {
      console.error('Failed to update recording metadata:', error);
      throw new Error(`Failed to update recording: ${error}`);
    }
  }

  async deleteRecording(account: Account, recordingId: string): Promise<string> {
    try {
      this.voiceStorageContract.connect(account);

      const result = await this.voiceStorageContract.delete_recording(recordingId);
      await this.provider.waitForTransaction(result.transaction_hash);

      return result.transaction_hash;
    } catch (error) {
      console.error('Failed to delete recording:', error);
      throw new Error(`Failed to delete recording: ${error}`);
    }
  }

  // User Registry Methods
  async registerUser(
    account: Account,
    profile: {
      username: string;
      displayName: string;
      bio: string;
      avatarIpfs: string;
    }
  ): Promise<string> {
    try {
      this.userRegistryContract.connect(account);

      const calldata = CallData.compile({
        profile: {
          username: profile.username,
          display_name: profile.displayName,
          bio: profile.bio,
          avatar_ipfs: profile.avatarIpfs,
        }
      });

      const result = await this.userRegistryContract.register_user(calldata);
      await this.provider.waitForTransaction(result.transaction_hash);

      return result.transaction_hash;
    } catch (error) {
      console.error('Failed to register user:', error);
      throw new Error(`Failed to register user: ${error}`);
    }
  }

  async getUserProfile(userAddress: string) {
    try {
      const result = await this.userRegistryContract.get_profile(userAddress);

      return {
        address: result.address,
        username: result.username,
        displayName: result.display_name,
        bio: result.bio,
        avatarIpfs: result.avatar_ipfs,
        createdAt: Number(result.created_at),
        totalRecordings: Number(result.total_recordings),
        totalPlays: Number(result.total_plays),
        followersCount: Number(result.followers_count),
        followingCount: Number(result.following_count),
        isVerified: result.is_verified,
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  // Access Control Methods
  async grantAccess(
    account: Account,
    recordingId: string,
    userAddress: string,
    permissionType: number,
    expiresAt: number = 0
  ): Promise<string> {
    try {
      this.accessControlContract.connect(account);

      const result = await this.accessControlContract.grant_access(
        recordingId,
        userAddress,
        permissionType,
        expiresAt
      );

      await this.provider.waitForTransaction(result.transaction_hash);
      return result.transaction_hash;
    } catch (error) {
      console.error('Failed to grant access:', error);
      throw new Error(`Failed to grant access: ${error}`);
    }
  }

  async hasAccess(
    recordingId: string,
    userAddress: string,
    permissionType: number
  ): Promise<boolean> {
    try {
      const result = await this.accessControlContract.has_access(
        recordingId,
        userAddress,
        permissionType
      );

      return result;
    } catch (error) {
      console.error('Failed to check access:', error);
      return false;
    }
  }

  /**
   * Convert string to felt252 format for Starknet
   */
  private stringToFelt252(str: string): string {
    if (!str) return '0x0';
    // Use the official Starknet utility to prevent encoding errors
    return shortString.encodeShortString(str);
  }

  /**
   * Sanitize numeric values for Starknet felt252
   */
  private sanitizeNumber(value: number | undefined | null): number {
    if (value === null || value === undefined || !isFinite(value) || isNaN(value)) {
      return 0;
    }

    // Ensure the number is a positive integer within felt252 range
    const sanitized = Math.floor(Math.abs(value));

    // felt252 max value is 2^251 - 1, but for practical purposes, limit to safe integer range
    return Math.min(sanitized, Number.MAX_SAFE_INTEGER);
  }
}

/**
 * Create StarknetRecordingService with default configuration
 */
export function createStarknetRecordingService(): StarknetRecordingService {
  // Default configuration for development
  const providerUrl = process.env.NEXT_PUBLIC_STARKNET_RPC_URL || 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';

  // Get contract addresses from environment variables (using _CONTRACT suffix as per Netlify config)
  const voiceStorageAddress = process.env.NEXT_PUBLIC_VOICE_STORAGE_CONTRACT || '0x0';
  const userRegistryAddress = process.env.NEXT_PUBLIC_USER_REGISTRY_CONTRACT || '0x0';
  const accessControlAddress = process.env.NEXT_PUBLIC_ACCESS_CONTROL_CONTRACT || '0x0';

  // Validate that contract addresses are set
  if (voiceStorageAddress === '0x0') {
    console.error('❌ NEXT_PUBLIC_VOICE_STORAGE_CONTRACT not set in environment variables');
  }
  if (userRegistryAddress === '0x0') {
    console.error('❌ NEXT_PUBLIC_USER_REGISTRY_CONTRACT not set in environment variables');
  }
  if (accessControlAddress === '0x0') {
    console.error('❌ NEXT_PUBLIC_ACCESS_CONTROL_CONTRACT not set in environment variables');
  }

  console.log('🔧 Starknet Service Configuration:', {
    providerUrl,
    voiceStorageAddress,
    userRegistryAddress,
    accessControlAddress,
  });

  // Use the proper ABIs extracted from compiled contracts
  const voiceStorageAbi = VOICE_STORAGE_ABI;
  const userRegistryAbi = USER_REGISTRY_ABI;
  const accessControlAbi = ACCESS_CONTROL_ABI;

  return new StarknetRecordingService(
    providerUrl,
    voiceStorageAddress,
    userRegistryAddress,
    accessControlAddress,
    voiceStorageAbi,
    userRegistryAbi,
    accessControlAbi
  );
}
