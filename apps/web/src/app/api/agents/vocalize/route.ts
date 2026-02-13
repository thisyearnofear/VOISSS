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
  AUDIO_CONFIG,
  SERVICE_COSTS,
} from "@voisss/shared";
import { getIdentifier } from "@/lib/rate-limit";
import { getAgentVerificationService } from "@voisss/shared/services/agent-verification";
import { getAgentRateLimiter, AgentTierLimits } from "@voisss/shared/services/agent-rate-limiter";
import { getAgentSecurityService, AgentSecurityProfile } from "@voisss/shared/services/agent-security";
import { getAgentEventHub, VOISSS_EVENT_TYPES } from "@voisss/shared/services/agent-event-hub";
import { createHash } from "crypto";

// Idempotency cache with TTL cleanup
class IdempotencyCache {
  private cache = new Map<string, { result: any; expiresAt: number }>();
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  get(key: string): { result: any; expiresAt: number } | undefined {
    this.maybeCleanup();
    return this.cache.get(key);
  }

  set(key: string, value: { result: any; expiresAt: number }): void {
    this.cache.set(key, value);
  }

  private maybeCleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.CLEANUP_INTERVAL) return;
    
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
    this.lastCleanup = now;
  }
}

const idempotencyCache = new IdempotencyCache();
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
  const requestStart = Date.now();

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

    // Get agent identifier for security and rate limiting
    const agentId = agentAddress || getIdentifier(req);
    const userAgent = req.headers.get('user-agent') || undefined;
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

    // Collect headers for security analysis
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // SECURITY LAYER 1: Agent Verification (reverse CAPTCHA)
    const agentProof = req.headers.get('X-Agent-Proof');
    const timestamp = req.headers.get('X-Agent-Timestamp');
    const verificationService = getAgentVerificationService();

    if (agentAddress && agentProof) {
      const proofResult = await verificationService.verifyAgentProof(agentAddress, agentProof, timestamp || '');
      if (proofResult.valid) {
        console.log(`🤖 Agent verification: PASS via wallet proof (agent: ${agentAddress})`);
      } else {
        return NextResponse.json({
          success: false,
          error: "Agent proof verification failed",
          details: {
            reason: proofResult.reason,
          }
        }, { status: 403 });
      }
    } else {
      const verification = verificationService.verifyAgentBehavior({
        userAgent,
        headers,
        payload: body
      });

      if (verification.confidence < 0.6) {
        return NextResponse.json({
          success: false,
          error: "Agent verification required",
          details: {
            reason: verification.reason,
            confidence: verification.confidence,
            instructions: {
              method: "Sign a proof message with your agent wallet and include it in the request headers.",
              headers: {
                "X-Agent-Proof": "<wallet_signature>",
                "X-Agent-Timestamp": "<unix_ms_timestamp>"
              },
              messageFormat: "VOISSS-Agent:<your_agent_address_lowercase>:<timestamp_ms>",
              example: `curl -X POST /api/agents/vocalize -H "X-Agent-Proof: 0x..." -H "X-Agent-Timestamp: ${Date.now()}" -H "Content-Type: application/json" -d '{"text":"hello","voiceId":"...","agentAddress":"0x..."}'`,
              note: "Timestamp must be within 5 minutes of server time."
            },
            challengeEndpoint: "/api/agents/verify"
          }
        }, { status: 403 });
      }

      console.log(`🤖 Agent verification: ${verification.isAgent ? 'PASS' : 'UNCERTAIN'} via behavioral (confidence: ${verification.confidence.toFixed(2)})`);
    }

    // SECURITY LAYER 2: Comprehensive Security Check
    const securityService = getAgentSecurityService();
    const securityCheck = await securityService.securityCheck({
      agentId,
      userAgent,
      headers,
      path: req.nextUrl.pathname,
      method: req.method,
      payload: body,
      ip,
      timing: {
        requestStart,
        processingTime: Date.now() - requestStart
      }
    });

    if (!securityCheck.allowed) {
      console.warn(`🚨 Security check failed for agent ${agentId}: ${securityCheck.reason}`);

      // Publish security event
      const eventHub = getAgentEventHub();
      await eventHub.publish({
        type: VOISSS_EVENT_TYPES.SECURITY_THREAT_DETECTED,
        source: 'vocalize-api',
        data: {
          agentId,
          reason: securityCheck.reason,
          threatLevel: securityCheck.threatLevel,
          actions: securityCheck.actions
        },
        metadata: {
          priority: securityCheck.threatLevel === 'red' ? 'urgent' : 'high'
        }
      });

      return NextResponse.json({
        success: false,
        error: securityCheck.reason || 'Security check failed',
        threatLevel: securityCheck.threatLevel
      }, { status: 403 });
    }

    // Determine agent tier based on security profile
    const agentTier = determineAgentTier(securityCheck.profile, agentAddress);

    // SECURITY LAYER 3: Advanced Rate Limiting
    const rateLimiter = getAgentRateLimiter();
    const characterCount = text.length;
    // For rate limiting, we use the base cost (before discounts) to prevent abuse of cheaper rates
    const { baseCost: rateLimitCost } = calculateServiceCost('voice_generation', characterCount);

    const rateLimitCheck = await rateLimiter.checkLimits(agentId, agentTier, {
      cost: rateLimitCost,
      characters: characterCount
    });

    if (!rateLimitCheck.allowed) {
      console.warn(`⏱️ Rate limit exceeded for agent ${agentId}: ${rateLimitCheck.reason}`);

      // Publish rate limit event
      const eventHub = getAgentEventHub();
      await eventHub.publish({
        type: VOISSS_EVENT_TYPES.RATE_LIMIT_EXCEEDED,
        source: 'vocalize-api',
        data: {
          agentId,
          reason: rateLimitCheck.reason,
          limits: rateLimitCheck.limits,
          tier: agentTier
        }
      });

      return NextResponse.json({
        success: false,
        error: rateLimitCheck.reason || 'Rate limit exceeded',
        retryAfter: rateLimitCheck.retryAfter
      }, {
        status: 429,
        headers: {
          'Retry-After': rateLimitCheck.retryAfter?.toString() || '60',
          ...rateLimitCheck.headers
        }
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

    // Publish voice generation started event
    const eventHub = getAgentEventHub();
    const recordingId = `voc_${Date.now()}_${generateContentHash(text, voiceId, agentId).slice(0, 8)}`;

    await eventHub.publish({
      type: VOISSS_EVENT_TYPES.VOICE_GENERATION_STARTED,
      source: 'vocalize-api',
      data: {
        recordingId,
        agentId,
        characterCount,
        estimatedDurationMs,
        voiceId,
        tier: agentTier
      }
    });

    // Get payment quote (this now includes tier-based discounts)
    const quote = await paymentRouter.getQuote(agentAddress, 'voice_generation', characterCount);
    const actualCost = quote.estimatedCost;

    // Check for X-PAYMENT header (x402 payment attempt)
    const paymentHeader = req.headers.get('X-PAYMENT');

    if (paymentHeader) {
      // Client is attempting x402 payment
      const payment = parsePaymentHeader(paymentHeader) as X402PaymentPayload | null;

      if (!payment) {
        return NextResponse.json({
          success: false,
          error: 'Invalid payment header. X-PAYMENT must be JSON (or base64-encoded JSON) matching X402PaymentPayload.',
          expectedFormat: {
            signature: "0x...(EIP-712 TransferWithAuthorization signature)",
            from: "0x...(your agent address)",
            to: "0x...(payTo from 402 response)",
            value: "100",
            validAfter: "0",
            validBefore: "9999999999",
            nonce: "0x...(random 32-byte hex)"
          }
        }, { status: 400 });
      }

      // Create requirements for verification
      const x402Client = (await import('@voisss/shared')).getX402Client();
      const requirements = x402Client.createRequirements(
        `${req.nextUrl.origin}/api/agents/vocalize`,
        actualCost,
        process.env.X402_PAY_TO_ADDRESS || '',
        `Voice generation: ${characterCount} characters (Discount: ${quote.discountPercent}%)`
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
        paymentResult.cost,
        'x402',
        req,
        paymentResult.txHash,
        undefined,
        undefined,
        recordingId,
        agentTier,
        paymentResult.baseCost,
        paymentResult.discountApplied
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
          paymentResult.cost,
          paymentResult.method,
          req,
          undefined,
          paymentResult.remainingCredits,
          paymentResult.tier,
          recordingId,
          agentTier,
          paymentResult.baseCost,
          paymentResult.discountApplied
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
      actualCost,
      process.env.X402_PAY_TO_ADDRESS || '',
      `Voice generation: ${characterCount} characters (Discount: ${quote.discountPercent}%)`
    );

    return createPaymentRequiredResponse(requirements) as NextResponse<VocalizeResponse>;


  } catch (error: unknown) {
    console.error("Vocalize API error:", error);

    // Publish error event
    try {
      const eventHub = getAgentEventHub();
      await eventHub.publish({
        type: VOISSS_EVENT_TYPES.VOICE_GENERATION_FAILED,
        source: 'vocalize-api',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        },
        metadata: {
          priority: 'high'
        }
      });
    } catch (eventError) {
      console.error('Failed to publish error event:', eventError);
    }

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
  tier?: string,
  recordingId?: string,
  agentTier?: keyof import('@voisss/shared/services/agent-rate-limiter').AgentTierLimits,
  baseCost?: bigint,
  discountApplied?: number
): Promise<NextResponse<VocalizeResponse>> {
  const agentId = agentAddress || getIdentifier(req);
  const eventHub = getAgentEventHub();

  try {
    // Validate API key
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      await eventHub.publish({
        type: VOISSS_EVENT_TYPES.VOICE_GENERATION_FAILED,
        source: 'vocalize-api',
        data: {
          recordingId,
          agentId,
          error: 'Voice service not configured',
          characterCount
        },
        metadata: { priority: 'high' }
      });

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

      // Publish failure event
      await eventHub.publish({
        type: VOISSS_EVENT_TYPES.VOICE_GENERATION_FAILED,
        source: 'vocalize-api',
        data: {
          recordingId,
          agentId,
          error: userFriendlyMessage,
          characterCount,
          voiceId,
          elevenlabsStatus: ttsResponse.status
        },
        metadata: { priority: 'high' }
      });

      return NextResponse.json({
        success: false,
        error: userFriendlyMessage
      }, { status: ttsResponse.status });
    }

    // Get audio data
    const audioBuffer = await ttsResponse.arrayBuffer();

    // Generate content hash
    const contentHash = generateContentHash(text, voiceId, agentId);
    const finalRecordingId = recordingId || `voc_${Date.now()}_${contentHash.slice(0, 8)}`;

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
          filename: `${finalRecordingId}.mp3`,
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
            filename: `${finalRecordingId}.mp3`,
            mimeType: 'audio/mpeg',
            duration: Math.ceil(text.length / 2.5),
            recordingId: finalRecordingId,
            agentAddress: agentId,
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

        // Publish failure event
        await eventHub.publish({
          type: VOISSS_EVENT_TYPES.VOICE_GENERATION_FAILED,
          source: 'vocalize-api',
          data: {
            recordingId: finalRecordingId,
            agentId,
            error: 'Storage failed',
            characterCount,
            voiceId
          },
          metadata: { priority: 'high' }
        });

        // Last resort: return error instead of base64
        return NextResponse.json({
          success: false,
          error: "Audio generation succeeded but storage failed. Please try again.",
          details: "Both IPFS upload and temporary storage failed"
        }, { status: 503 }); // Service Unavailable
      }
    }

    // Log the successful generation
    console.log(`Voice generated for agent ${agentId}:`, {
      characterCount,
      cost: formatUSDC(cost),
      paymentMethod,
      voiceId,
      contentHash,
      ipfsHash: ipfsHash || 'temporary',
      isTemporary,
      tier: agentTier,
      discount: discountApplied ? `${Math.floor(discountApplied * 100)}%` : 'none',
    });

    // Publish success event
    await eventHub.publish({
      type: VOISSS_EVENT_TYPES.VOICE_GENERATION_COMPLETED,
      source: 'vocalize-api',
      data: {
        recordingId: finalRecordingId,
        agentId,
        audioUrl,
        contentHash,
        characterCount,
        cost: cost.toString(),
        baseCost: baseCost?.toString(),
        discountApplied,
        paymentMethod,
        voiceId,
        tier: agentTier,
        ...(ipfsHash && { ipfsHash }),
        ...(isTemporary && { isTemporary: true }),
        ...(txHash && { txHash })
      },
      metadata: {
        priority: 'normal',
        tags: ['voice-generation', 'success']
      }
    });

    const result = {
      success: true,
      data: {
        audioUrl,
        contentHash,
        cost: formatUSDC(cost),
        costWei: cost.toString(),
        baseCost: baseCost ? formatUSDC(baseCost) : undefined,
        baseCostWei: baseCost?.toString(),
        discountApplied,
        characterCount,
        paymentMethod,
        recordingId: finalRecordingId,
        ...(ipfsHash && { ipfsHash }),
        ...(isTemporary && {
          isTemporary: true,
          note: "Audio is temporarily stored. IPFS upload will be retried in background."
        }),
        ...(txHash && { txHash }),
        ...(remainingCredits !== undefined && { 
          creditBalance: formatUSDC(remainingCredits),
          creditBalanceWei: remainingCredits.toString() 
        }),
        ...(tier && { tier }),
        ...(agentTier && { agentTier }),
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("Voice generation error:", error);

    // Publish failure event
    await eventHub.publish({
      type: VOISSS_EVENT_TYPES.VOICE_GENERATION_FAILED,
      source: 'vocalize-api',
      data: {
        recordingId,
        agentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        characterCount,
        voiceId
      },
      metadata: { priority: 'high' }
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Voice generation failed"
    }, { status: 500 });
  }
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
        creditBalance: formatUSDC(creditBalance),
        creditBalanceWei: creditBalance.toString(),
        currentTier: quote.currentTier,
        costPerCharacter: formatUSDC(SERVICE_COSTS.voice_generation.unitCost || 0n),
        sampleCost: {
          characters: sampleChars,
          baseUsdc: formatUSDC(quote.baseCost),
          usdc: formatUSDC(quote.estimatedCost),
          discountPercent: quote.discountPercent,
          wei: quote.estimatedCost.toString(),
          formatted: formatUSDC(quote.estimatedCost),
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

/**
 * Determine agent tier based on security profile and address
 */
function determineAgentTier(
  profile: import('@voisss/shared/services/agent-security').AgentSecurityProfile,
  agentAddress?: string
): keyof import('@voisss/shared/services/agent-rate-limiter').AgentTierLimits {
  // Premium tier: High trust score and reputation
  if (profile.trustScore >= 80 && profile.reputation >= 800) {
    return 'premium';
  }

  // Verified tier: Good trust score and reputation
  if (profile.trustScore >= 60 && profile.reputation >= 400) {
    return 'verified';
  }

  // Registered tier: Has wallet address
  if (agentAddress && /^0x[a-fA-F0-9]{40}$/.test(agentAddress)) {
    return 'registered';
  }

  // Default to unregistered
  return 'unregistered';
}

// Export supported HTTP methods
export const dynamic = 'force-dynamic';
