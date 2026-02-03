import { NextRequest, NextResponse } from "next/server";
import { getMissionService } from "@voisss/shared/server";
import { 
  AgentSubmissionRequestSchema, 
  AgentSubmissionResponse,
  IPFSService,
} from "@voisss/shared";
import { rateLimiters, getIdentifier, getRateLimitHeaders } from "@/lib/rate-limit";

// Initialize IPFS service
const ipfsService = new IPFSService({
  provider: 'pinata',
  apiKey: process.env.PINATA_API_KEY,
  apiSecret: process.env.PINATA_API_SECRET,
});

const missionService = getMissionService();

/**
 * POST /api/agents/submit
 * 
 * Submit a voice recording to a theme/mission.
 * Accepts base64 audio or IPFS hash, stores to IPFS if needed,
 * and creates a mission submission.
 */
export async function POST(req: NextRequest): Promise<NextResponse<AgentSubmissionResponse>> {
  try {
    const body = await req.json();
    const validated = AgentSubmissionRequestSchema.parse(body);

    const { 
      agentAddress, 
      themeId, 
      audioData, 
      audioFormat,
      context, 
      location, 
      metadata 
    } = validated;

    // Rate limiting
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

    // Verify theme exists and is active
    const mission = await missionService.getMissionById(themeId);
    if (!mission) {
      return NextResponse.json({
        success: false,
        error: "Theme not found",
      }, { status: 404 });
    }

    if (!mission.isActive) {
      return NextResponse.json({
        success: false,
        error: "Theme is no longer active",
      }, { status: 400 });
    }

    if (mission.maxParticipants && mission.currentParticipants >= mission.maxParticipants) {
      return NextResponse.json({
        success: false,
        error: "Theme has reached maximum participants",
      }, { status: 400 });
    }

    // Handle audio - upload to IPFS if base64
    let ipfsHash: string;
    
    if (audioFormat === 'ipfs') {
      ipfsHash = audioData;
    } else {
      // Convert base64 to buffer and upload
      const audioBuffer = Buffer.from(audioData.replace(/^data:audio\/\w+;base64,/, ''), 'base64');
      
      try {
        const uploadResult = await ipfsService.uploadAudio(audioBuffer, {
          filename: `agent-${agentAddress}-${themeId}-${Date.now()}.mp3`,
          mimeType: 'audio/mpeg',
          duration: 0, // Unknown for agent submissions
        });
        
        ipfsHash = uploadResult.hash;
      } catch (uploadError) {
        console.error("IPFS upload failed:", uploadError);
        return NextResponse.json({
          success: false,
          error: "Failed to upload audio to IPFS",
        }, { status: 500 });
      }
    }

    // Create recording ID
    const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Submit to mission
    const submissionResult = await missionService.submitMissionResponse({
      missionId: themeId,
      userId: agentAddress,
      recordingId,
      recordingIpfsHash: ipfsHash,
      location: location || { city: "Unknown", country: "Unknown" },
      context: context || "agent-generated",
      participantConsent: true,
      isAnonymized: false,
      voiceObfuscated: false,
      status: 'approved',
    });

    // Calculate reward eligibility
    const baseReward = parseFloat(mission.baseReward) || 0;
    const rewardEligible = baseReward > 0;

    return NextResponse.json({
      success: true,
      submissionId: submissionResult.id,
      recordingId,
      ipfsHash,
      status: 'approved',
      reward: {
        eligible: rewardEligible,
        estimatedAmount: rewardEligible ? String(baseReward) : undefined,
        currency: rewardEligible ? '$VOISSS' : undefined,
      },
    });

  } catch (error) {
    console.error("Submit API error:", error);

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
      error: error instanceof Error ? error.message : "Failed to submit recording",
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
