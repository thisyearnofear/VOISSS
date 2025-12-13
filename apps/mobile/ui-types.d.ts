// Temporary type declarations for @voisss/ui package
// These are placeholder types to help with compilation while the actual UI package types are being fixed

declare module '@voisss/ui' {
  // Components
  export const AITransformationPanel: any;
  export const DubbingPanel: any;
  export const Button: any;
  export const Input: any;
  export const Spacing: any;
  export const WaveformVisualization: any;
  export const SocialShare: any;
  export const globalStyles: any;

  // Theme
  export const theme: {
    colors: any;
    spacing: {
      xxs: number;
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    borderRadius: {
      sm: number;
      md: number;
      lg: number;
      xl: number;
      full: number;
    };
    typography: {
      fontSize: {
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
      };
      fontSizes: {
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
      };
      fontWeight: {
        light: string;
        normal: string;
        medium: string;
        bold: string;
      };
    };
  };

  // Utilities
  export const colors: any;
}

// Declare missing wallet connectors module
declare module '../../services/wallet-connectors' {
  export const initializeWalletConnectors: any;
  export const getBalance: any;
}

// Declare missing web3 utils module  
declare module '../../utils/web3-utils' {
  export const getBalance: any;
}