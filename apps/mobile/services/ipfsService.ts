/**
 * IPFS Service for uploading audio files in the mobile app
 * Mimics the web app's implementation but adapted for React Native
 */

import * as FileSystem from 'expo-file-system';
import { IPFSService, IPFSUploadResult, AudioMetadata } from '@voisss/shared';

// Extend the shared IPFS service to add React Native specific functionality
export class MobileIPFSService extends IPFSService {
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
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Use the parent class method to upload
      return await this.uploadAudio(bytes, metadata);
    } catch (error) {
      console.error('Failed to upload audio from URI:', error);
      throw new Error(`Failed to upload audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Create IPFS service instance with environment-based configuration
 * This function reads environment variables from Expo config
 */
export function createMobileIPFSService(): MobileIPFSService {
  // In Expo, environment variables are accessed through Constants.expoConfig
  // For now, we'll use default configuration and let users set it up
  const config = {
    provider: 'pinata' as const, // Type assertion to match IPFSConfig type
    apiKey: process.env.EXPO_PUBLIC_PINATA_API_KEY,
    apiSecret: process.env.EXPO_PUBLIC_PINATA_API_SECRET,
  };

  // Debug logging
  console.log('🔧 Mobile IPFS Service Configuration:', {
    provider: config.provider,
    hasApiKey: !!config.apiKey,
    hasApiSecret: !!config.apiSecret,
  });

  return new MobileIPFSService(config);
}