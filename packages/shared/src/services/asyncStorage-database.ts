/**
 * @internal — React Native AsyncStorage adapter for DatabaseService.
 *
 * ⚠️  Do NOT import this file directly.
 * Use `cross-platform-storage` (the public API) instead:
 *   import { crossPlatformStorage } from '@voisss/shared';
 *
 * This adapter is an implementation detail of the storage layer.
 * Importing it directly creates platform-specific coupling.
 *
 * React Native-compatible database implementation using AsyncStorage.
 * Mirrors the localStorage-database API for consistency across platforms.
 */

import { 
  DatabaseService, 
  DatabaseConnectionError, 
  DatabaseOperationError,
  DatabaseValidationError,
  CollectionName 
} from './database-service';

import AsyncStorage from '@react-native-async-storage/async-storage';

export class AsyncStorageDatabase implements DatabaseService {
  private keyPrefix = 'voisss_db_';
  private connected = false;

  constructor(private namespace: string = 'default') {
    this.keyPrefix = `voisss_db_${namespace}_`;
  }

  async connect(): Promise<void> {
    try {
      // Test AsyncStorage availability
      await AsyncStorage.setItem(`${this.keyPrefix}test`, 'test');
      await AsyncStorage.removeItem(`${this.keyPrefix}test`);
      this.connected = true;
    } catch (error) {
      throw new DatabaseConnectionError(
        'AsyncStorage is not available'
      );
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  private getKey(collection: string, id?: string): string {
    return id 
      ? `${this.keyPrefix}${collection}_${id}`
      : `${this.keyPrefix}${collection}_index`;
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
  }

  private async getCollectionIndex(collection: string): Promise<string[]> {
    try {
      const indexKey = this.getKey(collection);
      const indexData = await AsyncStorage.getItem(indexKey);
      return indexData ? JSON.parse(indexData) : [];
    } catch (error) {
      console.warn(`Failed to read index for collection ${collection}:`, error);
      return [];
    }
  }

  private async setCollectionIndex(collection: string, index: string[]): Promise<void> {
    try {
      const indexKey = this.getKey(collection);
      await AsyncStorage.setItem(indexKey, JSON.stringify(index));
    } catch (error) {
      throw new DatabaseOperationError(
        `Failed to update index for collection ${collection}`,
        collection,
        'setIndex'
      );
    }
  }

  private async addToIndex(collection: string, id: string): Promise<void> {
    const index = await this.getCollectionIndex(collection);
    if (!index.includes(id)) {
      index.push(id);
      await this.setCollectionIndex(collection, index);
    }
  }

  private async removeFromIndex(collection: string, id: string): Promise<void> {
    const index = await this.getCollectionIndex(collection);
    const newIndex = index.filter(existingId => existingId !== id);
    await this.setCollectionIndex(collection, newIndex);
  }

  async get<T>(collection: string, id: string): Promise<T | null> {
    await this.ensureConnected();
    
    try {
      const key = this.getKey(collection, id);
      const data = await AsyncStorage.getItem(key);
      
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);
      
      // Convert date strings back to Date objects
      return this.reviveDates(parsed);
    } catch (error) {
      throw new DatabaseOperationError(
        `Failed to get item ${id} from collection ${collection}`,
        collection,
        'get'
      );
    }
  }

  async getAll<T>(collection: string): Promise<T[]> {
    await this.ensureConnected();
    
    try {
      const index = await this.getCollectionIndex(collection);
      const items: T[] = [];

      for (const id of index) {
        const item = await this.get<T>(collection, id);
        if (item !== null) {
          items.push(item);
        }
      }

      return items;
    } catch (error) {
      throw new DatabaseOperationError(
        `Failed to get all items from collection ${collection}`,
        collection,
        'getAll'
      );
    }
  }

  async getWhere<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
    const allItems = await this.getAll<T>(collection);
    return allItems.filter(predicate);
  }

  async set<T>(collection: string, id: string, data: T): Promise<void> {
    await this.ensureConnected();
    
    try {
      const key = this.getKey(collection, id);
      const serialized = JSON.stringify(data, this.dateReplacer);
      
      await AsyncStorage.setItem(key, serialized);
      await this.addToIndex(collection, id);
    } catch (error) {
      throw new DatabaseOperationError(
        `Failed to set item ${id} in collection ${collection}`,
        collection,
        'set'
      );
    }
  }

  async update<T>(collection: string, id: string, updates: Partial<T>): Promise<T> {
    const existing = await this.get<T>(collection, id);
    
    if (!existing) {
      throw new DatabaseOperationError(
        `Item ${id} not found in collection ${collection}`,
        collection,
        'update'
      );
    }

    const updated = { ...existing, ...updates };
    await this.set(collection, id, updated);
    return updated;
  }

  async delete(collection: string, id: string): Promise<boolean> {
    await this.ensureConnected();
    
    try {
      const key = this.getKey(collection, id);
      const existed = (await AsyncStorage.getItem(key)) !== null;
      
      await AsyncStorage.removeItem(key);
      await this.removeFromIndex(collection, id);
      
      return existed;
    } catch (error) {
      throw new DatabaseOperationError(
        `Failed to delete item ${id} from collection ${collection}`,
        collection,
        'delete'
      );
    }
  }

  async exists(collection: string, id: string): Promise<boolean> {
    await this.ensureConnected();
    
    const key = this.getKey(collection, id);
    return (await AsyncStorage.getItem(key)) !== null;
  }

  async setBatch<T>(collection: string, items: Array<{ id: string; data: T }>): Promise<void> {
    await this.ensureConnected();
    
    for (const { id, data } of items) {
      await this.set(collection, id, data);
    }
  }

  async deleteBatch(collection: string, ids: string[]): Promise<void> {
    await this.ensureConnected();
    
    for (const id of ids) {
      await this.delete(collection, id);
    }
  }

  async clear(collection: string): Promise<void> {
    await this.ensureConnected();
    
    try {
      const index = await this.getCollectionIndex(collection);
      
      // Remove all items
      for (const id of index) {
        const key = this.getKey(collection, id);
        await AsyncStorage.removeItem(key);
      }
      
      // Clear the index
      await this.setCollectionIndex(collection, []);
    } catch (error) {
      throw new DatabaseOperationError(
        `Failed to clear collection ${collection}`,
        collection,
        'clear'
      );
    }
  }

  async count(collection: string): Promise<number> {
    const index = await this.getCollectionIndex(collection);
    return index.length;
  }

  // Utility methods for handling Date serialization
  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  private reviveDates(obj: any): any {
    if (obj && typeof obj === 'object') {
      if (obj.__type === 'Date') {
        return new Date(obj.value);
      }
      
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          obj[key] = this.reviveDates(obj[key]);
        }
      }
    }
    
    return obj;
  }

  // Debug and maintenance methods
  async getStorageInfo(): Promise<{
    collections: Array<{ name: string; count: number; sizeKB: number }>;
    totalSizeKB: number;
  }> {
    const collections: Array<{ name: string; count: number; sizeKB: number }> = [];
    let totalSize = 0;

    // Get all keys that belong to this database instance
    const allKeys = await AsyncStorage.getAllKeys();
    const dbKeys = allKeys.filter(key => key.startsWith(this.keyPrefix));

    // Group by collection
    const collectionMap = new Map<string, string[]>();
    
    for (const key of dbKeys) {
      const parts = key.replace(this.keyPrefix, '').split('_');
      if (parts.length >= 2) {
        const collection = parts[0];
        if (!collectionMap.has(collection)) {
          collectionMap.set(collection, []);
        }
        collectionMap.get(collection)!.push(key);
      }
    }

    // Calculate size for each collection
    for (const [collectionName, keys] of collectionMap) {
      let collectionSize = 0;
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key) || '';
        collectionSize += key.length + value.length;
      }
      
      const sizeKB = Math.round(collectionSize / 1024 * 100) / 100;
      const count = await this.count(collectionName);
      
      collections.push({
        name: collectionName,
        count,
        sizeKB
      });
      
      totalSize += collectionSize;
    }

    return {
      collections,
      totalSizeKB: Math.round(totalSize / 1024 * 100) / 100
    };
  }
}

/**
 * Factory function to create an AsyncStorage database instance
 */
export function createAsyncStorageDatabase(namespace: string = 'default'): DatabaseService {
  return new AsyncStorageDatabase(namespace);
}