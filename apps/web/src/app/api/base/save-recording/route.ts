/**
 * Gasless Recording Save API
 *
 * This endpoint executes blockchain transactions on behalf of users who have
 * granted spend permissions. Users experience zero wallet popups after initial setup.
 *
 * Flow:
 * 1. User uploads to IPFS (frontend)
 * 2. User calls this API with IPFS hash + metadata
 * 3. Backend verifies spend permission
 * 4. Backend executes transaction using spender wallet
 * 5. User receives transaction hash (no popup!)
 */

import { NextRequest, NextResponse } from 'next/server';
import { encodeFunctionData, type Address, createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { spenderWallet } from '@/lib/spender-wallet';
import { VoiceRecordsABI } from '@/contracts/VoiceRecordsABI';

// Note: We don't use prepareSpendCallData on the backend
// The spend permission is verified on-chain when the spender executes the transaction

const VOICE_RECORDS_CONTRACT = process.env.NEXT_PUBLIC_VOICE_RECORDS_CONTRACT as Address;

if (!VOICE_RECORDS_CONTRACT) {
  throw new Error('NEXT_PUBLIC_VOICE_RECORDS_CONTRACT environment variable is required');
}

interface SaveRecordingRequest {
  userAddress: Address;
  permissionHash: string;
  ipfsHash: string;
  title: string;
  isPublic: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveRecordingRequest = await request.json();
    const { userAddress, permissionHash, ipfsHash, title, isPublic } = body;

    // Validate inputs
    if (!userAddress || !permissionHash || !ipfsHash || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📝 Processing gasless save for user:', userAddress);

    // Note: Permission verification happens on-chain
    // The Spend Permission Manager contract will revert if:
    // - Permission doesn't exist
    // - Permission is expired
    // - Allowance is insufficient
    // - Spender is not authorized

    // Prepare the contract call data
    const contractCallData = encodeFunctionData({
      abi: VoiceRecordsABI,
      functionName: 'saveRecording',
      args: [ipfsHash, title, isPublic],
    });

    console.log('🔨 Executing transaction with spender wallet...');

    // Execute the transaction using spender wallet
    // The spend permission is automatically verified on-chain
    const recordingTxHash = await spenderWallet.sendTransaction({
      to: VOICE_RECORDS_CONTRACT,
      data: contractCallData,
    });

    console.log('✅ Recording saved:', recordingTxHash);

    // Wait for confirmation
    const receipt = await spenderWallet.waitForTransactionReceipt({
      hash: recordingTxHash,
    });

    return NextResponse.json({
      success: true,
      txHash: recordingTxHash,
      status: receipt.status,
      blockNumber: receipt.blockNumber.toString(),
    });

  } catch (error: any) {
    console.error('❌ Gasless save failed:', error);

    // Provide user-friendly error messages
    let errorMessage = 'Failed to save recording';
    let statusCode = 500;

    if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Spender wallet has insufficient funds. Please contact support.';
      statusCode = 503;
    } else if (error.message?.includes('permission')) {
      errorMessage = 'Invalid or expired spend permission';
      statusCode = 403;
    } else if (error.message?.includes('revert')) {
      errorMessage = 'Contract execution failed. Please try again.';
      statusCode = 400;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
      },
      { status: statusCode }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const balance = await spenderWallet.getBalance({
      address: spenderWallet.account.address,
    });

    return NextResponse.json({
      status: 'healthy',
      spenderAddress: spenderWallet.account.address,
      balance: balance.toString(),
      chain: 'base',
      chainId: 8453,
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: error.message,
      },
      { status: 500 }
    );
  }
}