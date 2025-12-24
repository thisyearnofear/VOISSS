import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import {
  Pencil,
  Trash2,
  Heart,
  Share,
  Tag,
  Download,
  Copy,
} from "lucide-react-native";
import { theme } from "@voisss/ui";
import { colors } from "@voisss/ui";
import { VoiceRecording } from "../types";
import { BaseModal } from "@voisss/ui";

interface RecordingOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  recording: VoiceRecording;
  isFavorite: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  onManageTags: () => void;
  onExport: () => void;
  onDuplicate: () => void;
}

export default function RecordingOptionsModal({
  visible,
  onClose,
  recording,
  isFavorite,
  onEdit,
  onDelete,
  onToggleFavorite,
  onShare,
  onManageTags,
  onExport,
  onDuplicate,
}: RecordingOptionsModalProps) {
  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={recording.title}
    >
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.option} onPress={onEdit}>
          <Pencil size={24} color={colors.dark.text} />
          <Text style={styles.optionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={onToggleFavorite}>
          <Heart
            size={24}
            color={isFavorite ? colors.dark.error : colors.dark.text}
            fill={isFavorite ? colors.dark.error : "transparent"}
          />
          <Text style={styles.optionText}>
            {isFavorite
              ? "Remove from Favorites"
              : "Add to Favorites"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={onManageTags}>
          <Tag size={24} color={colors.dark.text} />
          <Text style={styles.optionText}>Manage Tags</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={onShare}>
          <Share size={24} color={colors.dark.text} />
          <Text style={styles.optionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={onExport}>
          <Download size={24} color={colors.dark.text} />
          <Text style={styles.optionText}>Export</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={onDuplicate}>
          <Copy size={24} color={colors.dark.text} />
          <Text style={styles.optionText}>Duplicate</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteOption} onPress={onDelete}>
          <Trash2 size={24} color={colors.dark.error} />
          <Text style={styles.deleteOptionText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  optionsContainer: {
    padding: theme.spacing.md,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  optionText: {
    marginLeft: theme.spacing.md,
    fontSize: theme.typography.fontSizes.md,
    color: colors.dark.text,
  },
  deleteOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  deleteOptionText: {
    marginLeft: theme.spacing.md,
    fontSize: theme.typography.fontSizes.md,
    color: colors.dark.error,
  },
  cancelButton: {
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: colors.dark.card,
    alignItems: "center",
  },
  cancelButtonText: {
    color: colors.dark.text,
    fontWeight: 500,
  },
});