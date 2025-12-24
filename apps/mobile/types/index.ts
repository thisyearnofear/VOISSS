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
  missionId: string;
  recordingId: string;
  status: 'pending' | 'completed' | 'rejected';
  recording: VoiceRecording;
}

export type LanguageInfo = {
  code: string;
  name: string;
  nativeName?: string;
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
