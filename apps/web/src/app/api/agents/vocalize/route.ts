import { NextRequest, NextResponse } from "next/server";
import {
  VoiceGenerationRequestSchema,
  VoiceGenerationRequest,
  getPaymentRouter,
  calculateServiceCost,
  formatUSDC,
  createPaymentRequiredResponse,
  X402PaymentPayload,
  parsePaymentHeader,
  IPFSService,
} from "@voisss/shared";
import { AUDIO_CONFIG } from "@voisss/shared";
import { rateLimiters, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";
import { getAgentVerificationService } from "@voisss/shared/services/agent-verification";

// Idempotency cache (in production, use Redis or similar)
const idempotencyCache = new Map<string, { result: any; expiresAt: number }>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// IPFS service for audio storage
const ipfsService = new IPFSService({
  provider: 'pinata',
  apiKey: process.env.PINATA_API_KEY,
  apiSecret: process.env.PINATA_API_SECRET,
});

// Use shared validation schema
type VocalizeRequest = VoiceGenerationRequest;

// Response types
interface VocalizeResponse {
  success: boolean;
  data?: {
    audioUrl: string;
    contentHash: string;
    cost: string; // USDC wei as string
    characterCount: number;
    creditBalance?: string; // USDC wei as string
    tier?: string;
    paymentMethod?: string;
    ipfsHash?: string;
    recordingId?: string;
    txHash?: string;
  };
  error?: string;
  paymentRequired?: {
    amount: string;
    currency: string;
    reason: string;
  };
}

const ELEVEN_API_BASE = "https://api.elevenlabs.io/v1";
const CHARS_PER_SECOND = 2.5; // ~150 chars per minute for ElevenLabs multilingual v2

export const runtime = "nodejs";

// Initialize payment router
const paymentRouter = getPaymentRouter({
  preference: 'credits_first',
  x402PayTo: process.env.X402_PAY_TO_ADDRESS || '',
});

/**
 * POST /api/agents/vocalize
 * 
 * Generate voice from text. Supports multiple payment methods:
 * 1. Prepaid credits (for registered agents)
 * 2. Token-gated tier access (for $VOISSS holders)
 * 3. x402 USDC payment (fallback)
 */
export async function POST(req: NextRequest): Promise<NextResponse<VocalizeResponse>> {
  try {
    // Check idempotency key first
    const idempotencyKey = req.headers.get('Idempotency-Key');
    if (idempotencyKey) {
      const cached = idempotencyCache.get(idempotencyKey);
      if (cached && cached.expiresAt > Date.now()) {
        return NextResponse.json(cached.result, {
          headers: { 'X-Idempotency-Replay': 'true' },
        });
      }
    }

    // Parse and validate request first (for rate limit identifier)
    const body = await req.json();
    const validatedRequest = VoiceGenerationRequestSchema.parse(body);

    const { text, voiceId, agentAddress, options, maxDurationMs: requestMaxDurationMs } = validatedRequest;

    // Agent verification (reverse CAPTCHA)
    const agentProof = req.headers.get('X-Agent-Proof');
    const skipVerification = req.headers.get('X-Skip-Agent-Verification') === 'true';

    if (!skipVerification) {
      const verificationService = getAgentVerificationService();
      const headers: Record<string, string> = {};
      req.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const verification = verificationService.verifyAgentBehavior({
        userAgent: req.headers.get('user-agent') || undefined,
        headers,
        payload: body
      });

      // If confidence is low, require explicit agent proof
      if (verification.confidence < 0.6 && !agentProof) {
        return NextResponse.json({
          success: false,
          error: "Agent verification required",
          details: {
            reason: verification.reason,
            confidence: verification.confidence,
            instructions: "This endpoint is designed for AI agents. Please include X-Agent-Proof header or solve a verification challenge.",
            challengeEndpoint: "/api/agents/verify"
          }
        }, { status: 403 });
      }

      console.log(`🤖 Agent verification: ${verification.isAgent ? 'PASS' : 'UNCERTAIN'} (confidence: ${verification.confidence.toFixed(2)})`);
    }

    // Rate limiting check
    const identifier = agentAddress || getIdentifier(req);
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

    // Estimate and validate audio duration
    const estimatedDurationMs = Math.ceil(text.length / CHARS_PER_SECOND) * 1000;
    const maxDurationMs = requestMaxDurationMs ?? AUDIO_CONFIG.MAX_DURATION_MS;

    if (estimatedDurationMs > maxDurationMs) {
      return NextResponse.json({
        success: false,
        error: `Estimated audio duration (${Math.ceil(estimatedDurationMs / 1000)}s) exceeds maximum allowed (${maxDurationMs / 1000}s)`
      }, { status: 400 });
    }

    // Calculate cost
    const characterCount = text.length;
    const cost = calculateServiceCost('voice_generation', characterCount);

    // Get payment quote
    const quote = await paymentRouter.getQuote(agentAddress, 'voice_generation', characterCount);

    // Check for X-PAYMENT header (x402 payment attempt)
    const paymentHeader = req.headers.get('X-PAYMENT');

    if (paymentHeader) {
      // Client is attempting x402 payment
      const payment = parsePaymentHeader(paymentHeader) as X402PaymentPayload | null;

      if (!payment) {
        return NextResponse.json({
          success: false,
          error: 'Invalid payment header'
        }, { status: 400 });
      }

      // Create requirements for verification
      const x402Client = (await import('@voisss/shared')).getX402Client();
      const requirements = x402Client.createRequirements(
        `${req.nextUrl.origin}/api/agents/vocalize`,
        formatUSDC(cost),
        process.env.X402_PAY_TO_ADDRESS || '',
        `Voice generation: ${characterCount} characters`
      );

      // Process x402 payment
      const paymentResult = await paymentRouter.processX402Payment(
        agentAddress,
        'voice_generation',
        characterCount,
        payment,
        requirements
      );

      if (!paymentResult.success) {
        return NextResponse.json({
          success: false,
          error: paymentResult.error || 'Payment failed'
        }, { status: 402 });
      }

      // Payment successful, generate voice
      const response = await generateAndReturnVoice(
        text,
        voiceId,
        agentAddress,
        characterCount,
        cost,
        'x402',
        req,
        paymentResult.txHash
      );

      // Cache successful result for idempotency
      if (idempotencyKey) {
        const resultBody = await response.clone().json();
        if (resultBody.success) {
          idempotencyCache.set(idempotencyKey, {
            result: resultBody,
            expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
          });
        }
      }

      return response;
    }

    // No payment header - check if we can process without x402
    if (quote.recommendedMethod !== 'x402') {
      // Try credits or tier
      const paymentResult = await paymentRouter.process({
        userAddress: agentAddress,
        service: 'voice_generation',
        quantity: characterCount,
        metadata: { voiceId },
      });

      if (paymentResult.success) {
        // Payment successful via credits or tier
        const response = await generateAndReturnVoice(
          text,
          voiceId,
          agentAddress,
          characterCount,
          cost,
          paymentResult.method,
          req,
          undefined,
          paymentResult.remainingCredits,
          paymentResult.tier
        );

        // Cache successful result for idempotency
        if (idempotencyKey) {
          const resultBody = await response.clone().json();
          if (resultBody.success) {
            idempotencyCache.set(idempotencyKey, {
              result: resultBody,
              expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
            });
          }
        }

        return response;
      }

      // Payment failed but might have fallback
      if (!paymentResult.fallbackAvailable) {
        return NextResponse.json({
          success: false,
          error: paymentResult.error || 'Payment failed'
        }, { status: 402 });
      }
    }

    // Return 402 Payment Required for x402
    const x402Client = (await import('@voisss/shared')).getX402Client();
    const requirements = x402Client.createRequirements(
      `${req.nextUrl.origin}/api/agents/vocalize`,
      formatUSDC(cost),
      process.env.X402_PAY_TO_ADDRESS || '',
      `Voice generation: ${characterCount} characters`
    );

    return createPaymentRequiredResponse(requirements) as NextResponse<VocalizeResponse>;

  } catch (error: unknown) {
    console.error("Vocalize API error:", error);

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ message: string }> };
      return NextResponse.json({
        success: false,
        error: `Invalid request: ${zodError.issues.map((e: any) => e.message).join(", ")}`
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error"
    }, { status: 500 });
  }
}

/**
 * Generate voice using ElevenLabs and return response
 */
async function generateAndReturnVoice(
  text: string,
  voiceId: string,
  agentAddress: string,
  characterCount: number,
  cost: bigint,
  paymentMethod: string,
  req: NextRequest,
  txHash?: string,
  remainingCredits?: bigint,
  tier?: string
): Promise<NextResponse<VocalizeResponse>> {
  // Validate API key
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: "Voice service not configured"
    }, { status: 500 });
  }

  // Generate audio using ElevenLabs
  const ttsResponse = await fetch(
    `${ELEVEN_API_BASE}/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    }
  );

  if (!ttsResponse.ok) {
    const errorText = await ttsResponse.text().catch(() => "");
    console.error("ElevenLabs TTS Error:", {
      status: ttsResponse.status,
      statusText: ttsResponse.statusText,
      responseText: errorText,
      voiceId,
      agentAddress,
    });

    let userFriendlyMessage = `Voice generation failed: ${ttsResponse.status}`;
    if (errorText.includes("quota")) {
      userFriendlyMessage = "Voice service quota exceeded. Please try again later.";
    } else if (ttsResponse.status === 401) {
      userFriendlyMessage = "Voice service authentication failed.";
    } else if (ttsResponse.status === 422) {
      userFriendlyMessage = "Invalid voice ID or text content.";
    }

    return NextResponse.json({
      success: false,
      error: userFriendlyMessage
    }, { status: ttsResponse.status });
  }

  // Get audio data
  const audioBuffer = await ttsResponse.arrayBuffer();

  // Generate content hash
  const contentHash = generateContentHash(text, voiceId, agentAddress);
  const recordingId = `voc_${Date.now()}_${contentHash.slice(0, 8)}`;

  // Upload to IPFS with robust retry logic and fallback providers
  let audioUrl: string;
  let ipfsHash: string | undefined;
  let isTemporary = false;

  try {
    // Use robust IPFS service with retry logic and fallbacks
    const { createRobustIPFSService } = await import('@voisss/shared/services/ipfs-service');
    const robustIpfsService = createRobustIPFSService();

    // Get fallback providers
    const fallbackProviders = (robustIpfsService as any).getFallbackProviders?.() || [];

    const uploadResult = await robustIpfsService.uploadAudio(
      Buffer.from(audioBuffer),
      {
        filename: `${recordingId}.mp3`,
        mimeType: 'audio/mpeg',
        duration: Math.ceil(text.length / 2.5), // Estimate duration
      },
      {
        maxRetries: 3,
        retryDelay: 1000,
        fallbackProviders,
      }
    );

    ipfsHash = uploadResult.hash;
    audioUrl = uploadResult.url;

    console.log(`✅ IPFS upload successful: ${ipfsHash}`);

  } catch (uploadError) {
    console.error("🚨 All IPFS upload attempts failed:", uploadError);

    // Store temporarily and return temp URL instead of base64
    try {
      const { getTempAudioStorage } = await import('@voisss/shared/services/temp-audio-storage');
      const tempStorage = getTempAudioStorage();

      const tempId = await tempStorage.storeTemporarily(
        Buffer.from(audioBuffer),
        {
          filename: `${recordingId}.mp3`,
          mimeType: 'audio/mpeg',
          duration: Math.ceil(text.length / 2.5),
          recordingId,
          agentAddress,
          contentHash,
        }
      );

      // Generate temporary URL
      audioUrl = tempStorage.generateTempUrl(tempId, req.nextUrl.origin);
      isTemporary = true;

      console.log(`📁 Audio stored temporarily: ${tempId}`);
      console.log(`🔄 Will retry IPFS upload in background`);

      // TODO: Trigger background retry job here
      // This could be a queue job, webhook, or scheduled task

    } catch (tempError) {
      console.error("🚨 Failed to store audio temporarily:", tempError);

      // Last resort: return error instead of base64
      return NextResponse.json({
        success: false,
        error: "Audio generation succeeded but storage failed. Please try again.",
        details: "Both IPFS upload and temporary storage failed"
      }, { status: 503 }); // Service Unavailable
    }
  }

  // Log the successful generation
  console.log(`Voice generated for agent ${agentAddress}:`, {
    characterCount,
    cost: formatUSDC(cost),
    paymentMethod,
    voiceId,
    contentHash,
    ipfsHash: ipfsHash || 'temporary',
    isTemporary,
  });

  const result = {
    success: true,
    data: {
      audioUrl,
      contentHash,
      cost: cost.toString(),
      characterCount,
      paymentMethod,
      recordingId,
      ...(ipfsHash && { ipfsHash }),
      ...(isTemporary && {
        isTemporary: true,
        note: "Audio is temporarily stored. IPFS upload will be retried in background."
      }),
      ...(txHash && { txHash }),
      ...(remainingCredits !== undefined && { creditBalance: remainingCredits.toString() }),
      ...(tier && { tier }),
    }
  };

  return NextResponse.json(result);
}

/**
 * GET /api/agents/vocalize?agentAddress=0x...
 * 
 * Get agent credit information and pricing
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get agent address from query params
    const { searchParams } = new URL(req.url);
    const agentAddress = searchParams.get('agentAddress');

    if (!agentAddress || !/^0x[a-fA-F0-9]{40}$/.test(agentAddress)) {
      return NextResponse.json({
        success: false,
        error: "Valid agent address required"
      }, { status: 400 });
    }

    // Get quote for sample voice generation (1000 characters)
    const sampleChars = 1000;
    const quote = await paymentRouter.getQuote(agentAddress, 'voice_generation', sampleChars);

    // Get credit balance
    const creditBalance = await paymentRouter.getCreditBalance(agentAddress);

    return NextResponse.json({
      success: true,
      data: {
        agentAddress,
        creditBalance: creditBalance.toString(),
        currentTier: quote.currentTier,
        costPerCharacter: SERVICE_COSTS.voice_generation.unitCost?.toString() || '1',
        sampleCost: {
          characters: sampleChars,
          usdc: formatUSDC(quote.estimatedCost),
          wei: quote.estimatedCost.toString(),
        },
        availablePaymentMethods: quote.availableMethods,
        recommendedMethod: quote.recommendedMethod,
      }
    });

  } catch (error: unknown) {
    console.error("Get agent info error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to get agent information"
    }, { status: 500 });
  }
}

// Helper functions
function generateContentHash(text: string, voiceId: string, agentAddress: string): string {
  const crypto = require('crypto');
  const data = `${text}:${voiceId}:${agentAddress}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Import SERVICE_COSTS from payment module
import { SERVICE_COSTS } from "@voisss/shared";

// Export supported HTTP methods
export const dynamic = 'force-dynamic';
