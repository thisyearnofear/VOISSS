import { NextRequest, NextResponse } from 'next/server';
import { createMissionService } from '@voisss/shared';
import { PLATFORM_CONFIG } from '@voisss/shared/config/platform';
import { Mission, QualityCriteria } from '@voisss/shared/types/socialfi';

const missionService = createMissionService();

// Base reward by difficulty
const REWARD_BY_DIFFICULTY = {
  easy: 10,
  medium: 25,
  hard: 50,
};

/**
 * POST /api/missions/create
 * 
 * Creates a new mission with simplified form fields.
 * Automatically calculates baseReward from difficulty.
 * Client validates creator eligibility before calling.
 * Server validates auth and required fields.
 */

interface CreateMissionRequest {
  // Core fields
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targetDuration: number;
  expirationDays: number;
  locationBased?: boolean;

  // Advanced fields (optional)
  language?: string;
  rewardModel?: 'pool' | 'flat_rate' | 'performance';
  budgetAllocation?: number;
  creatorStake?: number;
  qualityCriteria?: QualityCriteria;
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

    // Validate required fields
    if (!body.title?.trim() || !body.description?.trim() || !body.difficulty || !body.targetDuration) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, difficulty, targetDuration' },
        { status: 400 }
      );
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(body.difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty. Must be: easy, medium, or hard' },
        { status: 400 }
      );
    }

    // Validate duration range
    if (body.targetDuration < 30 || body.targetDuration > 600) {
      return NextResponse.json(
        { error: 'Target duration must be between 30 and 600 seconds' },
        { status: 400 }
      );
    }

    // Validate expiration
    const expirationDays = body.expirationDays || PLATFORM_CONFIG.missions.defaultExpirationDays;
    if (expirationDays < 1 || expirationDays > 90) {
      return NextResponse.json(
        { error: 'Expiration must be between 1 and 90 days' },
        { status: 400 }
      );
    }

    // Calculate base reward from difficulty
    const baseReward = REWARD_BY_DIFFICULTY[body.difficulty];

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Create mission via service
    const mission = await missionService.createMission({
      title: body.title.trim(),
      description: body.description.trim(),
      difficulty: body.difficulty,
      baseReward,
      rewardModel: body.rewardModel || 'pool',
      targetDuration: body.targetDuration,
      locationBased: body.locationBased || false,
      language: body.language || 'en',
      qualityCriteria: body.qualityCriteria,
      budgetAllocation: body.budgetAllocation,
      creatorStake: body.creatorStake,
      isActive: PLATFORM_CONFIG.missions.autoPublish,
      createdBy: userAddress,
      expiresAt,
      autoExpire: true,
    });

    return NextResponse.json({ success: true, mission }, { status: 201 });
  } catch (error) {
    console.error('Mission creation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create mission';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
