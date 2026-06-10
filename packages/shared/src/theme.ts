/**
 * Shared theme tokens — aligned with the canonical palette.
 *
 * ⚠️  This file mirrors packages/ui/src/theme/index.ts (the canonical source of truth).
 * If you change values here, also update the canonical theme in @voisss/ui.
 *
 * `@voisss/shared` cannot depend on `@voisss/ui` (dependency direction is ui → shared),
 * so this file duplicates the token values. Keep them in sync.
 */

/**
 * Colors — CORRECT brand values (NOT the old #3B82F6 palette).
 */
export const colors = {
  dark: {
    background: "#0A0A0A",
    text: "#FFFFFF",
    textSecondary: "#A1A1AA",
    primary: "#7C5DFA",
    primaryHover: "#6D4AE8",
    primaryLight: "#9C88FF",
    secondary: "#3B82F6",
    success: "#22C55E",
    error: "#EF4444",
    warning: "#F59E0B",
    border: "#2A2A2A",
    borderLight: "#3A3A3A",
    card: "#1A1A1A",
    cardAlt: "#252525",
    surface: "#1A1A1A",
    overlay: "rgba(0, 0, 0, 0.7)",
    muted: "#71717A",
  },
  light: {
    background: "#FFFFFF",
    text: "#000000",
    primary: "#7C5DFA",
    secondary: "#4B5563",
    accent: "#10B981",
    error: "#DC2626",
    warning: "#D97706",
    success: "#059669",
  },
} as const;

/**
 * Spacing
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Typography
 */
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

/**
 * Border Radius
 */
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

/**
 * Theme type (for backward compatibility)
 */
export type Theme = {
  colors: typeof colors;
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
};
