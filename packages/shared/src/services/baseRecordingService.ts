/**
 * Base Recording Service - Gasless Transaction Edition
 *
 * This service uses the backend spender wallet to execute gasless transactions.
 * Users only need to grant spend permission once, then all saves are popup-free!
 *
 * Architecture:
 * 1. User uploads to IPFS (frontend)
 * 2. Service calls backend API with IPFS hash + metadata
 * 3. Backend verifies spend permission and executes transaction
 * 4. User receives transaction hash (no wallet popup!)
 */

export interface BaseRecordingMetadata {
  title: string;
  description: string;
  isPublic: boolean;
  tags: string[];
}

/**
 * Extended metadata for private recordings
 * Includes privacy settings and access control
 */
export interface PrivateRecordingMetadata extends BaseRecordingMetadata {
  isPrivate: true;
  allowedViewers?: string[]; // Specific addresses that can access
  encryptionType?: 'aes-256' | 'rsa-4096' | 'custom';
  accessExpiration?: Date; // Optional time-based access control
  selectiveDisclosure?: {
    titlePublic?: boolean;
    descriptionPublic?: boolean;
    tagsPublic?: boolean;
  };
}

export interface SaveRecordingResponse {
  success: boolean;
  txHash: string;
  status: string;
  blockNumber: string;
}

/**
 * Response for private recording creation
 * Includes privacy-specific information
 */
export interface SavePrivateRecordingResponse extends SaveRecordingResponse {
  contentId: string; // Unique identifier for private content
  zkProof?: string; // Optional zk proof for verification
  encryptedDataHash: string; // Hash of encrypted content
}

export interface BaseRecordingService {
  saveRecording(ipfsHash: string, metadata: BaseRecordingMetadata): Promise<string>;
  
  // Optional privacy features
  savePrivateRecording?(
    encryptedDataHash: string,
    metadata: PrivateRecordingMetadata,
    zkProof?: string
  ): Promise<SavePrivateRecordingResponse>;
  
  getPrivateRecording?(
    contentId: string,
    userAddress: string,
    zkProof?: string
  ): Promise<{
    success: boolean;
    encryptedDataHash?: string;
    metadata?: PrivateRecordingMetadata;
    accessGranted: boolean;
  }>;
}

export class BaseRecordingServiceImpl implements BaseRecordingService {
  private userAddress: string;
  private contractAddress: string;
  private backendUrl: string;
  private permissionRetriever: () => string | null;

  constructor(
    userAddress: string,
    contractAddress: string,
    backendUrl: string,
    permissionRetriever: () => string | null
  ) {
    if (!contractAddress) {
      throw new Error("VOICE_RECORDS_CONTRACT environment variable not set. Please deploy the VoiceRecords contract first.");
    }

    if (!userAddress) {
      throw new Error("User address is required. Please connect your wallet first.");
    }

    this.userAddress = userAddress;
    this.contractAddress = contractAddress;
    this.backendUrl = backendUrl;
    this.permissionRetriever = permissionRetriever;
  }

  /**
   * Saves a recording's metadata to the Base blockchain in a gasless transaction.
   * No wallet popup required after initial permission grant!
   *
   * @param ipfsHash The IPFS hash of the audio file
   * @param metadata The recording's metadata
   * @returns Promise resolving with the transaction hash
   */
  async saveRecording(
    ipfsHash: string,
    metadata: BaseRecordingMetadata
  ): Promise<string> {
    try {
      // Get stored permission hash
      const permissionHash = this.permissionRetriever();

      if (!permissionHash) {
        throw new Error('No spend permission found. Please grant permission first.');
      }

      console.log('📤 Sending gasless save request to backend...');

      // Call backend API for gasless transaction
      const response = await fetch(`${this.backendUrl}/api/base/save-recording`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: this.userAddress,
          permissionHash,
          ipfsHash,
          title: metadata.title,
          isPublic: metadata.isPublic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save recording');
      }

      const data: SaveRecordingResponse = await response.json();

      console.log('✅ Recording saved successfully:', data.txHash);
      console.log('📊 Block number:', data.blockNumber);

      return data.txHash;

    } catch (error: any) {
      console.error("Failed to save recording to Base:", error);

      // Provide user-friendly error messages
      if (error.message?.includes('permission')) {
        throw new Error('Spend permission expired or invalid. Please grant permission again.');
      } else if (error.message?.includes('insufficient funds')) {
        throw new Error('Service temporarily unavailable. Please try again later.');
      } else {
        throw new Error(error.message || 'Failed to save recording to the blockchain.');
      }
    }
  }
}

/**
 * Create Base recording service instance with platform-specific configuration
 */
export function createBaseRecordingService(
  userAddress: string | null,
  options?: {
    backendUrl?: string;
    contractAddress?: string;
    permissionRetriever?: () => string | null;
  }
): BaseRecordingService {
  const backendUrl = options?.backendUrl ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_VOISSS_API) ||
    'https://voisss.famile.xyz';

  const contractAddress = options?.contractAddress ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_VOICE_RECORDS_CONTRACT) ||
    '0x0';

  // Platform-specific permission retrieval
  const permissionRetriever = options?.permissionRetriever ||
    (() => {
      // Web: use localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem('spendPermissionHash');
      }
      // Mobile: placeholder for now - will be implemented per platform
      return null;
    });

  return new BaseRecordingServiceImpl(
    userAddress || '',
    contractAddress,
    backendUrl,
    permissionRetriever
  );
}
