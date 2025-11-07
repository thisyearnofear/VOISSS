import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal } from "react-native";
import {
  Pencil,
  Trash2,
  Heart,
  Share,
  Tag,
  Download,
  Copy,
  X,
} from "lucide-react-native";
import { theme } from "@voisss/ui";
import { colors } from "@voisss/ui";
import { VoiceRecording } from "@voisss/shared";

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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{recording.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.dark.text} />
            </TouchableOpacity>
          </View>

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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.dark.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.dark.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  title: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: 600,
    color: colors.dark.text,
    flex: 1,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
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
