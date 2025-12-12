export interface VoiceInfo {
  voiceId: string;
  name?: string;
  description?: string;
}

/**
 * Enhanced voice style with UI metadata and categorization
 * Used for mobile and web voice selection interfaces
 */
export interface AIVoiceStyle extends VoiceInfo {
  id: string;
  category: 'professional' | 'creative' | 'fun' | 'emotional';
  previewText: string;
  icon: string;
  // Additional UI metadata
  isPremium?: boolean;
  popularity?: number;
  tags?: string[];
}

/**
 * Voice enhancement options for AI transformation
 */
export interface AIEnhancementOption {
  id: string;
  name: string;
  description: string;
  type: 'style' | 'emotion' | 'effect' | 'language';
  values: string[];
  defaultValue?: string;
}

/**
 * Scroll-exclusive voice challenge
 * Gamification feature using VRF for fair selection
 */
export interface ScrollVoiceChallenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  reward: string;
  voiceStyleRequirements?: string[];
  durationRequirements?: {
    minSeconds: number;
    maxSeconds: number;
  };
  chainSpecific: 'scroll' | 'starknet' | 'both';
  startDate: string;
  endDate: string;
  isActive: boolean;
  participants?: string[];
  winners?: string[];
}

/**
 * Voice challenge submission
 */
export interface VoiceChallengeSubmission {
  challengeId: string;
  userAddress: string;
  recordingId: string;
  submissionDate: string;
  voiceStyleUsed: string;
  enhancementsUsed: Record<string, string>;
  status: 'pending' | 'approved' | 'rejected' | 'winner';
  vrfProof?: string; // Proof of fair selection if winner
}

/**
 * Scroll leaderboard entry
 */
export interface ScrollLeaderboardEntry {
  userAddress: string;
  username: string;
  score: number;
  rank: number;
  challengesCompleted: number;
  challengesWon: number;
  totalRecordings: number;
  privateRecordings: number;
  lastActive: string;
}

/**
 * Scroll achievement
 */
export interface ScrollAchievement {
  id: string;
  name: string;
  description: string;
  criteria: string;
  points: number;
  isSecret?: boolean;
  chainSpecific: 'scroll' | 'starknet' | 'both';
}

/**
 * User achievement progress
 */
export interface UserAchievementProgress {
  achievementId: string;
  userAddress: string;
  progress: number;
  completed: boolean;
  completionDate?: string;
}

export interface VoiceVariantPreview {
  generatedVoiceId: string;
  // Optional: base64 or URL for previewing
  audioBase64?: string;
}

export interface TransformOptions {
  voiceId: string;
  modelId?: string; // default via env
  outputFormat?: string; // default via env
}

export interface DubbingLanguage {
  code: string;
  name: string;
  nativeName?: string;
}

export interface DubbingOptions extends TransformOptions {
  targetLanguage: string;
  sourceLanguage?: string; // auto-detect if not provided
  preserveBackgroundAudio?: boolean;
  modelId?: string; // default via env
}

export interface DubbingResult {
  dubbedAudio: Blob;
  transcript?: string;
  translatedTranscript?: string;
  detectedSpeakers?: number;
  targetLanguage: string;
  processingTime?: number;
}

export interface IAudioTransformProvider {
  listVoices(): Promise<VoiceInfo[]>;
  transformVoice(blob: Blob, options: TransformOptions): Promise<Blob>;
  dubAudio?(blob: Blob, options: DubbingOptions): Promise<DubbingResult>;
  getSupportedDubbingLanguages?(): Promise<DubbingLanguage[]>;
  remixVoice?(params: { baseVoiceId: string; description: string; text: string }): Promise<VoiceVariantPreview[]>;
  createVoiceFromPreview?(previewId: string, params: { name: string; description?: string }): Promise<{ voiceId: string }>;
  // New methods for client-side polling
  startDubbingJob?(blob: Blob, options: DubbingOptions): Promise<string>;
  getDubbingStatus?(dubbingId: string): Promise<{ status: string; error?: string }>;
  getDubbedAudio?(dubbingId: string, targetLanguage: string): Promise<DubbingResult>;
}
