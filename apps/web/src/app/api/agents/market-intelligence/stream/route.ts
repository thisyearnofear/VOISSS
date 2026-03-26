/**
 * Voice Market Intelligence Agent - Stream Endpoint
 * 
 * POST /api/agents/market-intelligence/stream
 * 
 * Provides real-time progress updates via Server-Sent Events (SSE)
 * for market intelligence report generation.
 */

import { NextRequest } from "next/server";
import {
  MarketIntelligenceRequestSchema,
  createErrorResponse,
  API_ERROR_CODES,
} from "@voisss/shared";
import { createMarketAgentService } from "@voisss/shared/services/market-intelligence/market-agent-service";
import { getFirecrawlService } from "@voisss/shared/services/market-intelligence/firecrawl-service";
import { getIdentifier, rateLimiters, getRateLimitHeaders } from "@/lib/rate-limit";
import { getAgentVerificationService } from "@voisss/shared/services/agent-verification";
import { getAgentSecurityService } from "@voisss/shared/services/agent-security";
import { MARKET_INTELLIGENCE_EVENT_TYPES } from "@voisss/shared/types/market-intelligence";
import { getAgentEventHub, VOISSS_EVENT_TYPES } from "@voisss/shared/services/agent-event-hub";

export const runtime = "nodejs";

/**
 * POST /api/agents/market-intelligence/stream
 * 
 * Stream real-time progress of market intelligence research
 * Uses Server-Sent Events (SSE) for progress updates
 */
export async function POST(req: NextRequest): Promise<Response> {
  const requestStart = Date.now();
  const identifier = getIdentifier(req);

  // Check rate limit
  const rateLimitCheck = await rateLimiters.standard.check(identifier);
  if (!rateLimitCheck.success) {
    return Response.json(
      createErrorResponse(API_ERROR_CODES.RATE_LIMIT_EXCEEDED, "Rate limit exceeded"),
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitCheck),
      }
    );
  }

  // Check if Firecrawl is available
  const firecrawlService = getFirecrawlService();
  const isFirecrawlAvailable = firecrawlService.isAvailable();

  // SECURITY LAYER: Agent Verification
  const agentProof = req.headers.get('X-Agent-Proof');
  const agentAddress = req.headers.get('X-Agent-Address') || undefined;
  const verificationService = getAgentVerificationService();

  if (agentAddress && agentProof) {
    const timestamp = req.headers.get('X-Agent-Timestamp') || '';
    const proofResult = await verificationService.verifyAgentProof(agentAddress, agentProof, timestamp);
    if (!proofResult.valid) {
      return Response.json(
        createErrorResponse(API_ERROR_CODES.INVALID_TOKEN, "Agent proof verification failed"),
        { status: 403 }
      );
    }
  }

  // SECURITY LAYER: Security Check
  try {
    const body = await req.json();
    const securityService = getAgentSecurityService();
    const userAgent = req.headers.get('user-agent') || undefined;
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const securityCheck = await securityService.securityCheck({
      agentId: agentAddress || identifier,
      userAgent,
      headers,
      path: req.nextUrl.pathname,
      method: req.method,
      payload: body,
      ip,
      timing: { requestStart, processingTime: Date.now() - requestStart },
    });

    if (!securityCheck.allowed) {
      return Response.json(
        createErrorResponse(API_ERROR_CODES.INSUFFICIENT_PERMISSIONS, securityCheck.reason || "Security check failed"),
        { status: 403 }
      );
    }

    // Validate request
    const validatedRequest = MarketIntelligenceRequestSchema.parse(body);
    const { query, voiceId, depth, topic } = validatedRequest;

    console.log(`[MarketIntelligence/Stream] Processing: "${query}"`);

    // Create stream reader
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const eventHub = getAgentEventHub();
        const reportId = `stream_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

        // Send initial progress
        sendEvent(controller, encoder, {
          type: 'progress',
          data: {
            reportId,
            stage: 'init',
            progress: 0,
            message: 'Starting market research...',
            firecrawlAvailable: isFirecrawlAvailable,
          },
        });

        try {
          // Stage 1: Searching
          sendEvent(controller, encoder, {
            type: 'progress',
            data: {
              reportId,
              stage: 'searching',
              progress: 10,
              message: 'Searching market data...',
            },
          });

          // Perform research
          const research = await firecrawlService.research(query);

          sendEvent(controller, encoder, {
            type: 'search_results',
            data: {
              reportId,
              resultCount: research.sources.length,
              sources: research.sources,
            },
          });

          // Stage 2: Analyzing
          sendEvent(controller, encoder, {
            type: 'progress',
            data: {
              reportId,
              stage: 'analyzing',
              progress: 40,
              message: 'Analyzing findings...',
            },
          });

          // Stage 3: Synthesizing
          sendEvent(controller, encoder, {
            type: 'progress',
            data: {
              reportId,
              stage: 'synthesizing',
              progress: 60,
              message: 'Generating report content...',
            },
          });

          const summary = generateSummary(query, research);

          // Stage 4: Voice Generation (if voiceId provided)
          if (voiceId) {
            sendEvent(controller, encoder, {
              type: 'progress',
              data: {
                reportId,
                stage: 'generating_voice',
                progress: 75,
                message: 'Creating audio report...',
              },
            });

            // Note: Actual voice generation happens asynchronously
            // Client can poll GET /api/agents/market-intelligence?id={reportId} for final result
          }

          // Stage 5: Completed
          sendEvent(controller, encoder, {
            type: 'complete',
            data: {
              reportId,
              query,
              summary,
              keyFindings: research.keyFindings,
              sources: research.sources,
              processingTimeMs: Date.now() - requestStart,
            },
          });

          // Also publish via event hub
          await eventHub.publish({
            type: MARKET_INTELLIGENCE_EVENT_TYPES.MARKET_REPORT_GENERATED,
            source: 'market-intelligence-stream',
            data: {
              reportId,
              query,
              agentAddress,
              processingTimeMs: Date.now() - requestStart,
            },
          });

        } catch (error: any) {
          console.error('[MarketIntelligence/Stream] Error:', error);
          
          sendEvent(controller, encoder, {
            type: 'error',
            data: {
              reportId,
              error: error instanceof Error ? error.message : 'Unknown error',
              message: 'Failed to generate market intelligence report',
            },
          });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('[MarketIntelligence/Stream] Error:', error);

    if (error?.issues) {
      const zodError = error as { issues: Array<{ message: string }> };
      return Response.json(
        createErrorResponse(
          API_ERROR_CODES.VALIDATION_FAILED,
          `Invalid request: ${zodError.issues.map((e: any) => e.message).join(", ")}`
        ),
        { status: 400 }
      );
    }

    return Response.json(
      createErrorResponse(
        API_ERROR_CODES.INTERNAL_ERROR,
        error instanceof Error ? error.message : "Failed to start market intelligence stream"
      ),
      { status: 500 }
    );
  }
}

/**
 * Generate summary from research data
 */
function generateSummary(
  query: string,
  research: { summary: string; keyFindings: string[]; sources: any[] }
): string {
  const lines = [
    `Market Intelligence Report: ${query}`,
    '',
    'EXECUTIVE SUMMARY',
    '─'.repeat(40),
    research.summary,
    '',
    'KEY FINDINGS',
    '─'.repeat(40),
    ...research.keyFindings.map((finding, i) => `${i + 1}. ${finding}`),
    '',
    `Report generated ${new Date().toLocaleDateString()}`,
  ];

  return lines.join('\n');
}

/**
 * Send SSE event to client
 */
function sendEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: { type: string; data: any }
): void {
  const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
  controller.enqueue(encoder.encode(message));
}

export const dynamic = 'force-dynamic';
