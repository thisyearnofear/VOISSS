import { NextRequest, NextResponse } from 'next/server';
import { createMissionService } from '@voisss/shared/services/persistent-mission-service';
import { MissionResponse } from '@voisss/shared/types/socialfi';

const missionService = createMissionService();

/**
 * POST /api/missions/submit
 *
 * User submits their recording for a mission
 * 
 * Request body:
 * {
 *   missionId: string,
 *   userId: string (wallet address),
 *   recordingId: string,
 *   recordingIpfsHash?: string,
 *   location: { city, country, coordinates? },
 *   context: string,
 *   participantConsent: boolean,
 *   consentProof?: string (IPFS hash),
 *   isAnonymized: boolean,
 *   voiceObfuscated: boolean
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   submission: MissionResponse (id, missionId, userId, status='approved')
 * }
 */

interface MissionSubmitRequest {
  missionId: string;
  userId: string; // wallet address
  recordingId: string;
  recordingIpfsHash?: string;
  location: {
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  context: string;
  participantConsent: boolean;
  consentProof?: string;
  isAnonymized: boolean;
  voiceObfuscated: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Extract address from Bearer token for verification
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokenAddress = authHeader.substring(7);
    if (!tokenAddress?.startsWith('0x') || tokenAddress.length !== 42) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 401 });
    }

    // Parse and validate request
    const body: MissionSubmitRequest = await request.json();

    // Validate required fields
    const requiredFields = ['missionId', 'userId', 'recordingId', 'location', 'context', 'participantConsent', 'isAnonymized', 'voiceObfuscated'];
    for (const field of requiredFields) {
      if (!(field in body)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate address matches token
    if (body.userId.toLowerCase() !== tokenAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Address mismatch: userId must match authorization token' },
        { status: 403 }
      );
    }

    // Validate mission exists
    const mission = await missionService.getMissionById(body.missionId);
    if (!mission) {
      return NextResponse.json(
        { error: `Mission not found: ${body.missionId}` },
        { status: 404 }
      );
    }

    // Validate mission is still active
    if (!mission.isActive) {
      return NextResponse.json(
        { error: 'Mission is no longer active' },
        { status: 410 }
      );
    }

    // Validate mission has not expired
    if (mission.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Mission has expired' },
        { status: 410 }
      );
    }

    // Validate location fields
    if (!body.location.city || !body.location.country) {
      return NextResponse.json(
        { error: 'Location must include city and country' },
        { status: 400 }
      );
    }

    // Create submission with defaults
    const submissionData: Omit<MissionResponse, 'id' | 'submittedAt'> = {
      missionId: body.missionId,
      userId: body.userId,
      recordingId: body.recordingId,
      recordingIpfsHash: body.recordingIpfsHash,
      location: body.location,
      context: body.context,
      participantConsent: body.participantConsent,
      consentProof: body.consentProof,
      isAnonymized: body.isAnonymized,
      voiceObfuscated: body.voiceObfuscated,
      status: 'approved', // Auto-approved
    };

    // Submit via service
    const submission = await missionService.submitMissionResponse(submissionData);

    return NextResponse.json(
      {
        success: true,
        submission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Mission submission error:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit mission response';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
