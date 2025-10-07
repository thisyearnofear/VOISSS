import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  Platform,
  ScrollView,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Folder,
  FileAudio,
  Check,
  Import as ImportIcon,
  Cloud,
  HardDrive,
  Smartphone,
  Play,
  Pause,
  Tag as TagIcon,
  X,
  AlertCircle,
  Loader,
  Upload,
  Share2,
  ExternalLink,
  Download,
  ChevronRight,
  Sparkles,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { globalStyles, theme } from "@/constants/theme";
import colors from "@/constants/colors";
import { useRecordingsStore } from "@/store/recordingsStore";
import { VoiceRecording, Tag } from "@voisss/shared";
import {
  formatDuration,
  formatFileSize,
  formatRelativeTime,
} from "@/utils/formatters";
import TagBadge from "@/components/TagBadge";
import BottomSheet from "@/components/BottomSheet";
import AnimatedGradientBackground from "@/components/AnimatedGradientBackground";
import ErrorBoundary from "@/components/ErrorBoundary";

// Mock import sources
const importSources = [
  {
    id: "device",
    name: "Device Storage",
    icon: "Smartphone",
    description: "Scan your device for voice recordings",
  },
  {
    id: "files",
    name: "Files App",
    icon: "Folder",
    description: "Import from your files app",
  },
  {
    id: "icloud",
    name: "iCloud Drive",
    icon: "Cloud",
    description: "Import from iCloud",
  },
  {
    id: "drive",
    name: "Google Drive",
    icon: "Cloud",
    description: "Import from Google Drive",
  },
  {
    id: "downloads",
    name: "Downloads",
    icon: "HardDrive",
    description: "Import from your downloads folder",
  },
];

// Mock export destinations
const exportDestinations = [
  {
    id: "files",
    name: "Files App",
    icon: "Folder",
    description: "Export to your files app",
  },
  {
    id: "icloud",
    name: "iCloud Drive",
    icon: "Cloud",
    description: "Export to iCloud",
  },
  {
    id: "drive",
    name: "Google Drive",
    icon: "Cloud",
    description: "Export to Google Drive",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    icon: "Cloud",
    description: "Export to Dropbox",
  },
  {
    id: "share",
    name: "Share",
    icon: "Share2",
    description: "Share via other apps",
  },
];

// Mock categories for auto-organization
const suggestedCategories = [
  { id: "music", name: "Music", count: 5, color: "#7C5DFA" },
  { id: "language", name: "Language Practice", count: 3, color: "#4E7BFF" },
  { id: "meetings", name: "Meetings", count: 4, color: "#4CAF50" },
  { id: "ideas", name: "Ideas", count: 2, color: "#FFC107" },
  { id: "voice-notes", name: "Voice Notes", count: 6, color: "#FF5252" },
];

// Mock files that could be imported
const mockImportFiles: Partial<VoiceRecording & { uri: string, category: string, source: string }>[] = [
  {
    id: "import-1",
    title: "Guitar Melody Idea.m4a",
    duration: 65,
    fileSize: 1048576,
    uri: "https://example.com/import1.m4a",
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    source: "imported",
    category: "music",
  },
  {
    id: "import-2",
    title: "Team Meeting Notes.mp3",
    duration: 540,
    fileSize: 8388608,
    uri: "https://example.com/import2.mp3",
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000),
    tags: [],
    source: "imported",
    category: "meetings",
  },
  {
    id: "import-3",
    title: "French Pronunciation.wav",
    duration: 1200,
    fileSize: 20971520,
    uri: "https://example.com/import3.wav",
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000),
    tags: [],
    source: "imported",
    category: "language",
  },
  {
    id: "import-4",
    title: "Product Idea Brainstorm.m4a",
    duration: 320,
    fileSize: 5242880,
    uri: "https://example.com/import4.m4a",
    createdAt: new Date(Date.now() - 259200000), // 3 days ago
    updatedAt: new Date(Date.now() - 259200000),
    tags: [],
    source: "imported",
    category: "ideas",
  },
  {
    id: "import-5",
    title: "Spanish Vocabulary Practice.m4a",
    duration: 480,
    fileSize: 7340032,
    uri: "https://example.com/import5.m4a",
    createdAt: new Date(Date.now() - 345600000), // 4 days ago
    updatedAt: new Date(Date.now() - 345600000),
    tags: [],
    source: "imported",
    category: "language",
  },
  {
    id: "import-6",
    title: "Bass Line Idea.m4a",
    duration: 45,
    fileSize: 768000,
    uri: "https://example.com/import6.m4a",
    createdAt: new Date(Date.now() - 432000000), // 5 days ago
    updatedAt: new Date(Date.now() - 432000000),
    tags: [],
    source: "imported",
    category: "music",
  },
  {
    id: "import-7",
    title: "Weekly Standup.mp3",
    duration: 900,
    fileSize: 15728640,
    uri: "https://example.com/import7.mp3",
    createdAt: new Date(Date.now() - 518400000), // 6 days ago
    updatedAt: new Date(Date.now() - 518400000),
    tags: [],
    source: "imported",
    category: "meetings",
  },
  {
    id: "import-8",
    title: "Quick Reminder.m4a",
    duration: 15,
    fileSize: 256000,
    uri: "https://example.com/import8.m4a",
    createdAt: new Date(Date.now() - 604800000), // 7 days ago
    updatedAt: new Date(Date.now() - 604800000),
    tags: [],
    source: "imported",
    category: "voice-notes",
  },
  {
    id: "import-9",
    title: "Drum Pattern Idea.m4a",
    duration: 30,
    fileSize: 512000,
    uri: "https://example.com/import9.m4a",
    createdAt: new Date(Date.now() - 691200000), // 8 days ago
    updatedAt: new Date(Date.now() - 691200000),
    tags: [],
    source: "imported",
    category: "music",
  },
  {
    id: "import-10",
    title: "Client Meeting Notes.mp3",
    duration: 1800,
    fileSize: 31457280,
    uri: "https://example.com/import10.mp3",
    createdAt: new Date(Date.now() - 777600000), // 9 days ago
    updatedAt: new Date(Date.now() - 777600000),
    tags: [],
    source: "imported",
    category: "meetings",
  },
];

// Mock files for export
const mockExportFiles: Partial<VoiceRecording & { source: string }>[] = [
  {
    id: "export-1",
    title: "Project Brainstorm.m4a",
    duration: 185,
    fileSize: 3145728,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ["work", "ideas"],
    source: "recorded",
  },
  {
    id: "export-2",
    title: "Voice Memo - Shopping List.mp3",
    duration: 42,
    fileSize: 716800,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
    tags: ["personal"],
    source: "recorded",
  },
  {
    id: "export-3",
    title: "Interview with Sarah.wav",
    duration: 1560,
    fileSize: 26214400,
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(Date.now() - 172800000),
    tags: ["work", "interview"],
    source: "imported",
  },
];

// Extend VoiceRecording type to include category for grouping
interface ImportRecording extends VoiceRecording {
  category?: string;
  isPlaying?: boolean;
  isDuplicate?: boolean;
}

// ... (rest of the file is unchanged, copy from original)