// Shared theme across the app
export const theme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },
  typography: {
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    fontWeights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  shadows: {
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
  },
};

// Define Theme type for consistency
export type Theme = typeof theme;

// Common styles used across components - these are raw style objects that can be used in both React Native and web
export const globalStyles = {
  container: {
    flex: 1,
    backgroundColor: "#121214",  // Using dark background directly instead of colors.dark.background
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#121214",  // Using dark background directly
  },
  screenPadding: {
    padding: 16,  // theme.spacing.md
  },
  card: {
    backgroundColor: "#1E1E24",  // colors.dark.card
    borderRadius: 12,  // theme.borderRadius.lg
    padding: 16,  // theme.spacing.md
    marginBottom: 16,  // theme.spacing.md
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#2A2A35",  // colors.dark.border
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
    fontSize: 24,  // theme.typography.fontSizes.xxl
    fontWeight: 700,
    color: "#FFFFFF",  // colors.dark.text
    marginBottom: 16,  // theme.spacing.md
  },
  subtitle: {
    fontSize: 18,  // theme.typography.fontSizes.lg
    fontWeight: 600,
    color: "#FFFFFF",  // colors.dark.text
    marginBottom: 8,  // theme.spacing.sm
  },
  text: {
    fontSize: 16,  // theme.typography.fontSizes.md
    color: "#FFFFFF",  // colors.dark.text
  },
  textSecondary: {
    fontSize: 16,  // theme.typography.fontSizes.md
    color: "#A0A0B0",  // colors.dark.textSecondary
  },
  textSmall: {
    fontSize: 14,  // theme.typography.fontSizes.sm
    color: "#A0A0B0",  // colors.dark.textSecondary
  },
  button: {
    backgroundColor: "#7C5DFA",  // colors.dark.primary
    borderRadius: 8,  // theme.borderRadius.md
    paddingVertical: 8,  // theme.spacing.sm
    paddingHorizontal: 16,  // theme.spacing.md
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowColor: "#7C5DFA",  // colors.dark.primary
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#FFFFFF",  // colors.dark.text
    fontSize: 16,  // theme.typography.fontSizes.md
    fontWeight: 500,
  },
  iconButton: {
    padding: 8,  // theme.spacing.sm
    borderRadius: 9999,  // theme.borderRadius.full
    backgroundColor: "#1E1E24",  // colors.dark.card
    borderWidth: 1,
    borderColor: "#2A2A35",  // colors.dark.border
  },
};

// Enhanced button styles
export const buttonStyles = {
  primary: {
    backgroundColor: "#7C5DFA",  // colors.dark.primary
    borderRadius: 8,  // theme.borderRadius.md
    paddingVertical: 8,  // theme.spacing.sm
    paddingHorizontal: 24,  // theme.spacing.lg
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowColor: "#7C5DFA",  // colors.dark.primary
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  primaryText: {
    color: "#FFFFFF",  // colors.dark.text
    fontSize: 16,  // theme.typography.fontSizes.md
    fontWeight: "600" as const,
  },
  secondary: {
    backgroundColor: "transparent",
    borderRadius: 8,  // theme.borderRadius.md
    paddingVertical: 8,  // theme.spacing.sm
    paddingHorizontal: 24,  // theme.spacing.lg
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 2,
    borderColor: "#7C5DFA",  // colors.dark.primary
  },
  secondaryText: {
    color: "#7C5DFA",  // colors.dark.primary
    fontSize: 16,  // theme.typography.fontSizes.md
    fontWeight: "600" as const,
  },
  danger: {
    backgroundColor: "#FF5252",  // colors.dark.error
    borderRadius: 8,  // theme.borderRadius.md
    paddingVertical: 8,  // theme.spacing.sm
    paddingHorizontal: 24,  // theme.spacing.lg
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowColor: "#FF5252",  // colors.dark.error
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  dangerText: {
    color: "#FFFFFF",  // colors.dark.text
    fontSize: 16,  // theme.typography.fontSizes.md
    fontWeight: "600" as const,
  },
  iconButton: {
    padding: 8,  // theme.spacing.sm
    borderRadius: 9999,  // theme.borderRadius.full
    backgroundColor: "#1E1E24",  // colors.dark.card
    borderWidth: 1,
    borderColor: "#2A2A35",  // colors.dark.border
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
};
