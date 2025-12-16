import axios, { AxiosInstance } from 'axios';

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
 * Service class for interacting with the Routeway API
 */
export class RoutewayService {
  private client: AxiosInstance;
  private config: RoutewayConfig;

  constructor(config: RoutewayConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.routeway.ai/v1',
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });
  }

  /**
   * Makes a chat completion request to the Routeway API
   */
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const response = await this.client.post('/chat/completions', request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Routeway API error: ${error.response?.data?.error?.message || error.message}`);
      }
      throw new Error(`Unexpected error calling Routeway API: ${error}`);
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
      const response = await this.client.get('/models');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Routeway API error: ${error.response?.data?.error?.message || error.message}`);
      }
      throw new Error(`Unexpected error calling Routeway API: ${error}`);
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