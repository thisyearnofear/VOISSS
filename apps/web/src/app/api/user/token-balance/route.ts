import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { VOISSS_TOKEN_ACCESS, getTierForBalance, getTokenExplorerUrl } from '@voisss/shared/config/tokenAccess';

/**
 * POST /api/user/token-balance
 * 
 * Get user's $voisss token balance from Base chain
 * Returns current tier and formatted balance
 * 
 * Supports both $voisss and $papajams queries via tokenAddress parameter
 */

interface TokenBalanceRequest {
  address: string;
  tokenAddress?: string;
  chainId?: number;
}

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
] as const;

export async function POST(request: NextRequest) {
  let tokenAddress: string | undefined;
  let address: string | undefined;
  
  try {
    const body: TokenBalanceRequest = await request.json();
    address = body.address;
    tokenAddress = body.tokenAddress;

    // Validate address
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      );
    }

    // Determine which token to query
    const queryTokenAddress = (tokenAddress || 
      process.env.NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS) as `0x${string}`;
    
    if (!queryTokenAddress) {
      return NextResponse.json(
        { error: 'Token address not configured' },
        { status: 500 }
      );
    }

    // Create public client for Base chain
    const rpcUrl = process.env.BASE_RPC_URL;
    console.log('[token-balance] RPC URL:', rpcUrl ? `${rpcUrl.substring(0, 30)}...` : 'UNDEFINED');
    
    const publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl || undefined),
    });

    // Fetch balance from contract
    const balance = await publicClient.readContract({
      address: queryTokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

    // Determine tier based on balance
    const tier = getTierForBalance(balance);

    // Return formatted response
    return NextResponse.json(
      {
        address,
        tokenAddress: queryTokenAddress,
        balance: balance.toString(),
        tier,
        decimals: VOISSS_TOKEN_ACCESS.decimals,
        symbol: VOISSS_TOKEN_ACCESS.symbol,
        chainId: 8453, // Base mainnet
      },
      { status: 200, headers: { 'Cache-Control': 'public, max-age=30' } } // Cache for 30s
    );

  } catch (error) {
    console.error('[token-balance] Error:', error);
    
    // NEW: Return fallback options for graceful degradation
    const queryTokenAddress = (tokenAddress || 
      process.env.NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS) as `0x${string}`;
    
    return NextResponse.json(
      {
        error: 'Unable to fetch token balance',
        balanceStatus: 'fallback',
        fallbackOptions: [
          {
            type: 'manual_verify',
            label: 'Check on BaseScan',
            description: 'View your balance directly on the blockchain explorer',
            url: `${getTokenExplorerUrl('voisss')}?a=${address}`,
          },
          {
            type: 'retry',
            label: 'Retry Now',
            description: 'Retry the balance check',
          },
        ],
      },
      { status: 502 } // Service temporarily unavailable
    );
  }
}
