/**
 * Platform-Aware Wallet Connectors
 * 
 * Unified wallet connection service that works across web and mobile platforms
 * Follows MODULAR and CLEAN principles with explicit platform detection
 */

import { type Connector, walletConnect, injected, coinbaseWallet } from 'wagmi/connectors';
import { type Chain, type Transport, http } from 'viem';

/**
 * Wallet connector configuration
 */
export interface WalletConnectorConfig {
  projectId: string;
  chains: Chain[];
  showQrModal?: boolean;
  metadata?: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
}

/**
 * Platform-aware wallet connector service
 */
export class WalletConnectorService {
  private config: WalletConnectorConfig;
  private isMobile: boolean;

  constructor(config: WalletConnectorConfig) {
    this.config = config;
    this.isMobile = this.detectMobileEnvironment();
  }

  /**
   * Detect if running in mobile environment
   */
  private detectMobileEnvironment(): boolean {
    // Check for React Native global object
    if (typeof global !== 'undefined' && 
        (global.__DEV__ !== undefined || 
         global.nativeRequire !== undefined)) {
      return true;
    }
    
    // Check for Node.js environment (used in React Native)
    if (typeof process !== 'undefined' && 
        process.versions !== undefined && 
        process.versions.node !== undefined) {
      // But exclude browser environments that have process shim
      if (typeof window === 'undefined' || 
          typeof document === 'undefined') {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get platform-aware wallet connectors
   * Automatically selects appropriate connectors based on environment
   */
  public getConnectors(transport: Transport = http()): Connector[] {
    const connectors: Connector[] = [];

    // WalletConnect works on both platforms
    connectors.push(
      walletConnect({
        projectId: this.config.projectId,
        chains: this.config.chains,
        showQrModal: this.config.showQrModal ?? true,
        metadata: this.config.metadata,
      })
    );

    // Web-only connectors
    if (!this.isMobile && typeof window !== 'undefined') {
      // Injected connector (MetaMask, etc.)
      connectors.push(
        injected({
          target: 'metaMask',
        })
      );

      // Coinbase Wallet
      connectors.push(
        coinbaseWallet({
          appName: this.config.metadata?.name || 'VOISSS',
          appLogoUrl: this.config.metadata?.icons?.[0],
        })
      );
    }

    return connectors;
  }

  /**
   * Get wallet connection URL for mobile deep linking
   * Returns appropriate wallet URL based on platform
   */
  public getWalletConnectionUrl(walletType: 'metamask' | 'coinbase' | 'walletconnect' = 'walletconnect'): string | null {
    if (!this.isMobile) {
      return null; // Deep linking not needed for web
    }

    switch (walletType) {
      case 'metamask':
        return 'https://metamask.app.link';
      case 'coinbase':
        return 'https://go.cb-w.com/mobile-download';
      case 'walletconnect':
        return `wc:${this.config.projectId}@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=${this.generateWCKey()}`;
      default:
        return null;
    }
  }

  /**
   * Generate WalletConnect key for deep linking
   */
  private generateWCKey(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Check if specific wallet is available
   */
  public isWalletAvailable(walletType: 'metamask' | 'coinbase' | 'walletconnect'): boolean {
    if (walletType === 'walletconnect') {
      return true; // Always available
    }

    if (this.isMobile) {
      return false; // Browser wallets not available on mobile
    }

    // Web wallet detection
    if (typeof window !== 'undefined') {
      if (walletType === 'metamask') {
        return typeof window.ethereum !== 'undefined' && 
               window.ethereum.isMetaMask;
      }
      if (walletType === 'coinbase') {
        return typeof window.ethereum !== 'undefined' && 
               window.ethereum.isCoinbaseWallet;
      }
    }

    return false;
  }

  /**
   * Get recommended wallet for current platform
   */
  public getRecommendedWallet(): { 
    type: 'metamask' | 'coinbase' | 'walletconnect'; 
    name: string; 
    description: string; 
    available: boolean; 
    installUrl?: string; 
  } {
    if (this.isMobile) {
      return {
        type: 'walletconnect',
        name: 'WalletConnect',
        description: 'Connect with any mobile wallet',
        available: true,
      };
    }

    // Check for MetaMask
    if (this.isWalletAvailable('metamask')) {
      return {
        type: 'metamask',
        name: 'MetaMask',
        description: 'Browser extension wallet',
        available: true,
        installUrl: 'https://metamask.io/download/',
      };
    }

    // Check for Coinbase Wallet
    if (this.isWalletAvailable('coinbase')) {
      return {
        type: 'coinbase',
        name: 'Coinbase Wallet',
        description: 'Browser extension wallet',
        available: true,
        installUrl: 'https://www.coinbase.com/wallet',
      };
    }

    // Fallback to WalletConnect
    return {
      type: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect with any wallet',
      available: true,
    };
  }

  /**
   * Get environment information
   */
  public getEnvironmentInfo(): { 
    isMobile: boolean; 
    platform: string; 
    recommendedWallet: string; 
  } {
    const recommended = this.getRecommendedWallet();
    
    return {
      isMobile: this.isMobile,
      platform: this.isMobile ? 'react-native' : 'web',
      recommendedWallet: recommended.type,
    };
  }
}

/**
 * Factory function to create wallet connector service
 */
export function createWalletConnectorService(config: WalletConnectorConfig): WalletConnectorService {
  return new WalletConnectorService(config);
}

/**
 * Singleton instance with default configuration
 */
export const walletConnectorService = new WalletConnectorService({
  projectId: 'your-walletconnect-project-id', // Replace with actual project ID
  chains: [], // Will be set when initialized
  metadata: {
    name: 'VOISSS',
    description: 'Voice Social Network',
    url: 'https://voisss.com',
    icons: ['https://voisss.com/logo.png'],
  },
});

/**
 * Initialize wallet connector service with proper configuration
 */
export function initializeWalletConnectors(chains: Chain[], projectId: string): void {
  walletConnectorService = new WalletConnectorService({
    projectId,
    chains,
    metadata: {
      name: 'VOISSS',
      description: 'Voice Social Network',
      url: 'https://voisss.com',
      icons: ['https://voisss.com/logo.png'],
    },
  });
}