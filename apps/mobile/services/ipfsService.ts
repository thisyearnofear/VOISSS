/**
 * IPFS Service for uploading audio files in the mobile app
 * Simplified implementation for React Native
 */

import * as FileSystem from 'expo-file-system';

// Define the types that would normally come from the shared package
export interface AudioMetadata {
  title: string;
  artist?: string;
  duration: number;
  date?: string;
  genre?: string;
}

export interface IPFSUploadResult {
  hash: string;
  size: number;
  url?: string;
}

export class MobileIPFSService {
  private config: { 
    projectId: string; 
    projectSecret: string; 
    apiUrl?: string 
  } | null = null;

  constructor(config?: { projectId: string; projectSecret: string; apiUrl?: string }) {
    if (config) {
      this.config = config;
    } else {
      // Use environment variables or defaults
      this.config = {
        projectId: process.env.IPFS_PROJECT_ID || 'default-project-id',
        projectSecret: process.env.IPFS_API_SECRET || 'default-secret',
        apiUrl: process.env.IPFS_API_URL || 'https://api.pinata.cloud'
      };
    }
  }

  /**
   * Upload audio file from local URI to IPFS
   * This is a React Native specific method that handles file system URIs
   */
  async uploadAudioFromUri(
    fileUri: string,
    metadata: AudioMetadata
  ): Promise<IPFSUploadResult> {
    try {
      // Read the file as base64
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to Uint8Array
      const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      // Upload to IPFS (mock implementation)
      return await this.uploadAudio(bytes, metadata);
    } catch (error) {
      console.error('IPFS upload from URI failed:', error);
      throw error;
    }
  }

  /**
   * Upload audio data to IPFS
   */
  async uploadAudio(
    bytes: Uint8Array,
    metadata: AudioMetadata
  ): Promise<IPFSUploadResult> {
    // Mock implementation - in a real app, this would call the IPFS API
    console.log(`Mock upload to IPFS: ${metadata.title}, size: ${bytes.length} bytes`);
    
    // Generate a mock IPFS hash
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      hash: mockHash,
      size: bytes.length,
      url: `https://ipfs.io/ipfs/${mockHash}`
    };
  }

  /**
   * Test IPFS connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Mock implementation - in a real app, this would ping the IPFS gateway
      console.log('Testing IPFS connection...');
      return true;
    } catch (error) {
      console.error('IPFS connection test failed:', error);
      return false;
    }
  }

  /**
   * Get audio URL from IPFS hash
   */
  getAudioUrl(hash: string): string {
    return `https://ipfs.io/ipfs/${hash}`;
  }

  /**
   * Get file information from IPFS
   */
  async getFileInfo(hash: string): Promise<{ size: number; name?: string; type?: string }> {
    // Mock implementation
    return {
      size: Math.floor(Math.random() * 10000000) + 100000, // Random size between 100KB and 10MB
      name: `audio-${hash.substring(0, 8)}.mp3`,
      type: 'audio/mpeg'
    };
  }
}

// Export a singleton instance
let ipfsService: MobileIPFSService | null = null;

export const getIPFSService = (config?: { projectId: string; projectSecret: string; apiUrl?: string }): MobileIPFSService => {
  if (!ipfsService) {
    ipfsService = new MobileIPFSService(config);
  }
  return ipfsService;
};