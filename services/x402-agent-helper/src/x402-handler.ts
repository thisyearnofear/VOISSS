/**
 * X402 V2 Payment Handler (Agent-Key Model)
 * 
 * Handles x402 payment flows using the AGENT'S own wallet/key, not a centralized one.
 * This maintains the permissionless nature of x402 - each agent pays for their own usage.
 * 
 * Supports both:
 * 1. Credits-first flow (no signing needed - agent deposits USDC to VOISSS first)
 * 2. x402 V2 flow (agent provides their key, we sign on their behalf)
 * 
 * X402 V2 Changes (Feb 2026):
 * - Headers: PAYMENT-REQUIRED, PAYMENT-SIGNATURE, PAYMENT-RESPONSE (no X- prefix)
 * - New @x402/sdk package structure
 * - Wallet-based sessions for reusable access
 */

import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';

// USDC Contract Addresses
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// EIP-712 Domain constants for USDC
const EIP712_NAME = 'USD Coin';
const EIP712_VERSION = '2';

// X402 V2 Header Names (no X- prefix)
const PAYMENT_REQUIRED_HEADER = 'PAYMENT-REQUIRED';
const PAYMENT_SIGNATURE_HEADER = 'PAYMENT-SIGNATURE';

export interface X402V2Requirements {
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

export interface X402V2PaymentPayload {
  signature: string;
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

export interface VoiceGenerationRequest {
  text: string;
  voiceId: string;
  agentAddress?: string;
  maxDurationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface VoiceGenerationResponse {
  success: boolean;
  data?: {
    audioUrl: string;
    contentHash: string;
    cost: string;
    characterCount: number;
    creditBalance?: string;
    tier?: string;
    paymentMethod?: string;
    ipfsHash?: string;
    recordingId?: string;
    txHash?: string;
  };
  error?: string;
}

export interface PaymentFlowResult {
  success: boolean;
  usedCredits?: boolean;
  usedX402?: boolean;
  response?: VoiceGenerationResponse;
  error?: string;
}

/**
 * X402 V2 Payment Handler - Agent Key Model
 * 
 * This handler uses the AGENT'S private key, not a centralized one.
 * Each agent brings their own funded wallet.
 */
export class X402AgentHandler {
  private voisssApiUrl: string;
  private network: 'base' | 'base-sepolia';

  constructor(
    voisssApiUrl: string = 'https://voisss.netlify.app',
    network: 'base' | 'base-sepolia' = 'base'
  ) {
    this.voisssApiUrl = voisssApiUrl;
    this.network = network;
  }

  /**
   * Execute voice generation with automatic payment flow selection
   * 
   * Flow 1: Credits (no agent key needed)
   * - Agent deposits USDC to VOISSS contract first
   * - No signing required
   * 
   * Flow 2: x402 V2 (agent provides their key)
   * - Agent provides their private key
   * - We sign EIP-712 on their behalf
   * - Payment comes from agent's wallet
   */
  async generateVoice(
    request: VoiceGenerationRequest,
    agentPrivateKey?: string
  ): Promise<PaymentFlowResult> {
    try {
      // Step 1: Initial request to check payment requirements
      const initialResponse = await fetch(`${this.voisssApiUrl}/api/agents/vocalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      // Flow 1: Credits - if not 402, payment succeeded via credits/tier
      if (initialResponse.status !== 402) {
        if (!initialResponse.ok) {
          const error = await initialResponse.text();
          return {
            success: false,
            error: `Voice generation failed: ${error}`,
          };
        }

        const result = await initialResponse.json() as VoiceGenerationResponse;
        return {
          success: result.success,
          usedCredits: result.success,
          response: result,
        };
      }

      // Flow 2: x402 V2 - Payment required, need to sign
      if (!agentPrivateKey) {
        return {
          success: false,
          error: 'Payment required but no agent private key provided. Either: (1) deposit USDC credits to your agent address first, or (2) provide your private key for x402 signing.',
        };
      }

      // Parse x402 V2 requirements from PAYMENT-REQUIRED header
      const paymentRequiredHeader = initialResponse.headers.get(PAYMENT_REQUIRED_HEADER) || 
                                    initialResponse.headers.get('X-PAYMENT-REQUIRED'); // Fallback for V1
      
      if (!paymentRequiredHeader) {
        return {
          success: false,
          error: 'Payment required but no PAYMENT-REQUIRED header received',
        };
      }

      let requirements: X402V2Requirements;
      try {
        requirements = JSON.parse(paymentRequiredHeader);
      } catch (e) {
        return {
          success: false,
          error: `Failed to parse payment requirements: ${e instanceof Error ? e.message : 'Unknown error'}`,
        };
      }

      console.log(`💰 x402 V2 payment required: ${requirements.maxAmountRequired} USDC wei`);
      console.log(`📝 Resource: ${requirements.resource}`);

      // Step 2: Sign payment using AGENT'S key
      console.log('✍️ Signing x402 V2 payment authorization with agent key...');
      const paymentPayload = await this.signPayment(requirements, agentPrivateKey);
      console.log('✅ Payment signed by agent wallet');

      // Step 3: Retry request with PAYMENT-SIGNATURE header (V2 format)
      console.log('🔄 Retrying request with signed payment...');
      const paymentResponse = await fetch(`${this.voisssApiUrl}/api/agents/vocalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [PAYMENT_SIGNATURE_HEADER]: JSON.stringify(paymentPayload),
          // Fallback for V1 compatibility
          'X-PAYMENT': JSON.stringify(paymentPayload),
        },
        body: JSON.stringify(request),
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.text();
        return {
          success: false,
          usedX402: false,
          error: `x402 payment failed: ${error}`,
        };
      }

      const result = await paymentResponse.json() as VoiceGenerationResponse;
      
      if (result.success && result.data?.txHash) {
        console.log(`✅ x402 V2 payment successful! TX: ${result.data.txHash}`);
      }

      return {
        success: result.success,
        usedX402: result.success,
        response: result,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Sign x402 V2 payment using AGENT'S private key
   */
  private async signPayment(
    requirements: X402V2Requirements,
    privateKey: string
  ): Promise<X402V2PaymentPayload> {
    // Format private key
    if (!privateKey.startsWith('0x')) {
      privateKey = '0x' + privateKey;
    }

    const account = privateKeyToAccount(privateKey as `0x{string}`);
    const chain = this.network === 'base' ? base : baseSepolia;
    
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(),
    });

    const now = Math.floor(Date.now() / 1000);
    const validAfter = now - 60; // Valid from 1 minute ago (for clock skew)
    const validBefore = now + requirements.maxTimeoutSeconds;
    const nonce = this.generateNonce();

    const usdcAddress = this.network === 'base' ? USDC_BASE : USDC_BASE_SEPOLIA;
    const chainId = this.network === 'base' ? 8453 : 84532;

    // EIP-712 typed data for TransferWithAuthorization
    const typedData = {
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
        name: EIP712_NAME,
        version: EIP712_VERSION,
        chainId,
        verifyingContract: usdcAddress,
      },
      primaryType: 'TransferWithAuthorization' as const,
      message: {
        from: account.address,
        to: requirements.payTo,
        value: requirements.maxAmountRequired,
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce,
      },
    };

    // Sign the EIP-712 typed data with agent's key
    const signature = await walletClient.signTypedData(typedData);

    return {
      signature,
      from: account.address,
      to: requirements.payTo,
      value: requirements.maxAmountRequired,
      validAfter: validAfter.toString(),
      validBefore: validBefore.toString(),
      nonce,
    };
  }

  /**
   * Generate a random 32-byte nonce
   */
  private generateNonce(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return '0x' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Submit a voice recording to a mission
   * (No payment needed for submission)
   */
  async submitToMission(
    missionId: string,
    recordingId: string,
    agentAddress: string,
    location?: { city: string; country: string },
    context?: string
  ): Promise<{ success: boolean; submission?: { id: string; status: string }; error?: string }> {
    try {
      const response = await fetch(`${this.voisssApiUrl}/api/missions/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${agentAddress}`,
        },
        body: JSON.stringify({
          missionId,
          userId: agentAddress,
          recordingId,
          location: location || { city: 'Unknown', country: 'Internet' },
          context: context || 'Agent submission',
          participantConsent: true,
          isAnonymized: false,
          voiceObfuscated: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `Mission submission failed: ${error}`,
        };
      }

      return await response.json() as { success: boolean; submission?: { id: string; status: string }; error?: string };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
