import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@voisss/ui';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  success?: string;
  icon?: string;
  variant?: 'default' | 'focused' | 'error' | 'success';
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
  
  const getInputStyle = () => {
    let baseStyle = {
      backgroundColor: colors.dark.surface,
      borderColor: colors.dark.border,
      color: colors.dark.text,
      placeholderColor: colors.dark.textSecondary,
    };
    
    if (error) {
      return {
        ...baseStyle,
        backgroundColor: colors.dark.surface,
        borderColor: colors.dark.error,
        color: colors.dark.text,
        placeholderColor: colors.dark.error,
      };
    }
    
    if (success) {
      return {
        ...baseStyle,
        backgroundColor: colors.dark.surface,
        borderColor: colors.dark.success,
        color: colors.dark.text,
        placeholderColor: colors.dark.success,
      };
    }
    
    if (isFocused) {
      return {
        ...baseStyle,
        backgroundColor: colors.dark.surfaceLight,
        borderColor: colors.dark.primary,
        color: colors.dark.text,
        placeholderColor: colors.dark.textSecondary,
      };
    }
    
    return baseStyle;
  };
  
  const inputVariant = getInputStyle();

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
            color: inputVariant.color,
          }, inputStyle]}
          placeholderTextColor={inputVariant.placeholderColor}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      
      {(error || success) && (
        <Text style={[styles.helperText, {
          color: error ? colors.dark.error : colors.dark.success,
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
    marginBottom: 16,
  },
  label: {
    color: colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 56,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 12,
    lineHeight: 24,
  },
  helperText: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
    paddingHorizontal: 4,
  },
});