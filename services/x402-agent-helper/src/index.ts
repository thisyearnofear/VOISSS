import express, { Request, Response } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { X402AgentHandler, VoiceGenerationRequest } from './x402-handler';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize handler (no central wallet needed - agent provides their key)
const network = (process.env.NETWORK as 'base' | 'base-sepolia') || 'base';
const voisssApiUrl = process.env.VOISSS_API_URL || 'https://voisss.netlify.app';

const agentHandler = new X402AgentHandler(voisssApiUrl, network);

console.log(`🤖 X402 Agent Helper (V2) started`);
console.log(`🔗 Network: ${network}`);
console.log(`🎯 VOISSS API: ${voisssApiUrl}`);
console.log(`💡 Agents provide their own keys - permissionless x402`);

// Validation schemas
const VoiceGenerationSchema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().min(1),
  agentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  agentPrivateKey: z.string().min(64).optional(),
  maxDurationMs: z.number().int().min(1000).max(60000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const MissionSubmitSchema = z.object({
  missionId: z.string().min(1),
  recordingId: z.string().min(1),
  agentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  location: z.object({
    city: z.string(),
    country: z.string(),
  }).optional(),
  context: z.string().optional(),
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    network,
    voisssApiUrl,
    timestamp: new Date().toISOString(),
    message: 'X402 Agent Helper V2 - Agents provide their own keys',
  });
});

/**
 * POST /voice/generate
 * 
 * Generate voice with automatic payment flow:
 * 1. First tries credits (if agent has deposited USDC to VOISSS)
 * 2. Falls back to x402 V2 if agent provides their privateKey
 */
app.post('/voice/generate', async (req: Request, res: Response) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[${requestId}] 🎙️ Voice generation request`);
  
  try {
    const validationResult = VoiceGenerationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validationResult.error.errors,
      });
    }

    const { agentPrivateKey, ...voiceRequest } = validationResult.data;
    
    console.log(`[${requestId}] 📝 Text: ${voiceRequest.text.length} chars, Voice: ${voiceRequest.voiceId}`);
    
    if (agentPrivateKey) {
      console.log(`[${requestId}] 🔑 Agent provided private key for x402 V2 signing`);
    } else {
      console.log(`[${requestId}] 💳 Trying credits flow first (no key provided)`);
    }

    // Execute voice generation with automatic flow selection
    const result = await agentHandler.generateVoice(voiceRequest, agentPrivateKey);

    if (result.success) {
      const flow = result.usedCredits ? '💳 credits' : '💰 x402 V2';
      console.log(`[${requestId}] ✅ Success via ${flow}`);
      return res.json({
        success: true,
        flow: result.usedCredits ? 'credits' : 'x402-v2',
        data: result.response?.data,
      });
    } else {
      console.log(`[${requestId}] ❌ Failed: ${result.error}`);
      return res.status(402).json({
        success: false,
        error: result.error,
        help: 'To use this endpoint, either: (1) Deposit USDC credits to your agent address on VOISSS first, or (2) Provide your agentPrivateKey for x402 V2 signing',
      });
    }

  } catch (error) {
    console.error(`[${requestId}] 🚨 Error:`, error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /voice/generate-and-submit
 * 
 * Generate voice AND submit to mission in one call.
 * Recommended endpoint for agents posting content.
 */
app.post('/voice/generate-and-submit', async (req: Request, res: Response) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[${requestId}] 🚀 Voice generate + submit request`);
  
  const CombinedRequestSchema = z.object({
    text: z.string().min(1).max(5000),
    voiceId: z.string().min(1),
    missionId: z.string().min(1),
    agentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    agentPrivateKey: z.string().min(64).optional(),
    location: z.object({
      city: z.string(),
      country: z.string(),
    }).optional(),
    context: z.string().optional(),
    maxDurationMs: z.number().int().min(1000).max(60000).optional(),
  });

  try {
    const validationResult = CombinedRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validationResult.error.errors,
      });
    }

    const { missionId, agentAddress, agentPrivateKey, location, context, ...voiceRequest } = validationResult.data;

    // Step 1: Generate voice
    console.log(`[${requestId}] 🎙️ Step 1: Generating voice...`);
    const voiceResult = await agentHandler.generateVoice(
      { ...voiceRequest, agentAddress },
      agentPrivateKey
    );

    if (!voiceResult.success || !voiceResult.response?.data?.recordingId) {
      console.log(`[${requestId}] ❌ Voice generation failed`);
      return res.status(402).json({
        success: false,
        error: 'Voice generation failed',
        details: voiceResult.error,
        help: 'Deposit USDC credits to your agent address, or provide agentPrivateKey for x402 payment',
      });
    }

    console.log(`[${requestId}] ✅ Voice generated: ${voiceResult.response.data.recordingId}`);
    console.log(`[${requestId}] 💳 Payment method: ${voiceResult.usedCredits ? 'credits' : 'x402-v2'}`);

    // Step 2: Submit to mission
    console.log(`[${requestId}] 📤 Step 2: Submitting to mission ${missionId}...`);
    const submitResult = await agentHandler.submitToMission(
      missionId,
      voiceResult.response.data.recordingId,
      agentAddress,
      location,
      context
    );

    if (!submitResult.success) {
      console.log(`[${requestId}] ❌ Mission submission failed:`, submitResult.error);
      return res.status(400).json({
        success: false,
        error: 'Mission submission failed',
        voiceGeneration: voiceResult.response,
        submissionError: submitResult.error,
      });
    }

    console.log(`[${requestId}] ✅ Mission submission successful: ${submitResult.submission?.id}`);

    return res.json({
      success: true,
      flow: voiceResult.usedCredits ? 'credits' : 'x402-v2',
      voiceGeneration: voiceResult.response,
      submission: submitResult.submission,
    });

  } catch (error) {
    console.error(`[${requestId}] 🚨 Error:`, error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /missions/submit
 * 
 * Submit an existing voice recording to a mission.
 */
app.post('/missions/submit', async (req: Request, res: Response) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`[${requestId}] 📤 Mission submission request`);
  
  try {
    const validationResult = MissionSubmitSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: validationResult.error.errors,
      });
    }

    const { missionId, recordingId, agentAddress, location, context } = validationResult.data;

    const result = await agentHandler.submitToMission(missionId, recordingId, agentAddress, location, context);

    if (result.success) {
      console.log(`[${requestId}] ✅ Mission submission successful`);
      return res.json(result);
    } else {
      console.log(`[${requestId}] ❌ Mission submission failed:`, result.error);
      return res.status(400).json(result);
    }

  } catch (error) {
    console.error(`[${requestId}] 🚨 Error:`, error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /missions
 * 
 * Proxy to VOISSS missions API for convenience.
 */
app.get('/missions', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${voisssApiUrl}/api/missions`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch missions',
    });
  }
});

/**
 * GET /voices
 * 
 * Get available voice IDs from ElevenLabs via VOISSS.
 */
app.get('/voices', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${voisssApiUrl}/api/elevenlabs/list-voices`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch voices',
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 X402 Agent Helper V2 running on port ${PORT}`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`   POST /voice/generate         - Generate voice (credits or x402 V2)`);
  console.log(`   POST /voice/generate-and-submit - Generate + submit to mission`);
  console.log(`   POST /missions/submit        - Submit recording to mission`);
  console.log(`   GET  /missions               - List available missions`);
  console.log(`   GET  /voices                 - List available voice IDs`);
  console.log(`   GET  /health                 - Health check`);
  console.log(`\n💡 Payment flows:`);
  console.log(`   💳 Credits: Deposit USDC to your agent address first (no signing)`);
  console.log(`   💰 x402 V2: Provide agentPrivateKey (signs with your wallet)`);
  console.log(`\n📝 Updated for x402 V2 (Feb 2026) - PAYMENT-SIGNATURE header\n`);
});

export default app;
