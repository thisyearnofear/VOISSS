// Core types
export * from './types/socialfi';
export * from './types/engagement';
export * from './types/audio';
export * from './types/audio-version';
export * from './types/api.types';
export * from './types/market-intelligence';

// API route registry (single source of truth for HTTP endpoints)
export * from './api/routes';

// Re-export from ./types excluding ApiResponse/ApiResponseSchema (conflicts with api.types)
export {
  MissionContextSchema, type MissionContext,
  VoiceRecordingSchema, type VoiceRecording,
  type MissionRecording,
  UserSchema, type User,
  RecordingMetadataSchema, type RecordingMetadata,
  TagSchema, type Tag,
  RecordingFilterSchema, type RecordingFilter,
  CommunitySchema, type Community,
  RecordingSchema, type Recording,
  AgentCategorySchema, type AgentCategory,
  ServiceTierSchema, type ServiceTier,
  AgentProfileSchema, type AgentProfile,
  AgentMetadataSchema, type AgentMetadata,
  FeedbackSchema, type Feedback,
  AgentReputationSchema, type AgentReputation,
  VoiceGenerationRequestSchema, type VoiceGenerationRequest,
  VoiceGenerationResultSchema, type VoiceGenerationResult,
  AgentCreditInfoSchema, type AgentCreditInfo,
  AgentThemeSchema, type AgentTheme,
  AgentSubmissionRequestSchema, type AgentSubmissionRequest,
  AgentSubmissionResponseSchema, type AgentSubmissionResponse,
  AgentRegistrationRequestSchema, type AgentRegistrationRequest,
  AgentRegistrationResponseSchema, type AgentRegistrationResponse,
  type USDCAmount, type TokenAmount,
} from './types';

// Services
export * from './services/mission-service';
export * from './services/persistent-mission-service';
export * from './services/engagement-service';
export * from './services/database-service';
export * from './services/memory-database';
export * from './services/cross-platform-storage';
export * from './services/ipfs-service';
export * from './services/payment/types';
export * from './services/payment/x402Client';
export * from './services/payment/PaymentRouter';
export * from './services/market-intelligence/firecrawl-service';
export * from './services/audio/ai/elevenlabs-service';
export * from './services/butler-memory-service';
// NOTE: server-only services (acp-listener-service, agent-reputation) are
// exported from ./index.server.ts only. Re-exporting them here pulls
// Node.js built-ins (child_process, fs, path) into the browser bundle and
// breaks Next.js production builds.

// Hooks - use deep imports to avoid pulling React into server bundles
// e.g. import { useTokenAccess } from '@voisss/shared/hooks/useTokenAccess'
// e.g. import { useEngagement } from '@voisss/shared/hooks/useEngagement'

// Utils
export * from './utils/formatters';

// Config
export * from './config/platform';
export * from './config/tokenAccess';

// Constants
export * from './constants';
export * from './constants/languages';
