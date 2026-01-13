/**
 * Token Burn Service
 * Handles premium output purchases requiring $voisss burn
 * 
 * Only resource-intensive actions trigger burns:
 * - Video exports (Runway/Synthesia cost)
 * - NFT minting (gas + storage)
 * - White-label exports (licensing)
 * - Batch operation overages (anti-abuse)
 */

import { VOISSS_TOKEN_ACCESS, getBurnActionCost } from '../config/tokenAccess';

export type BurnActionType = keyof typeof VOISSS_TOKEN_ACCESS.burnActions;

export interface BurnActionRequest {
  action: BurnActionType;
  userId: string;
  recordingId: string;
  metadata?: Record<string, any>;
}

export interface BurnActionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  cost: bigint;
}

/**
 * Validate if user can afford burn action
 */
export function canAffordBurnAction(
  userBalance: bigint,
  actionType: BurnActionType
): boolean {
  const cost = getBurnActionCost(actionType as string);
  if (!cost) return false;
  return userBalance >= cost;
}

/**
 * Get cost for burn action with formatting
 */
export function getBurnActionDisplay(actionType: BurnActionType | string): {
  cost: bigint;
  costFormatted: string;
  label: string;
  description: string;
} | null {
  const action = VOISSS_TOKEN_ACCESS.burnActions[actionType as unknown as BurnActionType];
  if (!action) return null;

  return {
    cost: action.cost,
    costFormatted: formatBurnCost(action.cost),
    label: action.label,
    description: action.description,
  };
}

/**
 * Format burn action cost for display
 */
export function formatBurnCost(cost: bigint, decimals: number = 18): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const wholePart = cost / divisor;
  return `${wholePart} $voisss`;
}

/**
 * Submit burn action to backend
 * User must have already signed approval
 */
export async function submitBurnAction(
  request: BurnActionRequest
): Promise<BurnActionResult> {
  try {
    const action = VOISSS_TOKEN_ACCESS.burnActions[request.action];
    if (!action) {
      return {
        success: false,
        error: `Unknown burn action: ${request.action}`,
        cost: 0n,
      };
    }

    const response = await fetch('/api/token/burn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Burn action failed',
        cost: action.cost,
      };
    }

    const result = await response.json();
    return {
      success: true,
      transactionHash: result.txHash,
      cost: action.cost,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: message,
      cost: getBurnActionCost(request.action as string) || 0n,
    };
  }
}

/**
 * Batch operation overage calculator
 * Protects against abuse by charging per transform over daily limit
 */
export interface BatchOperationCost {
  totalOperations: number;
  dailyLimit: number;
  operationsOverLimit: number;
  costPerOverage: bigint;
  totalBurnCost: bigint;
  shouldCharge: boolean;
}

export function calculateBatchOverageCost(
  operationCount: number,
  dailyLimit: number = 100
): BatchOperationCost {
  const operationsOverLimit = Math.max(0, operationCount - dailyLimit);
  const costPerOverage = getBurnActionCost('batch_operation_overage' as string) || BigInt(1);
  const totalBurnCost = BigInt(operationsOverLimit) * costPerOverage;

  return {
    totalOperations: operationCount,
    dailyLimit,
    operationsOverLimit,
    costPerOverage,
    totalBurnCost,
    shouldCharge: operationsOverLimit > 0,
  };
}
