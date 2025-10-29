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

// Lazy initialization of spender wallet to avoid build-time errors
let spenderWalletInstance: ReturnType<typeof createWalletClient> | null = null;
let spenderAddressInstance: Address | null = null;



// Export lazy-initialized wallet and address
export const spenderWallet = new Proxy({} as any, {
  get(target, prop) {
    initializeSpenderWallet();
    return (spenderWalletInstance as any)[prop];
  }
});

// Export a getter function for the spender address
export function getSpenderAddress(): Address {
  initializeSpenderWallet();
  return spenderAddressInstance!;
}

// Address verification will happen on first access
function verifySpenderAddress() {
  if (process.env.NEXT_PUBLIC_SPENDER_ADDRESS) {
    const expectedAddress = process.env.NEXT_PUBLIC_SPENDER_ADDRESS.toLowerCase();
    const actualAddress = spenderAddressInstance!.toLowerCase();

    if (expectedAddress !== actualAddress) {
      throw new Error(
        `Spender address mismatch! ` +
        `Expected: ${expectedAddress}, ` +
        `Got: ${actualAddress}. ` +
        `Please update NEXT_PUBLIC_SPENDER_ADDRESS in your .env file.`
      );
    }
  }
}

// Add verification to the initialization
function initializeSpenderWallet() {
  if (!spenderWalletInstance) {
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
    spenderWalletInstance = createWalletClient({
      account: spenderAccount,
      chain: base,
      transport: http(process.env.BASE_RPC_URL),
    }).extend(publicActions);

    spenderAddressInstance = spenderAccount.address;

    // Verify address after initialization
    verifySpenderAddress();

    console.log('✅ Spender wallet initialized:', spenderAddressInstance);
  }
  return spenderWalletInstance!;
}