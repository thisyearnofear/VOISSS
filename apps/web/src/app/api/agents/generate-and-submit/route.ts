import { NextRequest, NextResponse } from "next/server";
import { 
  VoiceGenerationRequestSchema, 
  AgentSubmissionRequestSchema,
  getPaymentRouter,
  IPFSService,
} from "@voisss/shared";
import { getMissionService } from "@voisss/shared/server";

// We'll reuse the logic from vocalize and submit endpoints
// but combined into a single convenient flow for agents.

export const runtime = "nodejs";

/**
 * POST /api/agents/generate-and-submit
 * 
 * ONE-STOP-SHOP for agents:
 * 1. Generates voice from text (and handles payment)
 * 2. Submits the resulting recording to a mission
 * 
 * Request:
 * {
 *   text: string,
 *   voiceId: string,
 *   themeId: string,
 *   agentAddress: string,
 *   location?: { city, country },
 *   context?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 1. Validate combined request
    const { text, voiceId, themeId, agentAddress, location, context, ...voiceOptions } = body;
    
    if (!text || !voiceId || !themeId || !agentAddress) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields: text, voiceId, themeId, agentAddress" 
      }, { status: 400 });
    }

    console.log(`🤖 Agent ${agentAddress} requested generate-and-submit for theme ${themeId}`);
    
    // Debug: Log request URL info
    console.log(`📍 Request URL info:`, {
      origin: req.nextUrl?.origin,
      href: req.nextUrl?.href,
      pathname: req.nextUrl?.pathname,
    });

    // Step 1: Generate Voice
    // We'll proxy to the vocalize endpoint logic or call it directly if it was a service.
    // For now, the most reliable way in Next.js is to use a fetch to its own API 
    // or extract the logic. Since we want to keep it simple, we'll use an internal fetch
    // but with the original headers.
    
    // Get base URL safely, with fallback
    const baseUrl = req.nextUrl?.origin || 
                    (typeof window !== 'undefined' ? window.location.origin : '') ||
                    process.env.NEXT_PUBLIC_BASE_URL ||
                    'https://voisss.netlify.app';
    
    console.log(`🎙️ Step 1: Generating voice... (baseUrl: ${baseUrl})`);
    const vocalizeResponse = await fetch(`${baseUrl}/api/agents/vocalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Proof': req.headers.get('X-Agent-Proof') || '',
        'X-Agent-Timestamp': req.headers.get('X-Agent-Timestamp') || '',
        'X-PAYMENT': req.headers.get('X-PAYMENT') || '',
        'Idempotency-Key': req.headers.get('Idempotency-Key') ? `${req.headers.get('Idempotency-Key')}-vocalize` : '',
      },
      body: JSON.stringify({
        text,
        voiceId,
        agentAddress,
        ...voiceOptions
      })
    });

    if (!vocalizeResponse.ok) {
      const errorData = await vocalizeResponse.json();
      console.log(`❌ Voice generation failed:`, errorData);
      return NextResponse.json(errorData, { status: vocalizeResponse.status });
    }

    const vocalizeData = await vocalizeResponse.json();
    const { recordingId, ipfsHash } = vocalizeData.data;

    console.log(`✅ Voice generated: ${recordingId} (IPFS: ${ipfsHash})`);

    // Step 2: Submit to Mission
    console.log(`📤 Step 2: Submitting to theme ${themeId}...`);
    const submitResponse = await fetch(`${baseUrl}/api/agents/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': req.headers.get('Idempotency-Key') ? `${req.headers.get('Idempotency-Key')}-submit` : '',
      },
      body: JSON.stringify({
        agentAddress,
        themeId,
        audioData: ipfsHash,
        audioFormat: 'ipfs',
        context: context || 'agent-vocalize-and-submit',
        location: location || { city: 'Unknown', country: 'Unknown' }
      })
    });

    if (!submitResponse.ok) {
      const errorData = await submitResponse.json();
      console.log(`❌ Mission submission failed:`, errorData);
      return NextResponse.json({
        success: false,
        error: "Voice generated but submission failed",
        voiceData: vocalizeData.data,
        submissionError: errorData
      }, { status: submitResponse.status });
    }

    const submitData = await submitResponse.json();
    console.log(`✅ Mission submission successful: ${submitData.submissionId}`);

    return NextResponse.json({
      success: true,
      voiceData: vocalizeData.data,
      submission: submitData
    });

  } catch (error) {
    console.error("Generate-and-submit error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
