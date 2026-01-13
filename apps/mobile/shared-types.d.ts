// Temporary type declarations for @voisss/shared package
// These are placeholder types to help with compilation while the actual shared package types are being fixed

declare module '@voisss/shared' {
  // Audio types
  export interface VoiceInfo {
    id: string;
    name: string;
    description?: string;
    previewUrl?: string;
    category?: string;
  }

  export interface VoiceRecording {
    id: string;
    uri: string;
    duration: number;
    createdAt: string;
    updatedAt: string;
    title?: string;
    description?: string;
    tags?: Tag[];
    language?: string;
    isPublic?: boolean;
    fileSize?: number;
    metadata?: any;
  }

  export interface MissionRecording {
    id: string;
    missionId: string;
    recordingId: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
  }

  export interface Tag {
    id: string;
    name: string;
    color?: string;
  }

  export interface Mission {
    id: string;
    title: string;
    description: string;
    reward: number;
    difficulty: 'easy' | 'medium' | 'hard';
    status: 'active' | 'completed' | 'expired';
    createdAt: string;
    updatedAt: string;
    currentParticipants?: number;
    maxParticipants?: number;
    expiresAt?: string;
    locationBased?: boolean;
    topic?: string;
  }

  export interface Recording {
    id: string;
    audioUrl: string;
    duration: number;
    createdAt: string;
    updatedAt: string;
    userId: string;
    metadata?: any;
    title?: string;
    description?: string;
    tags?: Tag[];
    language?: string;
    isPublic?: boolean;
    uri?: string;
    fileSize?: number;
    format?: string;
    quality?: string;
    waveform?: number[];
    category?: string;
    source?: string;
  }

  export interface RecordingFilter {
    id: string;
    name: string;
    type: 'tag' | 'language' | 'duration' | 'date';
    value: string;
    search?: string;
    tags?: string[];
    favorites?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }

  // Blockchain types
  export interface ScrollVoiceChallenge {
    id: string;
    title: string;
    description: string;
    reward: string;
    difficulty: number;
    status: 'active' | 'completed' | 'expired';
  }

  export interface ScrollAchievement {
    id: string;
    name: string;
    description: string;
    points: number;
    isCompleted: boolean;
  }

  export interface VoiceChallengeSubmission {
    challengeId: string;
    recordingId: string;
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
  }

  export interface ScrollLeaderboardEntry {
    userId: string;
    username: string;
    score: number;
    rank: number;
  }

  export interface UserAchievementProgress {
    achievementId: string;
    userId: string;
    progress: number;
    completed: boolean;
    lastUpdated: string;
  }

  // Service types
  export const crossPlatformStorage: any;
  export const walletConnectorService: any;
  export const ipfsService: any;
  export const audioConverter: any;
  export const recordingService: any;
  export const missionService: any;
  export const databaseService: any;
  export const localStorageDatabase: any;
  export const asyncStorageDatabase: any;
  export const persistentMissionService: any;
  export const onboardingService: any;
  export const walletConnectors: any;
  export const createIPFSService: any;

  // Utility functions
  export const formatDuration: (seconds: number) => string;
  export const formatFileSize: (bytes: number) => string;
  export const formatRelativeTime: (date: Date | string) => string;
  export const createPersistentMissionService: any;
  export const createAIServiceClient: any;

  // Utility types
  export const useMemoryContext: any;
  export const useCrossPlatformStorage: any;

  // Constants
  export const languages: any;
  export const constants: any;

  // Theme
  export const theme: any;

  // Blockchain
  export const blockchain: any;
  export const starknet: any;

  // Web3 Utilities
  export const web3Utils: any;
  export const featureFlags: any;
}