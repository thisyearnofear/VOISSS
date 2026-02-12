/**
 * X402 Agent Handler (Credits-Only Model)
 * 
 * Secure implementation where agents use pre-funded credits.
 * NO PRIVATE KEY HANDLING - keys never leave agent's control.
 * 
 * Flow:
 * 1. Agent deposits USDC to their VOISSS address (one-time setup)
 * 2. Agent calls API with just their agentAddress (public)
 * 3. Service deducts from credits automatically
 * 4. No signing, no key exposure, no per-transaction gas
 * 
 * This is the secure alternative to the broken x402 V2 flow
 * that required agents to expose private keys.
 */

// X402 V2 Header Names (no X- prefix)
const PAYMENT_REQUIRED_HEADER = 'PAYMENT-REQUIRED';

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
  response?: VoiceGenerationResponse;
  error?: string;
}

/**
 * X402 Agent Handler - Credits-Only Model
 * 
 * Secure handler that uses pre-funded credits.
 * NO PRIVATE KEY HANDLING - keys never leave agent's control.
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
   * Execute voice generation using credits flow only
   * 
   * SECURE: No private key handling. Agents must pre-fund their VOISSS address.
   * - Agent deposits USDC to VOISSS contract first (one-time setup)
   * - No signing required
   * - Service deducts from credits automatically
   * - No key exposure, no per-transaction gas
   */
  async generateVoice(
    request: VoiceGenerationRequest
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

      // Flow: Credits - if not 402, payment succeeded via credits/tier
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

      // Credits exhausted - need to pre-fund
      return {
        success: false,
        error: 'Insufficient credits. Please deposit USDC to your agent address on VOISSS first. No private key required - just fund your address with USDC on Base.',
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
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
