import { StyleSheet } from "react-native";
import colors from "./colors";

// Shared styles across the app
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

// Common styles used across components
export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  screenPadding: {
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spaceBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: theme.typography.fontSizes.xxl,
    fontWeight: 700,
    color: colors.dark.text,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: 600,
    color: colors.dark.text,
    marginBottom: theme.spacing.sm,
  },
  text: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.dark.text,
  },
  textSecondary: {
    fontSize: theme.typography.fontSizes.md,
    color: colors.dark.textSecondary,
  },
  textSmall: {
    fontSize: theme.typography.fontSizes.sm,
    color: colors.dark.textSecondary,
  },
  button: {
    backgroundColor: colors.dark.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.dark.text,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: 500,
  },
  iconButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
});
