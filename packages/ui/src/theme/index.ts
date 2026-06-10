/**
 * VOISSS Design System — CANONICAL SINGLE SOURCE OF TRUTH
 *
 * All design tokens originate here. Do NOT define colors, spacing, typography,
 * or any visual token outside this file. Everything else imports or derives from here.
 *
 * Brand values aligned with what renders in production (globals.css).
 * React Native (globalStyles/buttonStyles) references these tokens to avoid drift.
 */

// ============================================================================
// COLORS — Dark theme is primary. Light theme is future work.
// ============================================================================

export const colors = {
  dark: {
    // Backgrounds
    background: "#0A0A0A",
    backgroundSecondary: "#1A1A1A",
    backgroundTertiary: "#2A2A2A",

    // Brand
    primary: "#7C5DFA", // VOISSS purple — the brand color
    primaryHover: "#6D4AE8",
    primaryLight: "#9C88FF",

    // Accents
    secondary: "#3B82F6", // Blue accent
    secondaryHover: "#2563EB",

    // Semantic
    success: "#22C55E",
    successHover: "#16A34A",
    error: "#EF4444",
    errorHover: "#DC2626",
    warning: "#F59E0B",
    warningHover: "#D97706",

    // Text
    text: "#FFFFFF",
    textSecondary: "#A1A1AA",
    textMuted: "#71717A",

    // Borders
    border: "#2A2A2A",
    borderLight: "#3A3A3A",
    borderFocus: "#7C5DFA",

    // Surfaces (for RN compatibility — map to actual bg values)
    card: "#1A1A1A",
    cardBackground: "#1A1A1A",
    cardAlt: "#252525",
    surface: "#1A1A1A",
    overlay: "rgba(0, 0, 0, 0.7)",

    // Legacy aliases (maintain RN compatibility, point to actual values)
    waveform: "#7C5DFA",
    waveformBackground: "#2A2A2A",
    inactive: "#4A4A4A",
    disabled: "#4A4A4A",
    primaryDark: "#5A45C0",
    successLight: "#4ADE80",
    errorLight: "#F87171",
    warningLight: "#FBBF24",
    textSecondaryAlt: "#71717A",
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

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  fontFamily: {
    sans: "var(--font-inter), system-ui, sans-serif",
    display: "var(--font-syne), sans-serif",
    mono: "var(--font-courier-prime), monospace",
    accent: "var(--font-anton), Impact, sans-serif",
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    hero: 48,
  },
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
  lineHeight: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.625,
  },
  letterSpacing: {
    tight: "-0.02em",
    wide: "0.02em",
    wider: "0.05em",
    widest: "0.1em",
  },
} as const;

// ============================================================================
// SHADOWS (for React Native style objects)
// ============================================================================

export const shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const;

// ============================================================================
// ANIMATIONS
// ============================================================================

export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

// ============================================================================
// LEGACY THEME OBJECT (for RN compatibility — `import { theme } from '@voisss/ui'`)
// ============================================================================

export const theme = {
  spacing,
  borderRadius,
  typography: {
    fontSizes: {
      xs: typography.sizes.xs,
      sm: typography.sizes.sm,
      md: typography.sizes.md,
      lg: typography.sizes.lg,
      xl: typography.sizes.xl,
      xxl: typography.sizes.xxl,
      xxxl: typography.sizes.xxxl,
    },
    fontWeights: {
      regular: Number(typography.weights.regular),
      medium: Number(typography.weights.medium),
      semibold: Number(typography.weights.semibold),
      bold: Number(typography.weights.bold),
      extrabold: Number(typography.weights.extrabold),
    },
  },
  shadows,
};

export type Theme = typeof theme;

// ============================================================================
// GLOBAL STYLES (React Native style objects — token-referenced, no hardcoded values)
// ============================================================================

export const globalStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  screenPadding: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "center",
  },
  spaceBetween: {
    flexDirection: "row" as const,
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: Number(typography.weights.bold),
    color: colors.dark.text,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    fontWeight: Number(typography.weights.semibold),
    color: colors.dark.text,
    marginBottom: spacing.sm,
  },
  text: {
    fontSize: typography.sizes.md,
    color: colors.dark.text,
  },
  textSecondary: {
    fontSize: typography.sizes.md,
    color: colors.dark.textSecondary,
  },
  textSmall: {
    fontSize: typography.sizes.sm,
    color: colors.dark.textSecondary,
  },
  button: {
    backgroundColor: colors.dark.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowColor: colors.dark.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: colors.dark.text,
    fontSize: typography.sizes.md,
    fontWeight: Number(typography.weights.medium),
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.dark.card,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
};

// ============================================================================
// BUTTON STYLES (React Native)
// ============================================================================

export const buttonStyles = {
  primary: {
    backgroundColor: colors.dark.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowColor: colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  primaryText: {
    color: colors.dark.text,
    fontSize: typography.sizes.md,
    fontWeight: "600" as const,
  },
  secondary: {
    backgroundColor: "transparent",
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 2,
    borderColor: colors.dark.primary,
  },
  secondaryText: {
    color: colors.dark.primary,
    fontSize: typography.sizes.md,
    fontWeight: "600" as const,
  },
  danger: {
    backgroundColor: colors.dark.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowColor: colors.dark.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  dangerText: {
    color: colors.dark.text,
    fontSize: typography.sizes.md,
    fontWeight: "600" as const,
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.dark.card,
    borderWidth: 1,
    borderColor: colors.dark.border,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ThemeType = typeof theme;
