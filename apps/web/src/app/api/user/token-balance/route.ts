import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { VOISSS_TOKEN_ACCESS, getTierForBalance, getTokenExplorerUrl } from '@voisss/shared/config/tokenAccess';

/**
 * POST /api/user/token-balance
 *
 * Get user's $voisss token balance from Base chain with retry fallback.
 * Returns current tier and formatted balance with intelligent error handling.
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

// RPC providers with fallbacks
const RPC_PROVIDERS = [
  process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  'https://base.llamarpc.com', // Fallback RPC
];

async function fetchBalanceWithRetry(
  tokenAddress: `0x${string}`,
  userAddress: `0x${string}`,
  maxRetries: number = 2
): Promise<bigint> {
  let lastError: Error | null = null;

  // Try each RPC provider
  for (const rpcUrl of RPC_PROVIDERS) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[token-balance] Attempting RPC: ${rpcUrl} (attempt ${attempt + 1})`);
        
        const publicClient = createPublicClient({
          chain: base,
          transport: http(rpcUrl, { timeout: 10000 }), // 10s timeout
        });

        const balance = await Promise.race([
          publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [userAddress],
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('RPC timeout')), 10000)
          ),
        ]);

        console.log(`[token-balance] Successfully fetched balance: ${balance.toString()}`);
        return balance;
      } catch (error) {
        lastError = error as Error;
        console.warn(
          `[token-balance] RPC attempt failed: ${(error as Error).message}`,
          { rpcUrl, attempt }
        );

        // Wait before retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
  }

  // All attempts failed
  throw lastError || new Error('All RPC providers failed');
}

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

    // Fetch balance with retry logic
    const balance = await fetchBalanceWithRetry(
      queryTokenAddress,
      address as `0x${string}`
    );

    // Determine tier based on balance
    const tier = getTierForBalance(balance);

    // Return formatted response with aggressive caching
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
      { 
        status: 200, 
        headers: { 'Cache-Control': 'public, max-age=60' } // Cache for 60s
      }
    );

  } catch (error) {
    console.error('[token-balance] All retry attempts failed:', error);
    
    // Return degraded response but with 200 status to allow graceful UI degradation
    const queryTokenAddress = (tokenAddress || 
      process.env.NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS) as `0x${string}`;
    
    return NextResponse.json(
      {
        error: 'Unable to fetch token balance',
        balanceStatus: 'fallback',
        balance: '0', // Default to zero balance
        tier: 'none', // Default to no tier
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
      { 
        status: 200, // Return 200 for graceful client-side degradation
        headers: { 'Cache-Control': 'no-cache' } // Don't cache error responses
      }
    );
  }
}
