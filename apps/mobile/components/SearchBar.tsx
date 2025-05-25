import React from "react";
import { StyleSheet, TextInput, View, TouchableOpacity } from "react-native";
import { Search, X, SlidersHorizontal } from "lucide-react-native";
import { theme } from "@/constants/theme";
import colors from "@/constants/colors";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onFilterPress: () => void;
  placeholder?: string;
  showFilterButton?: boolean;
  filterActive?: boolean;
}

export default function SearchBar({
  value,
  onChangeText,
  onClear,
  onFilterPress,
  placeholder = "Search recordings...",
  showFilterButton = true,
  filterActive = false,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search
          size={20}
          color={colors.dark.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.dark.textSecondary}
          selectionColor={colors.dark.primary}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <X size={18} color={colors.dark.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {showFilterButton && (
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterActive && styles.filterButtonActive,
          ]}
          onPress={onFilterPress}
        >
          <SlidersHorizontal
            size={20}
            color={filterActive ? colors.dark.text : colors.dark.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: "100%",
    color: colors.dark.text,
    fontSize: theme.typography.fontSizes.md,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: colors.dark.card,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: theme.spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: colors.dark.primary,
  },
});
