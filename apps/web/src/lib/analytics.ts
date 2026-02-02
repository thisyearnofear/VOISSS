/**
 * Analytics Tracking
 * 
 * Simple analytics for payment and service usage.
 * For production, replace with proper analytics service (Segment, Mixpanel, etc.)
 * 
 * Tracks:
 * - Payment events (success, failure, method)
 * - Service usage (voice generation, etc.)
 * - Revenue by payment method
 */

import { PaymentMethod, ServiceType } from '@voisss/shared';

// In-memory store for development (replace with database in production)
interface AnalyticsEvent {
  id: string;
  type: 'payment' | 'service' | 'error';
  timestamp: Date;
  userAddress?: string;
  data: Record<string, any>;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private readonly maxEvents = 10000; // Prevent memory issues

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private track(event: Omit<AnalyticsEvent, 'id'>) {
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      id: this.generateId(),
    };

    this.events.push(analyticsEvent);

    // Prevent memory issues
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents / 2);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event.type, event.data);
    }
  }

  // ============ Payment Events ============

  trackPaymentSuccess(
    userAddress: string,
    method: PaymentMethod,
    service: ServiceType,
    cost: bigint,
    metadata?: Record<string, any>
  ) {
    this.track({
      type: 'payment',
      timestamp: new Date(),
      userAddress,
      data: {
        event: 'payment_success',
        method,
        service,
        cost: cost.toString(),
        ...metadata,
      },
    });
  }

  trackPaymentFailure(
    userAddress: string,
    method: PaymentMethod,
    service: ServiceType,
    error: string,
    metadata?: Record<string, any>
  ) {
    this.track({
      type: 'payment',
      timestamp: new Date(),
      userAddress,
      data: {
        event: 'payment_failure',
        method,
        service,
        error,
        ...metadata,
      },
    });
  }

  // ============ Service Events ============

  trackServiceUsage(
    userAddress: string,
    service: ServiceType,
    quantity: number,
    metadata?: Record<string, any>
  ) {
    this.track({
      type: 'service',
      timestamp: new Date(),
      userAddress,
      data: {
        event: 'service_usage',
        service,
        quantity,
        ...metadata,
      },
    });
  }

  trackVoiceGeneration(
    userAddress: string,
    characterCount: number,
    voiceId: string,
    paymentMethod: PaymentMethod,
    cost: bigint,
    duration?: number
  ) {
    this.track({
      type: 'service',
      timestamp: new Date(),
      userAddress,
      data: {
        event: 'voice_generation',
        service: 'voice_generation',
        characterCount,
        voiceId,
        paymentMethod,
        cost: cost.toString(),
        duration,
      },
    });
  }

  // ============ Error Events ============

  trackError(
    userAddress: string | undefined,
    service: ServiceType,
    error: string,
    metadata?: Record<string, any>
  ) {
    this.track({
      type: 'error',
      timestamp: new Date(),
      userAddress,
      data: {
        event: 'error',
        service,
        error,
        ...metadata,
      },
    });
  }

  // ============ Analytics Queries ============

  getRevenueByMethod(startTime: Date, endTime: Date): Record<PaymentMethod, bigint> {
    const revenue: Record<string, bigint> = {
      credits: 0n,
      tier: 0n,
      x402: 0n,
      none: 0n,
    };

    for (const event of this.events) {
      if (
        event.type === 'payment' &&
        event.data.event === 'payment_success' &&
        event.timestamp >= startTime &&
        event.timestamp <= endTime
      ) {
        const method = event.data.method as PaymentMethod;
        const cost = BigInt(event.data.cost || 0);
        revenue[method] = (revenue[method] || 0n) + cost;
      }
    }

    return revenue as Record<PaymentMethod, bigint>;
  }

  getServiceUsage(service: ServiceType, startTime: Date, endTime: Date): number {
    let count = 0;

    for (const event of this.events) {
      if (
        event.type === 'service' &&
        event.data.service === service &&
        event.timestamp >= startTime &&
        event.timestamp <= endTime
      ) {
        count++;
      }
    }

    return count;
  }

  getTopUsers(limit: number = 10): Array<{ address: string; usage: number }> {
    const userUsage = new Map<string, number>();

    for (const event of this.events) {
      if (event.type === 'service' && event.userAddress) {
        const current = userUsage.get(event.userAddress) || 0;
        userUsage.set(event.userAddress, current + 1);
      }
    }

    return Array.from(userUsage.entries())
      .map(([address, usage]) => ({ address, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, limit);
  }

  getRecentEvents(limit: number = 100): AnalyticsEvent[] {
    return this.events.slice(-limit).reverse();
  }

  // ============ Dashboard Data ============

  getDashboardStats() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      revenue24h: this.getRevenueByMethod(oneDayAgo, now),
      revenue7d: this.getRevenueByMethod(oneWeekAgo, now),
      voiceGenerations24h: this.getServiceUsage('voice_generation', oneDayAgo, now),
      voiceGenerations7d: this.getServiceUsage('voice_generation', oneWeekAgo, now),
      topUsers: this.getTopUsers(10),
      totalEvents: this.events.length,
    };
  }
}

// Singleton instance
export const analytics = new Analytics();

// Helper for API routes
export function trackVoiceGeneration(
  userAddress: string,
  characterCount: number,
  voiceId: string,
  paymentMethod: PaymentMethod,
  cost: bigint,
  duration?: number
) {
  analytics.trackVoiceGeneration(
    userAddress,
    characterCount,
    voiceId,
    paymentMethod,
    cost,
    duration
  );
}
