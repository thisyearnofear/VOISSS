import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { VoiceRecordsABI } from '@/contracts/VoiceRecordsABI';

/**
 * Blockchain Stats Tool - For ElevenLabs Agent
 * 
 * Returns statistics from the VoiceRecords contract on Base:
 * - Total recordings saved onchain
 * - Unique wallet connections (derived from event logs)
 */

// Initialize viem client for Base chain
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
});

export async function GET(request: NextRequest) {
  try {
    // Blockchain stats are public data - no authentication needed
    // These endpoints are read-only queries from the public blockchain

    const contractAddress = process.env.NEXT_PUBLIC_VOICE_RECORDS_CONTRACT as `0x${string}`;
    if (!contractAddress) {
      console.warn('VOICE_RECORDS_CONTRACT not configured');
      return NextResponse.json(
        { error: 'Contract not configured' },
        { status: 500 }
      );
    }

    // Fetch blockchain statistics
    const [totalRecordings, uniqueUsers] = await Promise.all([
      fetchTotalRecordings(contractAddress),
      fetchUniqueUsers(contractAddress),
    ]);

    const blockchainStats = {
      total_recordings: totalRecordings,
      unique_users: uniqueUsers,
      wallet_connections: uniqueUsers, // Same as unique users for now
      estimated_storage_mb: totalRecordings * 2.5, // Estimate ~2.5MB per recording
    };

    return NextResponse.json(blockchainStats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300', // Cache for 5 minutes (contract data changes less frequently)
      },
    });
  } catch (error) {
    console.error('Blockchain stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blockchain statistics' },
      { status: 500 }
    );
  }
}

/**
 * Fetch total recordings count from VoiceRecords contract
 */
async function fetchTotalRecordings(contractAddress: `0x${string}`): Promise<number> {
  try {
    const totalRecordings = await publicClient.readContract({
      address: contractAddress,
      abi: VoiceRecordsABI,
      functionName: 'getTotalRecordings',
    });

    return Number(totalRecordings) || 0;
  } catch (err) {
    console.error('Error fetching total recordings:', err);
    return 0;
  }
}

/**
 * Fetch unique users by querying RecordingSaved events
 * This counts unique owners from the contract events
 */
async function fetchUniqueUsers(contractAddress: `0x${string}`): Promise<number> {
  try {
    // Get the latest block to query events from
    const latestBlock = await publicClient.getBlockNumber();
    
    // Query RecordingSaved events - these have the owner address
    const logs = await publicClient.getLogs({
      address: contractAddress,
      event: {
        name: 'RecordingSaved',
        type: 'event',
        inputs: [
          {
            indexed: true,
            internalType: 'uint256',
            name: 'recordingId',
            type: 'uint256',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'owner',
            type: 'address',
          },
          {
            indexed: false,
            internalType: 'string',
            name: 'ipfsHash',
            type: 'string',
          },
          {
            indexed: false,
            internalType: 'string',
            name: 'title',
            type: 'string',
          },
          {
            indexed: false,
            internalType: 'bool',
            name: 'isPublic',
            type: 'bool',
          },
        ],
      },
      fromBlock: 0n,
      toBlock: latestBlock,
    });

    // Extract unique owners
    const uniqueOwners = new Set(
      logs.map((log) => {
        // The owner is the second indexed parameter (index 1)
        if (log.topics && log.topics[2]) {
          return log.topics[2];
        }
        return null;
      }).filter(Boolean)
    );

    return uniqueOwners.size;
  } catch (err) {
    console.error('Error fetching unique users:', err);
    
    // Fallback: try to estimate based on total recordings / average recordings per user
    // Assume ~3 recordings per user on average
    try {
      const totalRecordings = await fetchTotalRecordings(contractAddress);
      return Math.max(1, Math.ceil(totalRecordings / 3));
    } catch {
      return 0;
    }
  }
}

// Health check
export async function HEAD() {
  return NextResponse.json({}, { status: 200 });
}
