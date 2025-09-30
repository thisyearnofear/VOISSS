// Re-export types from shared package as the canonical types
import type { VoiceRecording as SharedVoiceRecording, MissionContext } from '@voisss/shared';

export type VoiceRecording = SharedVoiceRecording;
export type { MissionContext };

// Mobile-specific recording interface that extends the shared type
export interface MobileRecording extends SharedVoiceRecording {
  // Mobile-specific UI fields
  filePath?: string; // Local file URI for mobile playback
  uri?: string; // Alternative local file URI
  blob?: Blob; // For web platform compatibility
  isFavorite?: boolean;
  isShared?: boolean;
  sharedWith?: string[];
  plays?: number;
  likes?: number;
  comments?: number;
  waveform?: number[]; // Visualization data
  source?: "imported" | "recorded";
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface RecordingFilter {
  search: string;
  tags: string[];
  sortBy: "date" | "duration" | "name";
  sortOrder: "asc" | "desc";
  favorites: boolean;
}

export interface Comment {
  id: string;
  recordingId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
  likes: number;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  members: number;
  image: string;
  isPrivate: boolean;
  ownerId: string;
}
