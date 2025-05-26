import { Account, Contract, CallData, RpcProvider, InvokeFunctionResponse } from 'starknet';

export interface RecordingMetadata {
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
    account: Account,
    metadata: RecordingMetadata,
    onStatusChange?: (status: TransactionStatus) => void
  ): Promise<string> {
    try {
      // Validate inputs
      if (!account || !metadata.title || !metadata.ipfsHash) {
        throw new Error('Invalid recording metadata or account');
      }

      onStatusChange?.({ status: 'pending', hash: undefined });

      // Connect account to contract
      this.voiceStorageContract.connect(account);

      // Prepare metadata for contract call
      const calldata = CallData.compile([
        {
          title: metadata.title,
          description: metadata.description,
          ipfs_hash: metadata.ipfsHash,
          duration: metadata.duration,
          file_size: metadata.fileSize,
          is_public: metadata.isPublic,
        }
      ]);

      // Enhanced fee estimation with fallback mechanism
      try {
        return await this.executeWithSTRKFees(account, calldata, onStatusChange);
      } catch (strkError) {
        console.warn('STRK fee estimation failed, falling back to ETH:', strkError);
        return await this.executeWithETHFees(account, calldata, onStatusChange);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to store recording on Starknet:', error);
      onStatusChange?.({ status: 'failed', error: errorMessage });
      throw new Error(`Failed to store recording: ${errorMessage}`);
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
        tags: result.tags,
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
    metadata: RecordingMetadata
  ): Promise<string> {
    try {
      this.voiceStorageContract.connect(account);

      const calldata = CallData.compile({
        recording_id: recordingId,
        metadata: {
          title: metadata.title,
          description: metadata.description,
          ipfs_hash: metadata.ipfsHash,
          duration: metadata.duration,
          file_size: metadata.fileSize,
          is_public: metadata.isPublic,
          tags: metadata.tags,
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
}

/**
 * Create StarknetRecordingService with default configuration
 */
export function createStarknetRecordingService(): StarknetRecordingService {
  // Default configuration for development
  const providerUrl = process.env.NEXT_PUBLIC_STARKNET_RPC_URL || 'https://starknet-sepolia.public.blastapi.io';

  // These would be set after contract deployment
  const voiceStorageAddress = process.env.NEXT_PUBLIC_VOICE_STORAGE_CONTRACT || '0x0';
  const userRegistryAddress = process.env.NEXT_PUBLIC_USER_REGISTRY_CONTRACT || '0x0';
  const accessControlAddress = process.env.NEXT_PUBLIC_ACCESS_CONTROL_CONTRACT || '0x0';

  // For now, use empty ABIs - in production these would be imported from contracts
  const voiceStorageAbi = [];
  const userRegistryAbi = [];
  const accessControlAbi = [];

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
