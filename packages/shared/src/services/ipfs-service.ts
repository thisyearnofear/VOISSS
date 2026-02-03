/**
 * IPFS Service for uploading and retrieving audio files
 * Supports multiple IPFS providers: Pinata, Infura, and Web3.Storage
 */

export interface IPFSUploadResult {
  hash: string;
  size: number;
  url: string;
}

export interface IPFSConfig {
  provider: 'pinata' | 'infura' | 'web3storage' | 'local';
  apiKey?: string;
  apiSecret?: string;
  gatewayUrl?: string;
}

export interface AudioMetadata {
  filename: string;
  mimeType: string;
  duration: number;
  sampleRate?: number;
  bitRate?: number;
}

export class IPFSService {
  private config: IPFSConfig;
  private defaultGateway = 'https://gateway.pinata.cloud/ipfs/';

  constructor(config: IPFSConfig) {
    this.config = {
      gatewayUrl: this.defaultGateway,
      ...config,
    };
  }

  /**
   * Upload audio file to IPFS with retry logic and multiple provider fallback
   */
  async uploadAudio(
    audioData: Blob | ArrayBuffer | Uint8Array,
    metadata: AudioMetadata,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      fallbackProviders?: IPFSConfig['provider'][];
    } = {}
  ): Promise<IPFSUploadResult> {
    const { maxRetries = 3, retryDelay = 1000, fallbackProviders = [] } = options;

    // Primary provider attempt with retries
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 IPFS upload attempt ${attempt}/${maxRetries} using ${this.config.provider}`);

        const result = await this.uploadToProvider(this.config.provider, audioData, metadata);

        console.log(`✅ IPFS upload successful on attempt ${attempt}`);
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`❌ IPFS upload attempt ${attempt} failed:`, lastError.message);

        if (attempt < maxRetries) {
          const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Try fallback providers if primary fails
    for (const fallbackProvider of fallbackProviders) {
      if (fallbackProvider === this.config.provider) continue; // Skip primary

      try {
        console.log(`🔄 Trying fallback provider: ${fallbackProvider}`);
        const result = await this.uploadToProvider(fallbackProvider, audioData, metadata);
        console.log(`✅ Fallback upload successful with ${fallbackProvider}`);
        return result;

      } catch (error) {
        console.warn(`❌ Fallback provider ${fallbackProvider} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    // All attempts failed
    console.error('🚨 All IPFS upload attempts failed:', lastError);
    throw new Error(`Failed to upload to IPFS after ${maxRetries} retries and ${fallbackProviders.length} fallback providers: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Upload to a specific provider (extracted for retry logic)
   */
  private async uploadToProvider(
    provider: IPFSConfig['provider'],
    audioData: Blob | ArrayBuffer | Uint8Array,
    metadata: AudioMetadata
  ): Promise<IPFSUploadResult> {
    switch (provider) {
      case 'pinata':
        return await this.uploadToPinata(audioData, metadata);
      case 'infura':
        return await this.uploadToInfura(audioData, metadata);
      case 'web3storage':
        return await this.uploadToWeb3Storage(audioData, metadata);
      case 'local':
        return await this.uploadToLocalNode(audioData, metadata);
      default:
        throw new Error(`Unsupported IPFS provider: ${provider}`);
    }
  }

  /**
   * Upload encrypted audio file to IPFS for private recordings
   * Includes additional privacy metadata
   */
  async uploadEncryptedAudio(
    encryptedData: Blob | ArrayBuffer | Uint8Array,
    metadata: AudioMetadata,
    privacyMetadata: {
      encryptionAlgorithm: string;
      contentId: string;
      ownerAddress: string;
    }
  ): Promise<IPFSUploadResult> {
    try {
      console.log(`🔒 Uploading encrypted audio to IPFS...`);
      console.log(`   Content ID: ${privacyMetadata.contentId}`);
      console.log(`   Owner: ${privacyMetadata.ownerAddress}`);
      console.log(`   Encryption: ${privacyMetadata.encryptionAlgorithm}`);

      // Add privacy metadata to the upload
      const fullMetadata = {
        ...metadata,
        privacy: {
          isPrivate: true,
          contentId: privacyMetadata.contentId,
          owner: privacyMetadata.ownerAddress,
          encryption: privacyMetadata.encryptionAlgorithm,
          timestamp: new Date().toISOString(),
        }
      };

      // Use the standard upload method
      const result = await this.uploadAudio(encryptedData, fullMetadata);

      console.log(`✅ Encrypted audio uploaded successfully`);
      console.log(`   IPFS Hash: ${result.hash}`);
      console.log(`   URL: ${result.url}`);

      return result;

    } catch (error) {
      console.error('IPFS encrypted upload failed:', error);
      throw new Error(`Failed to upload encrypted audio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Retrieve encrypted audio from IPFS
   * Includes privacy verification
   */
  async retrieveEncryptedAudio(
    ipfsHash: string,
    expectedOwner?: string
  ): Promise<{
    data: Blob;
    metadata: AudioMetadata & {
      privacy?: {
        isPrivate: boolean;
        contentId: string;
        owner: string;
        encryption: string;
        timestamp: string;
      };
    };
    accessGranted: boolean;
  }> {
    try {
      console.log(`🔐 Retrieving encrypted audio from IPFS...`);
      console.log(`   IPFS Hash: ${ipfsHash}`);

      // TODO: Implement actual IPFS retrieval with privacy checks
      // This would verify ownership and access rights

      // Mock implementation for now
      const mockData = new Blob(['encrypted-audio-data'], { type: 'audio/mpeg' });
      const mockMetadata = {
        filename: 'private-recording.mp3',
        mimeType: 'audio/mpeg',
        duration: 120,
        sampleRate: 44100,
        privacy: {
          isPrivate: true,
          contentId: 'private-' + Math.random().toString(36).substring(2, 15),
          owner: expectedOwner || '0x' + Math.random().toString(16).substring(2, 42),
          encryption: 'aes-256',
          timestamp: new Date().toISOString(),
        }
      };

      const accessGranted = !expectedOwner || mockMetadata.privacy?.owner === expectedOwner;

      console.log(`✅ Encrypted audio retrieved`);
      console.log(`   Access granted: ${accessGranted}`);
      console.log(`   Owner: ${mockMetadata.privacy?.owner}`);

      return {
        data: mockData,
        metadata: mockMetadata,
        accessGranted
      };

    } catch (error) {
      console.error('IPFS encrypted retrieval failed:', error);
      throw new Error(`Failed to retrieve encrypted audio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Upload to Pinata (recommended for production)
   */
  private async uploadToPinata(
    audioData: Blob | ArrayBuffer | Uint8Array,
    metadata: AudioMetadata
  ): Promise<IPFSUploadResult> {
    if (!this.config.apiKey || !this.config.apiSecret) {
      throw new Error('Pinata API key and secret are required');
    }

    const formData = new FormData();

    // Convert data to blob if needed
    const blob = audioData instanceof Blob
      ? audioData
      : new Blob([audioData as BlobPart], { type: metadata.mimeType });

    formData.append('file', blob, metadata.filename);

    // Add metadata
    const pinataMetadata = {
      name: metadata.filename,
      keyvalues: {
        duration: metadata.duration.toString(),
        mimeType: metadata.mimeType,
        sampleRate: metadata.sampleRate?.toString() || '',
        bitRate: metadata.bitRate?.toString() || '',
        uploadedAt: new Date().toISOString(),
      }
    };

    formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': this.config.apiKey,
        'pinata_secret_api_key': this.config.apiSecret,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinata upload failed: ${error}`);
    }

    const result = await response.json();

    return {
      hash: result.IpfsHash,
      size: result.PinSize,
      url: `${this.config.gatewayUrl}${result.IpfsHash}`,
    };
  }

  /**
   * Upload to Infura IPFS
   */
  private async uploadToInfura(
    audioData: Blob | ArrayBuffer | Uint8Array,
    metadata: AudioMetadata
  ): Promise<IPFSUploadResult> {
    if (!this.config.apiKey || !this.config.apiSecret) {
      throw new Error('Infura project ID and secret are required');
    }

    const formData = new FormData();
    const blob = audioData instanceof Blob
      ? audioData
      : new Blob([audioData as BlobPart], { type: metadata.mimeType });

    formData.append('file', blob, metadata.filename);

    const auth = btoa(`${this.config.apiKey}:${this.config.apiSecret}`);

    const response = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Infura upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      hash: result.Hash,
      size: result.Size,
      url: `https://ipfs.infura.io/ipfs/${result.Hash}`,
    };
  }

  /**
   * Upload to Web3.Storage
   */
  private async uploadToWeb3Storage(
    audioData: Blob | ArrayBuffer | Uint8Array,
    metadata: AudioMetadata
  ): Promise<IPFSUploadResult> {
    if (!this.config.apiKey) {
      throw new Error('Web3.Storage API token is required');
    }

    const blob = audioData instanceof Blob
      ? audioData
      : new Blob([audioData as BlobPart], { type: metadata.mimeType });

    const formData = new FormData();
    formData.append('file', blob, metadata.filename);

    const response = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Web3.Storage upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      hash: result.cid,
      size: blob.size,
      url: `https://w3s.link/ipfs/${result.cid}`,
    };
  }

  /**
   * Upload to local IPFS node
   */
  private async uploadToLocalNode(
    audioData: Blob | ArrayBuffer | Uint8Array,
    metadata: AudioMetadata
  ): Promise<IPFSUploadResult> {
    const nodeUrl = this.config.gatewayUrl || 'http://localhost:5001';

    const formData = new FormData();
    const blob = audioData instanceof Blob
      ? audioData
      : new Blob([audioData as BlobPart], { type: metadata.mimeType });

    formData.append('file', blob, metadata.filename);

    const response = await fetch(`${nodeUrl}/api/v0/add`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Local IPFS upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      hash: result.Hash,
      size: result.Size,
      url: `${nodeUrl}/ipfs/${result.Hash}`,
    };
  }

  /**
   * Get playable URL for IPFS hash
   */
  getAudioUrl(ipfsHash: string): string {
    // Handle legacy hashes that can't be resolved
    if (ipfsHash.startsWith('legacy_hash_')) {
      console.warn('Cannot resolve legacy IPFS hash:', ipfsHash);
      return ''; // Return empty URL for legacy hashes
    }
    return `${this.config.gatewayUrl}${ipfsHash}`;
  }

  /**
   * Check if IPFS hash is valid
   */
  isValidIPFSHash(hash: string): boolean {
    // Basic IPFS hash validation (CIDv0 and CIDv1)
    const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    const cidv1Regex = /^b[a-z2-7]{58}$/;

    return cidv0Regex.test(hash) || cidv1Regex.test(hash);
  }

  /**
   * Test IPFS connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      // Create a small test file
      const testData = new Blob(['VOISSS IPFS test'], { type: 'text/plain' });
      const metadata: AudioMetadata = {
        filename: 'test.txt',
        mimeType: 'text/plain',
        duration: 0,
      };

      const result = await this.uploadAudio(testData, metadata);
      return this.isValidIPFSHash(result.hash);
    } catch (error) {
      console.error('IPFS connection test failed:', error);
      return false;
    }
  }

  /**
   * Get file info from IPFS
   */
  async getFileInfo(ipfsHash: string): Promise<{ size: number; type: string } | null> {
    try {
      const url = this.getAudioUrl(ipfsHash);
      const response = await fetch(url, { method: 'HEAD' });

      if (!response.ok) {
        return null;
      }

      return {
        size: parseInt(response.headers.get('content-length') || '0'),
        type: response.headers.get('content-type') || 'application/octet-stream',
      };
    } catch (error) {
      console.error('Failed to get file info:', error);
      return null;
    }
  }
}

/**
 * Create IPFS service instance with environment-based configuration
 */
export function createIPFSService(): IPFSService {
  // Try to get config from environment variables
  // Note: In browser context, only NEXT_PUBLIC_ prefixed vars are accessible
  const provider = (process.env.NEXT_PUBLIC_IPFS_PROVIDER || 'pinata') as IPFSConfig['provider'];

  const config: IPFSConfig = {
    provider,
    // Check server-side, Next.js, and Expo environment variables
    apiKey: process.env.PINATA_API_KEY || process.env.NEXT_PUBLIC_PINATA_API_KEY || process.env.NEXT_PUBLIC_IPFS_API_KEY || process.env.EXPO_PUBLIC_PINATA_API_KEY,
    apiSecret: process.env.PINATA_API_SECRET || process.env.NEXT_PUBLIC_PINATA_API_SECRET || process.env.NEXT_PUBLIC_IPFS_API_SECRET || process.env.EXPO_PUBLIC_PINATA_API_SECRET,
    gatewayUrl: process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL,
  };

  // Debug logging to help troubleshoot
  console.log('🔧 IPFS Service Configuration:', {
    provider: config.provider,
    hasApiKey: !!config.apiKey,
    hasApiSecret: !!config.apiSecret,
    apiKeyLength: config.apiKey?.length || 0,
    apiSecretLength: config.apiSecret?.length || 0,
    gatewayUrl: config.gatewayUrl,
  });

  return new IPFSService(config);
}

/**
 * Create IPFS service with multiple fallback providers for maximum reliability
 */
export function createRobustIPFSService(): IPFSService {
  const service = createIPFSService();

  // Add method to get fallback providers based on available credentials
  (service as any).getFallbackProviders = (): IPFSConfig['provider'][] => {
    const fallbacks: IPFSConfig['provider'][] = [];

    // Add Web3.Storage if we have a token
    if (process.env.WEB3_STORAGE_TOKEN || process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN) {
      fallbacks.push('web3storage');
    }

    // Add Infura if we have credentials
    if ((process.env.INFURA_PROJECT_ID || process.env.NEXT_PUBLIC_INFURA_PROJECT_ID) &&
      (process.env.INFURA_PROJECT_SECRET || process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET)) {
      fallbacks.push('infura');
    }

    // Always add local as last resort (though it may not work in production)
    fallbacks.push('local');

    return fallbacks;
  };

  return service;
}
