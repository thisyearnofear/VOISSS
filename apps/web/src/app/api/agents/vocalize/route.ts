import { NextRequest, NextResponse } from "next/server";
import { VoiceGenerationRequestSchema, VoiceGenerationRequest } from "@voisss/shared";

// Use shared validation schema
type VocalizeRequest = VoiceGenerationRequest;

// Response types
interface VocalizeResponse {
    success: boolean;
    data?: {
        audioUrl: string;
        contentHash: string;
        cost: number;
        characterCount: number;
        creditBalance: number;
        ipfsHash?: string;
        recordingId?: string;
    };
    error?: string;
}

const ELEVEN_API_BASE = "https://api.elevenlabs.io/v1";
const COST_PER_CHARACTER = 0.0001; // ETH equivalent in USD cents

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse<VocalizeResponse>> {
    try {
        // Parse and validate request
        const body = await req.json();
        const validatedRequest = VoiceGenerationRequestSchema.parse(body);

        const { text, voiceId, agentAddress, options } = validatedRequest;

        // Validate API key
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: "Voice service not configured"
            }, { status: 500 });
        }

        // Calculate cost
        const characterCount = text.length;
        const estimatedCost = characterCount * COST_PER_CHARACTER;

        // TODO: Integrate with AgentRegistry contract to check credits
        // For now, we'll simulate the credit check
        const mockCreditBalance = 1.0; // 1 ETH worth of credits

        if (estimatedCost > mockCreditBalance) {
            return NextResponse.json({
                success: false,
                error: `Insufficient credits. Required: ${estimatedCost.toFixed(4)} ETH, Available: ${mockCreditBalance.toFixed(4)} ETH`
            }, { status: 402 }); // Payment Required
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
                    model_id: options?.model || "eleven_multilingual_v2",
                    voice_settings: {
                        stability: options?.stability || 0.5,
                        similarity_boost: options?.similarity_boost || 0.5,
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
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');

        // Generate content hash for IPFS
        const contentHash = generateContentHash(text, voiceId, agentAddress);

        // TODO: Upload to IPFS
        // For now, we'll create a data URL
        const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

        // TODO: Deduct credits from AgentRegistry
        const newCreditBalance = mockCreditBalance - estimatedCost;

        // TODO: Auto-save to VoiceRecords if requested
        let recordingId: string | undefined;
        if (options?.autoSave) {
            // This would call VoiceRecords.saveRecording()
            recordingId = `recording_${Date.now()}`;
        }

        // Log the successful generation
        console.log(`Voice generated for agent ${agentAddress}:`, {
            characterCount,
            cost: estimatedCost,
            voiceId,
            contentHash,
        });

        return NextResponse.json({
            success: true,
            data: {
                audioUrl,
                contentHash,
                cost: estimatedCost,
                characterCount,
                creditBalance: newCreditBalance,
                recordingId,
            }
        });

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

        // TODO: Get agent info from AgentRegistry contract
        // For now, return mock data
        const mockAgentInfo = {
            agentAddress,
            name: "Sample Agent",
            creditBalance: 1.0,
            tier: "Managed",
            voiceProvider: "0x0000000000000000000000000000000000000000", // VOISSS default
            isActive: true,
            supportedVoices: [
                "21m00Tcm4TlvDq8ikWAM", // Rachel
                "AZnzlk1XvdvUeBnXmlld", // Domi
                "EXAVITQu4vr4xnSDxMaL", // Bella
            ],
            costPerCharacter: COST_PER_CHARACTER,
        };

        return NextResponse.json({
            success: true,
            data: mockAgentInfo
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

// Export supported HTTP methods
export const dynamic = 'force-dynamic';