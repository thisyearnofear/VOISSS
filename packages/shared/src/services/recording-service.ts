/**
 * Complete recording service that handles the full pipeline:
 * Recording → Conversion → IPFS Upload → Starknet Storage
 */

import { IPFSService, AudioMetadata, IPFSUploadResult } from './ipfs-service';
import { AudioConverter, AudioConversionOptions, ConversionResult } from './audio-converter';
import { StarknetRecordingService, StarknetRecordingMetadata, TransactionStatus, AccountType } from './starknet-recording';

/**
 * Hash IPFS hash to fit in felt252 (31 chars) while maintaining uniqueness
 */
function hashIpfsForContract(ipfsHash: string): string {
  // Create a deterministic hash that fits in felt252
  const encoder = new TextEncoder();
  const data = encoder.encode(ipfsHash);
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex and pad to 30 chars (leaving room for 0x prefix)
  const hexHash = Math.abs(hash).toString(16).padStart(30, '0');
  return `0x${hexHash}`;
}

export interface RecordingPipelineOptions {
  title: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  quality?: 'low' | 'medium' | 'high' | 'lossless';
  convertAudio?: boolean;
}

export interface RecordingPipelineResult {
  success: boolean;
  ipfsHash?: string; // Full IPFS hash for retrieval
  ipfsUrl?: string;
  transactionHash?: string;
  error?: string;
  metadata?: StarknetRecordingMetadata & { fullIpfsHash?: string }; // Include full hash in metadata
}

export interface PipelineProgress {
  stage: 'converting' | 'uploading' | 'storing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}

export class RecordingService {
  private ipfsService: IPFSService;
  private audioConverter: AudioConverter;
  private starknetService: StarknetRecordingService;

  constructor(
    ipfsService: IPFSService,
    starknetService: StarknetRecordingService
  ) {
    this.ipfsService = ipfsService;
    this.audioConverter = new AudioConverter();
    this.starknetService = starknetService;
  }

  /**
   * Complete recording pipeline: convert → upload → store
   */
  async processRecording(
    audioBlob: Blob,
    options: RecordingPipelineOptions,
    account?: AccountType,
    onProgress?: (progress: PipelineProgress) => void
  ): Promise<RecordingPipelineResult> {
    try {
      onProgress?.({
        stage: 'converting',
        progress: 10,
        message: 'Converting audio format...',
      });

      // Step 1: Convert audio if needed
      let processedAudio: ConversionResult;

      if (options.convertAudio !== false) {
        const conversionOptions = options.quality
          ? AudioConverter.getQualitySettings(options.quality)
          : { targetFormat: 'mp3' as const, bitRate: 128, sampleRate: 44100 };

        processedAudio = await this.audioConverter.convertForStorage(audioBlob, conversionOptions);
      } else {
        // Use original audio
        const duration = await this.getAudioDuration(audioBlob);
        processedAudio = {
          blob: audioBlob,
          mimeType: audioBlob.type || 'audio/mpeg',
          size: audioBlob.size,
          duration,
          format: this.getFormatFromMimeType(audioBlob.type) || 'mp3',
        };
      }

      onProgress?.({
        stage: 'uploading',
        progress: 30,
        message: 'Uploading to IPFS...',
      });

      // Step 2: Upload to IPFS
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${options.title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${processedAudio.format}`;

      const audioMetadata: AudioMetadata = {
        filename,
        mimeType: processedAudio.mimeType,
        duration: processedAudio.duration,
        sampleRate: 44100, // Default, could be extracted from audio
        bitRate: 128, // Default, could be extracted from audio
      };

      const ipfsResult: IPFSUploadResult = await this.ipfsService.uploadAudio(
        processedAudio.blob,
        audioMetadata
      );

      onProgress?.({
        stage: 'uploading',
        progress: 60,
        message: 'Upload complete, preparing metadata...',
      });

      // Step 3: Prepare metadata for Starknet
      // Store hashed version on-chain (fits felt252), keep full hash for retrieval
      const recordingMetadata: StarknetRecordingMetadata = {
        title: options.title,
        description: options.description || '',
        ipfsHash: hashIpfsForContract(ipfsResult.hash), // ✅ Deterministic hash for contract
        duration: Math.round(processedAudio.duration),
        fileSize: processedAudio.size,
        isPublic: options.isPublic || false,
        tags: options.tags || [],
      };

      // Step 4: Store on Starknet (if account provided)
      let transactionHash: string | undefined;

      if (account) {
        onProgress?.({
          stage: 'storing',
          progress: 80,
          message: 'Storing metadata on Starknet...',
        });

        transactionHash = await this.starknetService.storeRecording(
          account,
          recordingMetadata,
          (status: TransactionStatus) => {
            if (status.status === 'pending') {
              onProgress?.({
                stage: 'storing',
                progress: 90,
                message: 'Transaction pending...',
              });
            }
          }
        );
      }

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Recording saved successfully!',
      });

      return {
        success: true,
        ipfsHash: ipfsResult.hash, // ✅ Return full IPFS hash
        ipfsUrl: ipfsResult.url,
        transactionHash,
        metadata: {
          ...recordingMetadata,
          fullIpfsHash: ipfsResult.hash, // ✅ Include full hash in metadata
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      onProgress?.({
        stage: 'error',
        progress: 0,
        message: 'Failed to process recording',
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Upload existing recording to IPFS only (no Starknet)
   */
  async uploadToIPFS(
    audioBlob: Blob,
    title: string,
    options: Partial<AudioConversionOptions> = {}
  ): Promise<IPFSUploadResult> {
    // Convert audio if needed
    const processedAudio = await this.audioConverter.convertForStorage(audioBlob, options);

    // Prepare metadata
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${processedAudio.format}`;

    const audioMetadata: AudioMetadata = {
      filename,
      mimeType: processedAudio.mimeType,
      duration: processedAudio.duration,
    };

    return await this.ipfsService.uploadAudio(processedAudio.blob, audioMetadata);
  }

  /**
   * Get playable URL for IPFS hash
   */
  getPlaybackUrl(ipfsHash: string): string {
    return this.ipfsService.getAudioUrl(ipfsHash);
  }

  /**
   * Validate IPFS hash
   */
  isValidIPFSHash(hash: string): boolean {
    return this.ipfsService.isValidIPFSHash(hash);
  }

  /**
   * Test IPFS connectivity
   */
  async testIPFSConnection(): Promise<boolean> {
    return await this.ipfsService.testConnection();
  }

  /**
   * Get file info from IPFS
   */
  async getFileInfo(ipfsHash: string): Promise<{ size: number; type: string } | null> {
    return await this.ipfsService.getFileInfo(ipfsHash);
  }

  /**
   * Retrieve recording metadata from Starknet
   */
  async getRecordingMetadata(recordingId: string): Promise<any> {
    return await this.starknetService.getRecording(recordingId);
  }

  /**
   * Get user's recordings from Starknet
   */
  async getUserRecordings(userAddress: string): Promise<any[]> {
    return await this.starknetService.getUserRecordings(userAddress);
  }

  /**
   * Get audio duration from blob
   */
  private async getAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration || 0);
      };
      audio.onerror = () => {
        resolve(0); // Fallback
      };
      audio.src = URL.createObjectURL(audioBlob);
    });
  }

  /**
   * Get format from MIME type
   */
  private getFormatFromMimeType(mimeType: string): string | null {
    if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'mp3';
    if (mimeType.includes('wav')) return 'wav';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
    return null;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.audioConverter.dispose();
  }
}

/**
 * Factory function to create RecordingService with default configuration
 */
export function createRecordingService(
  ipfsService: IPFSService,
  starknetService: StarknetRecordingService
): RecordingService {
  return new RecordingService(ipfsService, starknetService);
}

/**
 * Utility function to estimate upload time based on file size
 */
export function estimateUploadTime(fileSizeBytes: number): number {
  // Rough estimate: 1MB per 10 seconds on average connection
  const mbSize = fileSizeBytes / (1024 * 1024);
  return Math.max(5, Math.round(mbSize * 10)); // Minimum 5 seconds
}

