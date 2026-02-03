/**
 * Agent-Aware Rate Limiting Service
 * Sophisticated rate limiting for AI agents with different tiers and behaviors
 */

export interface AgentRateLimitConfig {
    // Basic limits
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;

    // Burst limits
    burstSize: number;
    burstWindowMs: number;

    // Cost-based limits (for voice generation)
    maxCostPerMinute: bigint; // USDC wei
    maxCostPerHour: bigint;
    maxCostPerDay: bigint;

    // Character limits (for voice generation)
    maxCharactersPerMinute: number;
    maxCharactersPerHour: number;
    maxCharactersPerDay: number;
}

export interface AgentTierLimits {
    unregistered: AgentRateLimitConfig;
    registered: AgentRateLimitConfig;
    verified: AgentRateLimitConfig;
    premium: AgentRateLimitConfig;
}

export interface RateLimitResult {
    allowed: boolean;
    reason?: string;
    retryAfter?: number; // seconds
    limits: {
        requests: { current: number; max: number; window: string };
        cost?: { current: string; max: string; window: string };
        characters?: { current: number; max: number; window: string };
    };
    headers: Record<string, string>;
}

export class AgentRateLimiter {
    private limits: AgentTierLimits;
    private usage = new Map<string, any>(); // In production, use Redis

    constructor() {
        this.limits = {
            // Unregistered agents (basic verification only)
            unregistered: {
                requestsPerMinute: 5,
                requestsPerHour: 50,
                requestsPerDay: 200,
                burstSize: 2,
                burstWindowMs: 10000, // 10 seconds
                maxCostPerMinute: BigInt(5000000), // $5 USDC
                maxCostPerHour: BigInt(50000000), // $50 USDC
                maxCostPerDay: BigInt(200000000), // $200 USDC
                maxCharactersPerMinute: 500,
                maxCharactersPerHour: 5000,
                maxCharactersPerDay: 20000,
            },

            // Registered agents (with wallet address)
            registered: {
                requestsPerMinute: 20,
                requestsPerHour: 500,
                requestsPerDay: 2000,
                burstSize: 10,
                burstWindowMs: 10000,
                maxCostPerMinute: BigInt(20000000), // $20 USDC
                maxCostPerHour: BigInt(200000000), // $200 USDC
                maxCostPerDay: BigInt(1000000000), // $1000 USDC
                maxCharactersPerMinute: 2000,
                maxCharactersPerHour: 20000,
                maxCharactersPerDay: 100000,
            },

            // Verified agents (with reputation history)
            verified: {
                requestsPerMinute: 100,
                requestsPerHour: 2000,
                requestsPerDay: 10000,
                burstSize: 50,
                burstWindowMs: 10000,
                maxCostPerMinute: BigInt(100000000), // $100 USDC
                maxCostPerHour: BigInt(1000000000), // $1000 USDC
                maxCostPerDay: BigInt(5000000000), // $5000 USDC
                maxCharactersPerMinute: 10000,
                maxCharactersPerHour: 100000,
                maxCharactersPerDay: 500000,
            },

            // Premium agents (high-volume, trusted)
            premium: {
                requestsPerMinute: 500,
                requestsPerHour: 10000,
                requestsPerDay: 50000,
                burstSize: 200,
                burstWindowMs: 10000,
                maxCostPerMinute: BigInt(500000000), // $500 USDC
                maxCostPerHour: BigInt(5000000000), // $5000 USDC
                maxCostPerDay: BigInt(25000000000), // $25000 USDC
                maxCharactersPerMinute: 50000,
                maxCharactersPerHour: 500000,
                maxCharactersPerDay: 2500000,
            },
        };
    }

    /**
     * Check if agent request is within rate limits
     */
    async checkLimits(
        agentId: string,
        tier: keyof AgentTierLimits,
        request: {
            cost?: bigint;
            characters?: number;
        } = {}
    ): Promise<RateLimitResult> {
        const config = this.limits[tier];
        const now = Date.now();

        // Get or create usage tracking
        const usage = this.getUsage(agentId);

        // Check burst limits first (most restrictive)
        const burstCheck = this.checkBurstLimit(usage, config, now);
        if (!burstCheck.allowed) {
            return burstCheck;
        }

        // Check request limits
        const requestCheck = this.checkRequestLimits(usage, config, now);
        if (!requestCheck.allowed) {
            return requestCheck;
        }

        // Check cost limits (if applicable)
        if (request.cost !== undefined) {
            const costCheck = this.checkCostLimits(usage, config, now, request.cost);
            if (!costCheck.allowed) {
                return costCheck;
            }
        }

        // Check character limits (if applicable)
        if (request.characters !== undefined) {
            const charCheck = this.checkCharacterLimits(usage, config, now, request.characters);
            if (!charCheck.allowed) {
                return charCheck;
            }
        }

        // All checks passed - record usage
        this.recordUsage(usage, now, request);

        return {
            allowed: true,
            limits: {
                requests: {
                    current: usage.requests.minute.count,
                    max: config.requestsPerMinute,
                    window: 'minute'
                },
                ...(request.cost && {
                    cost: {
                        current: usage.cost.minute.total.toString(),
                        max: config.maxCostPerMinute.toString(),
                        window: 'minute'
                    }
                }),
                ...(request.characters && {
                    characters: {
                        current: usage.characters.minute.count,
                        max: config.maxCharactersPerMinute,
                        window: 'minute'
                    }
                })
            },
            headers: this.generateHeaders(usage, config)
        };
    }

    private checkBurstLimit(usage: any, config: AgentRateLimitConfig, now: number): RateLimitResult {
        // Clean old burst entries
        usage.burst = usage.burst.filter((timestamp: number) => now - timestamp < config.burstWindowMs);

        if (usage.burst.length >= config.burstSize) {
            const oldestBurst = Math.min(...usage.burst);
            const retryAfter = Math.ceil((oldestBurst + config.burstWindowMs - now) / 1000);

            return {
                allowed: false,
                reason: 'Burst limit exceeded',
                retryAfter,
                limits: {
                    requests: {
                        current: usage.burst.length,
                        max: config.burstSize,
                        window: `${config.burstWindowMs / 1000}s`
                    }
                },
                headers: { 'X-RateLimit-Burst-Retry-After': retryAfter.toString() }
            };
        }

        return { allowed: true, limits: { requests: { current: 0, max: 0, window: '' } }, headers: {} };
    }

    private checkRequestLimits(usage: any, config: AgentRateLimitConfig, now: number): RateLimitResult {
        // Check minute limit (most restrictive)
        this.cleanupWindow(usage.requests.minute, now, 60000);

        if (usage.requests.minute.count >= config.requestsPerMinute) {
            return {
                allowed: false,
                reason: 'Request rate limit exceeded',
                retryAfter: Math.ceil((usage.requests.minute.windowStart + 60000 - now) / 1000),
                limits: {
                    requests: {
                        current: usage.requests.minute.count,
                        max: config.requestsPerMinute,
                        window: 'minute'
                    }
                },
                headers: this.generateHeaders(usage, config)
            };
        }

        return { allowed: true, limits: { requests: { current: 0, max: 0, window: '' } }, headers: {} };
    }

    private checkCostLimits(usage: any, config: AgentRateLimitConfig, now: number, cost: bigint): RateLimitResult {
        this.cleanupWindow(usage.cost.minute, now, 60000);

        if (usage.cost.minute.total + cost > config.maxCostPerMinute) {
            return {
                allowed: false,
                reason: 'Cost limit exceeded',
                retryAfter: Math.ceil((usage.cost.minute.windowStart + 60000 - now) / 1000),
                limits: {
                    requests: { current: 0, max: 0, window: '' },
                    cost: {
                        current: usage.cost.minute.total.toString(),
                        max: config.maxCostPerMinute.toString(),
                        window: 'minute'
                    }
                },
                headers: this.generateHeaders(usage, config)
            };
        }

        return { allowed: true, limits: { requests: { current: 0, max: 0, window: '' } }, headers: {} };
    }

    private checkCharacterLimits(usage: any, config: AgentRateLimitConfig, now: number, characters: number): RateLimitResult {
        this.cleanupWindow(usage.characters.minute, now, 60000);

        if (usage.characters.minute.count + characters > config.maxCharactersPerMinute) {
            return {
                allowed: false,
                reason: 'Character limit exceeded',
                retryAfter: Math.ceil((usage.characters.minute.windowStart + 60000 - now) / 1000),
                limits: {
                    requests: { current: 0, max: 0, window: '' },
                    characters: {
                        current: usage.characters.minute.count,
                        max: config.maxCharactersPerMinute,
                        window: 'minute'
                    }
                },
                headers: this.generateHeaders(usage, config)
            };
        }

        return { allowed: true, limits: { requests: { current: 0, max: 0, window: '' } }, headers: {} };
    }

    private getUsage(agentId: string) {
        if (!this.usage.has(agentId)) {
            this.usage.set(agentId, {
                burst: [],
                requests: {
                    minute: { count: 0, windowStart: Date.now() },
                    hour: { count: 0, windowStart: Date.now() },
                    day: { count: 0, windowStart: Date.now() },
                },
                cost: {
                    minute: { total: BigInt(0), windowStart: Date.now() },
                    hour: { total: BigInt(0), windowStart: Date.now() },
                    day: { total: BigInt(0), windowStart: Date.now() },
                },
                characters: {
                    minute: { count: 0, windowStart: Date.now() },
                    hour: { count: 0, windowStart: Date.now() },
                    day: { count: 0, windowStart: Date.now() },
                }
            });
        }
        return this.usage.get(agentId);
    }

    private recordUsage(usage: any, now: number, request: { cost?: bigint; characters?: number }) {
        // Record burst
        usage.burst.push(now);

        // Record requests
        usage.requests.minute.count++;
        usage.requests.hour.count++;
        usage.requests.day.count++;

        // Record cost
        if (request.cost) {
            usage.cost.minute.total += request.cost;
            usage.cost.hour.total += request.cost;
            usage.cost.day.total += request.cost;
        }

        // Record characters
        if (request.characters) {
            usage.characters.minute.count += request.characters;
            usage.characters.hour.count += request.characters;
            usage.characters.day.count += request.characters;
        }
    }

    private cleanupWindow(window: any, now: number, windowMs: number) {
        if (now - window.windowStart > windowMs) {
            window.count = 0;
            window.total = BigInt(0);
            window.windowStart = now;
        }
    }

    private generateHeaders(usage: any, config: AgentRateLimitConfig): Record<string, string> {
        return {
            'X-RateLimit-Requests-Limit': config.requestsPerMinute.toString(),
            'X-RateLimit-Requests-Remaining': Math.max(0, config.requestsPerMinute - usage.requests.minute.count).toString(),
            'X-RateLimit-Requests-Reset': new Date(usage.requests.minute.windowStart + 60000).toISOString(),
            'X-RateLimit-Cost-Limit': config.maxCostPerMinute.toString(),
            'X-RateLimit-Cost-Remaining': (config.maxCostPerMinute - usage.cost.minute.total).toString(),
            'X-RateLimit-Characters-Limit': config.maxCharactersPerMinute.toString(),
            'X-RateLimit-Characters-Remaining': Math.max(0, config.maxCharactersPerMinute - usage.characters.minute.count).toString(),
        };
    }
}

// Singleton instance
let agentRateLimiter: AgentRateLimiter | null = null;

export function getAgentRateLimiter(): AgentRateLimiter {
    if (!agentRateLimiter) {
        agentRateLimiter = new AgentRateLimiter();
    }
    return agentRateLimiter;
}