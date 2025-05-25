import { Recording, Tag } from "@/types/recording";
import colors from "@/constants/colors";

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
export const mockRecordings: Recording[] = [
  {
    id: "1",
    title: "Guitar melody idea",
    duration: 127, // 2:07
    size: 2048576, // 2MB
    uri: "https://example.com/recording1.mp3",
    createdAt: "2023-06-15T14:30:00Z",
    updatedAt: "2023-06-15T14:30:00Z",
    tags: ["2"], // Music
    isFavorite: true,
    waveform: generateWaveform(),
    source: "imported",
    isPublic: true,
    plays: 42,
    likes: 7,
    comments: 2,
  },
  {
    id: "2",
    title: "Project meeting notes",
    duration: 843, // 14:03
    size: 13631488, // 13MB
    uri: "https://example.com/recording2.mp3",
    createdAt: "2023-06-10T09:15:00Z",
    updatedAt: "2023-06-10T09:15:00Z",
    tags: ["3"], // Work
    isFavorite: false,
    waveform: generateWaveform(),
    source: "imported",
    isPublic: false,
    isShared: true,
    sharedWith: ["user1", "user2"],
    plays: 5,
    likes: 0,
    comments: 1,
  },
  {
    id: "3",
    title: "French pronunciation practice",
    duration: 312, // 5:12
    size: 5242880, // 5MB
    uri: "https://example.com/recording3.mp3",
    createdAt: "2023-06-05T18:45:00Z",
    updatedAt: "2023-06-05T18:45:00Z",
    tags: ["5"], // Language
    isFavorite: true,
    waveform: generateWaveform(),
    source: "imported",
    isPublic: true,
    plays: 128,
    likes: 23,
    comments: 8,
  },
  {
    id: "4",
    title: "Shopping list reminder",
    duration: 45, // 0:45
    size: 768000, // 768KB
    uri: "https://example.com/recording4.mp3",
    createdAt: "2023-06-01T12:00:00Z",
    updatedAt: "2023-06-01T12:00:00Z",
    tags: ["6"], // Reminders
    isFavorite: false,
    waveform: generateWaveform(),
    source: "imported",
    isPublic: false,
    isShared: false,
  },
  {
    id: "5",
    title: "New app concept",
    duration: 235, // 3:55
    size: 3932160, // 3.75MB
    uri: "https://example.com/recording5.mp3",
    createdAt: "2023-05-28T16:20:00Z",
    updatedAt: "2023-05-28T16:20:00Z",
    tags: ["1", "3"], // Ideas, Work
    isFavorite: true,
    waveform: generateWaveform(),
    source: "imported",
    isPublic: true,
    plays: 76,
    likes: 12,
    comments: 4,
  },
  {
    id: "6",
    title: "Workout routine",
    duration: 178, // 2:58
    size: 2949120, // 2.8MB
    uri: "https://example.com/recording6.mp3",
    createdAt: "2023-05-25T07:30:00Z",
    updatedAt: "2023-05-25T07:30:00Z",
    tags: ["4"], // Personal
    isFavorite: false,
    waveform: generateWaveform(),
    source: "imported",
    isPublic: false,
    isShared: true,
    sharedWith: ["user3"],
    plays: 3,
    likes: 1,
    comments: 0,
  },
  {
    id: "7",
    title: "Podcast episode ideas",
    duration: 421, // 7:01
    size: 7077888, // 6.75MB
    uri: "https://example.com/recording7.mp3",
    createdAt: "2023-05-20T13:45:00Z",
    updatedAt: "2023-05-20T13:45:00Z",
    tags: ["1", "2"], // Ideas, Music
    isFavorite: true,
    waveform: generateWaveform(),
    source: "imported",
    isPublic: true,
    plays: 215,
    likes: 34,
    comments: 12,
  },
  {
    id: "8",
    title: "Birthday gift ideas",
    duration: 89, // 1:29
    size: 1468006, // 1.4MB
    uri: "https://example.com/recording8.mp3",
    createdAt: "2023-05-15T19:10:00Z",
    updatedAt: "2023-05-15T19:10:00Z",
    tags: ["4", "6"], // Personal, Reminders
    isFavorite: false,
    waveform: generateWaveform(),
    source: "imported",
    isPublic: false,
    isShared: false,
  },
];
