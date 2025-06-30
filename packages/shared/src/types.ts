import { z } from 'zod';

// Mission Context for Recordings
export const MissionContextSchema = z.object({
  missionId: z.string(),
  title: z.string(),
  description: z.string(),
  topic: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  reward: z.number(),
  targetDuration: z.number(),
  examples: z.array(z.string()),
  contextSuggestions: z.array(z.string()),
  acceptedAt: z.date(),
});

export type MissionContext = z.infer<typeof MissionContextSchema>;

// Voice Recording Types
export const VoiceRecordingSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  duration: z.number(), // in seconds
  fileSize: z.number(), // in bytes
  format: z.enum(['mp3', 'wav', 'aac', 'm4a']),
  quality: z.enum(['low', 'medium', 'high', 'lossless']),
  tags: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
  isPublic: z.boolean(),
  starknetTxHash: z.string().optional(), // Transaction hash for blockchain storage
  ipfsHash: z.string().optional(), // IPFS hash for decentralized storage
  // Mission-related fields
  missionContext: MissionContextSchema.optional(), // Mission this recording was created for
  isCompleted: z.boolean().default(false), // Whether this recording completes a mission
  completedAt: z.date().optional(), // When the mission was completed
  location: z.object({
    city: z.string(),
    country: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }).optional(), // Location where recording was made
  context: z.string().optional(), // Context where recording was made (taxi, coffee shop, etc.)
  participantConsent: z.boolean().default(false), // Whether participant consent was obtained
  consentProof: z.string().optional(), // IPFS hash of consent recording/document
  isAnonymized: z.boolean().default(false), // Whether voices are anonymized
  voiceObfuscated: z.boolean().default(false), // Whether voice obfuscation was applied
});

export type VoiceRecording = z.infer<typeof VoiceRecordingSchema>;

// Mission-aware recording interface for UI components
export interface MissionRecording {
  id: string;
  title: string;
  blob?: Blob;
  duration: number;
  timestamp: Date;
  onChain?: boolean;
  transactionHash?: string;
  ipfsHash?: string;
  ipfsUrl?: string;
  fileSize?: number;
  isHidden?: boolean;
  customTitle?: string;
  // Mission-specific fields
  missionContext?: MissionContext;
  isCompleted?: boolean;
  completedAt?: Date;
  location?: {
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  context?: string;
  participantConsent?: boolean;
  consentProof?: string;
  isAnonymized?: boolean;
  voiceObfuscated?: boolean;
}

// User Types
export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  avatar: z.string().optional(),
  starknetAddress: z.string().optional(),
  createdAt: z.date(),
  isVerified: z.boolean(),
});

export type User = z.infer<typeof UserSchema>;

// Starknet Integration Types
export const StarknetContractSchema = z.object({
  address: z.string(),
  abi: z.array(z.any()),
  network: z.enum(['mainnet', 'testnet', 'devnet']),
});

export type StarknetContract = z.infer<typeof StarknetContractSchema>;

// API Response Types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Recording Metadata
export const RecordingMetadataSchema = z.object({
  sampleRate: z.number(),
  bitRate: z.number(),
  channels: z.number(),
  codec: z.string(),
  device: z.string().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

export type RecordingMetadata = z.infer<typeof RecordingMetadataSchema>;
