/**
 * Conversational Market Intelligence Endpoint
 * 
 * POST /api/agents/conversational/market
 * 
 * ElevenLabs-compatible conversational endpoint for market research queries.
 * Maintains conversation context about market research and returns 
 * structured responses suitable for ElevenAgents integration.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createSuccessResponse,
  createErrorResponse,
  API_ERROR_CODES,
} from "@voisss/shared";
import { getFirecrawlService } from "@voisss/shared/services/market-intelligence/firecrawl-service";
import { getIdentifier, rateLimiters, getRateLimitHeaders } from "@/lib/rate-limit";
import { getAgentVerificationService } from "@voisss/shared/services/agent-verification";
import { getAgentSecurityService } from "@voisss/shared/services/agent-security";

export const runtime = "nodejs";

// Request schema for conversational market intelligence
const ConversationalMarketRequestSchema = z.object({
  message: z.string().min(1).max(500),
  conversationId: z.string().optional(),
  context: z.object({
    previousQueries: z.array(z.string()).optional(),
    topic: z.string().optional(),
  }).optional(),
  options: z.object({
    includeSources: z.boolean().default(true),
    voiceResponse: z.boolean().default(false),
    voiceId: z.string().optional(),
  }).optional(),
});

// ElevenLabs-compatible response format
interface ConversationalResponse {
  message: string;
  intent: 'market_research' | 'pricing_query' | 'competitor_analysis' | 'general';
  entities: {
    topic?: string;
    provider?: string;
    timeframe?: string;
  };
  action?: {
    type: 'generate_report' | 'search' | 'clarify' | 'fallback';
    parameters?: Record<string, any>;
  };
  sources?: Array<{
    title: string;
    url: string;
    relevance: number;
  }>;
  metadata: {
    conversationId: string;
    timestamp: string;
    processingTimeMs: number;
  };
}

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const requestStart = Date.now();
  const identifier = getIdentifier(req);

  // Check rate limit
  const rateLimitCheck = await rateLimiters.standard.check(identifier);
  if (!rateLimitCheck.success) {
    return NextResponse.json(
      createErrorResponse(API_ERROR_CODES.RATE_LIMIT_EXCEEDED, "Rate limit exceeded"),
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitCheck),
      }
    );
  }

  try {
    // Parse and validate request
    const body = await req.json();
    const validatedRequest = ConversationalMarketRequestSchema.parse(body);
    const { message, conversationId, context, options } = validatedRequest;

    // Generate conversation ID if not provided
    const convId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Analyze message intent
    const intentAnalysis = analyzeIntent(message);

    // Process based on intent
    let response: ConversationalResponse;

    if (intentAnalysis.intent === 'market_research' || intentAnalysis.intent === 'pricing_query' || intentAnalysis.intent === 'competitor_analysis') {
      // Perform research
      const firecrawlService = getFirecrawlService();
      const research = await firecrawlService.research(intentAnalysis.query);

      response = {
        message: generateConversationalResponse(intentAnalysis.intent, research),
        intent: intentAnalysis.intent,
        entities: intentAnalysis.entities,
        action: {
          type: 'search',
          parameters: { query: intentAnalysis.query },
        },
        sources: options?.includeSources ? research.sources.slice(0, 3).map((s, i) => ({
          title: s.title,
          url: s.url,
          relevance: 1 - (i * 0.2),
        })) : undefined,
        metadata: {
          conversationId: convId,
          timestamp: new Date().toISOString(),
          processingTimeMs: Date.now() - requestStart,
        },
      };
    } else {
      // General query - provide guidance
      response = {
        message: generateGuidanceResponse(message),
        intent: 'general',
        entities: {},
        action: {
          type: 'clarify',
          parameters: {
            suggestions: [
              'Voice AI market trends and pricing',
              'Compare ElevenLabs vs competitors',
              'Voice licensing rates and costs',
              'Market size and growth projections',
            ],
          },
        },
        metadata: {
          conversationId: convId,
          timestamp: new Date().toISOString(),
          processingTimeMs: Date.now() - requestStart,
        },
      };
    }

    return NextResponse.json(createSuccessResponse(response));

  } catch (error: any) {
    console.error("[ConversationalMarket] Error:", error);

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
        error instanceof Error ? error.message : "Failed to process market intelligence query"
      ),
      { status: 500 }
    );
  }
};

/**
 * Analyze message intent and extract entities
 */
function analyzeIntent(message: string): {
  intent: 'market_research' | 'pricing_query' | 'competitor_analysis' | 'general';
  query: string;
  entities: Record<string, string>;
} {
  const lowerMessage = message.toLowerCase();
  const entities: Record<string, string> = {};

  // Check for pricing queries
  if (lowerMessage.includes('price') || lowerMessage.includes('pricing') || 
      lowerMessage.includes('cost') || lowerMessage.includes('license') ||
      lowerMessage.includes('per character') || lowerMessage.includes('per minute')) {
    return {
      intent: 'pricing_query',
      query: extractTopic(message, ['pricing', 'cost', 'license']),
      entities: { ...entities, topic: 'pricing' },
    };
  }

  // Check for competitor queries
  if (lowerMessage.includes('competitor') || lowerMessage.includes('compare') ||
      lowerMessage.includes('vs ') || lowerMessage.includes('versus') ||
      lowerMessage.includes('alternative') || lowerMessage.includes('instead of')) {
    return {
      intent: 'competitor_analysis',
      query: extractTopic(message, ['competitor', 'compare', 'vs']),
      entities: { ...entities, topic: 'competitors' },
    };
  }

  // Check for market research queries
  const marketKeywords = ['market', 'trend', 'growth', 'industry', 'size', 'forecast', 
                          'demand', 'adoption', 'future', 'outlook'];
  if (marketKeywords.some(kw => lowerMessage.includes(kw))) {
    return {
      intent: 'market_research',
      query: message,
      entities: { ...entities, topic: 'market_trends' },
    };
  }

  // Default to general
  return {
    intent: 'general',
    query: message,
    entities: {},
  };
}

/**
 * Extract topic from message
 */
function extractTopic(message: string, keywords: string[]): string {
  const lowerMessage = message.toLowerCase();
  
  // Try to find specific provider names
  const providers = ['elevenlabs', 'murf', 'wellsaid', 'aws', 'amazon polly', 
                    'google cloud', 'microsoft azure', 'coqui', 'playht'];
  
  for (const provider of providers) {
    if (lowerMessage.includes(provider)) {
      return `${provider} ${keywords.join(' ')}`;
    }
  }

  return message;
}

/**
 * Generate conversational response based on intent and research
 */
function generateConversationalResponse(
  intent: string,
  research: { summary: string; keyFindings: string[]; sources: any[] }
): string {
  const summary = research.summary || 'Based on current market data.';
  const findings = research.keyFindings || [];

  switch (intent) {
    case 'pricing_query':
      return `Here's what I found about voice AI pricing:\n\n${summary}\n\nKey points:\n${findings.map((f, i) => `${i + 1}. ${f}`).join('\n')}`;
    
    case 'competitor_analysis':
      return `Here's the competitive landscape for voice AI:\n\n${summary}\n\nAnalysis:\n${findings.map((f, i) => `${i + 1}. ${f}`).join('\n')}`;
    
    case 'market_research':
    default:
      return `Here's the latest market intelligence:\n\n${summary}\n\nKey findings:\n${findings.map((f, i) => `${i + 1}. ${f}`).join('\n')}`;
  }
}

/**
 * Generate guidance response for general queries
 */
function generateGuidanceResponse(message: string): string {
  return `I'd be happy to help you with voice AI market intelligence! Here are some things I can research for you:

• Current voice AI market trends and growth projections
• Pricing comparisons across providers like ElevenLabs, Murf, AWS Polly
• Competitor analysis and feature comparisons
• Voice licensing rates and cost structures
• Industry adoption trends and use cases

What would you like to know more about? Just ask about any of these topics, and I'll gather the latest market data for you.`;
}

export const dynamic = 'force-dynamic';
