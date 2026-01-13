import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { BurnActionRequest, BurnActionResult, type BurnActionType } from '@voisss/shared/services/token-burn-service';
import { VOISSS_TOKEN_ACCESS } from '@voisss/shared/config/tokenAccess';

/**
 * POST /api/token/burn
 * 
 * Validate and log $voisss burn action
 * User's Sub Account executes the actual token transfer (gasless)
 * 
 * Request body:
 * {
 *   action: 'video_export' | 'nft_mint' | 'white_label_export' | 'batch_operation_overage',
 *   userId: string (user address),
 *   recordingId: string (uuid),
 *   metadata?: Record<string, any>
 * }
 * 
 * Response includes:
 * - success: boolean
 * - cost: bigint (in wei)
 * - burnAddress: standard burn address (0x000...000)
 */

// ERC20 balanceOf ABI
const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
]);

const VOISSS_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS as `0x${string}`;
const STANDARD_BURN_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

if (!VOISSS_TOKEN_ADDRESS) {
  console.error('[token/burn] NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS not configured');
}

export async function POST(request: NextRequest) {
  try {
    const body: BurnActionRequest = await request.json();

    // Validate request
    if (!body.action || !body.userId || !body.recordingId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, userId, recordingId' },
        { status: 400 }
      );
    }

    // Validate address
    if (!body.userId.startsWith('0x') || body.userId.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid user address' },
        { status: 400 }
      );
    }

    // Validate action exists
    const action = VOISSS_TOKEN_ACCESS.burnActions[body.action as BurnActionType];
    if (!action) {
      return NextResponse.json(
        { error: `Unknown burn action: ${body.action}` },
        { status: 400 }
      );
    }

    // Verify user has sufficient balance
    const publicClient = createPublicClient({
      chain: base,
      transport: http(process.env.BASE_RPC_URL || undefined),
    });

    const userBalance = await publicClient.readContract({
      address: VOISSS_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [body.userId as `0x${string}`],
    });

    if (userBalance < action.cost) {
      return NextResponse.json(
        {
          error: 'Insufficient balance for burn action',
          required: action.cost.toString(),
          available: userBalance.toString(),
        },
        { status: 402 } // Payment Required
      );
    }

    // Queue associated action asynchronously (video generation, NFT minting, etc.)
    executeAction(body.action as string, body.recordingId, body.metadata || {}).catch(err => {
      console.error(`[token/burn] Failed to execute action ${body.action}:`, err);
    });

    // Log burn event for analytics
    logBurnEvent({
      action: body.action as string,
      userId: body.userId,
      recordingId: body.recordingId,
      cost: action.cost.toString(),
      timestamp: new Date().toISOString(),
    });

    // Return success - frontend will execute the actual token transfer via user's wallet
    const result: BurnActionResult = {
      success: true,
      cost: action.cost,
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('[token/burn] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Burn action failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Execute the action associated with burn (async, fire-and-forget)
 * Examples: generate video, mint NFT, enable white-label export, etc.
 */
async function executeAction(
  action: string,
  recordingId: string,
  metadata: Record<string, any>
): Promise<void> {
  switch (action) {
    case 'video_export':
      // TODO: Queue video generation job (Runway/Synthesia API)
      console.log('[token/burn] Queuing video export for', recordingId);
      break;
      
    case 'nft_mint':
      // TODO: Call NFT minting service
      console.log('[token/burn] Queuing NFT mint for', recordingId);
      break;
      
    case 'white_label_export':
      // TODO: Create white-label export config
      console.log('[token/burn] Creating white-label export for', recordingId);
      break;
      
    case 'batch_operation_overage':
      // Overage is just a fee - no additional action
      console.log('[token/burn] Batch overage fee charged for', recordingId);
      break;
      
    default:
      console.warn('[token/burn] Unknown action:', action);
  }
}

/**
 * Log burn events for analytics (to database/event stream)
 */
async function logBurnEvent(event: {
  action: string;
  userId: string;
  recordingId: string;
  cost: string;
  timestamp: string;
}): Promise<void> {
  // TODO: Send to analytics/logging service
  // For now, just console log
  console.log('[token/burn] Event:', event);
}
