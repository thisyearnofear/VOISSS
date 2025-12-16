import type { AxiosInstance } from 'axios';

interface RoutewayConfig {
  apiKey: string;
  baseUrl?: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * React Native compatible Routeway service using fetch API instead of axios
 */
export class RoutewayService {
  private config: RoutewayConfig;

  constructor(config: RoutewayConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.routeway.ai/v1',
    };
  }

  /**
   * Makes a chat completion request to the Routeway API using fetch
   */
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Routeway API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      return data as ChatCompletionResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Routeway API error: ${error.message}`);
      }
      throw new Error('Unexpected error calling Routeway API');
    }
  }

  /**
   * Convenience method to send a simple message
   */
  async sendMessage(content: string, model: string = 'kimi-k2-0905:free'): Promise<string> {
    const response = await this.chatCompletion({
      model,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    });

    return response.choices[0]?.message.content || '';
  }

  /**
   * Lists available models from Routeway
   */
  async listModels(): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Routeway API error: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Routeway API error: ${error.message}`);
      }
      throw new Error('Unexpected error calling Routeway API');
    }
  }
}

/**
 * Creates a Routeway service instance with the provided API key
 */
export const createRoutewayService = (apiKey: string): RoutewayService => {
  if (!apiKey) {
    throw new Error('Routeway API key is required');
  }

  return new RoutewayService({ apiKey });
};