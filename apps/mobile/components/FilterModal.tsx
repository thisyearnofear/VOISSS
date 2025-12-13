import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  Check,
  ArrowDownAZ,
  ArrowUpZA,
  Clock,
  Calendar,
} from "lucide-react-native";
import { RecordingFilter } from "@voisss/shared";
import { useRecordingsStore } from "../store/recordingsStore";
import { theme } from "@voisss/ui";
import { colors } from "@voisss/ui";
import { BaseModal } from "@voisss/ui";
import TagBadge from "./TagBadge";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FilterModal({ visible, onClose }: FilterModalProps) {
  // Get only what we need from the store
  const filter = useRecordingsStore((state) => state.filter);
  const tags = useRecordingsStore((state) => state.tags);
  const { setFilter, resetFilter } = useRecordingsStore();

  // Use local state for filter changes
  const [localFilter, setLocalFilter] = useState<RecordingFilter>({
    ...filter,
  });

  // Reset local filter when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setLocalFilter({ ...filter });
    }
  }, [visible, filter]);

  const handleApply = useCallback(() => {
    setFilter(localFilter);
    onClose();
  }, [localFilter, setFilter, onClose]);

  const handleReset = useCallback(() => {
    resetFilter();
    onClose();
  }, [resetFilter, onClose]);

  const toggleTag = useCallback((tagId: string) => {
    setLocalFilter((prev) => {
      const newTags = prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId];

      return { ...prev, tags: newTags };
    });
  }, []);

  const toggleFavorites = useCallback(() => {
    setLocalFilter((prev) => ({ ...prev, favorites: !prev.favorites }));
  }, []);

  const setSortBy = useCallback((sortBy: "date" | "duration" | "name") => {
    setLocalFilter((prev) => ({ ...prev, sortBy }));
  }, []);

  const toggleSortOrder = useCallback(() => {
    setLocalFilter((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  }, []);

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title="Filter & Sort"
    >
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <TagBadge
                key={tag.id}
                tag={tag}
                selected={localFilter.tags.includes(tag.id)}
                onPress={() => toggleTag(tag.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          <View style={styles.sortOptions}>
            <TouchableOpacity
              style={[
                styles.sortOption,
                localFilter.sortBy === "date" && styles.selectedOption,
              ]}
              onPress={() => setSortBy("date")}
            >
              <Calendar
                size={20}
                color={
                  localFilter.sortBy === "date"
                    ? colors.dark.text
                    : colors.dark.textSecondary
                }
              />
              <Text
                style={[
                  styles.sortOptionText,
                  localFilter.sortBy === "date" &&
                    styles.selectedOptionText,
                ]}
              >
                Date
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                localFilter.sortBy === "duration" && styles.selectedOption,
              ]}
              onPress={() => setSortBy("duration")}
            >
              <Clock
                size={20}
                color={
                  localFilter.sortBy === "duration"
                    ? colors.dark.text
                    : colors.dark.textSecondary
                }
              />
              <Text
                style={[
                  styles.sortOptionText,
                  localFilter.sortBy === "duration" &&
                    styles.selectedOptionText,
                ]}
              >
                Duration
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortOption,
                localFilter.sortBy === "name" && styles.selectedOption,
              ]}
              onPress={() => setSortBy("name")}
            >
              {localFilter.sortOrder === "asc" ? (
                <ArrowDownAZ
                  size={20}
                  color={
                    localFilter.sortBy === "name"
                      ? colors.dark.text
                      : colors.dark.textSecondary
                  }
                />
              ) : (
                <ArrowUpZA
                  size={20}
                  color={
                    localFilter.sortBy === "name"
                      ? colors.dark.text
                      : colors.dark.textSecondary
                  }
                />
              )}
              <Text
                style={[
                  styles.sortOptionText,
                  localFilter.sortBy === "name" &&
                    styles.selectedOptionText,
                ]}
              >
                Name
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.orderButton}
            onPress={toggleSortOrder}
          >
            <Text style={styles.orderButtonText}>
              Order:{" "}
              {localFilter.sortOrder === "asc" ? "Ascending" : "Descending"}
            </Text>
            {localFilter.sortOrder === "asc" ? (
              <ArrowDownAZ size={20} color={colors.dark.textSecondary} />
            ) : (
              <ArrowUpZA size={20} color={colors.dark.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Filters</Text>
          <TouchableOpacity
            style={styles.checkOption}
            onPress={toggleFavorites}
          >
            <View
              style={[
                styles.checkbox,
                localFilter.favorites && styles.checkboxSelected,
              ]}
            >
              {localFilter.favorites && (
                <Check size={16} color={colors.dark.text} />
              )}
            </View>
            <Text style={styles.checkOptionText}>Show favorites only</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: 600,
    color: colors.dark.text,
    marginBottom: theme.spacing.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  sortOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.dark.card,
    flex: 1,
    marginHorizontal: 4,
  },
  selectedOption: {
    backgroundColor: colors.dark.primary,
  },
  sortOptionText: {
    marginLeft: theme.spacing.xs,
    color: colors.dark.textSecondary,
  },
  selectedOptionText: {
    color: colors.dark.text,
    fontWeight: 500,
  },
  orderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.dark.card,
  },
  orderButtonText: {
    color: colors.dark.textSecondary,
  },
  checkOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.dark.textSecondary,
    marginRight: theme.spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
  },
  checkOptionText: {
    color: colors.dark.text,
  },
  footer: {
    flexDirection: "row",
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  resetButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.dark.card,
    marginRight: theme.spacing.sm,
    alignItems: "center",
  },
  resetButtonText: {
    color: colors.dark.textSecondary,
    fontWeight: 500,
  },
  applyButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.dark.primary,
    marginLeft: theme.spacing.sm,
    alignItems: "center",
  },
  applyButtonText: {
    color: colors.dark.text,
    fontWeight: 500,
  },
});