// Shared types and utilities for VOISSS platform
export * from './types';
export * from './types/socialfi';
export * from './constants/languages';
export * from './types/audio';
export * from './services/audio/ai/elevenlabs-service';
export * from './starknet/index'; // Legacy export for backward compatibility

// Token services - New consolidated token access
export * from './services/token';

// AI Services
export * from './services/routeway-service';
export * from './utils/routeway-utils';
export * from './utils/safe-routeway-input';

// Export blockchain chain configurations (types & constants only, no wallet logic)
export * from './blockchain/chains/base';
export * from './blockchain/chains/starknet';
export * from './blockchain/chains/scroll';
export * from './utils/session';
export * from './utils';
export * from './utils/formatters';
export * from './theme';

// Services with explicit exports to avoid conflicts
export * from './services/ipfs-service';
export * from './services/temp-audio-storage';
export * from './services/agent-verification';
export * from './services/audio-converter';
export * from './services/recording-service';
export * from './services/mission-service';
export * from './services/moderation-service';
export * from './services/database-service';
// cross-platform-storage is the single public storage API.
// localStorage-database and asyncStorage-database are internal adapters —
// import cross-platform-storage instead of using them directly.
export * from './services/cross-platform-storage';
// Note: persistent-mission-service factory uses pg adapter which is server-only
// To use: import { createMissionService } from '@voisss/shared/services/persistent-mission-service'
// Avoid importing from main index to prevent pg from being bundled in browser
// export * from './services/persistent-mission-service';
// Export Farcaster service conditionally for server-side only
// export * from './services/farcaster-social';

// Audio types and services
export * from './types/audio';
export * from './types/audio-version';
export * from './types/transcript';
export * from './utils/timed-transcript';
export * from './services/audio/ai/elevenlabs-service';
export * from './services/audio/ai/client-ai-service';

// Re-export createAIServiceClient as the main export
export { createAIServiceClient } from './services/audio/ai/client-ai-service';
export { createElevenLabsProvider, ElevenLabsTransformProvider } from './services/audio/ai/elevenlabs-service';

// Hooks - NOT exported from main index to prevent bundling in server components
// Client components should import directly:
// import { useMemoryContext } from '@voisss/shared/hooks/useMemoryContext'
// import { useCrossPlatformStorage } from '@voisss/shared/hooks/useCrossPlatformStorage'

// Wallet connectors - NOT exported from this file
// Apps that need wallet connectors should import directly:
// import { WalletConnectorService } from '@voisss/shared/services/wallet-connectors'
// This prevents wagmi and other web-only deps from being bundled in React Native builds



// Web3 utilities
export * from './utils/web3-utils';

// Feature flags
export * from './utils/featureFlags';

// Language constants and utilities
export * from './constants/languages';

// Platform constants (AUDIO_CONFIG, etc.)
export * from './constants';

// Token access configuration (server-safe)
export * from './config/tokenAccess';

// Tier bridge — canonical mapping between TokenTier and UserTier (server-safe)
export * from './utils/tierBridge';
export * from './services/token-burn-service';
// Note: useTokenAccess is a client-only hook and should be imported directly:
// import { useTokenAccess } from '@voisss/shared/hooks/useTokenAccess'

// Unified Payment System (server-safe)
export * from './services/payment';

// Note: Other hooks are NOT exported from main index to prevent bundling in server components
// Client components should import directly:
// import { useMemoryContext } from '@voisss/shared/hooks/useMemoryContext'