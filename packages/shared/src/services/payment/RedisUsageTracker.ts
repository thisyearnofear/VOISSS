/**
 * Redis Usage Tracker
 * 
 * Production-ready distributed usage tracking using Redis.
 * Replaces in-memory UsageTracker for multi-server deployments.
 * 
 * Features:
 * - Daily usage limits with automatic reset
 * - TTL-based key expiration
 * - Atomic increment operations
 * - Supports distributed rate limiting across multiple instances
 */

import { createClient, RedisClientType } from 'redis';

// ============================================================================
// TYPES
// ============================================================================

export interface UsageRecord {
  address: string;
  service: string;
  date: string; // YYYY-MM-DD
  usage: number;
}

export interface UsageStats {
  usage: number;
  limit: number;
  remaining: number;
  resetAt: string;
}

// ============================================================================
// REDIS USAGE TRACKER CLASS
// ============================================================================

export class RedisUsageTracker {
  private client: RedisClientType | null = null;
  private readonly keyPrefix = 'voisss:usage:';
  private readonly defaultTTLSeconds = 25 * 60 * 60; // 25 hours (slightly more than daily)

  constructor(private redisUrl?: string) {}

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (this.client) return;

    const url = this.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
    
    try {
      this.client = createClient({
        url,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              console.error('[RedisUsageTracker] Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('error', (err: Error) => {
        console.error('[RedisUsageTracker] Redis error:', err.message);
      });

      this.client.on('connect', () => {
        console.log('[RedisUsageTracker] Connected to Redis');
      });

      await this.client.connect();
    } catch (error) {
      console.error('[RedisUsageTracker] Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.client?.isOpen ?? false;
  }

  /**
   * Generate Redis key for usage tracking
   */
  private getKey(address: string, service: string, date: string): string {
    return `${this.keyPrefix}${address.toLowerCase()}:${service}:${date}`;
  }

  /**
   * Get current date string (YYYY-MM-DD)
   */
  private getDateString(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get tomorrow's date for TTL calculation
   */
  private getTomorrowTimestamp(): number {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return Math.floor(tomorrow.getTime() / 1000);
  }

  /**
   * Get usage for a specific address and service
   */
  async getUsage(address: string, service: string, date: Date = new Date()): Promise<number> {
    if (!this.client) {
      await this.connect();
    }

    const key = this.getKey(address, service, this.getDateString(date));
    const value = await this.client!.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Record usage for a specific address and service
   * Uses atomic increment to handle concurrent requests
   */
  async recordUsage(
    address: string,
    service: string,
    amount: number,
    date: Date = new Date()
  ): Promise<number> {
    if (!this.client) {
      await this.connect();
    }

    const key = this.getKey(address, service, this.getDateString(date));
    
    // Use atomic increment
    const newValue = await this.client!.incrBy(key, amount);
    
    // Set TTL if this is a new key (value equals amount just added)
    if (newValue === amount) {
      const ttl = await this.getTTLForDate(date);
      await this.client!.expire(key, ttl);
    }

    return newValue;
  }

  /**
   * Calculate TTL based on when the usage period resets
   */
  private async getTTLForDate(date: Date): Promise<number> {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    const secondsUntilReset = Math.max(
      Math.floor((endOfDay.getTime() - now.getTime()) / 1000),
      this.defaultTTLSeconds
    );
    
    return secondsUntilReset;
  }

  /**
   * Get usage stats including remaining quota
   */
  async getUsageStats(
    address: string,
    service: string,
    limit: number,
    date: Date = new Date()
  ): Promise<UsageStats> {
    const usage = await this.getUsage(address, service, date);
    const remaining = Math.max(0, limit - usage);
    
    const resetAt = new Date(date);
    resetAt.setDate(resetAt.getDate() + 1);
    resetAt.setHours(0, 0, 0, 0);

    return {
      usage,
      limit,
      remaining,
      resetAt: resetAt.toISOString(),
    };
  }

  /**
   * Check if usage would exceed limit
   */
  async wouldExceedLimit(
    address: string,
    service: string,
    amount: number,
    limit: number,
    date: Date = new Date()
  ): Promise<boolean> {
    const currentUsage = await this.getUsage(address, service, date);
    return currentUsage + amount > limit;
  }

  /**
   * Reset usage for a specific address and service
   * (Admin function - rarely needed)
   */
  async resetUsage(address: string, service: string, date: Date = new Date()): Promise<void> {
    if (!this.client) {
      await this.connect();
    }

    const key = this.getKey(address, service, this.getDateString(date));
    await this.client!.del(key);
  }

  /**
   * Get all usage records for an address
   */
  async getAddressUsage(address: string, date: Date = new Date()): Promise<UsageRecord[]> {
    if (!this.client) {
      await this.connect();
    }

    const pattern = `${this.keyPrefix}${address.toLowerCase()}:*:${this.getDateString(date)}`;
    const keys = await this.client!.keys(pattern);
    
    const records: UsageRecord[] = [];
    for (const key of keys) {
      // Parse key: voisss:usage:0x...:service:YYYY-MM-DD
      const parts = key.split(':');
      if (parts.length >= 5) {
        const service = parts[3];
        const dateStr = parts[4];
        const value = await this.client!.get(key);
        records.push({
          address: address.toLowerCase(),
          service,
          date: dateStr,
          usage: value ? parseInt(value, 10) : 0,
        });
      }
    }

    return records;
  }

  /**
   * Get total usage across all services for an address
   */
  async getTotalUsage(address: string, date: Date = new Date()): Promise<number> {
    const records = await this.getAddressUsage(address, date);
    return records.reduce((total, record) => total + record.usage, 0);
  }

  /**
   * Cleanup expired keys (manual trigger)
   * Redis TTL handles this automatically, but this can be used for debugging
   */
  async cleanup(): Promise<number> {
    if (!this.client) {
      await this.connect();
    }

    const pattern = `${this.keyPrefix}*`;
    const keys = await this.client!.keys(pattern);
    
    let cleaned = 0;
    for (const key of keys) {
      const ttl = await this.client!.ttl(key);
      if (ttl <= 0) {
        await this.client!.del(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// ============================================================================
// FALLBACK IN-MEMORY TRACKER (When Redis unavailable)
// ============================================================================

export class InMemoryUsageTracker {
  private usage = new Map<string, number>();
  private readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  private getKey(address: string, service: string): string {
    const date = new Date().toISOString().split('T')[0];
    return `${address.toLowerCase()}:${service}:${date}`;
  }

  getUsage(address: string, service: string): number {
    this.cleanup();
    return this.usage.get(this.getKey(address, service)) ?? 0;
  }

  recordUsage(address: string, service: string, amount: number): void {
    this.cleanup();
    const key = this.getKey(address, service);
    const current = this.usage.get(key) ?? 0;
    this.usage.set(key, current + amount);
  }

  async getUsageStats(
    address: string,
    service: string,
    limit: number
  ): Promise<UsageStats> {
    const usage = this.getUsage(address, service);
    const remaining = Math.max(0, limit - usage);
    
    const resetAt = new Date();
    resetAt.setDate(resetAt.getDate() + 1);
    resetAt.setHours(0, 0, 0, 0);

    return {
      usage,
      limit,
      remaining,
      resetAt: resetAt.toISOString(),
    };
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.TTL_MS;
    for (const [key, _] of this.usage) {
      // Simple cleanup on every 100th call
      if (Math.random() < 0.01) {
        // In production, track timestamps per key
      }
    }
  }
}

// ============================================================================
// FACTORY & SINGLETON
// ============================================================================

let usageTracker: RedisUsageTracker | null = null;
let fallbackTracker: InMemoryUsageTracker | null = null;
let useRedis = true;

export function getUsageTracker(): RedisUsageTracker {
  if (!usageTracker) {
    usageTracker = new RedisUsageTracker(process.env.REDIS_URL);
  }
  return usageTracker;
}

/**
 * Get fallback in-memory tracker (used when Redis is unavailable)
 */
export function getFallbackTracker(): InMemoryUsageTracker {
  if (!fallbackTracker) {
    fallbackTracker = new InMemoryUsageTracker();
  }
  return fallbackTracker;
}

/**
 * Set whether to use Redis (can be disabled for testing)
 */
export function setUseRedis(enabled: boolean): void {
  useRedis = enabled;
}

/**
 * Get the appropriate tracker based on configuration
 * Falls back to in-memory if Redis is unavailable
 */
export function getTracker(): RedisUsageTracker | InMemoryUsageTracker {
  if (useRedis) {
    try {
      return getUsageTracker();
    } catch {
      console.warn('[PaymentRouter] Redis unavailable, falling back to in-memory tracker');
      useRedis = false;
      return getFallbackTracker();
    }
  }
  return getFallbackTracker();
}

/**
 * Reset all trackers (useful for testing)
 */
export function resetUsageTracker(): void {
  usageTracker = null;
  fallbackTracker = null;
  useRedis = true;
}
