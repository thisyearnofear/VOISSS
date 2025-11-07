import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { FileAudio, Import, Search as SearchIcon } from "lucide-react-native";
import { theme } from "@voisss/ui";
import { colors } from "@voisss/ui";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {icon || <FileAudio size={64} color={colors.dark.textSecondary} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function ImportEmptyState({ onImport }: { onImport: () => void }) {
  return (
    <EmptyState
      title="No recordings found"
      description="Import your voice recordings to get started"
      icon={<Import size={64} color={colors.dark.textSecondary} />}
      actionLabel="Import Recordings"
      onAction={onImport}
    />
  );
}

export function SearchEmptyState() {
  return (
    <EmptyState
      title="No results found"
      description="Try adjusting your search or filters"
      icon={<SearchIcon size={64} color={colors.dark.textSecondary} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: 700,
    color: colors.dark.text,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    backgroundColor: colors.dark.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  actionButtonText: {
    color: colors.dark.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: 500,
  },
});
