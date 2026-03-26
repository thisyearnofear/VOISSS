/**
 * Voice Market Intelligence Agent API
 * 
 * POST /api/agents/market-intelligence
 * - Research voice AI market trends using Firecrawl
 * - Generate audio reports using ElevenLabs via /api/agents/vocalize
 * - Optionally post to missions system
 * 
 * GET /api/agents/market-intelligence
 * - List recent reports
 * - Search reports
 */

import { NextRequest, NextResponse } from "next/server";
import {
  MarketIntelligenceRequestSchema,
  createSuccessResponse,
  createErrorResponse,
  API_ERROR_CODES,
} from "@voisss/shared";
import { createMarketAgentService } from "@voisss/shared/services/market-intelligence/market-agent-service";
import { getFirecrawlService } from "@voisss/shared/services/market-intelligence/firecrawl-service";
import { getIdentifier, rateLimiters, getRateLimitHeaders } from "@/lib/rate-limit";
import { getAgentVerificationService } from "@voisss/shared/services/agent-verification";
import { getAgentRateLimiter } from "@voisss/shared/services/agent-rate-limiter";
import { getAgentSecurityService } from "@voisss/shared/services/agent-security";
import { getAgentEventHub, MARKET_INTELLIGENCE_EVENT_TYPES } from "@voisss/shared/types/market-intelligence";

export const runtime = "nodejs";

interface MarketIntelligenceResponse {
  success: boolean;
  data?: {
    reportId: string;
    query: string;
    summary: string;
    keyFindings: string[];
    sources: Array<{
      title: string;
      url: string;
      publishedAt?: string;
    }>;
    audioUrl?: string;
    audioIpfsHash?: string;
    missionId?: string;
    createdAt: string;
    processingTimeMs: number;
    agentGenerated: boolean;
  };
  error?: string;
  meta?: {
    processingTimeMs: number;
    firecrawlAvailable: boolean;
  };
}

/**
 * POST /api/agents/market-intelligence
 * 
 * Generate a market intelligence report with optional audio
 */
export async function POST(req: NextRequest): Promise<NextResponse<MarketIntelligenceResponse>> {
  const requestStart = Date.now();
  const identifier = getIdentifier(req);

  // Check rate limit
  const rateLimitCheck = await rateLimiters.standard.check(identifier);
  if (!rateLimitCheck.success) {
    return NextResponse.json(
      createErrorResponse(API_ERROR_CODES.RATE_LIMIT_EXCEEDED, "Rate limit exceeded for market intelligence requests"),
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitCheck),
      }
    );
  }

  // Check if Firecrawl is available
  const firecrawlService = getFirecrawlService();
  const isFirecrawlAvailable = firecrawlService.isAvailable();

  console.log(`[MarketIntelligence] Request started - Firecrawl available: ${isFirecrawlAvailable}`);

  // SECURITY LAYER 1: Basic Agent Verification
  const agentProof = req.headers.get('X-Agent-Proof');
  const agentAddress = req.headers.get('X-Agent-Address') || undefined;
  const verificationService = getAgentVerificationService();

  if (agentAddress && agentProof) {
    const timestamp = req.headers.get('X-Agent-Timestamp') || '';
    const proofResult = await verificationService.verifyAgentProof(agentAddress, agentProof, timestamp);
    if (!proofResult.valid) {
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.INVALID_TOKEN, "Agent proof verification failed"),
        { status: 403 }
      );
    }
  }

  // SECURITY LAYER 2: Security Check
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
      console.warn(`[MarketIntelligence] Security check failed: ${securityCheck.reason}`);
      return NextResponse.json(
        createErrorResponse(API_ERROR_CODES.INSUFFICIENT_PERMISSIONS, securityCheck.reason || "Security check failed"),
        { status: 403 }
      );
    }

    // Validate request
    const validatedRequest = MarketIntelligenceRequestSchema.parse(body);
    const { query, voiceId, depth, topic, publishToMission, missionId } = validatedRequest;

    console.log(`[MarketIntelligence] Processing: "${query}" (depth: ${depth})`);

    // Create market agent service
    const marketAgent = createMarketAgentService();

    // Process the request
    const report = await marketAgent.processRequest({
      query,
      agentAddress,
      voiceId,
      depth,
      topic,
      publishToMission,
      missionId,
    });

    const processingTimeMs = Date.now() - requestStart;

    console.log(`[MarketIntelligence] Report generated: ${report.id} in ${processingTimeMs}ms`);

    return NextResponse.json({
      success: true,
      data: {
        reportId: report.id,
        query: report.query,
        summary: report.summary,
        keyFindings: report.keyFindings,
        sources: report.sources,
        audioUrl: report.audioUrl,
        audioIpfsHash: report.audioIpfsHash,
        missionId: report.missionId,
        createdAt: report.createdAt instanceof Date ? report.createdAt.toISOString() : String(report.createdAt),
        processingTimeMs: report.processingTimeMs || processingTimeMs,
        agentGenerated: report.agentGenerated,
      },
      meta: {
        processingTimeMs,
        firecrawlAvailable: isFirecrawlAvailable,
      },
    });

  } catch (error: any) {
    console.error("[MarketIntelligence] Error:", error);

    // Handle Zod validation errors
    if (error?.issues) {
      const zodError = error as { issues: Array<{ message: string }> };
      return NextResponse.json(
        createErrorResponse(
          API_ERROR_CODES.VALIDATION_FAILED,
          `Invalid request: ${zodError.issues.map((e: any) => e.message).join(", ")}`
        ),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse(
        API_ERROR_CODES.INTERNAL_ERROR,
        error instanceof Error ? error.message : "Failed to generate market intelligence report"
      ),
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/market-intelligence
 * 
 * List recent reports or search reports
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || searchParams.get('query');
  const topic = searchParams.get('topic');
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const reportId = searchParams.get('id');

  try {
    const marketAgent = createMarketAgentService();

    // Get single report if ID provided
    if (reportId) {
      const report = await marketAgent.getReport(reportId);
      if (!report) {
        return NextResponse.json(
          createErrorResponse(API_ERROR_CODES.RESOURCE_NOT_FOUND, `Report ${reportId} not found`),
          { status: 404 }
        );
      }
      return NextResponse.json(createSuccessResponse(report));
    }

    // Search reports if query provided
    if (query) {
      const reports = await marketAgent.searchReports(query, Math.min(limit, 50));
      return NextResponse.json(createSuccessResponse(reports));
    }

    // Filter by topic if provided
    if (topic) {
      const reports = await marketAgent.getReportsByTopic(topic, Math.min(limit, 50));
      return NextResponse.json(createSuccessResponse(reports));
    }

    // Default: return recent reports
    const reports = await marketAgent.getRecentReports(Math.min(limit, 50));
    return NextResponse.json(createSuccessResponse(reports));

  } catch (error: any) {
    console.error("[MarketIntelligence] GET Error:", error);
    return NextResponse.json(
      createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, "Failed to fetch reports"),
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
