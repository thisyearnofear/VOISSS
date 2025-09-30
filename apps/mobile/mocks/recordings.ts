import { MobileRecording, Tag } from "../types/recording";
import colors from "../constants/colors";

// Mock tags
export const mockTags: Tag[] = [
  { id: "1", name: "Ideas", color: "#7C5DFA" },
  { id: "2", name: "Music", color: "#4E7BFF" },
  { id: "3", name: "Work", color: "#4CAF50" },
  { id: "4", name: "Personal", color: "#FFC107" },
  { id: "5", name: "Language", color: "#FF5252" },
  { id: "6", name: "Reminders", color: "#FF9800" },
];

// Generate random waveform data
const generateWaveform = (length = 50) => {
  return Array.from({ length }, () => Math.random() * 0.8 + 0.2);
};

// Mock recordings data
export const mockRecordings: MobileRecording[] = [
  {
    id: "1",
    title: "Guitar melody idea",
    description: "",
    duration: 127, // 2:07
    fileSize: 2048576, // 2MB
    format: "mp3",
    quality: "medium",
    tags: ["2"], // Music
    createdAt: new Date("2023-06-15T14:30:00Z"),
    updatedAt: new Date("2023-06-15T14:30:00Z"),
    isPublic: true,
    participantConsent: false,
    isAnonymized: false,
    voiceObfuscated: false,
    isCompleted: false,
    // Mobile-specific fields
    uri: "https://example.com/recording1.mp3",
    isFavorite: true,
    isShared: false,
    waveform: generateWaveform(),
    source: "imported",
    plays: 42,
    likes: 7,
    comments: 2,
  },
  {
    id: "2",
    title: "Project meeting notes",
    description: "",
    duration: 843, // 14:03
    fileSize: 13631488, // 13MB
    format: "mp3",
    quality: "medium",
    tags: ["3"], // Work
    createdAt: new Date("2023-06-10T09:15:00Z"),
    updatedAt: new Date("2023-06-10T09:15:00Z"),
    isPublic: false,
    participantConsent: false,
    isAnonymized: false,
    voiceObfuscated: false,
    isCompleted: false,
    // Mobile-specific fields
    uri: "https://example.com/recording2.mp3",
    isFavorite: false,
    isShared: true,
    sharedWith: ["user1", "user2"],
    waveform: generateWaveform(),
    source: "imported",
    plays: 5,
    likes: 0,
    comments: 1,
  },
  {
    id: "3",
    title: "French pronunciation practice",
    description: "",
    duration: 312, // 5:12
    fileSize: 5242880, // 5MB
    format: "mp3",
    quality: "medium",
    tags: ["5"], // Language
    createdAt: new Date("2023-06-05T18:45:00Z"),
    updatedAt: new Date("2023-06-05T18:45:00Z"),
    isPublic: true,
    participantConsent: false,
    isAnonymized: false,
    voiceObfuscated: false,
    isCompleted: false,
    // Mobile-specific fields
    uri: "https://example.com/recording3.mp3",
    isFavorite: true,
    isShared: false,
    waveform: generateWaveform(),
    source: "imported",
    plays: 128,
    likes: 23,
    comments: 8,
  },
  {
    id: "4",
    title: "Shopping list reminder",
    description: "",
    duration: 45, // 0:45
    fileSize: 768000, // 768KB
    format: "mp3",
    quality: "medium",
    tags: ["6"], // Reminders
    createdAt: new Date("2023-06-01T12:00:00Z"),
    updatedAt: new Date("2023-06-01T12:00:00Z"),
    isPublic: false,
    participantConsent: false,
    isAnonymized: false,
    voiceObfuscated: false,
    isCompleted: false,
    // Mobile-specific fields
    uri: "https://example.com/recording4.mp3",
    isFavorite: false,
    isShared: false,
    waveform: generateWaveform(),
    source: "imported",
  },
  {
    id: "5",
    title: "New app concept",
    description: "",
    duration: 235, // 3:55
    fileSize: 3932160, // 3.75MB
    format: "mp3",
    quality: "medium",
    tags: ["1", "3"], // Ideas, Work
    createdAt: new Date("2023-05-28T16:20:00Z"),
    updatedAt: new Date("2023-05-28T16:20:00Z"),
    isPublic: true,
    participantConsent: false,
    isAnonymized: false,
    voiceObfuscated: false,
    isCompleted: false,
    // Mobile-specific fields
    uri: "https://example.com/recording5.mp3",
    isFavorite: true,
    isShared: false,
    waveform: generateWaveform(),
    source: "imported",
    plays: 76,
    likes: 12,
    comments: 4,
  },
  {
    id: "6",
    title: "Workout routine",
    description: "",
    duration: 178, // 2:58
    fileSize: 2949120, // 2.8MB
    format: "mp3",
    quality: "medium",
    tags: ["4"], // Personal
    createdAt: new Date("2023-05-25T07:30:00Z"),
    updatedAt: new Date("2023-05-25T07:30:00Z"),
    isPublic: false,
    participantConsent: false,
    isAnonymized: false,
    voiceObfuscated: false,
    isCompleted: false,
    // Mobile-specific fields
    uri: "https://example.com/recording6.mp3",
    isFavorite: false,
    isShared: true,
    sharedWith: ["user3"],
    waveform: generateWaveform(),
    source: "imported",
    plays: 3,
    likes: 1,
    comments: 0,
  },
  {
    id: "7",
    title: "Podcast episode ideas",
    description: "",
    duration: 421, // 7:01
    fileSize: 7077888, // 6.75MB
    format: "mp3",
    quality: "medium",
    tags: ["1", "2"], // Ideas, Music
    createdAt: new Date("2023-05-20T13:45:00Z"),
    updatedAt: new Date("2023-05-20T13:45:00Z"),
    isPublic: true,
    participantConsent: false,
    isAnonymized: false,
    voiceObfuscated: false,
    isCompleted: false,
    // Mobile-specific fields
    uri: "https://example.com/recording7.mp3",
    isFavorite: true,
    isShared: false,
    waveform: generateWaveform(),
    source: "imported",
    plays: 215,
    likes: 34,
    comments: 12,
  },
  {
    id: "8",
    title: "Birthday gift ideas",
    description: "",
    duration: 89, // 1:29
    fileSize: 1468006, // 1.4MB
    format: "mp3",
    quality: "medium",
    tags: ["4", "6"], // Personal, Reminders
    createdAt: new Date("2023-05-15T19:10:00Z"),
    updatedAt: new Date("2023-05-15T19:10:00Z"),
    isPublic: false,
    participantConsent: false,
    isAnonymized: false,
    voiceObfuscated: false,
    isCompleted: false,
    // Mobile-specific fields
    uri: "https://example.com/recording8.mp3",
    isFavorite: false,
    isShared: false,
    waveform: generateWaveform(),
    source: "imported",
  },
];
