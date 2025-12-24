import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { X } from "lucide-react-native";
import { Tag } from "../types";
import { theme } from "@voisss/ui";
import { colors } from "@voisss/ui";
import { useRecordingsStore } from "../store/recordingsStore";

interface TagBadgeProps {
  tag?: Tag;
  tagId?: string;
  onPress?: () => void;
  onRemove?: () => void;
  selected?: boolean;
  size?: "small" | "medium" | "large";
  small?: boolean; // Backward compatibility
}

export default function TagBadge({
  tag: propTag,
  tagId,
  onPress,
  onRemove,
  selected = false,
  size: propSize = "medium",
  small = false,
}: TagBadgeProps) {
  const { tags } = useRecordingsStore();

  // Determine size (support both size prop and small prop for backward compatibility)
  const size = small ? "small" : propSize;

  // If tagId is provided, find the tag from the store
  const tag = propTag || (tagId ? tags.find((t) => t.id === tagId) : undefined);

  if (!tag) {
    // Fallback for when tag is not found
    return null;
  }

  const badgeStyle = {
    ...styles.badge,
    backgroundColor: selected ? tag.color : `${tag.color}33`, // Add transparency if not selected
    borderColor: tag.color,
    paddingVertical: size === "small" ? 2 : size === "medium" ? 4 : 6,
    paddingHorizontal: size === "small" ? 6 : size === "medium" ? 10 : 14,
  };

  const textStyle = {
    ...styles.text,
    color: selected ? "#FFFFFF" : tag.color,
    fontSize: size === "small" ? 12 : size === "medium" ? 14 : 16,
  };

  if (onRemove) {
    return (
      <View style={badgeStyle}>
        <Text style={textStyle}>{tag.name}</Text>
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <X
            size={size === "small" ? 12 : 16}
            color={selected ? "#FFFFFF" : tag.color}
          />
        </TouchableOpacity>
      </View>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity style={badgeStyle} onPress={onPress}>
        <Text style={textStyle}>{tag.name}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{tag.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.borderRadius.full,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  text: {
    fontWeight: "500",
  },
  removeButton: {
    marginLeft: 4,
  },
});
