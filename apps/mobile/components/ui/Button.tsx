import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@voisss/ui';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: 'close' | 'copy' | 'cut' | 'pause' | 'play' | 'resize' | 'toggle' | 'push' | 'map' | 'filter' | 'at' | 'recording' | 'sync' | 'list' | 'search' | 'repeat' | 'link' | 'male' | 'female' | 'mic' | 'heart' | 'share' | 'more' | 'settings' | 'wallet' | 'arrow-forward' | 'arrow-back' | 'checkmark' | 'trash' | 'pencil' | 'download' | 'refresh' | 'star' | 'lock' | 'unlock' | 'eye' | 'eye-off' | 'person' | 'log-out' | 'log-in' | 'add' | 'remove' | 'information-circle' | 'warning' | 'alert' | 'help' | 'close-circle' | 'checkmark-circle' | 'radio-button-on' | 'radio-button-off' | 'checkbox' | 'checkbox-outline' | 'radio-button-off-sharp' | 'radio-button-on-sharp' | 'checkbox-sharp' | 'checkbox-outline-sharp' | 'chevron-up' | 'chevron-down' | 'chevron-forward' | 'chevron-back' | 'caret-up' | 'caret-down' | 'caret-forward' | 'caret-back' | 'arrow-up' | 'arrow-down' | 'arrow-forward' | 'arrow-back' | 'arrow-up-circle' | 'arrow-down-circle' | 'arrow-forward-circle' | 'arrow-back-circle' | 'arrow-redo' | 'arrow-undo' | 'chevron-up-circle' | 'chevron-down-circle' | 'chevron-forward-circle' | 'chevron-back-circle' | 'caret-up-circle' | 'caret-down-circle' | 'caret-forward-circle' | 'caret-back-circle' | 'arrow-up-circle-sharp' | 'arrow-down-circle-sharp' | 'arrow-forward-circle-sharp' | 'arrow-back-circle-sharp' | 'arrow-redo-sharp' | 'arrow-undo-sharp' | 'chevron-up-circle-sharp' | 'chevron-down-circle-sharp' | 'chevron-forward-circle-sharp' | 'chevron-back-circle-sharp' | 'caret-up-circle-sharp' | 'caret-down-circle-sharp' | 'caret-forward-circle-sharp' | 'caret-back-circle-sharp' | 'ellipsis-horizontal' | 'ellipsis-vertical' | 'menu' | 'reorder-three' | 'reorder-four' | 'drag' | 'more' | 'more-horizontal' | 'more-vertical' | 'grid' | 'apps' | 'list' | 'list-circle' | 'list-sharp' | 'list-circle-sharp' | 'options' | 'funnel' | 'filter' | 'filter-circle' | 'filter-sharp' | 'filter-circle-sharp' | 'funnel-outline' | 'filter-outline' | 'filter-circle-outline' | 'filter-sharp-outline' | 'filter-circle-sharp-outline' | 'qr-code' | 'qr-scanner' | 'barcode' | 'barcode-outline' | 'id-card' | 'id-card-outline' | 'card' | 'card-outline' | 'cash' | 'cash-outline' | 'pricetag' | 'pricetag-outline' | 'pricetags' | 'pricetags-outline' | 'pricetag-sharp' | 'pricetags-sharp' | 'pricetag-circle' | 'pricetags-circle' | 'pricetag-circle-sharp' | 'pricetags-circle-sharp' | 'pricetag-outline' | 'pricetags-outline' | 'pricetag-circle-outline' | 'pricetags-circle-outline' | 'pricetag-sharp-outline' | 'pricetags-sharp-outline' | 'pricetag-circle-sharp-outline' | 'pricetags-circle-sharp-outline' | 'pricetag-sharp-outline' | 'pricetags-sharp-outline' | 'pricetag-circle-sharp-outline' | 'pricetags-circle-sharp-outline' | 'pricetag-sharp-outline' | 'pricetags-sharp-outline' | 'pricetag-circle-sharp-outline' | 'pricetags-circle-sharp-outline' | 'pricetag-sharp-outline' | 'pricetags-sharp-outline' | 'pricetag-circle-sharp-outline' | 'pricetags-circle-sharp-outline' | 'pricetag-sharp-outline' | 'pricetags-sharp-outline' | 'pricetag-circle-sharp-outline' | 'pricetags-circle-sharp-outline' | 'pricetag-sharp-outline' | 'pricetags-sharp-outline' | 'pricetag-circle-sharp-outline' | 'pricetags-circle-sharp-outline' | 'pricetag-sharp-outline' | 'pricetags-sharp-outline' | 'pricetag-circle-sharp-outline' | 'pricetags-circle-sharp-outline' | 'pricetag-sharp-outline' | 'pricetags-sharp-outline' | 'pricetag-circle-sharp-outline' | 'pricetags-circle-sharp-outline' | 'pricetag-sharp-outline' | 'pricetags-sharp-outline' | 'pricetag-circle-sharp-outline' | 'pricetags-circle-sharp-outline' | 'pricetag-sharp-outline' | 'pricetags-sharp-outline' | 'pricetag-circle-sharp-outline' | 'pricetags-circle-sharp-outline' | 'pricetag-sharp-outline' | 'pricetags-sharp-outline' | 'pricetag-circle-sharp-outline' | 'pricetags-circle-sharp-outline' | 'pricetag-sharp-outline' | 'pricetags-sharp-outline' | 'pricetag-circle-sharp-outline' | 'pricetags-circle-sharp-outline' | 'pricetag-sharp-outline' | 'pricetags-sharp-outline' | 'pricetag-circle-sharp-outline' | 'pricetags-circle-sharp-outline'
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
  const getButtonStyle = () => {
    let baseStyle = {};
    
    switch (variant) {
      case 'primary':
        baseStyle = {
          backgroundColor: disabled ? colors.dark.disabled : colors.dark.primary,
          borderColor: 'transparent',
        };
        break;
      case 'secondary':
        baseStyle = {
          backgroundColor: disabled ? colors.dark.disabled : colors.dark.card,
          borderColor: colors.dark.border,
        };
        break;
      case 'outline':
        baseStyle = {
          backgroundColor: 'transparent',
          borderColor: colors.dark.primary,
        };
        break;
      case 'ghost':
        baseStyle = {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
        break;
      default:
        baseStyle = {
          backgroundColor: disabled ? colors.dark.disabled : colors.dark.primary,
          borderColor: 'transparent',
        };
    }
    
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
    let baseTextStyle = {};
    
    switch (variant) {
      case 'primary':
        baseTextStyle = {
          color: disabled ? colors.dark.textSecondary : colors.dark.text,
        };
        break;
      case 'secondary':
        baseTextStyle = {
          color: disabled ? colors.dark.textSecondary : colors.dark.primary,
        };
        break;
      case 'outline':
        baseTextStyle = {
          color: disabled ? colors.dark.textSecondary : colors.dark.primary,
        };
        break;
      case 'ghost':
        baseTextStyle = {
          color: disabled ? colors.dark.textSecondary : colors.dark.primary,
        };
        break;
      default:
        baseTextStyle = {
          color: disabled ? colors.dark.textSecondary : colors.dark.text,
        };
    }
    
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
          color={variant === 'primary' ? colors.dark.text : colors.dark.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={size === 'lg' ? 20 : 16}
              color={variant === 'primary' ? (disabled ? colors.dark.textSecondary : colors.dark.text) : (disabled ? colors.dark.textSecondary : colors.dark.primary)}
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
              color={variant === 'primary' ? (disabled ? colors.dark.textSecondary : colors.dark.text) : (disabled ? colors.dark.textSecondary : colors.dark.primary)}
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
    borderRadius: 10, // Using UI package's button border radius
    overflow: 'hidden',
    borderWidth: 1,
  },
  fullWidth: {
    width: '100%',
  },
  smButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  mdButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  lgButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 4,
  },
  iconRight: {
    marginLeft: 4,
  },
});