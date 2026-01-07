import { NextRequest, NextResponse } from 'next/server';
import { createMissionService } from '@voisss/shared';
import { PLATFORM_CONFIG } from '@voisss/shared/config/platform';
import { Mission } from '@voisss/shared/types/socialfi';

const missionService = createMissionService();

/**
 * POST /api/missions/create
 * 
 * Creates a new mission with auto-publish and auto-expiration.
 * Client validates creator eligibility before calling this endpoint.
 * Server validates auth and required fields only.
 */

interface CreateMissionRequest {
  title: string;
  description: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  maxParticipants?: number;
  targetDuration: number;
  examples: string[];
  contextSuggestions: string[];
  tags: string[];
  locationBased?: boolean;
  expirationDays?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Extract address from Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userAddress = authHeader.substring(7);
    if (!userAddress?.startsWith('0x') || userAddress.length !== 42) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 401 });
    }

    // Parse and validate request
    const body: CreateMissionRequest = await request.json();
    if (!body.title || !body.description || !body.topic || !body.difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create mission via service
    const expirationDays = body.expirationDays || PLATFORM_CONFIG.missions.defaultExpirationDays;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    const mission = await missionService.createMission({
      title: body.title,
      description: body.description,
      topic: body.topic,
      difficulty: body.difficulty,
      reward: PLATFORM_CONFIG.rewards.fixedPerMission,
      maxParticipants: body.maxParticipants || PLATFORM_CONFIG.missions.maxParticipants,
      isActive: PLATFORM_CONFIG.missions.autoPublish,
      createdBy: userAddress,
      tags: body.tags.filter(t => t.trim()),
      locationBased: body.locationBased || false,
      targetDuration: body.targetDuration,
      examples: body.examples.filter(e => e.trim()),
      contextSuggestions: body.contextSuggestions.filter(c => c.trim()),
      expiresAt,
      autoExpire: true,
    });

    return NextResponse.json({ success: true, mission }, { status: 201 });
  } catch (error) {
    console.error('Mission creation error:', error);
    return NextResponse.json({ error: 'Failed to create mission' }, { status: 500 });
  }
}
