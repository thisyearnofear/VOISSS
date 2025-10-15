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
