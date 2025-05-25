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
import { globalStyles, theme } from "../../constants/theme";
import colors from "../../constants/colors";
import { useRecordingsStore } from "../../store/recordingsStore";
import { Recording, Tag } from "../../types/recording";
import {
  formatDuration,
  formatFileSize,
  formatRelativeTime,
} from "../../utils/formatters";
import TagBadge from "../../components/TagBadge";
import BottomSheet from "../../components/BottomSheet";
import AnimatedGradientBackground from "../../components/AnimatedGradientBackground";
import ErrorBoundary from "../../components/ErrorBoundary";

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
const mockImportFiles: Recording[] = [
  {
    id: "import-1",
    title: "Guitar Melody Idea.m4a",
    duration: 65,
    size: 1048576,
    uri: "https://example.com/import1.m4a",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    isFavorite: false,
    source: "imported",
    category: "music",
  },
  {
    id: "import-2",
    title: "Team Meeting Notes.mp3",
    duration: 540,
    size: 8388608,
    uri: "https://example.com/import2.mp3",
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    tags: [],
    isFavorite: false,
    source: "imported",
    category: "meetings",
  },
  {
    id: "import-3",
    title: "French Pronunciation.wav",
    duration: 1200,
    size: 20971520,
    uri: "https://example.com/import3.wav",
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    tags: [],
    isFavorite: false,
    source: "imported",
    category: "language",
  },
  {
    id: "import-4",
    title: "Product Idea Brainstorm.m4a",
    duration: 320,
    size: 5242880,
    uri: "https://example.com/import4.m4a",
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
    tags: [],
    isFavorite: false,
    source: "imported",
    category: "ideas",
  },
  {
    id: "import-5",
    title: "Spanish Vocabulary Practice.m4a",
    duration: 480,
    size: 7340032,
    uri: "https://example.com/import5.m4a",
    createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    updatedAt: new Date(Date.now() - 345600000).toISOString(),
    tags: [],
    isFavorite: false,
    source: "imported",
    category: "language",
  },
  {
    id: "import-6",
    title: "Bass Line Idea.m4a",
    duration: 45,
    size: 768000,
    uri: "https://example.com/import6.m4a",
    createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 432000000).toISOString(),
    tags: [],
    isFavorite: false,
    source: "imported",
    category: "music",
  },
  {
    id: "import-7",
    title: "Weekly Standup.mp3",
    duration: 900,
    size: 15728640,
    uri: "https://example.com/import7.mp3",
    createdAt: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
    updatedAt: new Date(Date.now() - 518400000).toISOString(),
    tags: [],
    isFavorite: false,
    source: "imported",
    category: "meetings",
  },
  {
    id: "import-8",
    title: "Quick Reminder.m4a",
    duration: 15,
    size: 256000,
    uri: "https://example.com/import8.m4a",
    createdAt: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 604800000).toISOString(),
    tags: [],
    isFavorite: false,
    source: "imported",
    category: "voice-notes",
  },
  {
    id: "import-9",
    title: "Drum Pattern Idea.m4a",
    duration: 30,
    size: 512000,
    uri: "https://example.com/import9.m4a",
    createdAt: new Date(Date.now() - 691200000).toISOString(), // 8 days ago
    updatedAt: new Date(Date.now() - 691200000).toISOString(),
    tags: [],
    isFavorite: false,
    source: "imported",
    category: "music",
  },
  {
    id: "import-10",
    title: "Client Meeting Notes.mp3",
    duration: 1800,
    size: 31457280,
    uri: "https://example.com/import10.mp3",
    createdAt: new Date(Date.now() - 777600000).toISOString(), // 9 days ago
    updatedAt: new Date(Date.now() - 777600000).toISOString(),
    tags: [],
    isFavorite: false,
    source: "imported",
    category: "meetings",
  },
];

// Mock files for export
const mockExportFiles: Recording[] = [
  {
    id: "export-1",
    title: "Project Brainstorm.m4a",
    duration: 185,
    size: 3145728,
    uri: "https://example.com/export1.m4a",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["work", "ideas"],
    isFavorite: true,
    source: "recorded",
  },
  {
    id: "export-2",
    title: "Voice Memo - Shopping List.mp3",
    duration: 42,
    size: 716800,
    uri: "https://example.com/export2.mp3",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    tags: ["personal"],
    isFavorite: false,
    source: "recorded",
  },
  {
    id: "export-3",
    title: "Interview with Sarah.wav",
    duration: 1560,
    size: 26214400,
    uri: "https://example.com/export3.wav",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    tags: ["work", "interview"],
    isFavorite: true,
    source: "imported",
  },
];

// Extend Recording type to include category for grouping
interface ImportRecording extends Recording {
  category?: string;
  isPlaying?: boolean;
  isDuplicate?: boolean;
}

// Scanning animation component
const ScanningAnimation = () => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <View style={styles.scanningContainer}>
      <Animated.View style={[styles.scanningCircle, { opacity }]}>
        <FileAudio size={32} color={colors.dark.primary} />
      </Animated.View>
      <Text style={styles.scanningText}>
        Scanning your device for voice recordings...
      </Text>
    </View>
  );
};

// Success animation component
const SuccessAnimation = ({
  visible,
  onAnimationComplete,
}: {
  visible: boolean;
  onAnimationComplete: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Vibrate on success (only on mobile)
      if (Platform.OS !== "web") {
        Vibration.vibrate(200);
      }

      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationComplete();
      });
    }
  }, [visible, scaleAnim, opacityAnim, onAnimationComplete]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.successAnimationContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.successIconContainer}>
        <Check size={48} color={colors.dark.text} />
      </View>
      <Text style={styles.successText}>Import Successful!</Text>
    </Animated.View>
  );
};

export default function ImportScreen() {
  const router = useRouter();
  const { importRecordings, tags } = useRecordingsStore();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [files, setFiles] = useState<ImportRecording[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showSourceSheet, setShowSourceSheet] = useState(false);
  const [showTaggingSheet, setShowTaggingSheet] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [autoTagEnabled, setAutoTagEnabled] = useState(true);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [selectedExportDestination, setSelectedExportDestination] = useState<
    string | null
  >(null);
  const [selectedExportFiles, setSelectedExportFiles] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState("mp3");
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [easterEggCounter, setEasterEggCounter] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Simulate scanning process
  const startScanning = useCallback((sourceId: string) => {
    setSelectedSource(sourceId);
    setIsScanning(true);
    setScanProgress(0);
    setFiles([]);
    setHasError(false);

    // Simulate progressive scanning
    const totalFiles = mockImportFiles.length;
    let foundCount = 0;

    const scanInterval = setInterval(() => {
      foundCount++;
      setScanProgress(foundCount / totalFiles);

      // Add files progressively
      setFiles((prev) => [...prev, mockImportFiles[foundCount - 1]]);

      if (foundCount >= totalFiles) {
        clearInterval(scanInterval);
        setIsScanning(false);
      }
    }, 500);

    return () => clearInterval(scanInterval);
  }, []);

  const handleSourceSelect = useCallback(
    (sourceId: string) => {
      try {
        if (sourceId === "device") {
          startScanning(sourceId);
        } else {
          setSelectedSource(sourceId);
          setShowSourceSheet(true);
        }

        // Easter egg: Tap the same source 5 times
        if (selectedSource === sourceId) {
          setEasterEggCounter((prev) => {
            const newCount = prev + 1;
            if (newCount >= 5) {
              // Trigger easter egg
              setShowEasterEgg(true);
              // Reset counter
              return 0;
            }
            return newCount;
          });
        } else {
          setEasterEggCounter(0);
        }
      } catch (error) {
        console.error("Error selecting source:", error);
        setHasError(true);
        Alert.alert(
          "Error",
          "There was a problem selecting this source. Please try again."
        );
      }
    },
    [startScanning, selectedSource]
  );

  const handleSourceSheetConfirm = useCallback(() => {
    setShowSourceSheet(false);
    setIsScanning(true);
    setIsLoading(true);
    setHasError(false);

    // Simulate loading files from the selected source
    setTimeout(() => {
      try {
        // Filter files based on selected source
        // For demo purposes, we'll just show a subset
        const sourceFiles = mockImportFiles.slice(0, 5);
        setFiles(sourceFiles);
        setIsScanning(false);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading files:", error);
        setHasError(true);
        setIsLoading(false);
        setIsScanning(false);
        Alert.alert(
          "Error",
          "There was a problem loading files from this source. Please try again."
        );
      }
    }, 1500);
  }, []);

  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFiles((prev) => {
      if (prev.includes(fileId)) {
        return prev.filter((id) => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  }, []);

  const toggleExportFileSelection = useCallback((fileId: string) => {
    setSelectedExportFiles((prev) => {
      if (prev.includes(fileId)) {
        return prev.filter((id) => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  }, []);

  const toggleCategorySelection = useCallback((categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  }, []);

  const selectAllFiles = useCallback(() => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map((file) => file.id));
    }
  }, [files, selectedFiles.length]);

  const selectAllExportFiles = useCallback(() => {
    if (selectedExportFiles.length === mockExportFiles.length) {
      setSelectedExportFiles([]);
    } else {
      setSelectedExportFiles(mockExportFiles.map((file) => file.id));
    }
  }, [selectedExportFiles.length]);

  const selectAllInCategory = useCallback(
    (categoryId: string) => {
      const categoryFiles = files
        .filter((file) => file.category === categoryId)
        .map((file) => file.id);

      // If all files in this category are already selected, deselect them
      const allSelected = categoryFiles.every((id) =>
        selectedFiles.includes(id)
      );

      if (allSelected) {
        setSelectedFiles((prev) =>
          prev.filter((id) => !categoryFiles.includes(id))
        );
      } else {
        // Add all files from this category that aren't already selected
        setSelectedFiles((prev) => {
          const newSelection = [...prev];
          categoryFiles.forEach((id) => {
            if (!newSelection.includes(id)) {
              newSelection.push(id);
            }
          });
          return newSelection;
        });
      }
    },
    [files, selectedFiles]
  );

  const handlePlayPause = useCallback((fileId: string) => {
    setCurrentPlayingId((prev) => (prev === fileId ? null : fileId));
  }, []);

  const handleImport = useCallback(() => {
    if (selectedFiles.length === 0) {
      Alert.alert(
        "No files selected",
        "Please select at least one file to import."
      );
      return;
    }

    // If auto-tagging is enabled, show tagging sheet
    if (autoTagEnabled) {
      setShowTaggingSheet(true);
      return;
    }

    // Otherwise proceed with import
    proceedWithImport();
  }, [selectedFiles, autoTagEnabled]);

  const proceedWithImport = useCallback(() => {
    try {
      const filesToImport = files.filter((file) =>
        selectedFiles.includes(file.id)
      );

      // Check for duplicates
      const hasDuplicates = filesToImport.some((file) => file.isDuplicate);

      if (hasDuplicates) {
        Alert.alert(
          "Duplicate Files Detected",
          "Some files appear to be duplicates of recordings you already have. Would you like to import them anyway?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Import All",
              onPress: () => finalizeImport(filesToImport),
            },
            {
              text: "Skip Duplicates",
              onPress: () =>
                finalizeImport(
                  filesToImport.filter((file) => !file.isDuplicate)
                ),
            },
          ]
        );
      } else {
        finalizeImport(filesToImport);
      }
    } catch (error) {
      console.error("Error processing import:", error);
      setHasError(true);
      Alert.alert(
        "Import Error",
        "There was a problem processing your import. Please try again."
      );
    }
  }, [files, selectedFiles]);

  const finalizeImport = useCallback(
    (filesToImport: ImportRecording[]) => {
      try {
        setIsLoading(true);

        // Apply tags based on selected categories
        const taggedFiles = filesToImport.map((file) => {
          // Find matching tag IDs for the file's category
          const categoryTags = tags
            .filter((tag) => {
              // Match by name (in a real app, you'd have a more robust matching system)
              const categoryName = suggestedCategories.find(
                (cat) => cat.id === file.category
              )?.name;
              return tag.name
                .toLowerCase()
                .includes(categoryName?.toLowerCase() || "");
            })
            .map((tag) => tag.id);

          return {
            ...file,
            id: `imported-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            tags: categoryTags,
          };
        });

        importRecordings(taggedFiles);
        setIsLoading(false);

        // Show success animation
        setShowSuccessAnimation(true);

        // Reset state
        setSelectedFiles([]);
        setSelectedCategories([]);
        setShowTaggingSheet(false);
      } catch (error) {
        console.error("Error finalizing import:", error);
        setIsLoading(false);
        setHasError(true);
        Alert.alert(
          "Import Error",
          "There was a problem finalizing your import. Please try again."
        );
      }
    },
    [importRecordings, selectedCategories, tags]
  );

  const handleSuccessAnimationComplete = useCallback(() => {
    setShowSuccessAnimation(false);

    // Show success message with count and categories
    const categoryNames = selectedCategories
      .map((catId) => suggestedCategories.find((cat) => cat.id === catId)?.name)
      .filter(Boolean)
      .join(", ");

    Alert.alert(
      "Import Successful",
      `${selectedFiles.length} recording${
        selectedFiles.length !== 1 ? "s" : ""
      } imported${
        categoryNames ? ` and organized into ${categoryNames}` : ""
      }.`,
      [{ text: "View Recordings", onPress: () => router.push("/") }]
    );
  }, [router, selectedCategories, selectedFiles.length]);

  const handleExport = useCallback(() => {
    if (selectedExportFiles.length === 0) {
      Alert.alert(
        "No files selected",
        "Please select at least one recording to export."
      );
      return;
    }

    setShowExportSheet(true);
  }, [selectedExportFiles]);

  const handleExportDestinationSelect = useCallback((destinationId: string) => {
    setSelectedExportDestination(destinationId);
  }, []);

  const finalizeExport = useCallback(() => {
    try {
      if (!selectedExportDestination) {
        Alert.alert(
          "No destination selected",
          "Please select a destination for your export."
        );
        return;
      }

      setIsLoading(true);
      const filesToExport = mockExportFiles.filter((file) =>
        selectedExportFiles.includes(file.id)
      );

      // Simulate export process
      Alert.alert(
        "Exporting Files",
        `Exporting ${filesToExport.length} file${
          filesToExport.length !== 1 ? "s" : ""
        } to ${
          exportDestinations.find(
            (dest) => dest.id === selectedExportDestination
          )?.name
        } as ${exportFormat.toUpperCase()}...`
      );

      setTimeout(() => {
        setIsLoading(false);
        Alert.alert(
          "Export Complete",
          `Successfully exported ${filesToExport.length} recording${
            filesToExport.length !== 1 ? "s" : ""
          }.`,
          [{ text: "OK" }]
        );

        // Reset export state
        setSelectedExportFiles([]);
        setSelectedExportDestination(null);
        setShowExportSheet(false);
      }, 1500);
    } catch (error) {
      console.error("Error finalizing export:", error);
      setIsLoading(false);
      setHasError(true);
      Alert.alert(
        "Export Error",
        "There was a problem with your export. Please try again."
      );
    }
  }, [selectedExportDestination, selectedExportFiles, exportFormat]);

  // Group files by category
  const groupedFiles = React.useMemo(() => {
    const groups: Record<string, ImportRecording[]> = {};

    files.forEach((file) => {
      const category = file.category || "uncategorized";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(file);
    });

    return groups;
  }, [files]);

  const renderSourceItem = useCallback(
    ({ item }: { item: (typeof importSources)[0] }) => (
      <TouchableOpacity
        style={[
          styles.sourceItem,
          selectedSource === item.id && styles.selectedSourceItem,
        ]}
        onPress={() => handleSourceSelect(item.id)}
        accessibilityLabel={`Import from ${item.name}`}
        accessibilityHint={item.description}
      >
        <View style={styles.sourceIconContainer}>
          {item.icon === "Folder" ? (
            <Folder size={24} color={colors.dark.text} />
          ) : item.icon === "Cloud" ? (
            <Cloud size={24} color={colors.dark.text} />
          ) : item.icon === "HardDrive" ? (
            <HardDrive size={24} color={colors.dark.text} />
          ) : (
            <Smartphone size={24} color={colors.dark.text} />
          )}
        </View>
        <View style={styles.sourceInfo}>
          <Text style={styles.sourceName}>{item.name}</Text>
          <Text style={styles.sourceDescription}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    ),
    [selectedSource, handleSourceSelect]
  );

  const renderExportDestinationItem = useCallback(
    ({ item }: { item: (typeof exportDestinations)[0] }) => (
      <TouchableOpacity
        style={[
          styles.sourceItem,
          selectedExportDestination === item.id && styles.selectedSourceItem,
        ]}
        onPress={() => handleExportDestinationSelect(item.id)}
        accessibilityLabel={`Export to ${item.name}`}
        accessibilityHint={item.description}
      >
        <View style={styles.sourceIconContainer}>
          {item.icon === "Folder" ? (
            <Folder size={24} color={colors.dark.text} />
          ) : item.icon === "Cloud" ? (
            <Cloud size={24} color={colors.dark.text} />
          ) : item.icon === "Share2" ? (
            <Share2 size={24} color={colors.dark.text} />
          ) : (
            <ExternalLink size={24} color={colors.dark.text} />
          )}
        </View>
        <View style={styles.sourceInfo}>
          <Text style={styles.sourceName}>{item.name}</Text>
          <Text style={styles.sourceDescription}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    ),
    [selectedExportDestination, handleExportDestinationSelect]
  );

  const renderFileItem = useCallback(
    ({ item }: { item: ImportRecording }) => (
      <TouchableOpacity
        style={[
          styles.fileItem,
          selectedFiles.includes(item.id) && styles.selectedFileItem,
          item.isDuplicate && styles.duplicateFileItem,
        ]}
        onPress={() => toggleFileSelection(item.id)}
        accessibilityLabel={`${item.title}, ${formatDuration(item.duration)}`}
        accessibilityHint={`Tap to ${
          selectedFiles.includes(item.id) ? "deselect" : "select"
        } this recording`}
      >
        <View style={styles.fileInfo}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => handlePlayPause(item.id)}
            accessibilityLabel={`${
              currentPlayingId === item.id ? "Pause" : "Play"
            } ${item.title}`}
          >
            {currentPlayingId === item.id ? (
              <Pause size={16} color={colors.dark.text} />
            ) : (
              <Play size={16} color={colors.dark.text} />
            )}
          </TouchableOpacity>

          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.fileMetadata}>
              {formatDuration(item.duration)} • {formatFileSize(item.size)} •{" "}
              {formatRelativeTime(item.createdAt)}
            </Text>

            {/* Waveform visualization */}
            <View style={styles.waveformContainer}>
              {Array.from({ length: 20 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.waveformBar,
                    {
                      height: Math.random() * 10 + 2,
                      backgroundColor:
                        currentPlayingId === item.id
                          ? colors.dark.primary
                          : colors.dark.waveformBackground,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.fileActions}>
          <View style={styles.categoryTag}>
            {item.category && (
              <TagBadge
                tag={{
                  id: item.category,
                  name:
                    suggestedCategories.find((cat) => cat.id === item.category)
                      ?.name || "",
                  color:
                    suggestedCategories.find((cat) => cat.id === item.category)
                      ?.color || colors.dark.primary,
                }}
                small
              />
            )}
          </View>

          <View style={styles.checkboxContainer}>
            <View
              style={[
                styles.checkbox,
                selectedFiles.includes(item.id) && styles.checkboxSelected,
              ]}
            >
              {selectedFiles.includes(item.id) && (
                <Check size={16} color={colors.dark.text} />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [selectedFiles, toggleFileSelection, currentPlayingId, handlePlayPause]
  );

  const renderExportFileItem = useCallback(
    ({ item }: { item: (typeof mockExportFiles)[0] }) => (
      <TouchableOpacity
        style={[
          styles.fileItem,
          selectedExportFiles.includes(item.id) && styles.selectedFileItem,
        ]}
        onPress={() => toggleExportFileSelection(item.id)}
        accessibilityLabel={`${item.title}, ${formatDuration(item.duration)}`}
        accessibilityHint={`Tap to ${
          selectedExportFiles.includes(item.id) ? "deselect" : "select"
        } this recording for export`}
      >
        <View style={styles.fileInfo}>
          <View style={styles.fileIconContainer}>
            <FileAudio size={24} color={colors.dark.text} />
          </View>

          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.fileMetadata}>
              {formatDuration(item.duration)} • {formatFileSize(item.size)} •{" "}
              {formatRelativeTime(item.createdAt)}
            </Text>

            <View style={styles.tagsList}>
              {item.tags.map((tagId, index) => (
                <TagBadge
                  key={tagId}
                  tag={{
                    id: tagId,
                    name: tagId,
                    color: colors.dark.primary,
                  }}
                  small
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.fileActions}>
          <View style={styles.checkboxContainer}>
            <View
              style={[
                styles.checkbox,
                selectedExportFiles.includes(item.id) &&
                  styles.checkboxSelected,
              ]}
            >
              {selectedExportFiles.includes(item.id) && (
                <Check size={16} color={colors.dark.text} />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [selectedExportFiles, toggleExportFileSelection]
  );

  const renderCategoryHeader = useCallback(
    (categoryId: string) => {
      const category = suggestedCategories.find((cat) => cat.id === categoryId);
      if (!category) return null;

      const categoryFiles = files.filter(
        (file) => file.category === categoryId
      );
      const selectedCount = categoryFiles.filter((file) =>
        selectedFiles.includes(file.id)
      ).length;
      const allSelected =
        categoryFiles.length > 0 && selectedCount === categoryFiles.length;

      return (
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => selectAllInCategory(categoryId)}
          accessibilityLabel={`${category.name} category, ${selectedCount} of ${categoryFiles.length} selected`}
          accessibilityHint="Tap to select or deselect all recordings in this category"
        >
          <View
            style={[styles.categoryColor, { backgroundColor: category.color }]}
          />
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryCount}>
            {selectedCount}/{categoryFiles.length} selected
          </Text>
          <View
            style={[styles.checkbox, allSelected && styles.checkboxSelected]}
          >
            {allSelected && <Check size={16} color={colors.dark.text} />}
          </View>
        </TouchableOpacity>
      );
    },
    [files, selectedFiles, selectAllInCategory]
  );

  const renderImportContent = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Import Recordings</Text>
        <Text style={styles.subtitle}>
          Select a source to import your voice recordings from
        </Text>
      </View>

      <FlatList
        data={importSources}
        renderItem={renderSourceItem}
        keyExtractor={(item) => item.id}
        style={styles.sourcesList}
        contentContainerStyle={styles.sourcesListContent}
      />

      {isScanning && (
        <View style={styles.scanningOverlay}>
          <ScanningAnimation />
          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBar, { width: `${scanProgress * 100}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(scanProgress * 100)}% complete
          </Text>
          <Text style={styles.filesFoundText}>{files.length} files found</Text>
        </View>
      )}

      {hasError && (
        <View style={styles.errorContainer}>
          <AlertCircle size={32} color={colors.dark.error} />
          <Text style={styles.errorText}>
            There was a problem scanning for recordings. Please try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setHasError(false);
              if (selectedSource) {
                startScanning(selectedSource);
              }
            }}
            accessibilityLabel="Retry scanning"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {files.length > 0 && !isScanning && !hasError && (
        <>
          <View style={styles.filesHeader}>
            <Text style={styles.filesTitle}>
              {files.length} recordings found
            </Text>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={selectAllFiles}
              accessibilityLabel={`${
                selectedFiles.length === files.length ? "Deselect" : "Select"
              } all recordings`}
            >
              <Text style={styles.selectAllText}>
                {selectedFiles.length === files.length
                  ? "Deselect All"
                  : "Select All"}
              </Text>
            </TouchableOpacity>
          </View>

          {Object.entries(groupedFiles).map(([categoryId, categoryFiles]) => (
            <View key={categoryId} style={styles.categorySection}>
              {renderCategoryHeader(categoryId)}
              {categoryFiles.map((file) => (
                <View key={file.id}>{renderFileItem({ item: file })}</View>
              ))}
            </View>
          ))}

          <View style={styles.importButtonContainer}>
            <TouchableOpacity
              style={[
                styles.importButton,
                selectedFiles.length === 0 && styles.importButtonDisabled,
              ]}
              onPress={handleImport}
              disabled={selectedFiles.length === 0}
              accessibilityLabel={`Import ${selectedFiles.length} recordings`}
              accessibilityHint="Tap to import selected recordings"
            >
              <ImportIcon size={20} color={colors.dark.text} />
              <Text style={styles.importButtonText}>
                Import{" "}
                {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <BottomSheet
        visible={showSourceSheet}
        onClose={() => setShowSourceSheet(false)}
        title="Import from Source"
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetDescription}>
            Select files from{" "}
            {importSources.find((source) => source.id === selectedSource)?.name}
          </Text>

          <TouchableOpacity
            style={styles.sheetButton}
            onPress={handleSourceSheetConfirm}
            accessibilityLabel="Browse Files"
          >
            <Text style={styles.sheetButtonText}>Browse Files</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetCancelButton}
            onPress={() => setShowSourceSheet(false)}
            accessibilityLabel="Cancel"
          >
            <Text style={styles.sheetCancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={showTaggingSheet}
        onClose={() => setShowTaggingSheet(false)}
        title="Organize Your Recordings"
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetDescription}>
            We've detected these categories in your recordings. Select which
            ones you'd like to use for organization.
          </Text>

          <View style={styles.categoriesList}>
            {suggestedCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategories.includes(category.id) &&
                    styles.categoryItemSelected,
                  { borderColor: category.color },
                ]}
                onPress={() => toggleCategorySelection(category.id)}
                accessibilityLabel={`${category.name} category with ${category.count} recordings`}
                accessibilityHint={`Tap to ${
                  selectedCategories.includes(category.id)
                    ? "deselect"
                    : "select"
                } this category`}
              >
                <View
                  style={[
                    styles.categoryItemColor,
                    { backgroundColor: category.color },
                  ]}
                />
                <View style={styles.categoryItemInfo}>
                  <Text style={styles.categoryItemName}>{category.name}</Text>
                  <Text style={styles.categoryItemCount}>
                    {category.count} recordings
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    selectedCategories.includes(category.id) &&
                      styles.checkboxSelected,
                  ]}
                >
                  {selectedCategories.includes(category.id) && (
                    <Check size={16} color={colors.dark.text} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.sheetButton}
            onPress={proceedWithImport}
            accessibilityLabel={`Import ${selectedFiles.length} Recordings`}
          >
            <Text style={styles.sheetButtonText}>
              Import {selectedFiles.length} Recordings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetCancelButton}
            onPress={() => setShowTaggingSheet(false)}
            accessibilityLabel="Skip Organization"
          >
            <Text style={styles.sheetCancelButtonText}>Skip Organization</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </>
  );

  const renderExportContent = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Export Recordings</Text>
        <Text style={styles.subtitle}>
          Select recordings to export to other apps or services
        </Text>
      </View>

      <View style={styles.filesHeader}>
        <Text style={styles.filesTitle}>Your Recordings</Text>
        <TouchableOpacity
          style={styles.selectAllButton}
          onPress={selectAllExportFiles}
          accessibilityLabel={`${
            selectedExportFiles.length === mockExportFiles.length
              ? "Deselect"
              : "Select"
          } all recordings`}
        >
          <Text style={styles.selectAllText}>
            {selectedExportFiles.length === mockExportFiles.length
              ? "Deselect All"
              : "Select All"}
          </Text>
        </TouchableOpacity>
      </View>

      {mockExportFiles.map((file) => (
        <View key={file.id}>{renderExportFileItem({ item: file })}</View>
      ))}

      <View style={styles.importButtonContainer}>
        <TouchableOpacity
          style={[
            styles.importButton,
            selectedExportFiles.length === 0 && styles.importButtonDisabled,
          ]}
          onPress={handleExport}
          disabled={selectedExportFiles.length === 0}
          accessibilityLabel={`Export ${selectedExportFiles.length} recordings`}
        >
          <Download size={20} color={colors.dark.text} />
          <Text style={styles.importButtonText}>
            Export{" "}
            {selectedExportFiles.length > 0
              ? `(${selectedExportFiles.length})`
              : ""}
          </Text>
        </TouchableOpacity>
      </View>

      <BottomSheet
        visible={showExportSheet}
        onClose={() => setShowExportSheet(false)}
        title="Export Recordings"
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetDescription}>
            Select a destination to export your recordings to
          </Text>

          <FlatList
            data={exportDestinations}
            renderItem={renderExportDestinationItem}
            keyExtractor={(item) => item.id}
            style={styles.exportDestinationsList}
          />

          <View style={styles.exportFormatContainer}>
            <Text style={styles.exportFormatTitle}>Export Format</Text>
            <View style={styles.exportFormatOptions}>
              <TouchableOpacity
                style={[
                  styles.exportFormatOption,
                  exportFormat === "mp3" && styles.exportFormatOptionSelected,
                ]}
                onPress={() => setExportFormat("mp3")}
                accessibilityLabel="MP3 format"
                accessibilityState={{ selected: exportFormat === "mp3" }}
              >
                <Text
                  style={[
                    styles.exportFormatOptionText,
                    exportFormat === "mp3" &&
                      styles.exportFormatOptionTextSelected,
                  ]}
                >
                  MP3
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.exportFormatOption,
                  exportFormat === "wav" && styles.exportFormatOptionSelected,
                ]}
                onPress={() => setExportFormat("wav")}
                accessibilityLabel="WAV format"
                accessibilityState={{ selected: exportFormat === "wav" }}
              >
                <Text
                  style={[
                    styles.exportFormatOptionText,
                    exportFormat === "wav" &&
                      styles.exportFormatOptionTextSelected,
                  ]}
                >
                  WAV
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.exportFormatOption,
                  exportFormat === "m4a" && styles.exportFormatOptionSelected,
                ]}
                onPress={() => setExportFormat("m4a")}
                accessibilityLabel="M4A format"
                accessibilityState={{ selected: exportFormat === "m4a" }}
              >
                <Text
                  style={[
                    styles.exportFormatOptionText,
                    exportFormat === "m4a" &&
                      styles.exportFormatOptionTextSelected,
                  ]}
                >
                  M4A
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.sheetButton,
              !selectedExportDestination && styles.sheetButtonDisabled,
            ]}
            onPress={finalizeExport}
            disabled={!selectedExportDestination}
            accessibilityLabel={`Export ${selectedExportFiles.length} Recordings`}
            accessibilityHint={
              selectedExportDestination
                ? "Tap to export selected recordings"
                : "Select a destination first"
            }
          >
            <Text style={styles.sheetButtonText}>
              Export {selectedExportFiles.length} Recordings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetCancelButton}
            onPress={() => setShowExportSheet(false)}
            accessibilityLabel="Cancel"
          >
            <Text style={styles.sheetCancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </>
  );

  // Loading indicator
  if (isLoading) {
    return (
      <SafeAreaView style={globalStyles.safeArea} edges={["bottom"]}>
        <View style={styles.loadingContainer}>
          <Loader size={48} color={colors.dark.primary} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={["bottom"]}>
      <View style={styles.container}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "import" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("import")}
            accessibilityLabel="Import tab"
            accessibilityState={{ selected: activeTab === "import" }}
            accessibilityHint="Tap to switch to import recordings"
          >
            <ImportIcon
              size={20}
              color={
                activeTab === "import"
                  ? colors.dark.primary
                  : colors.dark.textSecondary
              }
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "import" && styles.activeTabButtonText,
              ]}
            >
              Import
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "export" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("export")}
            accessibilityLabel="Export tab"
            accessibilityState={{ selected: activeTab === "export" }}
            accessibilityHint="Tap to switch to export recordings"
          >
            <Download
              size={20}
              color={
                activeTab === "export"
                  ? colors.dark.primary
                  : colors.dark.textSecondary
              }
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "export" && styles.activeTabButtonText,
              ]}
            >
              Export
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {activeTab === "import"
            ? renderImportContent()
            : renderExportContent()}
        </ScrollView>

        {/* Success Animation */}
        <SuccessAnimation
          visible={showSuccessAnimation}
          onAnimationComplete={handleSuccessAnimationComplete}
        />

        {/* Easter Egg */}
        {showEasterEgg && (
          <View style={styles.easterEggContainer}>
            <AnimatedGradientBackground
              breathing={true}
              startingSize={1.5}
              gradientColors={[
                "#121214",
                "#7C5DFA",
                "#4E7BFF",
                "#4CAF50",
                "#FFC107",
              ]}
            />
            <View style={styles.easterEggContent}>
              <Sparkles size={48} color={colors.dark.text} />
              <Text style={styles.easterEggTitle}>You found a secret!</Text>
              <Text style={styles.easterEggDescription}>
                You've unlocked the hidden AI-powered batch processing feature!
              </Text>
              <TouchableOpacity
                style={styles.easterEggButton}
                onPress={() => setShowEasterEgg(false)}
                accessibilityLabel="Close easter egg"
              >
                <Text style={styles.easterEggButtonText}>Awesome!</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.dark.primary,
  },
  tabButtonText: {
    fontSize: 16,
    color: colors.dark.textSecondary,
  },
  activeTabButtonText: {
    color: colors.dark.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.dark.textSecondary,
  },
  sourcesList: {
    marginBottom: 24,
  },
  sourcesListContent: {
    paddingBottom: 16,
  },
  sourceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.dark.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  selectedSourceItem: {
    borderColor: colors.dark.primary,
    backgroundColor: `${colors.dark.primary}20`,
  },
  sourceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: 4,
  },
  sourceDescription: {
    fontSize: 14,
    color: colors.dark.textSecondary,
  },
  scanningOverlay: {
    backgroundColor: colors.dark.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  scanningContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  scanningCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.dark.primary}30`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  scanningText: {
    fontSize: 16,
    color: colors.dark.text,
    textAlign: "center",
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: colors.dark.background,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.dark.primary,
  },
  progressText: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    marginBottom: 8,
  },
  filesFoundText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
  },
  filesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filesTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark.text,
  },
  selectAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectAllText: {
    fontSize: 14,
    color: colors.dark.primary,
    fontWeight: "600",
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.dark.card,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
  },
  categoryCount: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    marginRight: 12,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.dark.card,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  selectedFileItem: {
    borderColor: colors.dark.primary,
    backgroundColor: `${colors.dark.primary}20`,
  },
  duplicateFileItem: {
    borderColor: colors.dark.warning,
    backgroundColor: `${colors.dark.warning}10`,
  },
  fileInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: 4,
  },
  fileMetadata: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginBottom: 8,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 16,
    gap: 2,
  },
  waveformBar: {
    width: 3,
    backgroundColor: colors.dark.waveformBackground,
    borderRadius: 1.5,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  fileActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryTag: {
    marginRight: 12,
  },
  checkboxContainer: {
    marginLeft: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.dark.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
  },
  importButtonContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  importButtonDisabled: {
    backgroundColor: colors.dark.inactive,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
  },
  sheetContent: {
    padding: 24,
  },
  sheetDescription: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    marginBottom: 24,
  },
  sheetButton: {
    backgroundColor: colors.dark.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  sheetButtonDisabled: {
    backgroundColor: colors.dark.inactive,
  },
  sheetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
  },
  sheetCancelButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  sheetCancelButtonText: {
    fontSize: 16,
    color: colors.dark.textSecondary,
  },
  categoriesList: {
    marginBottom: 24,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.dark.card,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  categoryItemSelected: {
    backgroundColor: `${colors.dark.primary}20`,
  },
  categoryItemColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryItemInfo: {
    flex: 1,
  },
  categoryItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: 4,
  },
  categoryItemCount: {
    fontSize: 14,
    color: colors.dark.textSecondary,
  },
  exportDestinationsList: {
    maxHeight: 300,
    marginBottom: 24,
  },
  exportFormatContainer: {
    marginBottom: 24,
  },
  exportFormatTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
    marginBottom: 12,
  },
  exportFormatOptions: {
    flexDirection: "row",
    gap: 12,
  },
  exportFormatOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: "center",
  },
  exportFormatOptionSelected: {
    borderColor: colors.dark.primary,
    backgroundColor: `${colors.dark.primary}20`,
  },
  exportFormatOptionText: {
    fontSize: 14,
    color: colors.dark.textSecondary,
  },
  exportFormatOptionTextSelected: {
    color: colors.dark.primary,
    fontWeight: "600",
  },
  successAnimationContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 10,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.dark.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark.text,
  },
  easterEggContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    zIndex: 20,
  },
  easterEggContent: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    maxWidth: "80%",
  },
  easterEggTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
  },
  easterEggDescription: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  easterEggButton: {
    backgroundColor: colors.dark.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  easterEggButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.dark.background,
  },
  loadingText: {
    fontSize: 18,
    color: colors.dark.text,
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: colors.dark.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  errorText: {
    fontSize: 16,
    color: colors.dark.text,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.dark.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark.text,
  },
});
