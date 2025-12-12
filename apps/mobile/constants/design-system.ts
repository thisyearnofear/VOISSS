/**
 * VOISSS Design System - Mobile UI/UX Standards
 * 
 * This design system ensures consistent, polished UI across all components
 */

export const Colors = {
  // Primary Brand Colors
  primary: '#FF6B6B',
  primaryDark: '#E55A5A',
  primaryLight: '#FF8E8E',
  
  // Secondary Colors
  secondary: '#6B46C1',
  secondaryDark: '#553C9A',
  secondaryLight: '#8B5CF6',
  
  // Background Colors
  background: '#000000',
  backgroundLight: '#121212',
  backgroundDark: '#1E1E1E',
  
  // Surface Colors
  surface: '#1A1A1A',
  surfaceLight: '#2A2A2A',
  surfaceDark: '#3A3A3A',
  
  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  textError: '#FF4444',
  textSuccess: '#4CAF50',
  textWarning: '#FFD700',
  
  // Accent Colors
  scrollBlue: '#2E86AB',
  starknetPurple: '#6B46C1',
  
  // Status Colors
  success: '#4CAF50',
  warning: '#FFD700',
  error: '#FF4444',
  info: '#2196F3',
  
  // Gradient Colors
  gradientStart: '#FF6B6B',
  gradientEnd: '#6B46C1',
  
  // Border Colors
  border: '#333333',
  borderLight: '#444444',
  borderDark: '#222222',
};

export const Typography = {
  // Font Families
  primary: 'System',
  secondary: 'System',
  
  // Font Sizes
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  button: 16,
  
  // Font Weights
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  
  // Line Heights
  lineHeight: {
    h1: 40,
    h2: 32,
    h3: 28,
    h4: 24,
    body: 24,
    bodySmall: 20,
    caption: 16,
    button: 20,
  },
};

export const Spacing = {
  // Base spacing unit (8px)
  base: 8,
  
  // Spacing Scale
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Layout Spacing
  screenPadding: 20,
  cardPadding: 16,
  buttonPadding: 12,
  inputPadding: 14,
};

export const Shadows = {
  // Shadow Levels
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const BorderRadius = {
  // Border Radius Scale
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
  
  // Component-specific radii
  button: 10,
  card: 12,
  input: 8,
  badge: 16,
  avatar: 999,
};

export const Animations = {
  // Animation Durations
  fast: 150,
  medium: 300,
  slow: 500,
  
  // Easing Functions
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  spring: { damping: 10, stiffness: 100, mass: 0.5 },
};

export const ZIndex = {
  modal: 1000,
  tooltip: 1100,
  dropdown: 1200,
  overlay: 1300,
};

// Chain-specific styling
export const ChainStyles = {
  starknet: {
    color: Colors.starknetPurple,
    background: 'rgba(107, 70, 193, 0.1)',
    icon: 'diamond',
  },
  scroll: {
    color: Colors.scrollBlue,
    background: 'rgba(46, 134, 171, 0.1)',
    icon: 'layers',
  },
  ethereum: {
    color: '#627EEA',
    background: 'rgba(98, 126, 234, 0.1)',
    icon: 'logo-bitcoin',
  },
};

// Button variants
export const ButtonVariants = {
  primary: {
    backgroundColor: Colors.primary,
    textColor: Colors.textPrimary,
    borderColor: 'transparent',
  },
  secondary: {
    backgroundColor: Colors.surface,
    textColor: Colors.primary,
    borderColor: Colors.border,
  },
  success: {
    backgroundColor: Colors.success,
    textColor: Colors.textPrimary,
    borderColor: 'transparent',
  },
  warning: {
    backgroundColor: Colors.warning,
    textColor: Colors.textPrimary,
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.error,
    textColor: Colors.textPrimary,
    borderColor: 'transparent',
  },
  outline: {
    backgroundColor: 'transparent',
    textColor: Colors.primary,
    borderColor: Colors.primary,
  },
};

// Input variants
export const InputVariants = {
  default: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    textColor: Colors.textPrimary,
    placeholderColor: Colors.textSecondary,
  },
  focused: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.primary,
    textColor: Colors.textPrimary,
    placeholderColor: Colors.textSecondary,
  },
  error: {
    backgroundColor: Colors.surface,
    borderColor: Colors.error,
    textColor: Colors.textPrimary,
    placeholderColor: Colors.error,
  },
  success: {
    backgroundColor: Colors.surface,
    borderColor: Colors.success,
    textColor: Colors.textPrimary,
    placeholderColor: Colors.success,
  },
};

// Card variants
export const CardVariants = {
  default: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    shadow: Shadows.sm,
  },
  elevated: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    shadow: Shadows.md,
  },
  highlighted: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.primary,
    shadow: Shadows.lg,
  },
};
