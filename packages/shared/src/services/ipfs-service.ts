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
   * Upload audio file to IPFS
   */
  async uploadAudio(
    audioData: Blob | ArrayBuffer | Uint8Array,
    metadata: AudioMetadata
  ): Promise<IPFSUploadResult> {
    try {
      switch (this.config.provider) {
        case 'pinata':
          return await this.uploadToPinata(audioData, metadata);
        case 'infura':
          return await this.uploadToInfura(audioData, metadata);
        case 'web3storage':
          return await this.uploadToWeb3Storage(audioData, metadata);
        case 'local':
          return await this.uploadToLocalNode(audioData, metadata);
        default:
          throw new Error(`Unsupported IPFS provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error(`Failed to upload to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    // Check both server-side and client-side environment variables
    apiKey: process.env.PINATA_API_KEY || process.env.NEXT_PUBLIC_PINATA_API_KEY || process.env.NEXT_PUBLIC_IPFS_API_KEY,
    apiSecret: process.env.PINATA_API_SECRET || process.env.NEXT_PUBLIC_PINATA_API_SECRET || process.env.NEXT_PUBLIC_IPFS_API_SECRET,
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
