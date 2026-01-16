import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { createMissionServiceWithMemoryDatabase } from '@voisss/shared/server';
import { PLATFORM_CONFIG, meetsCreatorRequirements } from '@voisss/shared/config/platform';
import { getTierForBalance, VOISSS_TOKEN_ACCESS } from '@voisss/shared/config/tokenAccess';
import { Mission, QualityCriteria } from '@voisss/shared/types/socialfi';

const missionService = createMissionServiceWithMemoryDatabase();

// Base reward by difficulty
const REWARD_BY_DIFFICULTY = {
  easy: 10,
  medium: 25,
  hard: 50,
};

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

/**
 * POST /api/missions/create
 * 
 * Creates a new mission with simplified form fields.
 * Automatically calculates baseReward from difficulty.
 * 
 * Validates:
 * - User address format and auth
 * - Dual-token requirements ($papajams + $voisss)
 * - Required fields (title, description, difficulty, duration)
 * - Duration and expiration ranges
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

    // Validate either-token requirement (at least $papajams OR $voisss required)
    const publicClient = createPublicClient({
      chain: base,
      transport: http(process.env.BASE_RPC_URL || undefined),
    });

    // Check $papajams balance (creator stake)
    const papajamsAddress = PLATFORM_CONFIG.papajamsToken.address;
    const papajamsBalance = await publicClient.readContract({
      address: papajamsAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`],
    });

    const meetsPapajamsRequirement = meetsCreatorRequirements(papajamsBalance);

    // Check $voisss balance (platform tier - need at least Basic tier)
    const voisssAddress = process.env.NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS as `0x${string}`;
    if (!voisssAddress) {
      return NextResponse.json(
        { error: 'Token configuration error' },
        { status: 500 }
      );
    }

    const voisssBalance = await publicClient.readContract({
      address: voisssAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress as `0x${string}`],
    });

    const tier = getTierForBalance(voisssBalance);
    const meetsVoisssRequirement = tier !== 'none';

    // At least one token requirement must be met
    if (!meetsPapajamsRequirement && !meetsVoisssRequirement) {
      return NextResponse.json(
        {
          error: 'Insufficient token balance',
          required: `Either ${PLATFORM_CONFIG.creatorRequirements.minTokenBalance} $papajams OR 10k $voisss (Basic tier minimum)`,
          papajamsBalance: papajamsBalance.toString(),
          voisssBalance: voisssBalance.toString(),
        },
        { status: 403 }
      );
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
