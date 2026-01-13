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
}

export interface Recording extends VoiceRecording {
  // Extended recording type
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
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  rewards?: number;
  expiresAt?: string | Date;
  currentParticipants?: number;
  maxParticipants?: number;
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

export interface AudioMetadata {
  duration: number;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  format: string;
  codec: string;
}

export interface IPFSUploadResult {
  hash: string;
  size: number;
  url?: string;
}
