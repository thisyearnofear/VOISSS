import type {
  VoisssConfig,
  VocalizeRequest,
  VocalizeResponse,
  Voice,
  VoiceFilter,
  AgentInfo,
} from './types';
import { VoisssError, PaymentRequiredError, RateLimitError } from './errors';

const DEFAULT_API_URL = 'https://voisss.netlify.app';
const DEFAULT_TIMEOUT = 30000;

/**
 * Official VOISSS client for voice generation
 * 
 * @example
 * ```typescript
 * const client = new VoisssClient({
 *   agentAddress: '0x...',
 *   network: 'base-mainnet'
 * });
 * 
 * const audio = await client.vocalize({
 *   text: 'Hello world!',
 *   voiceId: 'sarah-professional'
 * });
 * 
 * console.log(audio.data?.audioUrl);
 * ```
 */
export class VoisssClient {
  private apiUrl: string;
  private agentAddress?: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(config: VoisssConfig = {}) {
    this.apiUrl = config.apiUrl || DEFAULT_API_URL;
    this.agentAddress = config.agentAddress;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    
    this.headers = {
      'Content-Type': 'application/json',
      'User-Agent': `@voisss/sdk/0.1.0`,
      ...config.headers,
    };
  }

  /**
   * Generate voice from text
   * 
   * @param request - Voice generation request
   * @returns Voice generation response with audio URL
   * @throws {PaymentRequiredError} When payment is required
   * @throws {RateLimitError} When rate limit is exceeded
   * @throws {VoisssError} For other errors
   */
  async vocalize(request: VocalizeRequest): Promise<VocalizeResponse> {
    const agentAddress = request.agentAddress || this.agentAddress;
    
    const body = {
      text: request.text,
      voiceId: request.voiceId,
      agentAddress,
      preview: request.preview,
      options: request.options,
      maxDurationMs: request.maxDurationMs,
    };

    try {
      const response = await this.fetch('/api/agents/vocalize', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const data = await response.json();

      // Handle payment required
      if (response.status === 402) {
        throw new PaymentRequiredError(
          data.error || 'Payment required',
          data.paymentRequired || data.payment
        );
      }

      // Handle rate limit
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        throw new RateLimitError(
          data.error || 'Rate limit exceeded',
          retryAfter
        );
      }

      // Handle other errors
      if (!response.ok) {
        throw new VoisssError(
          data.error || 'Voice generation failed',
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof VoisssError) {
        throw error;
      }
      throw new VoisssError(
        error instanceof Error ? error.message : 'Unknown error',
        undefined,
        error
      );
    }
  }

  /**
   * Get agent information and pricing
   * 
   * @param agentAddress - Agent's wallet address (optional, uses config if not provided)
   * @returns Agent information including credit balance and pricing
   */
  async getAgentInfo(agentAddress?: string): Promise<AgentInfo> {
    const address = agentAddress || this.agentAddress;
    
    if (!address) {
      throw new VoisssError('Agent address is required');
    }

    try {
      const response = await this.fetch(
        `/api/agents/vocalize?agentAddress=${address}`,
        { method: 'GET' }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new VoisssError(
          data.error || 'Failed to get agent info',
          response.status,
          data
        );
      }

      return data.data;
    } catch (error) {
      if (error instanceof VoisssError) {
        throw error;
      }
      throw new VoisssError(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * List available voices
   * 
   * @param filter - Optional filter criteria
   * @returns List of available voices
   */
  async listVoices(filter?: VoiceFilter): Promise<Voice[]> {
    // TODO: Implement when marketplace API endpoint is available
    throw new VoisssError('listVoices not yet implemented');
  }

  /**
   * Get voice by ID
   * 
   * @param voiceId - Voice ID
   * @returns Voice information
   */
  async getVoice(voiceId: string): Promise<Voice> {
    // TODO: Implement when marketplace API endpoint is available
    throw new VoisssError('getVoice not yet implemented');
  }

  /**
   * Internal fetch wrapper with timeout and error handling
   */
  private async fetch(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.apiUrl}${path}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new VoisssError('Request timeout', 408);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
