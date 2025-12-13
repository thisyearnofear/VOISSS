/**
 * Cross-Platform Storage Service
 * 
 * Unified storage API that works across web (localStorage) and mobile (AsyncStorage)
 * Follows DRY principle by providing single source of truth for storage operations
 * Enhances existing database service pattern with platform awareness
 */

import { DatabaseService } from './database-service';

/**
 * Cross-platform storage adapter that automatically selects the appropriate
 * storage backend based on the runtime environment
 */
export class CrossPlatformStorage implements DatabaseService {
  private innerService: DatabaseService;
  private isMobile: boolean;

  constructor(namespace: string = 'default') {
    // Detect mobile environment
    this.isMobile = this.detectMobileEnvironment();
    
    // Initialize appropriate storage backend
    this.innerService = this.createStorageService(namespace);
  }

  /**
   * Detect if running in mobile environment (React Native)
   * Uses feature detection rather than platform detection for reliability
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
   * Create the appropriate storage service based on environment
   */
  private createStorageService(namespace: string): DatabaseService {
    if (this.isMobile) {
      return this.createMobileStorage(namespace);
    } else {
      return this.createWebStorage(namespace);
    }
  }

  /**
   * Create web storage service (localStorage-based)
   */
  private createWebStorage(namespace: string): DatabaseService {
    const { createLocalStorageDatabase } = require('./localStorage-database');
    return createLocalStorageDatabase(namespace);
  }

  /**
   * Create mobile storage service (AsyncStorage-based)
   */
  private createMobileStorage(namespace: string): DatabaseService {
    const { createAsyncStorageDatabase } = require('./asyncStorage-database');
    return createAsyncStorageDatabase(namespace);
  }

  /**
   * Simple key-value storage API for convenience
   * Provides a simpler interface for basic storage needs
   */
  public async getItem(key: string): Promise<string | null> {
    try {
      const item = await this.innerService.get('storage', key);
      return item?.value || null;
    } catch (error) {
      console.warn(`Failed to get storage item ${key}:`, error);
      return null;
    }
  }

  public async setItem(key: string, value: string): Promise<void> {
    await this.innerService.set('storage', key, { value, updatedAt: new Date() });
  }

  public async removeItem(key: string): Promise<void> {
    await this.innerService.delete('storage', key);
  }

  public async clear(): Promise<void> {
    await this.innerService.clear('storage');
  }

  // Delegate all DatabaseService methods to the inner service
  public async connect(): Promise<void> {
    await this.innerService.connect();
  }

  public async disconnect(): Promise<void> {
    await this.innerService.disconnect();
  }

  public isConnected(): boolean {
    return this.innerService.isConnected();
  }

  public async get<T>(collection: string, id: string): Promise<T | null> {
    return this.innerService.get<T>(collection, id);
  }

  public async getAll<T>(collection: string): Promise<T[]> {
    return this.innerService.getAll<T>(collection);
  }

  public async getWhere<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
    return this.innerService.getWhere<T>(collection, predicate);
  }

  public async set<T>(collection: string, id: string, data: T): Promise<void> {
    await this.innerService.set<T>(collection, id, data);
  }

  public async update<T>(collection: string, id: string, updates: Partial<T>): Promise<T> {
    return this.innerService.update<T>(collection, id, updates);
  }

  public async delete(collection: string, id: string): Promise<boolean> {
    return this.innerService.delete(collection, id);
  }

  public async exists(collection: string, id: string): Promise<boolean> {
    return this.innerService.exists(collection, id);
  }

  public async setBatch<T>(collection: string, items: Array<{ id: string; data: T }>): Promise<void> {
    await this.innerService.setBatch<T>(collection, items);
  }

  public async deleteBatch(collection: string, ids: string[]): Promise<void> {
    await this.innerService.deleteBatch(collection, ids);
  }

  public async clear(collection: string): Promise<void> {
    await this.innerService.clear(collection);
  }

  public async count(collection: string): Promise<number> {
    return this.innerService.count(collection);
  }

  public async getStorageInfo(): Promise<any> {
    if ('getStorageInfo' in this.innerService) {
      return (this.innerService as any).getStorageInfo();
    }
    return null;
  }

  public async clearAllData(): Promise<void> {
    // Clear all collections
    const collections = ['storage', 'missions', 'mission_responses', 'user_missions'];
    for (const collection of collections) {
      try {
        await this.clear(collection);
      } catch (error) {
        // Ignore errors for non-existent collections
      }
    }
  }

  /**
   * Get environment information for debugging
   */
  public getEnvironmentInfo(): { isMobile: boolean; platform: string } {
    return {
      isMobile: this.isMobile,
      platform: this.isMobile ? 'react-native' : 'web'
    };
  }
}

/**
 * Factory function to create a cross-platform storage service
 */
export function createCrossPlatformStorage(namespace: string = 'default'): DatabaseService {
  return new CrossPlatformStorage(namespace);
}

/**
 * Singleton instance for convenience
 */
export const crossPlatformStorage = new CrossPlatformStorage('default');