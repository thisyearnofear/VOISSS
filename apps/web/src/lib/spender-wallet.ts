/**
 * Backend Spender Wallet Configuration
 * 
 * This wallet executes gasless transactions on behalf of users who have
 * granted spend permissions. It should ONLY be used server-side.
 * 
 * Security: NEVER expose SPENDER_PRIVATE_KEY to the frontend!
 */

import { createWalletClient, http, publicActions, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// Validate environment variables
if (!process.env.SPENDER_PRIVATE_KEY) {
  throw new Error('SPENDER_PRIVATE_KEY environment variable is required');
}

if (!process.env.BASE_RPC_URL) {
  throw new Error('BASE_RPC_URL environment variable is required');
}

// Create spender account from private key
const spenderAccount = privateKeyToAccount(process.env.SPENDER_PRIVATE_KEY as `0x${string}`);

// Create wallet client with public actions for reading
export const spenderWallet = createWalletClient({
  account: spenderAccount,
  chain: base,
  transport: http(process.env.BASE_RPC_URL),
}).extend(publicActions);

// Export spender address for frontend use
export const SPENDER_ADDRESS: Address = spenderAccount.address;

// Verify spender address matches environment variable (if provided)
if (process.env.NEXT_PUBLIC_SPENDER_ADDRESS) {
  const expectedAddress = process.env.NEXT_PUBLIC_SPENDER_ADDRESS.toLowerCase();
  const actualAddress = SPENDER_ADDRESS.toLowerCase();
  
  if (expectedAddress !== actualAddress) {
    throw new Error(
      `Spender address mismatch! ` +
      `Expected: ${expectedAddress}, ` +
      `Got: ${actualAddress}. ` +
      `Please update NEXT_PUBLIC_SPENDER_ADDRESS in your .env file.`
    );
  }
}

console.log('✅ Spender wallet initialized:', SPENDER_ADDRESS);