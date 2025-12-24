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
import { globalStyles, theme, colors } from "@voisss/ui";
import { useRecordingsStore } from "@/store/recordingsStore";
import { VoiceRecording, Tag } from "@/types";
import {
  formatDuration,
  formatRelativeTime,
  formatFileSize,
} from "@/utils/formatting";
import TagBadge from "@/components/TagBadge";
import BottomSheet from "@/components/BottomSheet";
import AnimatedGradientBackground from "@/components/AnimatedGradientBackground";
import ErrorBoundary from "@/components/ErrorBoundary";

// Mock import sources
const importSources = [
  {
    id: "device",
    name: "Device Storage",
    icon: Smartphone,
    description: "Scan your device for voice recordings",
  },
  {
    id: "files",
    name: "Files App",
    icon: Folder,
    description: "Import from your files app",
  },
  {
    id: "icloud",
    name: "iCloud Drive",
    icon: Cloud,
    description: "Import from iCloud",
  },
  {
    id: "drive",
    name: "Google Drive",
    icon: Cloud,
    description: "Import from Google Drive",
  },
  {
    id: "downloads",
    name: "Downloads",
    icon: HardDrive,
    description: "Import from your downloads folder",
  },
];

// Mock export destinations
const exportDestinations = [
  {
    id: "files",
    name: "Files App",
    icon: Folder,
    description: "Export to your files app",
  },
  {
    id: "icloud",
    name: "iCloud Drive",
    icon: Cloud,
    description: "Export to iCloud",
  },
  {
    id: "drive",
    name: "Google Drive",
    icon: Cloud,
    description: "Export to Google Drive",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    icon: Cloud,
    description: "Export to Dropbox",
  },
  {
    id: "share",
    name: "Share",
    icon: Share2,
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
  { id: "misc", name: "Miscellaneous", count: 0, color: "#9E9E9E" },
];

// Mock files that could be imported
const mockImportFiles: Partial<VoiceRecording & { uri: string, category: string, source: string }>[] = [
  {
    id: "import-1",
    title: "Guitar Melody Idea.m4a",
    duration: 65,
    fileSize: 1048576,
    uri: "https://example.com/import1.m4a",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
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
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
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
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
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
    createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    updatedAt: new Date(Date.now() - 345600000).toISOString(),
    tags: [],
    source: "imported",
    category: "language",
  },
];

// Extend VoiceRecording type to include category for grouping
interface ImportRecording extends VoiceRecording {
  category?: string;
  isPlaying?: boolean;
  isDuplicate?: boolean;
}

export default function ImportScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');

  const renderSourceItem = (item: typeof importSources[0], key: string) => {
    const Icon = item.icon;
    return (
      <TouchableOpacity key={key} style={styles.sourceCard} onPress={() => Alert.alert("Coming Soon", `Import from ${item.name} is coming soon!`)}>
        <View style={[styles.iconContainer, { backgroundColor: colors.dark.card }]}>
          <Icon size={24} color={colors.dark.text} />
        </View>
        <View style={styles.sourceInfo}>
          <Text style={styles.sourceName}>{item.name}</Text>
          <Text style={styles.sourceDescription}>{item.description}</Text>
        </View>
        <ChevronRight size={20} color={colors.dark.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderFileItem = (item: typeof mockImportFiles[0], key: string) => (
    <View key={key} style={styles.fileCard}>
      <View style={styles.fileIcon}>
        <FileAudio size={24} color={colors.dark.primary} />
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{item.title}</Text>
        <Text style={styles.fileDetails}>
          {formatDuration(item.duration || 0)} • {formatFileSize(item.fileSize || 0)}
        </Text>
      </View>
      <TouchableOpacity style={styles.importButton} onPress={() => Alert.alert("Import", `Importing ${item.title}`)}>
        <ImportIcon size={16} color={colors.dark.background} />
        <Text style={styles.importButtonText}>Import</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Import & Export</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'import' && styles.activeTab]}
          onPress={() => setActiveTab('import')}
        >
          <Text style={[styles.tabText, activeTab === 'import' && styles.activeTabText]}>Import</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'export' && styles.activeTab]}
          onPress={() => setActiveTab('export')}
        >
          <Text style={[styles.tabText, activeTab === 'export' && styles.activeTabText]}>Export</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'import' ? (
          <>
            <Text style={styles.sectionTitle}>Sources</Text>
            <View style={styles.sourcesList}>
              {importSources.map(source => renderSourceItem(source, source.id))}
            </View>

            <Text style={styles.sectionTitle}>Recent Files</Text>
            <View style={styles.filesList}>
              {mockImportFiles.map(file => renderFileItem(file, file.id || ''))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Destinations</Text>
            <View style={styles.sourcesList}>
              {exportDestinations.map(dest => renderSourceItem(dest as any, dest.id))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  headerTitle: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: 'bold',
    color: colors.dark.text,
  },
  tabs: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    backgroundColor: colors.dark.card,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  activeTab: {
    backgroundColor: colors.dark.cardAlt,
  },
  tabText: {
    color: colors.dark.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.dark.text,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600',
    color: colors.dark.text,
    marginLeft: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sourcesList: {
    paddingHorizontal: theme.spacing.md,
  },
  filesList: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '600',
    color: colors.dark.text,
  },
  sourceDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  fileIcon: {
    marginRight: theme.spacing.md,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: '500',
    color: colors.dark.text,
  },
  fileDetails: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  importButtonText: {
    color: colors.dark.background,
    fontWeight: '600',
    marginLeft: 4,
    fontSize: theme.typography.fontSizes.sm,
  },
});