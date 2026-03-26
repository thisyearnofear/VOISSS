/**
 * Agent Event Hub - Central-Decentral Event Subscription System
 * Solves the "million lobsters polling million APIs" problem
 * Supports Redis-backed distributed event delivery with in-memory fallback
 */

import { createClient, RedisClientType } from 'redis';

export interface AgentEvent {
    id: string;
    type: string;
    source: string;
    timestamp: number;
    data: any;
    metadata?: {
        priority?: 'low' | 'normal' | 'high' | 'urgent';
        ttl?: number; // Time to live in milliseconds
        retryable?: boolean;
        tags?: string[];
    };
}

export interface EventSubscription {
    id: string;
    agentId: string;
    eventTypes: string[];
    filters?: Record<string, any>;
    webhook?: {
        url: string;
        headers?: Record<string, string>;
        retryPolicy?: {
            maxRetries: number;
            backoffMs: number;
        };
    };
    websocket?: {
        connectionId: string;
    };
    createdAt: number;
    lastDelivery?: number;
    deliveryCount: number;
    failureCount: number;
    isActive: boolean;
}

export interface EventFilter {
    agentId?: string;
    source?: string;
    priority?: string;
    tags?: string[];
    customFilters?: Record<string, any>;
}

const EH_KEY_PREFIX = 'voisss:events:';

export class AgentEventHub {
    private subscriptions = new Map<string, EventSubscription>();
    private eventQueue = new Map<string, AgentEvent[]>(); // Per-agent queues (in-memory fallback)
    private websockets = new Map<string, WebSocket>();
    private eventHistory = new Map<string, AgentEvent[]>(); // Recent events per type
    private readonly MAX_QUEUE_SIZE = 1000;
    private readonly MAX_HISTORY_SIZE = 100;
    private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    private redis: RedisClientType | null = null;
    private redisConnected = false;

    constructor(private redisUrl?: string) {
        // Periodic cleanup
        setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);

        if (redisUrl || process.env.REDIS_URL) {
            this.initRedis(redisUrl || process.env.REDIS_URL!);
        }
    }

    private async initRedis(url: string): Promise<void> {
        try {
            this.redis = createClient({
                url,
                socket: {
                    reconnectStrategy: (retries: number) => {
                        if (retries > 10) return new Error('Max reconnection attempts reached');
                        return Math.min(retries * 100, 3000);
                    },
                },
            });
            this.redis.on('error', () => { this.redisConnected = false; });
            await this.redis.connect();
            this.redisConnected = true;
        } catch {
            this.redisConnected = false;
            this.redis = null;
        }
    }

    /**
     * Subscribe agent to events
     */
    async subscribe(subscription: Omit<EventSubscription, 'id' | 'createdAt' | 'deliveryCount' | 'failureCount' | 'isActive'>): Promise<string> {
        const subscriptionId = this.generateId();

        const fullSubscription: EventSubscription = {
            ...subscription,
            id: subscriptionId,
            createdAt: Date.now(),
            deliveryCount: 0,
            failureCount: 0,
            isActive: true
        };

        this.subscriptions.set(subscriptionId, fullSubscription);

        // Initialize event queue for agent if not exists
        if (!this.eventQueue.has(subscription.agentId)) {
            this.eventQueue.set(subscription.agentId, []);
        }

        console.log(`🔔 Agent ${subscription.agentId} subscribed to events: ${subscription.eventTypes.join(', ')}`);

        return subscriptionId;
    }

    /**
     * Unsubscribe from events
     */
    async unsubscribe(subscriptionId: string): Promise<boolean> {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            return false;
        }

        subscription.isActive = false;
        this.subscriptions.delete(subscriptionId);

        // Close websocket if exists
        if (subscription.websocket?.connectionId) {
            const ws = this.websockets.get(subscription.websocket.connectionId);
            if (ws) {
                ws.close();
                this.websockets.delete(subscription.websocket.connectionId);
            }
        }

        console.log(`🔕 Unsubscribed: ${subscriptionId}`);
        return true;
    }

    /**
     * Publish event to all matching subscribers
     */
    async publish(event: Omit<AgentEvent, 'id' | 'timestamp'>): Promise<void> {
        const fullEvent: AgentEvent = {
            ...event,
            id: this.generateId(),
            timestamp: Date.now()
        };

        // Add to event history
        this.addToHistory(fullEvent);

        // Find matching subscriptions
        const matchingSubscriptions = Array.from(this.subscriptions.values())
            .filter(sub => sub.isActive && this.eventMatches(fullEvent, sub));

        console.log(`📢 Publishing event ${fullEvent.type} to ${matchingSubscriptions.length} subscribers`);

        // Deliver to each matching subscription
        const deliveryPromises = matchingSubscriptions.map(sub =>
            this.deliverEvent(fullEvent, sub)
        );

        await Promise.allSettled(deliveryPromises);
    }

    /**
     * Get events for agent (polling fallback)
     * Reads from Redis when available, falls back to in-memory
     */
    async getEvents(agentId: string, options: {
        since?: number;
        limit?: number;
        eventTypes?: string[];
    } = {}): Promise<AgentEvent[]> {
        let events: AgentEvent[];

        if (this.redisConnected && this.redis) {
            try {
                const key = `${EH_KEY_PREFIX}queue:${agentId}`;
                const raw = await this.redis.lRange(key, 0, -1);
                events = raw.map(r => JSON.parse(r) as AgentEvent);
            } catch {
                events = [...(this.eventQueue.get(agentId) || [])];
            }
        } else {
            events = [...(this.eventQueue.get(agentId) || [])];
        }

        // Filter by timestamp
        if (options.since) {
            events = events.filter(event => event.timestamp > options.since!);
        }

        // Filter by event types
        if (options.eventTypes) {
            events = events.filter(event => options.eventTypes!.includes(event.type));
        }

        // Apply limit
        if (options.limit) {
            events = events.slice(-options.limit);
        }

        // Mark as delivered
        events.forEach(event => {
            const subscription = Array.from(this.subscriptions.values())
                .find(sub => sub.agentId === agentId);
            if (subscription) {
                subscription.deliveryCount++;
                subscription.lastDelivery = Date.now();
            }
        });

        return events.sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * Get event history for debugging/replay
     */
    async getEventHistory(eventType: string, limit: number = 50): Promise<AgentEvent[]> {
        const history = this.eventHistory.get(eventType) || [];
        return history.slice(-limit);
    }

    /**
     * Get subscription status
     */
    async getSubscriptionStatus(subscriptionId: string): Promise<EventSubscription | null> {
        return this.subscriptions.get(subscriptionId) || null;
    }

    /**
     * List all subscriptions for an agent
     */
    async getAgentSubscriptions(agentId: string): Promise<EventSubscription[]> {
        return Array.from(this.subscriptions.values())
            .filter(sub => sub.agentId === agentId && sub.isActive);
    }

    /**
     * WebSocket connection management
     */
    async connectWebSocket(agentId: string, ws: WebSocket): Promise<string> {
        const connectionId = this.generateId();
        this.websockets.set(connectionId, ws);

        // Send queued events
        const queue = this.eventQueue.get(agentId) || [];
        queue.forEach(event => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(event));
            }
        });

        // Clear queue after sending
        this.eventQueue.set(agentId, []);

        console.log(`🔌 WebSocket connected for agent ${agentId}: ${connectionId}`);
        return connectionId;
    }

    /**
     * Batch event publishing for efficiency
     */
    async publishBatch(events: Omit<AgentEvent, 'id' | 'timestamp'>[]): Promise<void> {
        const publishPromises = events.map(event => this.publish(event));
        await Promise.allSettled(publishPromises);
    }

    /**
     * Event delivery with retry logic
     */
    private async deliverEvent(event: AgentEvent, subscription: EventSubscription): Promise<void> {
        try {
            if (subscription.webhook) {
                await this.deliverViaWebhook(event, subscription);
            } else if (subscription.websocket) {
                await this.deliverViaWebSocket(event, subscription);
            } else {
                // Queue for polling
                await this.queueEvent(event, subscription.agentId);
            }

            subscription.deliveryCount++;
            subscription.lastDelivery = Date.now();

        } catch (error) {
            subscription.failureCount++;
            console.error(`Failed to deliver event ${event.id} to ${subscription.agentId}:`, error);

            // Queue as fallback
            await this.queueEvent(event, subscription.agentId);
        }
    }

    /**
     * Deliver event via webhook
     */
    private async deliverViaWebhook(event: AgentEvent, subscription: EventSubscription): Promise<void> {
        if (!subscription.webhook) return;

        const { url, headers = {}, retryPolicy } = subscription.webhook;
        const maxRetries = retryPolicy?.maxRetries || 3;
        const backoffMs = retryPolicy?.backoffMs || 1000;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Event-ID': event.id,
                        'X-Event-Type': event.type,
                        'X-Event-Source': event.source,
                        ...headers
                    },
                    body: JSON.stringify(event)
                });

                if (response.ok) {
                    return; // Success
                }

                throw new Error(`HTTP ${response.status}: ${response.statusText}`);

            } catch (error) {
                if (attempt === maxRetries - 1) {
                    throw error; // Final attempt failed
                }

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(2, attempt)));
            }
        }
    }

    /**
     * Deliver event via WebSocket
     */
    private async deliverViaWebSocket(event: AgentEvent, subscription: EventSubscription): Promise<void> {
        if (!subscription.websocket) return;

        const ws = this.websockets.get(subscription.websocket.connectionId);
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket not available');
        }

        ws.send(JSON.stringify(event));
    }

    /**
     * Queue event for polling - uses Redis list when available
     */
    private async queueEvent(event: AgentEvent, agentId: string): Promise<void> {
        if (this.redisConnected && this.redis) {
            try {
                const key = `${EH_KEY_PREFIX}queue:${agentId}`;
                await this.redis.lPush(key, JSON.stringify(event));
                await this.redis.lTrim(key, 0, this.MAX_QUEUE_SIZE - 1);
                await this.redis.expire(key, 86400); // 24h TTL
                return;
            } catch { /* fall through to in-memory */ }
        }

        if (!this.eventQueue.has(agentId)) {
            this.eventQueue.set(agentId, []);
        }

        const queue = this.eventQueue.get(agentId)!;
        queue.push(event);

        // Maintain queue size
        if (queue.length > this.MAX_QUEUE_SIZE) {
            queue.shift(); // Remove oldest
        }
    }

    /**
     * Check if event matches subscription
     */
    private eventMatches(event: AgentEvent, subscription: EventSubscription): boolean {
        // Check event type
        if (!subscription.eventTypes.includes(event.type)) {
            return false;
        }

        // Check filters
        if (subscription.filters) {
            for (const [key, value] of Object.entries(subscription.filters)) {
                if (event.data[key] !== value) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Add event to history
     */
    private addToHistory(event: AgentEvent): void {
        if (!this.eventHistory.has(event.type)) {
            this.eventHistory.set(event.type, []);
        }

        const history = this.eventHistory.get(event.type)!;
        history.push(event);

        // Maintain history size
        if (history.length > this.MAX_HISTORY_SIZE) {
            history.shift();
        }
    }

    /**
     * Cleanup expired data
     */
    private cleanup(): void {
        const now = Date.now();
        const TTL = 24 * 60 * 60 * 1000; // 24 hours

        // Clean expired events from queues
        for (const [agentId, queue] of this.eventQueue) {
            const validEvents = queue.filter(event => {
                const eventTTL = event.metadata?.ttl || TTL;
                return now - event.timestamp < eventTTL;
            });
            this.eventQueue.set(agentId, validEvents);
        }

        // Clean expired subscriptions
        for (const [id, subscription] of this.subscriptions) {
            if (!subscription.isActive || (subscription.lastDelivery && now - subscription.lastDelivery > TTL)) {
                this.subscriptions.delete(id);
            }
        }

        // Clean event history
        for (const [eventType, history] of this.eventHistory) {
            const validHistory = history.filter(event => now - event.timestamp < TTL);
            this.eventHistory.set(eventType, validHistory);
        }

        console.log('🧹 Event hub cleanup completed');
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Get hub statistics
     */
    getStats(): {
        activeSubscriptions: number;
        totalEvents: number;
        queuedEvents: number;
        websocketConnections: number;
        eventTypes: string[];
    } {
        const totalEvents = Array.from(this.eventQueue.values())
            .reduce((sum, queue) => sum + queue.length, 0);

        const eventTypes = Array.from(new Set(
            Array.from(this.eventHistory.keys())
        ));

        return {
            activeSubscriptions: this.subscriptions.size,
            totalEvents,
            queuedEvents: totalEvents,
            websocketConnections: this.websockets.size,
            eventTypes
        };
    }
}

// Predefined event types for VOISSS
export const VOISSS_EVENT_TYPES = {
    // Voice generation events
    VOICE_GENERATION_STARTED: 'voice.generation.started',
    VOICE_GENERATION_COMPLETED: 'voice.generation.completed',
    VOICE_GENERATION_FAILED: 'voice.generation.failed',

    // Mission events
    MISSION_CREATED: 'mission.created',
    MISSION_ACCEPTED: 'mission.accepted',
    MISSION_SUBMITTED: 'mission.submitted',
    MISSION_COMPLETED: 'mission.completed',
    MISSION_EXPIRED: 'mission.expired',

    // Payment events
    PAYMENT_RECEIVED: 'payment.received',
    PAYMENT_FAILED: 'payment.failed',
    CREDITS_DEPOSITED: 'credits.deposited',
    CREDITS_WITHDRAWN: 'credits.withdrawn',

    // System events
    RATE_LIMIT_EXCEEDED: 'system.rate_limit_exceeded',
    SECURITY_THREAT_DETECTED: 'system.security_threat',
    SERVICE_DEGRADED: 'system.service_degraded',
    SERVICE_RESTORED: 'system.service_restored',

    // Agent events
    AGENT_REGISTERED: 'agent.registered',
    AGENT_VERIFIED: 'agent.verified',
    AGENT_BLOCKED: 'agent.blocked',
    AGENT_REPUTATION_CHANGED: 'agent.reputation_changed',

    // Market Intelligence events
    MARKET_RESEARCH_STARTED: 'market_intelligence.research_started',
    MARKET_SEARCH_COMPLETED: 'market_intelligence.search_completed',
    MARKET_ANALYSIS_COMPLETED: 'market_intelligence.analysis_completed',
    MARKET_REPORT_GENERATED: 'market_intelligence.report_generated',
    MARKET_REPORT_PUBLISHED: 'market_intelligence.report_published',
    MARKET_RESEARCH_FAILED: 'market_intelligence.research_failed',
} as const;

// Singleton instance
let agentEventHub: AgentEventHub | null = null;

export function getAgentEventHub(): AgentEventHub {
    if (!agentEventHub) {
        agentEventHub = new AgentEventHub(process.env.REDIS_URL);
    }
    return agentEventHub;
}