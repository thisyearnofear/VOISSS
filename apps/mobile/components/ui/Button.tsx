import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, ButtonVariants } from '../../constants/design-system';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: keyof typeof ButtonVariants;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = false,
}) => {
  const buttonVariant = ButtonVariants[variant];
  
  const getButtonStyle = () => {
    let baseStyle = {
      backgroundColor: disabled ? Colors.borderDark : buttonVariant.backgroundColor,
      borderColor: buttonVariant.borderColor,
      borderWidth: variant === 'outline' ? 1 : 0,
      opacity: disabled ? 0.6 : 1,
    };
    
    switch (size) {
      case 'sm':
        return { ...baseStyle, ...styles.smButton };
      case 'lg':
        return { ...baseStyle, ...styles.lgButton };
      default:
        return { ...baseStyle, ...styles.mdButton };
    }
  };

  const getTextStyle = () => {
    let baseTextStyle = {
      color: disabled ? Colors.textDisabled : buttonVariant.textColor,
      fontSize: Typography.button,
      fontWeight: Typography.semiBold,
    };
    
    return { ...baseTextStyle, ...styles.buttonText };
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size={size === 'lg' ? 'large' : 'small'}
          color={buttonVariant.textColor}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={size === 'lg' ? 20 : 16}
              color={disabled ? Colors.textDisabled : buttonVariant.textColor}
              style={styles.iconLeft}
            />
          )}
          
          <Text style={[getTextStyle(), textStyle]}>
            {title}
          </Text>
          
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={size === 'lg' ? 20 : 16}
              color={disabled ? Colors.textDisabled : buttonVariant.textColor}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.button,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  smButton: {
    paddingVertical: Typography.button / 2,
    paddingHorizontal: Spacing.sm,
  },
  mdButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  lgButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  buttonText: {
    textAlign: 'center',
    lineHeight: Typography.lineHeight.button,
  },
  iconLeft: {
    marginRight: Spacing.xs,
  },
  iconRight: {
    marginLeft: Spacing.xs,
  },
});
