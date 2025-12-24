import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Modal,
  Dimensions,
} from "react-native";
import { ChevronDown, Star, Search } from "lucide-react-native";
import {
  SUPPORTED_DUBBING_LANGUAGES,
  getPopularLanguages,
} from "../types";
import { colors } from "@voisss/ui";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  languages?: LanguageInfo[];
  placeholder?: string;
  disabled?: boolean;
  viewMode?: "dropdown" | "cards";
}

export default function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  languages = SUPPORTED_DUBBING_LANGUAGES,
  placeholder = "Select language...",
  disabled = false,
  viewMode = "cards",
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedLanguageInfo = useMemo(() => {
    return languages.find((lang) => lang.code === selectedLanguage);
  }, [selectedLanguage, languages]);

  const popularLanguages = useMemo(() => {
    return getPopularLanguages();
  }, []);

  const filteredLanguages = useMemo(() => {
    if (!searchTerm) return languages;
    return languages.filter(
      (lang) =>
        lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.nativeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [languages, searchTerm]);

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
    setSearchTerm("");
  };

  const renderLanguageItem = ({ item }: { item: LanguageInfo }) => {
    const isSelected = item.code === selectedLanguage;

    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.selectedLanguageItem]}
        onPress={() => handleLanguageSelect(item.code)}
        disabled={disabled}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.languageTextContainer}>
          <Text
            style={[
              styles.languageName,
              isSelected && styles.selectedLanguageNameText,
            ]}
          >
            {item.nativeName && item.nativeName !== item.name
              ? `${item.name} (${item.nativeName})`
              : item.name}
          </Text>
          {item.sampleText && (
            <Text
              style={[
                styles.sampleText,
                isSelected && styles.selectedSampleText,
              ]}
            >
              {item.sampleText}
            </Text>
          )}
        </View>
        {item.isPopular && (
          <Star
            size={16}
            color={colors.dark.warning}
            fill={colors.dark.warning}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (viewMode === "dropdown") {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.dropdownButton, disabled && styles.disabledButton]}
          onPress={() => !disabled && setIsOpen(true)}
          disabled={disabled}
        >
          <View style={styles.selectedLanguageContainer}>
            {selectedLanguageInfo ? (
              <>
                <Text style={styles.flag}>{selectedLanguageInfo.flag}</Text>
                <Text style={styles.selectedLanguageText}>
                  {selectedLanguageInfo.nativeName &&
                  selectedLanguageInfo.nativeName !== selectedLanguageInfo.name
                    ? `${selectedLanguageInfo.name} (${selectedLanguageInfo.nativeName})`
                    : selectedLanguageInfo.name}
                </Text>
              </>
            ) : (
              <Text style={styles.placeholderText}>{placeholder}</Text>
            )}
          </View>
          <ChevronDown size={20} color={colors.dark.textSecondary} />
        </TouchableOpacity>

        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setIsOpen(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.searchContainer}>
                <Search size={20} color={colors.dark.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search languages..."
                  placeholderTextColor={colors.dark.textSecondary}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
              </View>

              <FlatList
                data={filteredLanguages}
                renderItem={renderLanguageItem}
                keyExtractor={(item) => item.code}
                style={styles.languageList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    );
  }

  // Enhanced cards view (default)
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.cardButton, disabled && styles.disabledButton]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <View style={styles.selectedLanguageContainer}>
          {selectedLanguageInfo ? (
            <>
              <Text style={styles.flag}>{selectedLanguageInfo.flag}</Text>
              <View style={styles.selectedLanguageTextContainer}>
                <Text style={styles.selectedLanguageNameText}>
                  {selectedLanguageInfo.nativeName &&
                  selectedLanguageInfo.nativeName !== selectedLanguageInfo.name
                    ? `${selectedLanguageInfo.name} (${selectedLanguageInfo.nativeName})`
                    : selectedLanguageInfo.name}
                </Text>
                {selectedLanguageInfo.sampleText && (
                  <Text style={styles.selectedSampleText} numberOfLines={1}>
                    {selectedLanguageInfo.sampleText}
                  </Text>
                )}
              </View>
            </>
          ) : (
            <Text style={styles.placeholderText}>{placeholder}</Text>
          )}
        </View>
        <ChevronDown size={20} color={colors.dark.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.bottomSheetContainer}>
          <TouchableOpacity
            style={styles.bottomSheetBackdrop}
            onPress={() => setIsOpen(false)}
          />

          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHandle} />

            <View style={styles.searchContainer}>
              <Search size={20} color={colors.dark.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search languages..."
                placeholderTextColor={colors.dark.textSecondary}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>

            {searchTerm === "" && popularLanguages.length > 0 && (
              <View style={styles.popularSection}>
                <View style={styles.popularHeader}>
                  <Star
                    size={16}
                    color={colors.dark.warning}
                    fill={colors.dark.warning}
                  />
                  <Text style={styles.popularTitle}>Popular Languages</Text>
                </View>
                <FlatList
                  data={popularLanguages.slice(0, 6)}
                  horizontal
                  renderItem={renderLanguageItem}
                  keyExtractor={(item) => item.code}
                  style={styles.popularList}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.popularListContent}
                />
              </View>
            )}

            <FlatList
              data={filteredLanguages}
              renderItem={renderLanguageItem}
              keyExtractor={(item) => item.code}
              style={styles.languageList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.dark.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  cardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.dark.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  disabledButton: {
    opacity: 0.5,
  },
  selectedLanguageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectedLanguageTextContainer: {
    flex: 1,
  },
  selectedLanguageText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: "500",
  },
  placeholderText: {
    color: colors.dark.textSecondary,
    fontSize: 16,
  },
  flag: {
    fontSize: 24,
  },
  languageList: {
    flex: 1,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  selectedLanguageItem: {
    backgroundColor: `${colors.dark.primary}20`,
  },
  languageTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  languageName: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: "500",
  },
  selectedLanguageNameText: {
    color: colors.dark.primary,
  },
  sampleText: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  selectedSampleText: {
    color: `${colors.dark.primary}CC`,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.dark.card,
    borderRadius: 16,
    width: SCREEN_WIDTH * 0.9,
    maxHeight: SCREEN_WIDTH * 0.8,
    overflow: "hidden",
  },
  bottomSheetContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheetContent: {
    backgroundColor: colors.dark.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    maxHeight: SCREEN_WIDTH * 0.8,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.dark.textSecondary,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dark.background,
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.dark.text,
    fontSize: 16,
    paddingVertical: 12,
    marginLeft: 8,
  },
  popularSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  popularHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  popularTitle: {
    color: colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  popularList: {
    flexGrow: 0,
  },
  popularListContent: {
    gap: 8,
  },
});
