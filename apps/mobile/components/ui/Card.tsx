import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, CardVariants, Shadows, Spacing } from '../../constants/design-system';

interface CardProps {
  children: React.ReactNode;
  variant?: keyof typeof CardVariants;
  onPress?: () => void;
  style?: ViewStyle;
  pressable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  pressable = false,
}) => {
  const cardVariant = CardVariants[variant];
  
  const cardContent = (
    <View style={[styles.card, {
      backgroundColor: cardVariant.backgroundColor,
      borderColor: cardVariant.borderColor,
      borderWidth: 1,
      ...(cardVariant.shadow as object),
    }, style]}
    >
      {children}
    </View>
  );

  if (pressable && onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    overflow: 'hidden',
  },
});
