import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { VoiceRecording } from "@voisss/shared";
import {
  useFilteredRecordings,
  useRecordingsStore,
} from "@/store/recordingsStore";
import { useUIStore, useIsFavorite } from "@/store/uiStore";
import { globalStyles } from "@/constants/theme";
import colors from "@/constants/colors";
import RecordingItem from "@/components/RecordingItem";
import SearchBar from "@/components/SearchBar";
import FilterModal from "@/components/FilterModal";
import RecordingOptionsModal from "@/components/RecordingOptionsModal";
import {
  ImportEmptyState,
  SearchEmptyState,
} from "@/components/EmptyState";

export default function RecordingsScreen() {
  const router = useRouter();
  const recordings = useFilteredRecordings();

  // State from data store
  const filter = useRecordingsStore((state) => state.filter);
  const currentRecordingId = useRecordingsStore(
    (state) => state.currentRecordingId
  );
  const isPlaying = useRecordingsStore((state) => state.isPlaying);
  const { setFilter, setCurrentRecording, setIsPlaying } = useRecordingsStore();

  // State from UI store
  const { toggleFavorite } = useUIStore();

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<VoiceRecording | null>(
    null
  );

  const isFavorite = useIsFavorite(selectedRecording?.id ?? "");

  const isFilterActive =
    filter.tags.length > 0 ||
    filter.favorites ||
    filter.sortBy !== "date" ||
    filter.sortOrder !== "desc";

  const handleRecordingPress = useCallback(
    (recording: VoiceRecording) => {
      router.push(`/recording/${recording.id}`);
    },
    [router]
  );

  const handlePlayPress = useCallback(
    (recording: VoiceRecording) => {
      if (currentRecordingId === recording.id) {
        setIsPlaying(!isPlaying);
      } else {
        setCurrentRecording(recording.id);
        setIsPlaying(true);
      }
    },
    [currentRecordingId, isPlaying, setCurrentRecording, setIsPlaying]
  );

  const handleMorePress = useCallback((recording: VoiceRecording) => {
    setSelectedRecording(recording);
    setOptionsModalVisible(true);
  }, []);

  const handleSearch = useCallback(
    (text: string) => {
      setFilter({ search: text });
    },
    [setFilter]
  );

  const handleClearSearch = useCallback(() => {
    setFilter({ search: "" });
  }, [setFilter]);

  const handleFilterPress = useCallback(() => {
    setFilterModalVisible(true);
  }, []);

  const handleImportPress = useCallback(() => {
    router.push({
      pathname: "/tabs/import",
    });
  }, [router]);

  // Options modal handlers
  const handleEdit = useCallback(() => {
    setOptionsModalVisible(false);
    // Navigate to edit screen
  }, []);

  const handleDelete = useCallback(() => {
    setOptionsModalVisible(false);
    // Show delete confirmation
  }, []);

  const handleToggleFavorite = useCallback(() => {
    if (selectedRecording) {
      toggleFavorite(selectedRecording.id);
    }
    // No need to close the modal, user might want to perform other actions
  }, [selectedRecording, toggleFavorite]);

  const handleShare = useCallback(() => {
    setOptionsModalVisible(false);
    // Share functionality
  }, []);

  const handleManageTags = useCallback(() => {
    setOptionsModalVisible(false);
    // Navigate to tag management
  }, []);

  const handleExport = useCallback(() => {
    setOptionsModalVisible(false);
    // Export functionality
  }, []);

  const handleDuplicate = useCallback(() => {
    setOptionsModalVisible(false);
    // Duplicate functionality
  }, []);

  const renderEmptyState = useCallback(() => {
    if (filter.search || isFilterActive) {
      return <SearchEmptyState />;
    }
    return <ImportEmptyState onImport={handleImportPress} />;
  }, [filter.search, isFilterActive, handleImportPress]);

  const renderItem = useCallback(
    ({ item }: { item: VoiceRecording }) => (
      <RecordingItem
        recording={item}
        onPress={() => handleRecordingPress(item)}
        onPlayPress={() => handlePlayPress(item)}
        onMorePress={() => handleMorePress(item)}
        isPlaying={isPlaying && currentRecordingId === item.id}
      />
    ),
    [
      handleRecordingPress,
      handlePlayPress,
      handleMorePress,
      isPlaying,
      currentRecordingId,
    ]
  );

  return (
    <SafeAreaView style={globalStyles.safeArea} edges={["bottom"]}>
      <View style={styles.container}>
        <SearchBar
          value={filter.search}
          onChangeText={handleSearch}
          onClear={handleClearSearch}
          onFilterPress={handleFilterPress}
          filterActive={isFilterActive}
        />

        <FlatList
          data={recordings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
        />

        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => router.push("/tabs/record")}
        >
          <Plus size={24} color={colors.dark.text} />
        </TouchableOpacity>

        <FilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
        />

        {selectedRecording && (
          <RecordingOptionsModal
            visible={optionsModalVisible}
            onClose={() => setOptionsModalVisible(false)}
            recording={selectedRecording}
            isFavorite={isFavorite}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
            onShare={handleShare}
            onManageTags={handleManageTags}
            onExport={handleExport}
            onDuplicate={handleDuplicate}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    padding: 16,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 80, // Space for FAB
  },
  fabButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.dark.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});
