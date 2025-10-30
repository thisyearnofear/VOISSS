/**
 * Backend Spender Wallet Configuration
 * 
 * This wallet executes gasless transactions on behalf of users who have
 * granted spend permissions. It should ONLY be used server-side.
 * 
 * Security: NEVER expose SPENDER_PRIVATE_KEY to the frontend!
 */

const { createWalletClient, http, publicActions } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { base } = require('viem/chains');

// Lazy initialization of spender wallet to avoid build-time errors
let spenderWalletInstance = null;
let spenderAddressInstance = null;

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
    const spenderAccount = privateKeyToAccount(process.env.SPENDER_PRIVATE_KEY);

    // Create wallet client with public actions for reading
    spenderWalletInstance = createWalletClient({
      account: spenderAccount,
      chain: base,
      transport: http(process.env.BASE_RPC_URL),
    }).extend(publicActions);

    spenderAddressInstance = spenderAccount.address;

    console.log('✅ Spender wallet initialized:', spenderAddressInstance);
  }
  return spenderWalletInstance;
}

// Export lazy-initialized wallet and address
const spenderWallet = new Proxy({}, {
  get(target, prop) {
    initializeSpenderWallet();
    return spenderWalletInstance[prop];
  }
});

function getSpenderAddress() {
  initializeSpenderWallet();
  return spenderAddressInstance;
}

module.exports = { spenderWallet, getSpenderAddress };
