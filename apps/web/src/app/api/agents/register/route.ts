import { NextRequest, NextResponse } from "next/server";
import { 
  AgentRegistrationRequestSchema, 
  AgentRegistrationResponse,
  AgentProfile,
} from "@voisss/shared";
import { rateLimiters, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import crypto from "crypto";

// In-memory agent registry (would be persisted in production)
// This could be moved to shared services or a database
const agentRegistry = new Map<string, AgentProfile>();

/**
 * POST /api/agents/register
 * 
 * Register a new agent for API access.
 * Creates an agent profile and returns an API key for authenticated requests.
 */
export async function POST(req: NextRequest): Promise<NextResponse<AgentRegistrationResponse>> {
  try {
    const body = await req.json();
    const validated = AgentRegistrationRequestSchema.parse(body);

    const { 
      agentAddress, 
      name, 
      metadataURI, 
      categories, 
      x402Enabled, 
      description,
      webhookUrl,
    } = validated;

    // Rate limiting
    const identifier = getIdentifier(req);
    const rateLimitResult = await rateLimiters.voiceGeneration.check(identifier);
    
    if (!rateLimitResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      }, { 
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      });
    }

    // Check if agent already registered
    if (agentRegistry.has(agentAddress)) {
      const existing = agentRegistry.get(agentAddress)!;
      return NextResponse.json({
        success: true,
        agentId: agentAddress,
        tier: existing.tier,
        error: "Agent already registered",
      });
    }

    // Generate API key for the agent
    const apiKey = `voisss_${crypto.randomBytes(32).toString('hex')}`;

    // Create agent profile
    const profile: AgentProfile = {
      agentAddress,
      metadataURI: metadataURI || '',
      name,
      categories,
      registeredAt: new Date(),
      isActive: true,
      x402Enabled,
      isBanned: false,
      tier: 'Managed',
      creditBalance: '0',
      voiceProvider: '0x0000000000000000000000000000000000000000',
    };

    // Store in registry
    agentRegistry.set(agentAddress, profile);

    // Log registration
    console.log(`Agent registered: ${name} (${agentAddress})`, {
      categories,
      x402Enabled,
      webhookUrl,
    });

    return NextResponse.json({
      success: true,
      agentId: agentAddress,
      apiKey,
      tier: 'Managed',
    });

  } catch (error) {
    console.error("Register API error:", error);

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ message: string; path: string[] }> };
      return NextResponse.json({
        success: false,
        error: `Validation error: ${zodError.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to register agent",
    }, { status: 500 });
  }
}

/**
 * GET /api/agents/register?agentAddress=0x...
 * 
 * Check if an agent is registered and get their profile.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const agentAddress = searchParams.get('agentAddress');

    if (!agentAddress || !/^0x[a-fA-F0-9]{40}$/.test(agentAddress)) {
      return NextResponse.json({
        success: false,
        error: "Valid agent address required",
      }, { status: 400 });
    }

    const profile = agentRegistry.get(agentAddress);

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: "Agent not registered",
        registered: false,
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      registered: true,
      data: {
        agentAddress: profile.agentAddress,
        name: profile.name,
        categories: profile.categories,
        tier: profile.tier,
        isActive: profile.isActive,
        creditBalance: profile.creditBalance,
        registeredAt: profile.registeredAt,
      },
    });

  } catch (error) {
    console.error("Get agent API error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to get agent info",
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
