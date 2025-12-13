import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors } from '@voisss/ui';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'highlighted';
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
  const getCardStyle = () => {
    let baseStyle = {
      backgroundColor: colors.dark.card,
      borderColor: colors.dark.border,
      borderWidth: 1,
    };
    
    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 2,
        };
      case 'highlighted':
        return {
          ...baseStyle,
          backgroundColor: colors.dark.cardAlt,
          borderColor: colors.dark.primary,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        };
      default:
        return {
          ...baseStyle,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 1,
        };
    }
  };
  
  const cardContent = (
    <View style={[styles.card, getCardStyle(), style]}>
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
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
});