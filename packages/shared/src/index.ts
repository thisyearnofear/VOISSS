// Shared types and utilities for VOISSS platform
export * from './types';
export * from './types/socialfi';
export * from './utils';
export * from './theme';

// Services with explicit exports to avoid conflicts
export * from './services/starknet-recording';
export * from './services/ipfs-service';
export * from './services/audio-converter';
export * from './services/recording-service';
export * from './services/mission-service';
export * from './services/database-service';
export * from './services/localStorage-database';
export * from './services/persistent-mission-service';

// Audio types and services
export * from './types/audio';
export * from './services/audio/ai/elevenlabs-service';
export * from './services/audio/ai/client-ai-service';

// Re-export createAIServiceClient as the main export
export { createAIServiceClient } from './services/audio/ai/client-ai-service';

// Feature flags
export * from './utils/featureFlags';

// Language constants and utilities
export * from './constants/languages';
