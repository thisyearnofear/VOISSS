// Shared types and utilities for VOISSS platform
export * from './types';
export * from './types/socialfi';
export type { Recording, VoiceRecording, Tag, MissionContext } from './types';
export * from './constants/languages';
export * from './types/audio';
export * from './services/audio/ai/elevenlabs-service';
export * from './blockchain/index';
export * from './starknet/index'; // Legacy export for backward compatibility
export * from './utils/session';
export * from './utils';
export * from './utils/formatters';
export * from './theme';

// Services with explicit exports to avoid conflicts
export * from './services/baseRecordingService';
export * from './services/ipfs-service';
export * from './services/audio-converter';
export * from './services/recording-service';
export * from './services/mission-service';
export * from './services/database-service';
export * from './services/localStorage-database';
export * from './services/persistent-mission-service';
export * from './services/onboarding-service';
// Export Farcaster service conditionally for server-side only
// export * from './services/farcaster-social';

// Audio types and services
export * from './types/audio';
export * from './services/audio/ai/elevenlabs-service';
export * from './services/audio/ai/client-ai-service';

// Re-export createAIServiceClient as the main export
export { createAIServiceClient } from './services/audio/ai/client-ai-service';
export { createElevenLabsProvider, ElevenLabsTransformProvider } from './services/audio/ai/elevenlabs-service';

// Hooks
export * from './hooks/useMemoryContext';

// Feature flags
export * from './utils/featureFlags';

// Language constants and utilities
export * from './constants/languages';