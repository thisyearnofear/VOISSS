/**
 * Cross-Platform Storage Service
 *
 * In-memory storage adapter that provides a unified DatabaseService-compatible API.
 * Previously provided platform-specific storage (localStorage on web, AsyncStorage on mobile).
 * 
 * For production persistence, use PostgresDatabase via API routes.
 * For client-side caching, use the DatabaseService interface with InMemoryDatabase directly.
 *
 * Follows DRY principle by providing single source of truth for storage operations.
 */

import { DatabaseService } from "./database-service";
import { InMemoryDatabase } from "./memory-database";

/**
 * Cross-platform storage adapter backed by an in-memory database.
 * 
 * Previously provided platform-specific storage (localStorage on web, AsyncStorage on mobile).
 * Now uses InMemoryDatabase as the single source of truth, with the recommendation that
 * production apps use PostgresDatabase for persistent server-side storage via API calls.
 * 
 * The setItem/getItem/removeItem convenience API is preserved for backward compatibility.
 */
export class CrossPlatformStorage implements DatabaseService {
  private innerService: DatabaseService;

  constructor(_namespace: string = "default") {
    this.innerService = new InMemoryDatabase();
  }

  /**
   * Simple key-value storage API for convenience
   * Provides a simpler interface for basic storage needs
   */
  public async getItem(key: string): Promise<string | null> {
    try {
      const item = await this.innerService.get("storage", key);
      // Handle both direct string storage and object storage
      if (typeof item === "string") {
        return item;
      } else if (
        item &&
        typeof item === "object" &&
        "value" in item &&
        typeof (item as any).value === "string"
      ) {
        return (item as any).value;
      }
      return null;
    } catch (error) {
      console.warn(`Failed to get storage item ${key}:`, error);
      return null;
    }
  }

  public async setItem(key: string, value: string): Promise<void> {
    // Store as simple string for compatibility
    await this.innerService.set("storage", key, value);
  }

  public async removeItem(key: string): Promise<void> {
    await this.innerService.delete("storage", key);
  }

  /**
   * Clear the default storage collection (convenience method)
   */
  public async clearDefaultStorage(): Promise<void> {
    await this.innerService.clear("storage");
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

  public async getWhere<T>(
    collection: string,
    predicate: (item: T) => boolean
  ): Promise<T[]> {
    return this.innerService.getWhere<T>(collection, predicate);
  }

  public async set<T>(collection: string, id: string, data: T): Promise<void> {
    await this.innerService.set<T>(collection, id, data);
  }

  public async update<T>(
    collection: string,
    id: string,
    updates: Partial<T>
  ): Promise<T> {
    return this.innerService.update<T>(collection, id, updates);
  }

  public async delete(collection: string, id: string): Promise<boolean> {
    return this.innerService.delete(collection, id);
  }

  public async exists(collection: string, id: string): Promise<boolean> {
    return this.innerService.exists(collection, id);
  }

  public async setBatch<T>(
    collection: string,
    items: Array<{ id: string; data: T }>
  ): Promise<void> {
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
    if ("getStorageInfo" in this.innerService) {
      return (this.innerService as any).getStorageInfo();
    }
    return null;
  }

  public async clearAllData(): Promise<void> {
    // Clear all collections
    const collections = [
      "storage",
      "missions",
      "mission_responses",
      "user_missions",
    ];
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
      isMobile: false,
      platform: "in-memory",
    };
  }
}

/**
 * Factory function to create a cross-platform storage service
 */
export function createCrossPlatformStorage(
  namespace: string = "default"
): DatabaseService {
  return new CrossPlatformStorage(namespace);
}

/**
 * Singleton instance for convenience
 */
export const crossPlatformStorage = new CrossPlatformStorage("default");
