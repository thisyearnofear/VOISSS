/**
 * React Native compatible exports for VOISSS shared package
 * 
 * This file excludes Node.js-specific dependencies that are incompatible
 * with React Native's Hermes engine:
 * - starknet (uses node:crypto)
 * - @neynar/nodejs-sdk (Node.js only)
 * - recording-service (depends on starknet)
 */

// Core types (safe - no Node.js dependencies)
export * from './types';
export * from './types/socialfi';
export type { Recording, VoiceRecording, Tag, MissionContext } from './types';
export * from './types/audio';

// Constants (safe - pure data)
export * from './constants/languages';

// Theme (safe - pure data)
export * from './theme';

// Utilities (safe - pure JavaScript)
export * from './utils';
export * from './utils/formatters';
export * from './utils/featureFlags';

// Session utilities (safe - uses AsyncStorage which is compatible)
export * from './utils/session';

// Services that don't require Node.js dependencies
export * from './services/baseRecordingService';
export * from './services/ipfs-service';
export * from './services/mission-service';
export * from './services/database-service';
export * from './services/localStorage-database';
export * from './services/persistent-mission-service';
export * from './services/onboarding-service';

// Audio services (safe - client-side only)
export * from './services/audio/ai/elevenlabs-service';
export * from './services/audio/ai/client-ai-service';
export { createAIServiceClient } from './services/audio/ai/client-ai-service';
export { createElevenLabsProvider, ElevenLabsTransformProvider } from './services/audio/ai/elevenlabs-service';

// Hooks (safe)
export * from './hooks/useMemoryContext';

// Blockchain - only export types and safe chain configurations
export * from './blockchain/chains/base';
export * from './blockchain/chains/starknet';
export * from './blockchain/chains/scroll';

// Re-export ALL_CHAINS without the adapters that use Node.js modules
import { STARKNET_CHAINS, StarknetChain } from './blockchain/chains/starknet';
import { SCROLL_CHAINS, ScrollChain } from './blockchain/chains/scroll';
import type { BaseChainConfig, TipTransaction, ChainAdapter } from './blockchain/chains/base';

// Mobile-supported chains (excludes ethereum which is not configured)
export type MobileSupportedChains = 'starknet' | 'scroll';

export const ALL_CHAINS: Record<MobileSupportedChains, Record<string, BaseChainConfig>> = {
    starknet: STARKNET_CHAINS,
    scroll: SCROLL_CHAINS,
} as const;

export type AllChains = {
    starknet: StarknetChain;
    scroll: ScrollChain;
};

// Re-export specific types that are commonly used
export type {
    BaseChainConfig,
    TipTransaction,
    ChainAdapter,
    StarknetChain,
    ScrollChain,
};

// For backward compatibility, also export SupportedChains as MobileSupportedChains
export type SupportedChains = MobileSupportedChains;

// Legacy Starknet exports - only types and config (no SDK)
export * from './starknet/index';

/**
 * Note: The following are NOT exported for React Native:
 * 
 * - createStarknetRecordingService (uses starknet SDK with node:crypto)
 * - StarknetRecordingService (uses starknet SDK with node:crypto)
 * - createRecordingService (depends on StarknetRecordingService)
 * - RecordingService (depends on StarknetRecordingService)
 * - FarcasterSocialService (uses @neynar/nodejs-sdk)
 * - blockchainService (uses adapters with potential Node.js deps)
 * - audio-converter (uses Web Audio API - browser only)
 * 
 * For mobile, use the mobile-specific implementations in apps/mobile/services/
 */
