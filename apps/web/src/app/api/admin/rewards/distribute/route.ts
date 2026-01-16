import { NextRequest, NextResponse } from 'next/server';
import { createMissionService } from '@voisss/shared/services/persistent-mission-service';

const missionService = createMissionService();

/**
 * POST /api/admin/rewards/distribute
 * 
 * Manually distribute tokens to user wallets based on their submission engagement
 * This is where you decide who gets paid and how much
 * 
 * Request body:
 * {
 *   submissionId: string,
 *   walletAddress: string,
 *   customRewardAmount?: number (overrides auto-calculation),
 *   papajamsAmount: number (total $papajams to send),
 *   voisssAmount: number (total $voisss to send),
 *   notes?: string (why they're being rewarded, what for)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   distribution: {
 *     submissionId,
 *     walletAddress,
 *     papajamsAmount,
 *     voisssAmount,
 *     totalValue,
 *     notes,
 *     distributedAt
 *   }
 * }
 * 
 * NOTE: This endpoint logs the distribution but does NOT actually send tokens.
 * Token transfer happens separately via Web3 transaction (implemented in #8 follow-up)
 */

interface RewardDistributionRequest {
  submissionId: string;
  walletAddress: string;
  customRewardAmount?: number;
  papajamsAmount: number;
  voisssAmount: number;
  notes?: string;
}

// In-memory log of distributions (in production, this would be a database)
const distributionLog: Array<{
  id: string;
  submissionId: string;
  walletAddress: string;
  papajamsAmount: number;
  voisssAmount: number;
  notes?: string;
  distributedAt: Date;
  status: 'pending_transaction' | 'sent' | 'failed';
}> = [];

export async function POST(request: NextRequest) {
  try {
    const body: RewardDistributionRequest = await request.json();

    // Validate required fields
    if (!body.submissionId || !body.walletAddress || body.papajamsAmount === undefined || body.voisssAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: submissionId, walletAddress, papajamsAmount, voisssAmount' },
        { status: 400 }
      );
    }

    // Validate amounts are non-negative
    if (body.papajamsAmount < 0 || body.voisssAmount < 0) {
      return NextResponse.json(
        { error: 'Amounts must be non-negative' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!body.walletAddress.startsWith('0x') || body.walletAddress.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // Fetch submission to verify it exists
    const submission = await missionService.getSubmission(body.submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: `Submission not found: ${body.submissionId}` },
        { status: 404 }
      );
    }

    // Verify wallet matches submission user
    if (submission.userId.toLowerCase() !== body.walletAddress.toLowerCase()) {
      return NextResponse.json(
        { error: `Wallet address does not match submission user. Expected ${submission.userId}` },
        { status: 403 }
      );
    }

    // Log the distribution
    const distributionId = `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const distribution = {
      id: distributionId,
      submissionId: body.submissionId,
      walletAddress: body.walletAddress,
      papajamsAmount: body.papajamsAmount,
      voisssAmount: body.voisssAmount,
      notes: body.notes,
      distributedAt: new Date(),
      status: 'pending_transaction' as const,
    };

    distributionLog.push(distribution);

    return NextResponse.json(
      {
        success: true,
        distribution,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Reward distribution error:', error);
    const message = error instanceof Error ? error.message : 'Failed to distribute rewards';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/admin/rewards/distributions
 * 
 * List all reward distributions with optional filters
 * 
 * Query params:
 * - submissionId: filter by submission
 * - walletAddress: filter by wallet
 * - status: 'pending_transaction' | 'sent' | 'failed'
 * - after: ISO date (distributions after this date)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    let filtered = [...distributionLog];

    if (searchParams.has('submissionId')) {
      const submissionId = searchParams.get('submissionId');
      filtered = filtered.filter(d => d.submissionId === submissionId);
    }

    if (searchParams.has('walletAddress')) {
      const wallet = searchParams.get('walletAddress');
      filtered = filtered.filter(d => d.walletAddress.toLowerCase() === wallet?.toLowerCase());
    }

    if (searchParams.has('status')) {
      const status = searchParams.get('status');
      filtered = filtered.filter(d => d.status === status);
    }

    if (searchParams.has('after')) {
      const afterStr = searchParams.get('after');
      if (afterStr) {
        const after = new Date(afterStr);
        filtered = filtered.filter(d => d.distributedAt >= after);
      }
    }

    // Sort by date, newest first
    filtered.sort((a, b) => b.distributedAt.getTime() - a.distributedAt.getTime());

    return NextResponse.json(
      {
        distributions: filtered,
        total: filtered.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching distributions:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch distributions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
