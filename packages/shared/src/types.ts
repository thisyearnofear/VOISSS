import { z } from 'zod';
import { AUDIO_CONFIG } from './constants';

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
  participantConsent: z.boolean(), // Whether participant consent was obtained
  consentProof: z.string().optional(), // IPFS hash of consent recording/document
  isAnonymized: z.boolean(), // Whether voices are anonymized
  voiceObfuscated: z.boolean(), // Whether voice obfuscation was applied
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

// Additional Social & Organization Types

export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
});

export type Tag = z.infer<typeof TagSchema>;

export const RecordingFilterSchema = z.object({
  search: z.string(),
  tags: z.array(z.string()),
  sortBy: z.enum(["date", "duration", "name"]),
  sortOrder: z.enum(["asc", "desc"]),
  favorites: z.boolean(),
});

export type RecordingFilter = z.infer<typeof RecordingFilterSchema>;



export const CommunitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  members: z.number(),
  image: z.string(),
  isPrivate: z.boolean(),
  ownerId: z.string(),
});

export type Community = z.infer<typeof CommunitySchema>;

// Recording types for unified cross-platform usage
export const RecordingSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  duration: z.number(),
  fileSize: z.number().optional(),
  format: z.enum(['mp3', 'wav', 'aac', 'm4a']).optional(),
  quality: z.enum(['low', 'medium', 'high', 'lossless']).optional(),
  tags: z.array(z.string()),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]).optional(),
  isPublic: z.boolean(),
  ipfsHash: z.string().optional(),
  ipfsUrl: z.string().optional(),
  transactionHash: z.string().optional(),
  onChain: z.boolean().optional(),
  owner: z.string().optional(),
  isHidden: z.boolean().optional(),
  // Agent-specific fields
  isAgentContent: z.boolean().optional(),
  category: z.enum(['defi', 'governance', 'alpha', 'memes', 'general']).optional(),
  x402Price: z.string().optional(), // Price in wei as string
  agentId: z.string().optional(), // Agent wallet address
  // Mobile-specific fields
  filePath: z.string().optional(),
  // Additional metadata
  location: z.object({
    city: z.string(),
    country: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }).optional(),
  context: z.string().optional(),
});

export type Recording = z.infer<typeof RecordingSchema>;

// Agent Types (EIP-8004 inspired)
export const AgentCategorySchema = z.enum(['defi', 'governance', 'alpha', 'memes', 'general']);
export type AgentCategory = z.infer<typeof AgentCategorySchema>;

// Voice Provider Types (Agent Gateway Pattern) - moved up for proper declaration order
export const ServiceTierSchema = z.enum(['Managed', 'Verified', 'Sovereign']);
export type ServiceTier = z.infer<typeof ServiceTierSchema>;

export const AgentProfileSchema = z.object({
  agentAddress: z.string(),
  metadataURI: z.string(), // IPFS or HTTPS link to agent config
  name: z.string(),
  categories: z.array(AgentCategorySchema),
  registeredAt: z.union([z.date(), z.number()]),
  isActive: z.boolean(),
  x402Enabled: z.boolean(),
  isBanned: z.boolean().default(false),
  tier: ServiceTierSchema.default('Managed'),
  creditBalance: z.number().default(0),
  voiceProvider: z.string().default('0x0000000000000000000000000000000000000000'),
});

export type AgentProfile = z.infer<typeof AgentProfileSchema>;

// Agent metadata stored on IPFS
export const AgentMetadataSchema = z.object({
  voiceId: z.string(), // ElevenLabs voice ID
  categories: z.array(AgentCategorySchema),
  pricing: z.object({
    perNote: z.string(), // Price in ETH/USDC
    subscription: z.string().optional(), // Monthly price
  }),
  x402Support: z.boolean(),
  description: z.string(),
  avatarUrl: z.string().optional(),
});

export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;

// Reputation/Feedback Types (EIP-8004 inspired)
export const FeedbackSchema = z.object({
  client: z.string(), // Address of feedback giver
  value: z.number(), // Score value
  valueDecimals: z.number(), // Decimal places
  tag1: z.string(), // Category (e.g., "defi")
  tag2: z.string(), // Quality signal (e.g., "accurate")
  timestamp: z.union([z.date(), z.number()]),
  isRevoked: z.boolean(),
});

export type Feedback = z.infer<typeof FeedbackSchema>;

export const AgentReputationSchema = z.object({
  agentId: z.string(),
  averageScore: z.number(),
  totalFeedback: z.number(),
  categoryScores: z.record(z.number()), // { [category]: score }
});

export type AgentReputation = z.infer<typeof AgentReputationSchema>;

// Voice Provider Types (Agent Gateway Pattern) - continued
export const VoiceGenerationRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string(),
  agentAddress: z.string(),
  maxDurationMs: z.number().min(1000).max(AUDIO_CONFIG.MAX_DURATION_MS).optional(),
  options: z.object({
    model: z.string().default("eleven_multilingual_v2"),
    stability: z.number().min(0).max(1).default(0.5),
    similarity_boost: z.number().min(0).max(1).default(0.5),
    autoSave: z.boolean().default(false),
  }).optional().default({}),
});

export type VoiceGenerationRequest = z.infer<typeof VoiceGenerationRequestSchema>;

export const VoiceGenerationResultSchema = z.object({
  success: z.boolean(),
  audioUrl: z.string().optional(),
  contentHash: z.string().optional(),
  cost: z.number().optional(),
  characterCount: z.number().optional(),
  creditBalance: z.number().optional(),
  ipfsHash: z.string().optional(),
  recordingId: z.string().optional(),
  error: z.string().optional(),
});

export type VoiceGenerationResult = z.infer<typeof VoiceGenerationResultSchema>;

export const AgentCreditInfoSchema = z.object({
  agentAddress: z.string(),
  name: z.string(),
  creditBalance: z.number(),
  tier: ServiceTierSchema,
  voiceProvider: z.string(), // Contract address, 0x0 = VOISSS default
  isActive: z.boolean(),
  supportedVoices: z.array(z.string()),
  costPerCharacter: z.number(),
});

export type AgentCreditInfo = z.infer<typeof AgentCreditInfoSchema>;
