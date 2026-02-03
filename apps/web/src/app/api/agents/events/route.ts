/**
 * Agent Event Subscription API
 * Central-decentral event system to prevent "million lobsters polling million APIs"
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAgentEventHub, VOISSS_EVENT_TYPES } from '@voisss/shared/services/agent-event-hub';
import { getAgentVerificationService } from '@voisss/shared/services/agent-verification';

// GET /api/agents/events - Get events for agent (polling)
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const agentId = searchParams.get('agentId');
        const since = searchParams.get('since');
        const limit = searchParams.get('limit');
        const eventTypes = searchParams.get('eventTypes');

        if (!agentId) {
            return NextResponse.json({
                success: false,
                error: 'agentId parameter required'
            }, { status: 400 });
        }

        // Basic agent verification
        const verificationService = getAgentVerificationService();
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            headers[key] = value;
        });

        const verification = verificationService.verifyAgentBehavior({
            userAgent: request.headers.get('user-agent') || undefined,
            headers
        });

        if (verification.confidence < 0.5) {
            return NextResponse.json({
                success: false,
                error: 'Agent verification failed',
                confidence: verification.confidence
            }, { status: 403 });
        }

        const eventHub = getAgentEventHub();
        const events = await eventHub.getEvents(agentId, {
            since: since ? parseInt(since) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            eventTypes: eventTypes ? eventTypes.split(',') : undefined
        });

        return NextResponse.json({
            success: true,
            data: {
                events,
                count: events.length,
                agentId,
                timestamp: Date.now()
            }
        });

    } catch (error) {
        console.error('Agent events GET error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to get events'
        }, { status: 500 });
    }
}

// POST /api/agents/events - Subscribe to events
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { agentId, eventTypes, filters, webhook, websocket } = body;

        if (!agentId || !eventTypes || !Array.isArray(eventTypes)) {
            return NextResponse.json({
                success: false,
                error: 'agentId and eventTypes array required'
            }, { status: 400 });
        }

        // Verify event types are valid
        const validEventTypes = Object.values(VOISSS_EVENT_TYPES);
        const invalidTypes = eventTypes.filter((type: string) => !validEventTypes.includes(type as any));

        if (invalidTypes.length > 0) {
            return NextResponse.json({
                success: false,
                error: `Invalid event types: ${invalidTypes.join(', ')}`,
                validTypes: validEventTypes
            }, { status: 400 });
        }

        // Agent verification
        const verificationService = getAgentVerificationService();
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            headers[key] = value;
        });

        const verification = verificationService.verifyAgentBehavior({
            userAgent: request.headers.get('user-agent') || undefined,
            headers,
            payload: body
        });

        if (verification.confidence < 0.6) {
            return NextResponse.json({
                success: false,
                error: 'Agent verification failed',
                confidence: verification.confidence
            }, { status: 403 });
        }

        const eventHub = getAgentEventHub();
        const subscriptionId = await eventHub.subscribe({
            agentId,
            eventTypes,
            filters,
            webhook,
            websocket
        });

        return NextResponse.json({
            success: true,
            data: {
                subscriptionId,
                agentId,
                eventTypes,
                message: 'Successfully subscribed to events'
            }
        });

    } catch (error) {
        console.error('Agent events POST error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to subscribe to events'
        }, { status: 500 });
    }
}

// DELETE /api/agents/events - Unsubscribe from events
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const subscriptionId = searchParams.get('subscriptionId');

        if (!subscriptionId) {
            return NextResponse.json({
                success: false,
                error: 'subscriptionId parameter required'
            }, { status: 400 });
        }

        const eventHub = getAgentEventHub();
        const success = await eventHub.unsubscribe(subscriptionId);

        if (!success) {
            return NextResponse.json({
                success: false,
                error: 'Subscription not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                subscriptionId,
                message: 'Successfully unsubscribed'
            }
        });

    } catch (error) {
        console.error('Agent events DELETE error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to unsubscribe'
        }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';