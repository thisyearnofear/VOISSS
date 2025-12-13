/**
 * Web3 Utility Functions
 * 
 * Cross-platform Web3 utilities that work across web and mobile environments
 * Follows MODULAR and PERFORMANT principles
 */

import { type Address, type Hex, isAddress, parseEther, formatEther, parseUnits, formatUnits } from 'viem';
import { crossPlatformStorage } from '../services/cross-platform-storage';

/**
 * Web3 Storage Keys
 */
export const WEB3_STORAGE_KEYS = {
  SPEND_PERMISSION_HASH: 'spendPermissionHash',
  LAST_CONNECTED_WALLET: 'lastConnectedWallet',
  WALLET_CONNECT_SESSION: 'walletConnectSession',
  USER_PREFERRED_CHAIN: 'userPreferredChain',
} as const;

export type Web3StorageKey = keyof typeof WEB3_STORAGE_KEYS;

/**
 * Web3 Storage Service
 * Unified interface for Web3-related storage operations
 */
export class Web3StorageService {
  /**
   * Store spend permission hash
   */
  static async storeSpendPermission(hash: string): Promise<void> {
    await crossPlatformStorage.setItem(WEB3_STORAGE_KEYS.SPEND_PERMISSION_HASH, hash);
  }

  /**
   * Retrieve spend permission hash
   */
  static async getSpendPermissionHash(): Promise<string | null> {
    return await crossPlatformStorage.getItem(WEB3_STORAGE_KEYS.SPEND_PERMISSION_HASH);
  }

  /**
   * Clear spend permission hash
   */
  static async clearSpendPermission(): Promise<void> {
    await crossPlatformStorage.removeItem(WEB3_STORAGE_KEYS.SPEND_PERMISSION_HASH);
  }

  /**
   * Store last connected wallet address
   */
  static async storeLastConnectedWallet(address: Address): Promise<void> {
    await crossPlatformStorage.setItem(WEB3_STORAGE_KEYS.LAST_CONNECTED_WALLET, address);
  }

  /**
   * Get last connected wallet address
   */
  static async getLastConnectedWallet(): Promise<Address | null> {
    const address = await crossPlatformStorage.getItem(WEB3_STORAGE_KEYS.LAST_CONNECTED_WALLET);
    return address && isAddress(address) ? address : null;
  }

  /**
   * Store user preferred chain ID
   */
  static async storePreferredChain(chainId: number): Promise<void> {
    await crossPlatformStorage.setItem(WEB3_STORAGE_KEYS.USER_PREFERRED_CHAIN, chainId.toString());
  }

  /**
   * Get user preferred chain ID
   */
  static async getPreferredChain(): Promise<number | null> {
    const chainId = await crossPlatformStorage.getItem(WEB3_STORAGE_KEYS.USER_PREFERRED_CHAIN);
    return chainId ? parseInt(chainId, 10) : null;
  }

  /**
   * Clear all Web3 storage
   */
  static async clearAllWeb3Storage(): Promise<void> {
    for (const key of Object.values(WEB3_STORAGE_KEYS)) {
      await crossPlatformStorage.removeItem(key);
    }
  }
}

/**
 * Web3 Formatters
 * Cross-platform formatting utilities
 */
export class Web3Formatters {
  /**
   * Format ETH amount for display
   */
  static formatEthAmount(weiAmount: bigint | string, decimals: number = 18): string {
    try {
      const formatted = formatUnits(BigInt(weiAmount), decimals);
      // Format with 4 decimal places, remove trailing zeros
      return parseFloat(formatted).toFixed(4).replace(/\.?0+$/, '');
    } catch (error) {
      console.error('Failed to format ETH amount:', error);
      return '0';
    }
  }

  /**
   * Format ETH amount with symbol
   */
  static formatEthWithSymbol(weiAmount: bigint | string, symbol: string = 'ETH'): string {
    return `${this.formatEthAmount(weiAmount)} ${symbol}`;
  }

  /**
   * Parse ETH amount to wei
   */
  static parseEthAmount(ethAmount: string, decimals: number = 18): bigint {
    try {
      return parseUnits(ethAmount, decimals);
    } catch (error) {
      console.error('Failed to parse ETH amount:', error);
      return 0n;
    }
  }

  /**
   * Format address for display (shorten middle)
   */
  static formatAddress(address: Address, startLength: number = 6, endLength: number = 4): string {
    if (!isAddress(address)) return address;
    return `${address.substring(0, startLength)}...${address.substring(address.length - endLength)}`;
  }

  /**
   * Format transaction hash for display
   */
  static formatTransactionHash(hash: Hex, startLength: number = 8, endLength: number = 6): string {
    return `${hash.substring(0, startLength)}...${hash.substring(hash.length - endLength)}`;
  }
}

/**
 * Web3 Helpers
 * Utility functions for common Web3 operations
 */
export class Web3Helpers {
  /**
   * Validate Ethereum address
   */
  static isValidAddress(address: string): boolean {
    return isAddress(address);
  }

  /**
   * Validate transaction hash
   */
  static isValidTransactionHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }

  /**
   * Validate block hash
   */
  static isValidBlockHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }

  /**
   * Convert string to Hex
   */
  static stringToHex(str: string): Hex {
    return `0x${Buffer.from(str, 'utf8').toString('hex')}` as Hex;
  }

  /**
   * Convert Hex to string
   */
  static hexToString(hex: Hex): string {
    return Buffer.from(hex.replace('0x', ''), 'hex').toString('utf8');
  }

  /**
   * Generate random Hex string
   */
  static generateRandomHex(length: number = 32): Hex {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}` as Hex;
  }

  /**
   * Get current timestamp in seconds (for blockchain operations)
   */
  static getCurrentTimestamp(): bigint {
    return BigInt(Math.floor(Date.now() / 1000));
  }

  /**
   * Convert timestamp to readable date
   */
  static timestampToDate(timestamp: bigint | number): Date {
    return new Date(Number(timestamp) * 1000);
  }

  /**
   * Format timestamp as relative time
   */
  static formatRelativeTime(timestamp: bigint | number): string {
    const date = this.timestampToDate(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
  }
}

/**
 * Web3 React Hooks
 * React hooks for common Web3 operations
 */
export function useWeb3Formatters() {
  return {
    formatEthAmount: Web3Formatters.formatEthAmount,
    formatEthWithSymbol: Web3Formatters.formatEthWithSymbol,
    formatAddress: Web3Formatters.formatAddress,
    formatTransactionHash: Web3Formatters.formatTransactionHash,
  };
}

export function useWeb3Storage() {
  return {
    storeSpendPermission: Web3StorageService.storeSpendPermission,
    getSpendPermissionHash: Web3StorageService.getSpendPermissionHash,
    clearSpendPermission: Web3StorageService.clearSpendPermission,
    storeLastConnectedWallet: Web3StorageService.storeLastConnectedWallet,
    getLastConnectedWallet: Web3StorageService.getLastConnectedWallet,
    storePreferredChain: Web3StorageService.storePreferredChain,
    getPreferredChain: Web3StorageService.getPreferredChain,
    clearAllWeb3Storage: Web3StorageService.clearAllWeb3Storage,
  };
}