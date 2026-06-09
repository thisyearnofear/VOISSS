import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { z } from "zod";
import { 
  ChatMessage, 
  InferenceConfig, 
  InferenceResponse 
} from "./types";

export class InferenceService {
  private config: InferenceConfig;
  private googleClient: GoogleGenerativeAI | null = null;

  constructor(config: InferenceConfig) {
    this.config = config;
    if (config.google?.apiKey) {
      this.googleClient = new GoogleGenerativeAI(config.google.apiKey);
    }
  }

  getConfig(): InferenceConfig {
    return this.config;
  }

  private getGoogleModel(modelName: string): GenerativeModel {
    if (!this.googleClient) {
      throw new Error("Google Gemini is not configured");
    }
    return this.googleClient.getGenerativeModel({ model: modelName });
  }

  private parseJsonResponse<T>(raw: string): T {
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch (e) {
      console.error("Failed to parse JSON response:", cleaned);
      throw e;
    }
  }

  /**
   * Generic OpenAI-compatible chat completion
   */
  private async runOpenAiCompatibleChat(args: {
    baseUrl: string;
    apiKey: string;
    model: string;
    messages: ChatMessage[];
    headers?: Record<string, string>;
  }): Promise<string> {
    const response = await fetch(`${args.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.apiKey}`,
        ...args.headers,
      },
      body: JSON.stringify({
        model: args.model,
        messages: args.messages,
        temperature: 0.4,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`AI request failed: ${response.status} ${details}`);
    }

    const data = (await response.json()) as any;
    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      throw new Error("AI returned an empty or invalid response");
    }

    return content.trim();
  }

  async runChat(messages: ChatMessage[], preferredProvider?: keyof InferenceConfig): Promise<InferenceResponse> {
    const providers = preferredProvider 
      ? [preferredProvider, ...(this.config.fallbackOrder || [])] 
      : (this.config.fallbackOrder || []);
    
    // Deduplicate while preserving order
    const uniqueProviders = Array.from(new Set(providers));

    for (const provider of uniqueProviders) {
      try {
        switch (provider) {
          case "acpCompute":
            if (this.config.acpCompute?.apiKey) {
              const text = await this.runOpenAiCompatibleChat({
                baseUrl: this.config.acpCompute.baseUrl || "https://api.venice.ai/api/v1",
                apiKey: this.config.acpCompute.apiKey,
                model: this.config.acpCompute.model || "llama-3.3-70b",
                messages,
                headers: { "X-ACP-Agent-Id": this.config.acpCompute.agentId || "" }
              });
              return { text, provider: "acpCompute", model: this.config.acpCompute.model || "llama-3.3-70b" };
            }
            break;

          case "kilocode":
            if (this.config.kilocode?.apiKey) {
              const text = await this.runOpenAiCompatibleChat({
                baseUrl: this.config.kilocode.baseUrl || "https://api.kilo.ai/api/openrouter/",
                apiKey: this.config.kilocode.apiKey,
                model: this.config.kilocode.model || "kilo-auto/balanced",
                messages
              });
              return { text, provider: "kilocode", model: this.config.kilocode.model || "kilo-auto/balanced" };
            }
            break;

          case "venice":
            if (this.config.venice?.apiKey) {
              const text = await this.runOpenAiCompatibleChat({
                baseUrl: this.config.venice.baseUrl || "https://api.venice.ai/api/v1",
                apiKey: this.config.venice.apiKey,
                model: this.config.venice.model || "llama-3.3-70b",
                messages
              });
              return { text, provider: "venice", model: this.config.venice.model || "llama-3.3-70b" };
            }
            break;

          case "routeway":
            if (this.config.routeway?.apiKey) {
              const text = await this.runOpenAiCompatibleChat({
                baseUrl: this.config.routeway.baseUrl || "https://api.routeway.ai/v1",
                apiKey: this.config.routeway.apiKey,
                model: this.config.routeway.model || "kimi-k2-0905:free",
                messages
              });
              return { text, provider: "routeway", model: this.config.routeway.model || "kimi-k2-0905:free" };
            }
            break;

          case "google":
            if (this.googleClient) {
              const modelName = this.config.google?.textModel || "gemini-3.1-pro-preview";
              const systemMessages = messages.filter(m => m.role === "system");
              const chatMessages = messages.filter(m => m.role !== "system");
              const systemInstruction = systemMessages.map(m => m.content).join("\n");

              const model = this.googleClient.getGenerativeModel({
                model: modelName,
                ...(systemInstruction ? { systemInstruction } : {}),
              });

              const history = chatMessages.slice(0, -1).map(m => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
              }));

              const lastMessage = chatMessages[chatMessages.length - 1]?.content || "";
              const chat = model.startChat({ history });
              const result = await chat.sendMessage(lastMessage);
              const response = await result.response;
              return { text: response.text().trim(), provider: "google", model: modelName };
            }
            break;
        }
      } catch (error) {
        console.error(`Provider ${provider} failed:`, error);
        // Continue to next provider in fallback order
      }
    }

    throw new Error("All AI providers failed or none are configured");
  }

  async runJsonPrompt<T>(prompt: string, schema?: z.ZodSchema<T>, preferredProvider?: keyof InferenceConfig): Promise<{ data: T; provider: string; model: string }> {
    const messages: ChatMessage[] = [
      { role: "system", content: "You are a specialized AI assistant that returns ONLY raw JSON. No talk, just JSON." },
      { role: "user", content: `${prompt}\n\nReturn strict JSON.` }
    ];

    const result = await this.runChat(messages, preferredProvider);
    const data = this.parseJsonResponse<T>(result.text);

    if (schema) {
      return { data: schema.parse(data), provider: result.provider, model: result.model };
    }

    return { data, provider: result.provider, model: result.model };
  }

  /**
   * Specialized method for Google Multimodal (Audio)
   */
  async runGoogleAudioPrompt<T>(args: {
    prompt: string;
    audioBase64: string;
    mimeType: string;
    model?: string;
  }): Promise<{ data: T; provider: string; model: string }> {
    if (!this.googleClient) {
      throw new Error("Google Gemini is not configured");
    }

    const modelName = args.model || this.config.google?.audioModel || "gemini-3.1-flash-preview";
    const model = this.getGoogleModel(modelName);

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: args.prompt },
            {
              inlineData: {
                mimeType: args.mimeType,
                data: args.audioBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const response = await result.response;
    const data = this.parseJsonResponse<T>(response.text());
    return { data, provider: "google", model: modelName };
  }
}
