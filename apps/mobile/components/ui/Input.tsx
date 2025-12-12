import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, InputVariants, Spacing } from '../../constants/design-system';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  success?: string;
  icon?: string;
  variant?: keyof typeof InputVariants;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  icon,
  variant = 'default',
  containerStyle,
  inputStyle,
  labelStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const inputVariant = error 
    ? InputVariants.error
    : success
      ? InputVariants.success
      : isFocused
        ? InputVariants.focused
        : InputVariants[variant];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}
      
      <View style={[styles.inputContainer, {
        backgroundColor: inputVariant.backgroundColor,
        borderColor: inputVariant.borderColor,
        borderWidth: error || success ? 1.5 : 1,
      }]}
      >
        {icon && (
          <Ionicons 
            name={icon}
            size={20}
            color={inputVariant.placeholderColor}
            style={styles.icon}
          />
        )}
        
        <TextInput
          style={[styles.input, {
            color: inputVariant.textColor,
          }, inputStyle]}
          placeholderTextColor={inputVariant.placeholderColor}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      
      {(error || success) && (
        <Text style={[styles.helperText, {
          color: error ? Colors.error : Colors.success,
        }]}
        >
          {error || success}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: Typography.bodySmall,
    fontWeight: Typography.medium,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.input,
    paddingHorizontal: Spacing.sm,
    minHeight: 56,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.body,
    fontWeight: Typography.regular,
    paddingVertical: Spacing.sm,
    lineHeight: Typography.lineHeight.body,
  },
  helperText: {
    fontSize: Typography.caption,
    fontWeight: Typography.regular,
    marginTop: Spacing.xxs,
    paddingHorizontal: Spacing.xs,
  },
});
