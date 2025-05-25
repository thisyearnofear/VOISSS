export const colors = {
  dark: {
    background: "#000000",
    text: "#FFFFFF",
    primary: "#3B82F6",
    secondary: "#6B7280",
    accent: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    success: "#10B981",
  },
  light: {
    background: "#FFFFFF",
    text: "#000000",
    primary: "#2563EB",
    secondary: "#4B5563",
    accent: "#059669",
    error: "#DC2626",
    warning: "#D97706",
    success: "#059669",
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export type Theme = {
  colors: typeof colors;
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
};
