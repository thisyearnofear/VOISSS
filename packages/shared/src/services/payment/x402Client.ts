/**
 * x402 Client Wrapper
 * 
 * Uses the Coinbase CDP Facilitator for payment verification and settlement.
 * USDC-only, Base-only - following x402 best practices.
 * 
 * Core Principles:
 * - CDP Facilitator (official Coinbase, v1+v2, free tier 1k tx/month)
 * - USDC only (protocol standard)
 * - Gasless transfers via EIP-3009
 * - Facilitator handles settlement
 */

import { getAddress } from 'viem';
import { generateJwt } from '@coinbase/cdp-sdk/auth';

// ============================================================================
// X402 PROTOCOL CONSTANTS
// ============================================================================

export const X402_CONSTANTS = {
  // Facilitator URLs
  CDP_FACILITATOR_URL: 'https://api.cdp.coinbase.com/platform/v2/x402',
  FACILITATOR_URL_TESTNET: 'https://x402.org/facilitator',

  // Networks
  NETWORK_BASE: 'base',
  NETWORK_BASE_SEPOLIA: 'base-sepolia',

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
  cdpApiKeyId?: string;
  cdpApiKeySecret?: string;
}

export interface X402PaymentRequirements {
  scheme: 'exact' | 'upto';
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
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
  facilitatorUrl: X402_CONSTANTS.CDP_FACILITATOR_URL,
  network: 'base',
  maxTimeoutSeconds: 60,
  cdpApiKeyId: process.env.CDP_API_KEY_ID,
  cdpApiKeySecret: process.env.CDP_API_KEY_SECRET,
};

// ============================================================================
// X402 CLIENT CLASS
// ============================================================================

export class X402Client {
  private config: X402Config;

  constructor(config: Partial<X402Config> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  get usdcAddress(): string {
    return this.config.network === 'base'
      ? X402_CONSTANTS.USDC_BASE
      : X402_CONSTANTS.USDC_BASE_SEPOLIA;
  }

  get networkId(): string {
    return this.config.network === 'base'
      ? X402_CONSTANTS.NETWORK_BASE
      : X402_CONSTANTS.NETWORK_BASE_SEPOLIA;
  }

  private isCdpFacilitator(): boolean {
    return this.config.facilitatorUrl.includes('api.cdp.coinbase.com');
  }

  private async getCdpAuthHeaders(method: string, path: string): Promise<Record<string, string>> {
    if (!this.isCdpFacilitator()) return {};
    if (!this.config.cdpApiKeyId || !this.config.cdpApiKeySecret) {
      console.warn('CDP API keys not configured, requests may fail');
      return {};
    }

    const jwt = await generateJwt({
      apiKeyId: this.config.cdpApiKeyId,
      apiKeySecret: this.config.cdpApiKeySecret,
      requestMethod: method,
      requestHost: 'api.cdp.coinbase.com',
      requestPath: path,
    });

    return { 'Authorization': `Bearer ${jwt}` };
  }

  createRequirements(
    resourceUrl: string,
    amount: string | bigint,
    payTo: string,
    description: string = ''
  ): X402PaymentRequirements {
    let weiAsString: string;

    if (typeof amount === 'bigint') {
      weiAsString = amount.toString();
    } else if (typeof amount === 'string') {
      // If it's a pure numeric string (no $ and no .), assume it's already wei
      if (/^\d+$/.test(amount)) {
        weiAsString = amount;
      } else {
        // Handle currency strings like "$0.01" or "0.01"
        const match = amount.match(/\$?([\d.]+)/);
        if (!match) {
          throw new Error(`Invalid amount format: ${amount}`);
        }
        
        // Use a safer way to convert to wei than Math.floor(float * 1M)
        const parts = match[1].split('.');
        const whole = parts[0] || '0';
        const fraction = (parts[1] || '').padEnd(6, '0').slice(0, 6);
        weiAsString = (BigInt(whole) * 1_000_000n + BigInt(fraction)).toString();
      }
    } else {
      throw new Error(`Unsupported amount type: ${typeof amount}`);
    }

    const DEFAULT_PAY_TO = '0xA6a8736f18f383f1cc2d938576933E5eA7Df01A1';
    let targetPayTo = payTo;

    if (!targetPayTo) {
      console.warn(`⚠️ empty payTo provided, falling back to default: ${DEFAULT_PAY_TO}`);
      targetPayTo = DEFAULT_PAY_TO;
    }

    let checksummedPayTo = targetPayTo;
    try {
      checksummedPayTo = getAddress(targetPayTo.trim());
    } catch (e) {
      console.error(`Invalid payTo address format: "${targetPayTo}"`, e);
      checksummedPayTo = DEFAULT_PAY_TO;
    }

    return {
      scheme: 'exact',
      network: this.networkId,
      maxAmountRequired: weiAsString,
      resource: resourceUrl,
      description,
      mimeType: 'application/json',
      payTo: checksummedPayTo,
      maxTimeoutSeconds: this.config.maxTimeoutSeconds,
      asset: this.usdcAddress,
      extra: {
        name: X402_CONSTANTS.EIP712_NAME,
        version: X402_CONSTANTS.EIP712_VERSION,
      },
    };
  }

  async verifyPayment(
    payment: X402PaymentPayload,
    requirements: X402PaymentRequirements
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    const { signature, from, to, value, validAfter, validBefore, nonce } = payment;

    try {
      const authHeaders = await this.getCdpAuthHeaders('POST', '/platform/v2/x402/verify');

      const response = await fetch(`${this.config.facilitatorUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          x402Version: 1,
          paymentPayload: {
            x402Version: 1,
            scheme: requirements.scheme,
            network: requirements.network,
            payload: {
              signature,
              authorization: { from, to, value, validAfter, validBefore, nonce },
            },
          },
          paymentRequirements: requirements,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Facilitator error: ${error}` };
      }

      const result = await response.json();

      return {
        success: result.success ?? result.isValid ?? true,
        txHash: result.txHash,
        error: result.error || result.invalidReason,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  async validatePayment(
    payment: X402PaymentPayload,
    requirements: X402PaymentRequirements
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const { signature, from, to, value, validAfter, validBefore, nonce } = payment;
      const authHeaders = await this.getCdpAuthHeaders('POST', '/platform/v2/x402/verify');

      const response = await fetch(`${this.config.facilitatorUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          x402Version: 1,
          paymentPayload: {
            x402Version: 1,
            scheme: requirements.scheme,
            network: requirements.network,
            payload: {
              signature,
              authorization: { from, to, value, validAfter, validBefore, nonce },
            },
          },
          paymentRequirements: requirements,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { valid: false, error };
      }

      const result = await response.json();
      return { valid: result.isValid ?? result.valid ?? true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

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

  generateNonce(): string {
    const bytes = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
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

export function resetX402Client(): void {
  x402Client = null;
}
