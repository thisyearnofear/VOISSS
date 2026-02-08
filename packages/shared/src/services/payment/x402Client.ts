/**
 * x402 Client Wrapper
 * 
 * Thin wrapper around the official x402 protocol client.
 * USDC-only, Base-only - following x402 best practices.
 * 
 * Core Principles:
 * - Use official x402 client (don't reinvent)
 * - USDC only (protocol standard)
 * - Gasless transfers via EIP-3009
 * - Facilitator handles settlement
 */

// Types imported from payment module

// ============================================================================
// X402 PROTOCOL CONSTANTS
// ============================================================================

export const X402_CONSTANTS = {
  // Facilitator URLs
  FACILITATOR_URL: 'https://x402.org/facilitator',
  CDP_FACILITATOR_URL: 'https://facilitator.cdp.coinbase.com',
  
  // Networks (CAIP-2 format)
  NETWORK_BASE: 'eip155:8453',
  NETWORK_BASE_SEPOLIA: 'eip155:84532',
  
  // USDC Contract Addresses
  USDC_BASE: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  USDC_BASE_SEPOLIA: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  
  // EIP-712 Domain for USDC
  EIP712_NAME: 'USD Coin',
  EIP712_VERSION: '2',
  
  // Headers
  PAYMENT_REQUIRED_HEADER: 'X-PAYMENT-REQUIRED',
  PAYMENT_HEADER: 'X-PAYMENT',
  PAYMENT_RESPONSE_HEADER: 'X-PAYMENT-RESPONSE',
  
  // Status
  STATUS_PAYMENT_REQUIRED: 402,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface X402Config {
  facilitatorUrl: string;
  network: 'base' | 'base-sepolia';
  maxTimeoutSeconds: number;
}

export interface X402PaymentRequirements {
  scheme: 'exact' | 'upto';
  network: string; // CAIP-2
  maxAmountRequired: string; // in token wei
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string; // token contract address
  extra: {
    name: string;
    version: string;
  };
}

export interface X402PaymentPayload {
  signature: string;
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_CONFIG: X402Config = {
  facilitatorUrl: X402_CONSTANTS.FACILITATOR_URL,
  network: 'base',
  maxTimeoutSeconds: 60,
};

// ============================================================================
// X402 CLIENT CLASS
// ============================================================================

export class X402Client {
  private config: X402Config;

  constructor(config: Partial<X402Config> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get USDC address for current network
   */
  get usdcAddress(): string {
    return this.config.network === 'base' 
      ? X402_CONSTANTS.USDC_BASE 
      : X402_CONSTANTS.USDC_BASE_SEPOLIA;
  }

  /**
   * Get CAIP-2 network identifier
   */
  get caip2Network(): string {
    return this.config.network === 'base'
      ? X402_CONSTANTS.NETWORK_BASE
      : X402_CONSTANTS.NETWORK_BASE_SEPOLIA;
  }

  /**
   * Create payment requirements for a resource
   * 
   * @param resourceUrl - URL of the resource being paid for
   * @param amount - Amount in USDC (e.g., "$0.01")
   * @param payTo - Recipient address
   * @param description - Optional description
   */
  createRequirements(
    resourceUrl: string,
    amount: string,
    payTo: string,
    description: string = ''
  ): X402PaymentRequirements {
    // Convert price string to USDC wei
    const match = amount.match(/\$?([\d.]+)/);
    if (!match) {
      throw new Error(`Invalid amount format: ${amount}`);
    }
    
    const dollars = parseFloat(match[1]);
    const wei = Math.floor(dollars * 1_000_000); // USDC has 6 decimals

    return {
      scheme: 'exact',
      network: this.caip2Network,
      maxAmountRequired: wei.toString(),
      resource: resourceUrl,
      description,
      mimeType: 'application/json',
      payTo,
      maxTimeoutSeconds: this.config.maxTimeoutSeconds,
      asset: this.usdcAddress,
      extra: {
        name: X402_CONSTANTS.EIP712_NAME,
        version: X402_CONSTANTS.EIP712_VERSION,
      },
    };
  }

  /**
   * Verify a payment with the facilitator
   * 
   * @param payment - The signed payment payload
   * @param requirements - Original payment requirements
   */
  async verifyPayment(
    payment: X402PaymentPayload,
    requirements: X402PaymentRequirements
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const response = await fetch(`${this.config.facilitatorUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentPayload: payment,
          paymentRequirements: requirements,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Facilitator error: ${error}` };
      }

      const result = await response.json();
      
      return {
        success: result.success ?? true,
        txHash: result.txHash,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Check if a payment is valid without settling
   * 
   * @param payment - The signed payment payload
   * @param requirements - Original payment requirements
   */
  async validatePayment(
    payment: X402PaymentPayload,
    requirements: X402PaymentRequirements
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.config.facilitatorUrl}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentPayload: payment,
          paymentRequirements: requirements,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { valid: false, error };
      }

      const result = await response.json();
      return { valid: result.valid ?? true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Create EIP-712 typed data for signing
   * 
   * @param from - Payer address
   * @param to - Recipient address
   * @param value - Amount in USDC wei
   * @param validAfter - Timestamp when valid (seconds)
   * @param validBefore - Timestamp when expires (seconds)
   * @param nonce - Unique nonce
   */
  createTypedData(
    from: string,
    to: string,
    value: string,
    validAfter: number,
    validBefore: number,
    nonce: string
  ): any {
    const chainId = this.config.network === 'base' ? 8453 : 84532;

    return {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' },
        ],
      },
      domain: {
        name: X402_CONSTANTS.EIP712_NAME,
        version: X402_CONSTANTS.EIP712_VERSION,
        chainId,
        verifyingContract: this.usdcAddress,
      },
      primaryType: 'TransferWithAuthorization',
      message: {
        from,
        to,
        value,
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce,
      },
    };
  }

  /**
   * Generate a random nonce for payment authorization
   */
  generateNonce(): string {
    const bytes = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      // Node.js fallback
      for (let i = 0; i < 32; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    return '0x' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
}

// ============================================================================
// SERVER-SIDE MIDDLEWARE HELPERS
// ============================================================================

/**
 * Create a 402 Payment Required response
 */
export function createPaymentRequiredResponse(
  requirements: X402PaymentRequirements
): Response {
  return new Response(
    JSON.stringify({ error: 'Payment required', requirements }),
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        [X402_CONSTANTS.PAYMENT_REQUIRED_HEADER]: JSON.stringify(requirements),
      },
    }
  );
}

/**
 * Parse payment from X-PAYMENT header
 */
export function parsePaymentHeader(header: string | null): X402PaymentPayload | null {
  if (!header) return null;
  try {
    return JSON.parse(header) as X402PaymentPayload;
  } catch {
    try {
      return JSON.parse(Buffer.from(header, 'base64').toString('utf-8')) as X402PaymentPayload;
    } catch {
      return null;
    }
  }
}

/**
 * Create a successful payment response with confirmation
 */
export function createPaymentSuccessResponse(
  data: any,
  txHash: string
): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      [X402_CONSTANTS.PAYMENT_RESPONSE_HEADER]: JSON.stringify({ txHash }),
    },
  });
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let x402Client: X402Client | null = null;

export function getX402Client(config?: Partial<X402Config>): X402Client {
  if (!x402Client) {
    x402Client = new X402Client(config);
  }
  return x402Client;
}

export function createX402Client(config?: Partial<X402Config>): X402Client {
  return new X402Client(config);
}

// Reset singleton (useful for testing)
export function resetX402Client(): void {
  x402Client = null;
}
