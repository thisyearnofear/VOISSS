/**
 * Local types for mobile app
 * Isolated from @voisss/shared to avoid dependency issues
 */

export interface VoiceRecording {
  id: string;
  title: string;
  description?: string;
  duration: number;
  createdAt: string | Date;
  updatedAt?: string | Date;
  isPublic: boolean;
  tags: string[];
  ipfsHash?: string;
  uri?: string;
  audioUrl?: string;
  userId?: string;
  format?: 'mp3' | 'wav' | 'aac' | 'm4a';
  quality?: 'low' | 'medium' | 'high';
  fileSize?: number;
  waveform?: number[];
  context?: string;
  metadata?: Record<string, any>;
  participantConsent?: boolean;
  isAnonymized?: boolean;
  voiceObfuscated?: boolean;
  isCompleted?: boolean;
}

export interface Recording extends VoiceRecording {
  // Extended recording type
  mimeType?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface RecordingFilter {
  tags?: string[];
  isPublic?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  search?: string;
  sortBy?: 'date' | 'duration' | 'name';
  sortOrder?: 'asc' | 'desc';
  favorites?: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  rewards?: number;
  expiresAt?: string | Date;
  currentParticipants?: number;
  maxParticipants?: number;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  locationBased?: boolean;
}

export interface MissionRecording {
  id: string;
  title: string;
  description?: string;
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
  missionContext?: any;
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

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
};

export type LanguageInfo = {
  code: string;
  name: string;
  nativeName?: string;
  flag?: string;
  sampleText?: string;
  isPopular?: boolean;
};

export const SUPPORTED_DUBBING_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', sampleText: 'Hello, how are you?', isPopular: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', sampleText: 'Hola, ¿cómo estás?' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', sampleText: 'Bonjour, comment allez-vous?' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', sampleText: 'Hallo, wie geht es dir?' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', sampleText: 'Ciao, come stai?' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', sampleText: 'Olá, como você está?' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', sampleText: 'こんにちは、お元気ですか？' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', sampleText: '안녕하세요, 어떻게 지내세요?' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', sampleText: '你好，你好吗？' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', sampleText: 'Привет, как дела?' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', sampleText: 'مرحبا، كيف حالك؟' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', sampleText: 'नमस्ते, आप कैसे हैं?' },
];

export const getPopularLanguages = (): LanguageInfo[] => {
  return SUPPORTED_DUBBING_LANGUAGES.filter(lang => lang.isPopular);
};

export interface VoiceInfo {
  id: string;
  name: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
}

export interface TransformOptions {
  voiceId: string;
  modelId?: string;
  outputFormat?: string;
}

export interface VoiceVariantPreview {
  generatedVoiceId: string;
  audioBase64?: string;
}

export interface DubbingLanguage {
  code: string;
  name: string;
  nativeName?: string;
}

export interface DubbingOptions extends TransformOptions {
  targetLanguage: string;
  sourceLanguage?: string;
  preserveBackgroundAudio?: boolean;
  modelId?: string;
}

export interface DubbingResult {
  dubbedAudio: Blob;
  transcript?: string;
  translatedTranscript?: string;
  detectedSpeakers?: number;
  targetLanguage: string;
  processingTime?: number;
}

export interface AIVoiceStyle {
  id: string;
  name?: string;
  description?: string;
  category: 'professional' | 'creative' | 'fun' | 'emotional';
  previewText: string;
  icon: string;
  isPremium?: boolean;
  popularity?: number;
  tags?: string[];
}

export interface AIEnhancementOption {
  id: string;
  name: string;
  description: string;
  type: 'style' | 'emotion' | 'effect' | 'language';
  values: string[];
  defaultValue?: string;
}

export interface IAudioTransformProvider {
  listVoices(): Promise<VoiceInfo[]>;
  transformVoice(blob: Blob, options: TransformOptions): Promise<Blob>;
  dubAudio?(blob: Blob, options: DubbingOptions): Promise<DubbingResult>;
  getSupportedDubbingLanguages?(): Promise<DubbingLanguage[]>;
  remixVoice?(params: { baseVoiceId: string; description: string; text: string }): Promise<VoiceVariantPreview[]>;
  createVoiceFromPreview?(previewId: string, params: { name: string; description?: string }): Promise<{ voiceId: string }>;
  startDubbingJob?(blob: Blob, options: DubbingOptions): Promise<string>;
  getDubbingStatus?(dubbingId: string): Promise<{ status: string; error?: string }>;
  getDubbedAudio?(dubbingId: string, targetLanguage: string): Promise<DubbingResult>;
}

export interface ElevenLabsTransformProvider extends IAudioTransformProvider {
  // ElevenLabs-specific methods
}

// Constants for AI voice styles and enhancements
export const AI_VOICE_STYLES: AIVoiceStyle[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clear, articulate voice for business presentations',
    category: 'professional',
    previewText: 'This is a professional voice for formal communications.',
    icon: '💼',
  },
  {
    id: 'narrator',
    name: 'Narrator',
    description: 'Engaging storytelling voice',
    category: 'creative',
    previewText: 'Once upon a time, in a land far away...',
    icon: '📖',
  },
  {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm and approachable tone',
    category: 'emotional',
    previewText: 'Hello there! How can I help you today?',
    icon: '😊',
  },
  {
    id: 'enthusiastic',
    name: 'Enthusiastic',
    description: 'Energetic and upbeat voice',
    category: 'emotional',
    previewText: 'This is amazing! Let\'s get started right away!',
    icon: '🔥',
  },
];

export const AI_ENHANCEMENT_OPTIONS: AIEnhancementOption[] = [
  {
    id: 'pitch',
    name: 'Pitch',
    description: 'Adjust the pitch of the voice',
    type: 'effect',
    values: ['lower', 'higher', 'normal'],
    defaultValue: 'normal',
  },
  {
    id: 'speed',
    name: 'Speed',
    description: 'Control the speaking speed',
    type: 'effect',
    values: ['slower', 'faster', 'normal'],
    defaultValue: 'normal',
  },
  {
    id: 'tone',
    name: 'Tone',
    description: 'Modify the emotional tone',
    type: 'emotion',
    values: ['happy', 'sad', 'angry', 'calm'],
    defaultValue: 'calm',
  },
  {
    id: 'accent',
    name: 'Accent',
    description: 'Apply regional accents',
    type: 'language',
    values: ['american', 'british', 'australian', 'none'],
    defaultValue: 'none',
  },
];

export interface AudioMetadata {
  duration: number;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  format: string;
  codec: string;
  filename?: string;
}

// Scroll-specific types
export interface ScrollVoiceChallenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  difficulty: number; // Changed from string to number as per error
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

export interface ScrollAchievement {
  id: string;
  name: string;
  description: string;
  criteria: string; // Added as per error
  points: number;
  isSecret?: boolean;
  chainSpecific: 'scroll' | 'starknet' | 'both';
}

export interface VoiceChallengeSubmission {
  challengeId: string;
  userAddress: string; // Added as per error
  recordingId: string;
  submissionDate: string;
  voiceStyleUsed: string;
  enhancementsUsed: Record<string, string>;
  status: 'pending' | 'approved' | 'rejected' | 'winner';
  vrfProof?: string;
}

export interface ScrollLeaderboardEntry {
  userAddress: string; // Added as per error
  username: string;
  score: number;
  rank: number;
  challengesCompleted: number;
  challengesWon: number;
  totalRecordings: number;
  privateRecordings: number;
  lastActive: string;
}

export interface UserAchievementProgress {
  achievementId: string;
  userAddress: string; // Added as per error
  progress: number;
  completed: boolean;
  completionDate?: string;
  userId?: string; // Added as per error
  lastUpdated?: string; // Added as per error
}

// Voice cache entry with timestamp
export interface VoiceCacheEntry {
  blob: Blob;
  timestamp: number;
}

export interface IPFSUploadResult {
  hash: string;
  size: number;
  url?: string;
}

// Blockchain types
export interface BaseChainConfig {
  name: string;
  id: number;
  rpcUrl: string;
  explorerUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contractAddresses: {
    [key: string]: string;
  };
}

// Define chain configurations
export const ALL_CHAINS = {
  starknet: {
    TESTNET: {
      name: 'Starknet Sepolia',
      id: 11155111,
      rpcUrl: 'https://starknet-sepolia.public.blastapi.io',
      explorerUrl: 'https://sepolia.starkscan.co',
      currency: {
        name: 'STRK',
        symbol: 'STRK',
        decimals: 18,
      },
      contractAddresses: {
        recordingRegistry: '0x1234567890123456789012345678901234567890',
      },
    },
    MAINNET: {
      name: 'Starknet Mainnet',
      id: 11155111,
      rpcUrl: 'https://starknet-mainnet.public.blastapi.io',
      explorerUrl: 'https://starkscan.co',
      currency: {
        name: 'STRK',
        symbol: 'STRK',
        decimals: 18,
      },
      contractAddresses: {
        recordingRegistry: '0x1234567890123456789012345678901234567890',
      },
    },
  },
  scroll: {
    TESTNET: {
      name: 'Scroll Sepolia',
      id: 534351,
      rpcUrl: 'https://sepolia-rpc.scroll.io',
      explorerUrl: 'https://sepolia.scrollscan.com',
      currency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      contractAddresses: {
        recordingRegistry: '0x1234567890123456789012345678901234567890',
      },
    },
    MAINNET: {
      name: 'Scroll Mainnet',
      id: 534352,
      rpcUrl: 'https://rpc.scroll.io',
      explorerUrl: 'https://scrollscan.com',
      currency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      contractAddresses: {
        recordingRegistry: '0x1234567890123456789012345678901234567890',
      },
    },
  },
} as const;

// Re-export MobileSupportedChains as SupportedChains for backward compatibility
export type SupportedChains = keyof typeof ALL_CHAINS; // 'starknet' | 'scroll'
