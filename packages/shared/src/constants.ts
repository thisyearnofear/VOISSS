// Constants for VOISSS platform

// Audio Configuration
export const AUDIO_CONFIG = {
  SAMPLE_RATES: [8000, 16000, 22050, 44100, 48000] as const,
  BIT_RATES: [64000, 128000, 192000, 256000, 320000] as const,
  FORMATS: ['mp3', 'wav', 'aac', 'm4a'] as const,
  QUALITIES: ['low', 'medium', 'high', 'lossless'] as const,
  MAX_DURATION: 3600, // 1 hour in seconds
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
} as const;

// Starknet Configuration
export const STARKNET_CONFIG = {
  NETWORKS: {
    MAINNET: 'mainnet',
    TESTNET: 'testnet',
    DEVNET: 'devnet',
  },
  CONTRACT_ADDRESSES: {
    VOICE_STORAGE: '0x545b48dd76469e984b5622e5841d2affa30155980829399e7ec7447012922e2',
    USER_REGISTRY: '0x52bb03f52e7c07d6f7053b0fc7c52c9e0c7d73ceb36fab93db3d7bbc578bb63',
    ACCESS_CONTROL: '0x5db925a0dfe7ab9137121613ef66a32ceb48acbc9cc33091d804dd9feb983b5',
  },
  RPC_URLS: {
    MAINNET: 'https://starknet-mainnet.public.blastapi.io',
    TESTNET: 'https://starknet-testnet.public.blastapi.io',
    DEVNET: 'http://localhost:5050',
  },
} as const;

// UI Constants
export const UI_CONFIG = {
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#8B5CF6',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    BACKGROUND: '#FFFFFF',
    SURFACE: '#F9FAFB',
    TEXT_PRIMARY: '#111827',
    TEXT_SECONDARY: '#6B7280',
  },
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
  },
  ANIMATIONS: {
    DURATION_FAST: 150,
    DURATION_NORMAL: 300,
    DURATION_SLOW: 500,
  },
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  VOISSS_BACKEND: process.env.NEXT_PUBLIC_VOISSS_API || 'https://voisss.famile.xyz',
  ENDPOINTS: {
    RECORDINGS: '/recordings',
    USERS: '/users',
    AUTH: '/auth',
    UPLOAD: '/upload',
    SEARCH: '/search',
  },
  TIMEOUTS: {
    DEFAULT: 10000, // 10 seconds
    UPLOAD: 60000, // 1 minute
    DOWNLOAD: 30000, // 30 seconds
    AUDIO_TRANSFORM: 120000, // 2 minutes for audio processing
  },
} as const;

// Feature Flags
export const FEATURES = {
  STARKNET_INTEGRATION: true,
  IPFS_STORAGE: true,
  COMMUNITY_FEATURES: true,
  MOBILE_APP: true,
  ANALYTICS: true,
  MONETIZATION: false, // To be enabled post-hackathon
} as const;

// AI Voice Styles - Consolidated from mobile service
export const AI_VOICE_STYLES = [
  {
    id: 'podcast-host',
    name: 'Podcast Host',
    description: 'Professional and engaging podcast voice',
    voiceId: 'podcast-host-voice-id',
    category: 'professional' as const,
    previewText: 'Welcome to today\'s episode where we explore...',
    icon: 'mic',
    isPremium: false,
    popularity: 95,
    tags: ['professional', 'clear', 'engaging'],
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    description: 'Warm and captivating storytelling voice',
    voiceId: 'storyteller-voice-id',
    category: 'creative' as const,
    previewText: 'Once upon a time, in a land far away...',
    icon: 'book',
    isPremium: false,
    popularity: 88,
    tags: ['warm', 'narrative', 'children'],
  },
  {
    id: 'news-anchor',
    name: 'News Anchor',
    description: 'Authoritative and clear news presentation',
    voiceId: 'news-anchor-voice-id',
    category: 'professional' as const,
    previewText: 'Breaking news: Major developments in...',
    icon: 'newspaper',
    isPremium: false,
    popularity: 85,
    tags: ['authoritative', 'clear', 'news'],
  },
  {
    id: 'robot',
    name: 'Futuristic Robot',
    description: 'Synthetic voice with a sci-fi feel',
    voiceId: 'robot-voice-id',
    category: 'fun' as const,
    previewText: 'Initiating voice protocol. All systems operational.',
    icon: 'robot',
    isPremium: true,
    popularity: 78,
    tags: ['sci-fi', 'synthetic', 'fun'],
  },
  {
    id: 'whisper',
    name: 'Mystery Whisper',
    description: 'Soft and intriguing whisper voice',
    voiceId: 'whisper-voice-id',
    category: 'emotional' as const,
    previewText: 'Psst... I have a secret to tell you...',
    icon: 'volume-low',
    isPremium: true,
    popularity: 72,
    tags: ['mysterious', 'soft', 'intimate'],
  },
  {
    id: 'epic',
    name: 'Epic Narrator',
    description: 'Dramatic and powerful narration',
    voiceId: 'epic-voice-id',
    category: 'creative' as const,
    previewText: 'In a world where anything is possible...',
    icon: 'megaphone',
    isPremium: true,
    popularity: 89,
    tags: ['dramatic', 'powerful', 'cinematic'],
  },
] as const;

// AI Enhancement Options - Consolidated from mobile service
export const AI_ENHANCEMENT_OPTIONS = [
  {
    id: 'emotion',
    name: 'Emotion',
    description: 'Adjust the emotional tone of your voice',
    type: 'emotion' as const,
    values: ['happy', 'sad', 'angry', 'excited', 'calm', 'neutral'],
    defaultValue: 'neutral',
  },
  {
    id: 'speed',
    name: 'Speed',
    description: 'Control the speaking rate',
    type: 'effect' as const,
    values: ['slow', 'normal', 'fast'],
    defaultValue: 'normal',
  },
  {
    id: 'pitch',
    name: 'Pitch',
    description: 'Adjust voice pitch',
    type: 'effect' as const,
    values: ['low', 'normal', 'high'],
    defaultValue: 'normal',
  },
  {
    id: 'background',
    name: 'Background',
    description: 'Add background effects',
    type: 'effect' as const,
    values: ['none', 'studio', 'outdoor', 'phone', 'radio'],
    defaultValue: 'none',
  },
  {
    id: 'language',
    name: 'Language',
    description: 'Translate and adjust for language',
    type: 'language' as const,
    values: ['english', 'spanish', 'french', 'german', 'japanese', 'chinese'],
    defaultValue: 'english',
  },
] as const;

// Privacy Configuration - zkEVM and encryption settings
export const PRIVACY_CONFIG = {
  ENCRYPTION: {
    DEFAULT_ALGORITHM: 'aes-256' as const,
    SUPPORTED_ALGORITHMS: ['aes-256', 'rsa-4096', 'chacha20'] as const,
    KEY_SIZES: {
      'aes-256': 256,
      'rsa-4096': 4096,
      'chacha20': 256,
    },
  },
  ZKEVM: {
    PROOF_TYPES: ['groth16', 'plonk'] as const,
    DEFAULT_PROOF_TYPE: 'groth16' as const,
    VERIFICATION_GAS_LIMIT: '500000', // Gas limit for zk proof verification
  },
  ACCESS_CONTROL: {
    DEFAULT_EXPIRATION: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    MAX_ALLOWED_VIEWERS: 50,
    PUBLIC_METADATA_FIELDS: ['title', 'duration', 'sampleRate'] as const,
  },
  STORAGE: {
    PRIVATE_CONTENT_PREFIX: 'private-voisss-',
    ENCRYPTED_METADATA_PREFIX: 'encrypted-meta-',
    ZK_PROOF_PREFIX: 'zk-proof-',
  },
} as const;

// Privacy Feature Flags
export const PRIVACY_FEATURES = {
  ZKEVM_PRIVACY: true,
  SELECTIVE_DISCLOSURE: true,
  TIME_BASED_ACCESS: true,
  ENCRYPTED_METADATA: true,
  PRIVATE_TIPPING: false, // To be implemented
  PRIVACY_DASHBOARD: false, // To be implemented
} as const;

// Default Privacy Settings
export const DEFAULT_PRIVACY_SETTINGS = {
  encryptionAlgorithm: PRIVACY_CONFIG.ENCRYPTION.DEFAULT_ALGORITHM,
  allowSelectiveDisclosure: true,
  defaultAccessExpiration: PRIVACY_CONFIG.ACCESS_CONTROL.DEFAULT_EXPIRATION,
  requireZkProof: true,
  publicMetadataFields: PRIVACY_CONFIG.ACCESS_CONTROL.PUBLIC_METADATA_FIELDS,
} as const;

// Validation Rules
export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  RECORDING_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  RECORDING_DESCRIPTION: {
    MAX_LENGTH: 500,
  },
  TAGS: {
    MAX_COUNT: 10,
    MAX_LENGTH: 20,
  },
} as const;
