/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiting for API endpoints.
 * For production, replace with Redis or similar.
 * 
 * Core Principles:
 * - Prevent abuse and DDoS
 * - Protect ElevenLabs quota
 * - Fair usage across users
 */

interface RateLimitConfig {
  interval: number;        // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique users per interval
  maxRequests: number;     // Max requests per user per interval
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Cleanup old entries periodically
    setInterval(() => this.cleanup(), config.interval);
  }

  async check(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // If no entry or entry expired, create new
    if (!entry || now > entry.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.interval,
      });
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        reset: now + this.config.interval,
      };
    }

    // Check if over limit
    if (entry.count >= this.config.maxRequests) {
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        reset: entry.resetTime,
      };
    }

    // Increment count
    entry.count++;
    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - entry.count,
      reset: entry.resetTime,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Default rate limiters for different endpoints
export const rateLimiters = {
  // Strict limit for voice generation (ElevenLabs quota protection)
  voiceGeneration: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
    maxRequests: 10, // 10 requests per minute per user
  }),

  // Medium limit for quotes and info
  standard: new RateLimiter({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 1000,
    maxRequests: 60, // 60 requests per minute per user
  }),

  // Lenient limit for read-only operations
  readOnly: new RateLimiter({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 2000,
    maxRequests: 120, // 120 requests per minute per user
  }),
};

// Helper function to get IP or user identifier
export function getIdentifier(req: Request): string {
  // Try to get from headers (set by reverse proxy)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Fallback to other headers
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Last resort: return a default (should not happen in production)
  return 'unknown';
}

// Response headers for rate limit info
export function getRateLimitHeaders(result: { limit: number; remaining: number; reset: number }): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
}
