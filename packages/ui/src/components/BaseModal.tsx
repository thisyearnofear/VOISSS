import React, { ReactNode } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from "react-native";
import { X } from "lucide-react-native";
import { colors } from "../theme/colors";

const { width, height } = Dimensions.get("window");

export interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
  closeOnBackdropPress?: boolean;
  containerStyle?: object;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdropPress = true,
  containerStyle = {},
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        onPress={closeOnBackdropPress ? onClose : undefined}
        activeOpacity={1}
      >
        <TouchableOpacity
          style={[styles.container, containerStyle]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {showCloseButton && (
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={colors.dark.text} />
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={styles.content}>{children}</View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.dark.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: colors.dark.card,
    borderRadius: 12,
    maxHeight: height * 0.8,
    width: width * 0.9,
    maxWidth: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
});