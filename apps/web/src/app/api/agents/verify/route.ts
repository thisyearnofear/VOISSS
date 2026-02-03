/**
 * Agent Verification API - Reverse CAPTCHA
 * Provides challenges to verify that requests come from AI agents, not humans
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAgentVerificationService } from '@voisss/shared/services/agent-verification';

// GET /api/agents/verify - Get a challenge for agent verification
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const difficulty = searchParams.get('difficulty') as 'basic' | 'intermediate' | 'advanced' || 'basic';

        const verificationService = getAgentVerificationService();
        const challenge = verificationService.generateChallenge(difficulty);

        return NextResponse.json({
            success: true,
            data: {
                challengeId: challenge.id,
                challenge: challenge.challenge,
                difficulty: challenge.difficulty,
                expiresAt: challenge.expiresAt,
                instructions: "Solve this challenge to prove you're an AI agent. Humans typically struggle with these computational tasks."
            }
        });

    } catch (error) {
        console.error('Agent verification challenge generation failed:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to generate verification challenge'
        }, { status: 500 });
    }
}

// POST /api/agents/verify - Submit challenge response or behavioral verification
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const verificationService = getAgentVerificationService();

        let result;

        if (body.challengeId && body.response) {
            // Challenge-based verification
            result = verificationService.verifyChallenge(body.challengeId, body.response);
        } else {
            // Behavioral verification
            const headers: Record<string, string> = {};
            request.headers.forEach((value, key) => {
                headers[key] = value;
            });

            result = verificationService.verifyAgentBehavior({
                userAgent: request.headers.get('user-agent') || undefined,
                headers,
                timing: body.timing,
                payload: body
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                isAgent: result.isAgent,
                confidence: result.confidence,
                reason: result.reason,
                verified: result.isAgent && result.confidence > 0.7
            }
        });

    } catch (error) {
        console.error('Agent verification failed:', error);
        return NextResponse.json({
            success: false,
            error: 'Verification failed'
        }, { status: 500 });
    }
}

export const dynamic = 'force-dynamic';