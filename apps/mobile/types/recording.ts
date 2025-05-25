export interface Recording {
  id: string;
  title: string;
  duration: number; // in seconds
  size: number; // in bytes
  uri: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  tags: string[];
  isFavorite: boolean;
  waveform?: number[]; // Visualization data
  transcription?: string; // For future AI features
  source: "imported" | "recorded";
  category?: string; // For grouping during import

  // New fields for community features
  isPublic?: boolean;
  isShared?: boolean;
  sharedWith?: string[]; // IDs of users or groups
  plays?: number;
  likes?: number;
  comments?: number;
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
