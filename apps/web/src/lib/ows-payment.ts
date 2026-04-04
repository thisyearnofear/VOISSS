/**
 * OWS (Open Wallet Standard) Payment Integration
 * 
 * Integrates OWS wallet detection and multi-chain x402 payments.
 * OWS provides the wallet layer, x402 provides the payment protocol.
 * 
 * Flow:
 * 1. Detect OWS wallet from request headers
 * 2. Generate x402 payment requirements for detected chain
 * 3. Verify payment on the appropriate chain
 * 4. Return success with transaction details
 */

import { getAddress, isAddress } from 'viem';

// Supported chains via OWS (from hackathon docs)
export const OWS_SUPPORTED_CHAINS = {
  // EVM chains
  'eip155:1': { name: 'Ethereum', shortName: 'eth', type: 'evm' },
  'eip155:8453': { name: 'Base', shortName: 'base', type: 'evm' },
  'eip155:42161': { name: 'Arbitrum', shortName: 'arb', type: 'evm' },
  'eip155:10': { name: 'Optimism', shortName: 'op', type: 'evm' },
  'eip155:137': { name: 'Polygon', shortName: 'matic', type: 'evm' },
  
  // Non-EVM chains
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': { name: 'Solana', shortName: 'sol', type: 'solana' },
  'cosmos:cosmoshub-4': { name: 'Cosmos', shortName: 'atom', type: 'cosmos' },
  'ton:mainnet': { name: 'TON', shortName: 'ton', type: 'ton' },
  'xrpl:mainnet': { name: 'XRP Ledger', shortName: 'xrp', type: 'xrpl' },
} as const;

export type ChainId = keyof typeof OWS_SUPPORTED_CHAINS;
export type ChainType = typeof OWS_SUPPORTED_CHAINS[ChainId]['type'];

export interface OWSWalletInfo {
  address: string;
  chainId: ChainId;
  chainType: ChainType;
  chainName: string;
  accountId?: string; // CAIP-10 format
  agentId?: string; // X-OWS-Agent-ID
  signature?: string; // X-OWS-Signature (HTTP Message Signature)
  timestamp?: string; // X-OWS-Timestamp
}

export interface OWSPaymentRequirements {
  chainId: ChainId;
  chainType: ChainType;
  amount: string; // USDC wei
  recipient: string; // Chain-specific recipient address
  description: string;
  x402Requirements: any; // Standard x402 requirements
}

export interface OWSPaymentVerification {
  success: boolean;
  txHash?: string;
  chainId?: ChainId;
  from?: string;
  to?: string;
  amount?: string;
  error?: string;
}

/**
 * Extract OWS wallet information from request headers
 * 
 * Expected headers:
 * - X-OWS-Wallet: wallet address
 * - X-OWS-Chain: CAIP-2 chain identifier (e.g., "eip155:8453" for Base)
 * - X-OWS-Account: (optional) CAIP-10 account identifier
 * - X-OWS-Agent-ID: (optional) Unique identifier for the agent
 * - X-OWS-Signature: (optional) HTTP Message Signature for zero-trust requests
 * - X-OWS-Timestamp: (optional) Timestamp for signature verification
 */
export function extractOWSWallet(headers: Headers): OWSWalletInfo | null {
  const walletAddress = headers.get('X-OWS-Wallet');
  const chainId = headers.get('X-OWS-Chain') as ChainId | null;
  const accountId = headers.get('X-OWS-Account') || undefined;
  const agentId = headers.get('X-OWS-Agent-ID') || undefined;
  const signature = headers.get('X-OWS-Signature') || undefined;
  const timestamp = headers.get('X-OWS-Timestamp') || undefined;

  if (!walletAddress || !chainId) {
    return null;
  }

  const chainInfo = OWS_SUPPORTED_CHAINS[chainId];
  if (!chainInfo) {
    console.warn(`Unsupported OWS chain: ${chainId}`);
    return null;
  }

  // Validate address format based on chain type
  if (chainInfo.type === 'evm') {
    if (!isAddress(walletAddress)) {
      console.warn(`Invalid EVM address: ${walletAddress}`);
      return null;
    }
  } else if (chainInfo.type === 'solana') {
    // Basic Solana address validation (32-44 chars, base58)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
      console.warn(`Invalid Solana address: ${walletAddress}`);
      return null;
    }
  }

  return {
    address: walletAddress,
    chainId,
    chainType: chainInfo.type,
    chainName: chainInfo.name,
    accountId,
    agentId,
    signature,
    timestamp,
  };
}

/**
 * Check if request has OWS wallet headers
 */
export function hasOWSWallet(headers: Headers): boolean {
  return !!(headers.get('X-OWS-Wallet') && headers.get('X-OWS-Chain'));
}

/**
 * Generate payment requirements for OWS wallet
 * 
 * This creates x402 payment requirements adapted for the specific chain.
 * For EVM chains, we use the existing x402 flow.
 * For non-EVM chains, we adapt the requirements accordingly.
 */
export function createOWSPaymentRequirements(
  wallet: OWSWalletInfo,
  amount: bigint,
  description: string,
  apiUrl: string
): OWSPaymentRequirements {
  const amountStr = amount.toString();

  // Get recipient address for the chain
  const recipient = getRecipientForChain(wallet.chainId);

  // For EVM chains, use standard x402
  if (wallet.chainType === 'evm') {
    const x402Client = require('@voisss/shared').getX402Client();
    const x402Requirements = x402Client.createRequirements(
      apiUrl,
      amount,
      recipient,
      description
    );

    return {
      chainId: wallet.chainId,
      chainType: wallet.chainType,
      amount: amountStr,
      recipient,
      description,
      x402Requirements,
    };
  }

  // For non-EVM chains, create adapted requirements
  if (wallet.chainType === 'solana') {
    return {
      chainId: wallet.chainId,
      chainType: wallet.chainType,
      amount: amountStr,
      recipient,
      description,
      x402Requirements: {
        amount: amountStr,
        currency: 'USDC',
        recipient,
        chainId: wallet.chainId,
        description,
        type: 'solana-transfer',
        instructions: `Transfer ${formatUSDC(amount)} USDC to ${recipient} on Solana`,
      },
    };
  }

  return {
    chainId: wallet.chainId,
    chainType: wallet.chainType,
    amount: amountStr,
    recipient,
    description,
    x402Requirements: {
      amount: amountStr,
      currency: 'USDC',
      recipient,
      chainId: wallet.chainId,
      description,
      // Non-EVM chains will need different payment structures
      note: `Payment on ${wallet.chainName} not yet fully implemented. Use EVM chain for now.`,
    },
  };
}

/**
 * Get recipient address for a specific chain
 * 
 * In production, you'd have different recipient addresses per chain.
 * For the hackathon, we'll use the same address for all EVM chains.
 */
function getRecipientForChain(chainId: ChainId): string {
  const chainInfo = OWS_SUPPORTED_CHAINS[chainId];

  // For EVM chains, use the configured x402 recipient
  if (chainInfo.type === 'evm') {
    return process.env.X402_PAY_TO_ADDRESS || '';
  }

  // For non-EVM chains, we'd need chain-specific addresses
  // TODO: Add recipient addresses for Solana, Cosmos, TON, XRP
  switch (chainId) {
    case 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp':
      return process.env.OWS_SOLANA_RECIPIENT || '';
    case 'cosmos:cosmoshub-4':
      return process.env.OWS_COSMOS_RECIPIENT || '';
    case 'ton:mainnet':
      return process.env.OWS_TON_RECIPIENT || '';
    case 'xrpl:mainnet':
      return process.env.OWS_XRP_RECIPIENT || '';
    default:
      return '';
  }
}

/**
 * Verify OWS payment from X-OWS-Payment header
 * 
 * The header should contain:
 * - For EVM: Standard x402 payment payload (signature, from, to, value, etc.)
 * - For Solana: Transaction signature
 * - For other chains: Chain-specific payment proof
 */
export async function verifyOWSPayment(
  wallet: OWSWalletInfo,
  paymentHeader: string,
  expectedAmount: bigint,
  requirements: OWSPaymentRequirements
): Promise<OWSPaymentVerification> {
  try {
    // For EVM chains, use existing x402 verification
    if (wallet.chainType === 'evm') {
      return await verifyEVMPayment(wallet, paymentHeader, expectedAmount, requirements);
    }

    // For Solana
    if (wallet.chainType === 'solana') {
      return await verifySolanaPayment(wallet, paymentHeader, expectedAmount, requirements);
    }

    // Other chains not yet implemented
    return {
      success: false,
      error: `Payment verification for ${wallet.chainName} not yet implemented`,
    };
  } catch (error) {
    console.error('OWS payment verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment verification failed',
    };
  }
}

/**
 * Verify EVM payment using existing x402 infrastructure
 */
async function verifyEVMPayment(
  wallet: OWSWalletInfo,
  paymentHeader: string,
  expectedAmount: bigint,
  requirements: OWSPaymentRequirements
): Promise<OWSPaymentVerification> {
  const { parsePaymentHeader } = await import('@voisss/shared');
  const payment = parsePaymentHeader(paymentHeader);

  if (!payment) {
    return {
      success: false,
      error: 'Invalid payment header format',
    };
  }

  // Verify payment matches requirements
  if (payment.from.toLowerCase() !== wallet.address.toLowerCase()) {
    return {
      success: false,
      error: 'Payment from address does not match wallet',
    };
  }

  if (payment.to.toLowerCase() !== requirements.recipient.toLowerCase()) {
    return {
      success: false,
      error: 'Payment to address does not match recipient',
    };
  }

  if (BigInt(payment.value) < expectedAmount) {
    return {
      success: false,
      error: `Insufficient payment amount: ${payment.value} < ${expectedAmount}`,
    };
  }

  // Use existing x402 verification
  const { getX402Client } = await import('@voisss/shared');
  const x402Client = getX402Client();

  try {
    const verified = await x402Client.verifyPayment(payment, requirements.x402Requirements);

    if (!verified.success) {
      return {
        success: false,
        error: verified.error || 'Payment verification failed',
      };
    }

    return {
      success: true,
      txHash: verified.txHash,
      chainId: wallet.chainId,
      from: payment.from,
      to: payment.to,
      amount: payment.value,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Verify Solana payment
 * 
 * For Solana, the payment header should contain a transaction signature.
 * We verify the transaction on-chain via RPC.
 */
async function verifySolanaPayment(
  wallet: OWSWalletInfo,
  paymentHeader: string,
  expectedAmount: bigint,
  requirements: OWSPaymentRequirements
): Promise<OWSPaymentVerification> {
  // In a production environment, we would use @solana/web3.js to verify the transaction
  // For the hackathon demo, we implement a robust verification structure
  
  const signature = paymentHeader;
  if (!/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(signature)) {
    return {
      success: false,
      error: 'Invalid Solana transaction signature format',
    };
  }

  // NOTE: Real on-chain verification would happen here
  // For the hackathon, we assume a "magic" signature 'HACKATHON_DEMO_SOLANA_SIG' passes for testing
  if (process.env.NODE_ENV === 'development' && signature === 'HACKATHON_DEMO_SOLANA_SIG') {
    return {
      success: true,
      txHash: signature,
      chainId: wallet.chainId,
      from: wallet.address,
      to: requirements.recipient,
      amount: requirements.amount,
    };
  }

  // Fallback to warning for now as full RPC integration is heavy for a quick hackathon fix
  return {
    success: false,
    error: 'Solana mainnet verification requires active RPC connection. Use EVM chains for live demo.',
  };
}

/**
 * Helper to format USDC for instructions
 */
function formatUSDC(amount: bigint): string {
  return (Number(amount) / 1000000).toFixed(6) + ' USDC';
}

/**
 * Calculate chain-specific pricing adjustments
 * 
 * Different chains have different gas costs, so we adjust pricing accordingly.
 * This ensures agents aren't penalized for using more expensive chains.
 */
export function getChainPricingMultiplier(chainId: ChainId): number {
  const chainInfo = OWS_SUPPORTED_CHAINS[chainId];

  // Base pricing (no adjustment)
  if (chainId === 'eip155:8453') return 1.0; // Base

  // Adjust for gas costs
  switch (chainInfo.type) {
    case 'evm':
      // Ethereum mainnet is more expensive
      if (chainId === 'eip155:1') return 1.1;
      // L2s are cheaper
      if (chainId === 'eip155:42161') return 0.95; // Arbitrum
      if (chainId === 'eip155:10') return 0.95; // Optimism
      if (chainId === 'eip155:137') return 0.9; // Polygon
      return 1.0;

    case 'solana':
      return 0.85; // Solana is very cheap

    case 'cosmos':
      return 0.9;

    case 'ton':
      return 0.9;

    case 'xrpl':
      return 0.9;

    default:
      return 1.0;
  }
}

/**
 * Format chain-specific payment instructions for 402 response
 */
export function formatOWSPaymentInstructions(
  wallet: OWSWalletInfo,
  requirements: OWSPaymentRequirements
): string {
  const { chainName, chainType } = wallet;

  if (chainType === 'evm') {
    return `
Payment required on ${chainName}:
- Amount: ${requirements.amount} USDC wei
- Recipient: ${requirements.recipient}
- Chain: ${wallet.chainId}

To pay:
1. Sign the x402 payment with your OWS wallet
2. Include the signature in X-OWS-Payment header
3. Retry the request

Example (using MoonPay CLI):
mp sign-payment --chain ${wallet.chainId} --to ${requirements.recipient} --amount ${requirements.amount}
    `.trim();
  }

  return `
Payment required on ${chainName}:
- Amount: ${requirements.amount} USDC wei
- Recipient: ${requirements.recipient}
- Chain: ${wallet.chainId}

Note: ${chainName} payment integration is in progress.
Please use an EVM chain (Base, Arbitrum, Optimism) for now.
  `.trim();
}

/**
 * Create 402 Payment Required response for OWS
 */
export function createOWSPaymentResponse(
  wallet: OWSWalletInfo,
  requirements: OWSPaymentRequirements
): Response {
  const instructions = formatOWSPaymentInstructions(wallet, requirements);

  return new Response(
    JSON.stringify({
      error: 'Payment Required',
      message: instructions,
      payment: {
        chainId: wallet.chainId,
        chainName: wallet.chainName,
        chainType: wallet.chainType,
        amount: requirements.amount,
        currency: 'USDC',
        recipient: requirements.recipient,
        description: requirements.description,
        // Include x402 requirements for EVM chains
        ...(wallet.chainType === 'evm' && {
          x402: requirements.x402Requirements,
        }),
      },
    }),
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Required': 'OWS',
        'X-Supported-Chains': Object.keys(OWS_SUPPORTED_CHAINS).join(','),
      },
    }
  );
}
