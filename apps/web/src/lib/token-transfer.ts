/**
 * Token Transfer Utility
 * Executes $voisss token transfers via user's wallet
 * Used for burning tokens to standard burn address
 */

import { encodeFunctionData, parseAbi } from 'viem';

const ERC20_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
]);

export const STANDARD_BURN_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export interface ExecuteTokenTransferParams {
  tokenAddress: `0x${string}`;
  to: `0x${string}`;
  amount: bigint;
}

/**
 * Encode token transfer data for Sub Account execution
 * Returns the encoded function call data
 */
export function encodeTokenTransfer({
  tokenAddress,
  to,
  amount,
}: ExecuteTokenTransferParams): `0x${string}` {
  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [to, amount],
  });
}

/**
 * Burn tokens by transferring to standard burn address
 * Returns encoded call data for Sub Account to execute
 */
export function encodeBurnTokens(
  tokenAddress: `0x${string}`,
  amount: bigint
): `0x${string}` {
  return encodeTokenTransfer({
    tokenAddress,
    to: STANDARD_BURN_ADDRESS,
    amount,
  });
}

/**
 * Execute token transfer via user's wallet
 * Requires wagmi wallet connection
 */
export async function executeTokenTransferViaWallet({
  tokenAddress,
  to,
  amount,
  sendTransaction,
}: ExecuteTokenTransferParams & {
  sendTransaction: (args: any) => Promise<string>;
}): Promise<string> {
  const data = encodeTokenTransfer({
    tokenAddress,
    to,
    amount,
  });

  // Send transaction via user's connected wallet
  const txHash = await sendTransaction({
    to: tokenAddress,
    data,
  });

  return txHash;
}
