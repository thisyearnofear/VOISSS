import { z } from 'zod';

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
});

export type VoiceRecording = z.infer<typeof VoiceRecordingSchema>;

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
