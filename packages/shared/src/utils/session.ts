/**
 * Cross-Platform Session Management Utility
 * 
 * This utility provides a consistent interface for session management
 * across web and mobile platforms, using the appropriate storage
 * mechanism for each platform.
 */

// Platform detection
const isWeb = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
const isMobile = !isWeb; // Simplified detection for React Native

// Storage interface
interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Web storage adapter (localStorage)
class WebStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to get item from localStorage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to set item in localStorage:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove item from localStorage:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
}

// Mobile storage adapter (AsyncStorage)
class MobileStorageAdapter implements StorageAdapter {
  private asyncStorage: any;

  constructor() {
    try {
      // Dynamically import AsyncStorage for mobile
      this.asyncStorage = require('@react-native-async-storage/async-storage').default;
    } catch (error) {
      console.warn('AsyncStorage not available:', error);
      this.asyncStorage = null;
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (!this.asyncStorage) return null;
    try {
      return await this.asyncStorage.getItem(key);
    } catch (error) {
      console.error('Failed to get item from AsyncStorage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.asyncStorage) return;
    try {
      await this.asyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to set item in AsyncStorage:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!this.asyncStorage) return;
    try {
      await this.asyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove item from AsyncStorage:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.asyncStorage) return;
    try {
      await this.asyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear AsyncStorage:', error);
    }
  }
}

// Create appropriate storage adapter based on platform
const storageAdapter: StorageAdapter = isWeb 
  ? new WebStorageAdapter() 
  : new MobileStorageAdapter();

// Session management utilities
export interface UserSession {
  userId: string;
  walletAddress?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  network?: string;
  preferences?: Record<string, any>;
}

const SESSION_KEY = '@voisss:user_session';
const WALLET_ADDRESS_KEY = '@voisss:wallet_address';
const NETWORK_KEY = '@voisss:network';

/**
 * Save user session
 */
export async function saveUserSession(session: UserSession): Promise<void> {
  try {
    const sessionString = JSON.stringify(session);
    await storageAdapter.setItem(SESSION_KEY, sessionString);
    
    // Also save wallet address separately for quick access
    if (session.walletAddress) {
      await storageAdapter.setItem(WALLET_ADDRESS_KEY, session.walletAddress);
    }
    
    // Save network preference
    if (session.network) {
      await storageAdapter.setItem(NETWORK_KEY, session.network);
    }
  } catch (error) {
    console.error('Failed to save user session:', error);
  }
}

/**
 * Load user session
 */
export async function loadUserSession(): Promise<UserSession | null> {
  try {
    const sessionString = await storageAdapter.getItem(SESSION_KEY);
    if (!sessionString) return null;
    
    const session: UserSession = JSON.parse(sessionString);
    
    // Check if session is expired
    if (session.expiresAt && Date.now() > session.expiresAt) {
      await clearUserSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to load user session:', error);
    return null;
  }
}

/**
 * Clear user session
 */
export async function clearUserSession(): Promise<void> {
  try {
    await storageAdapter.removeItem(SESSION_KEY);
    await storageAdapter.removeItem(WALLET_ADDRESS_KEY);
    await storageAdapter.removeItem(NETWORK_KEY);
  } catch (error) {
    console.error('Failed to clear user session:', error);
  }
}

/**
 * Get wallet address from session
 */
export async function getStoredWalletAddress(): Promise<string | null> {
  try {
    return await storageAdapter.getItem(WALLET_ADDRESS_KEY);
  } catch (error) {
    console.error('Failed to get wallet address:', error);
    return null;
  }
}

/**
 * Get network preference from session
 */
export async function getStoredNetwork(): Promise<string | null> {
  try {
    return await storageAdapter.getItem(NETWORK_KEY);
  } catch (error) {
    console.error('Failed to get network preference:', error);
    return null;
  }
}

/**
 * Update session with new data
 */
export async function updateSession(updates: Partial<UserSession>): Promise<UserSession | null> {
  const existingSession = await loadUserSession();
  if (!existingSession) return null;
  
  const updatedSession: UserSession = {
    ...existingSession,
    ...updates
  };
  
  await saveUserSession(updatedSession);
  return updatedSession;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await loadUserSession();
  if (!session) return false;
  
  // Check if session is expired
  if (session.expiresAt && Date.now() > session.expiresAt) {
    await clearUserSession();
    return false;
  }
  
  return true;
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Create a new session for a user
 */
export async function createSession(walletAddress?: string, network?: string): Promise<UserSession> {
  const userId = generateUserId();
  const session: UserSession = {
    userId,
    walletAddress,
    network,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  
  await saveUserSession(session);
  return session;
}