import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GoogleContentPart =
  | { text: string }
  | {
      inlineData: {
        mimeType: string;
        data: string;
      };
    };

export interface StudioInsights {
  title: string;
  summary: string[];
  tags: string[];
  actionItems: string[];
}

export interface HumanityCertificate {
  status: "verified-human" | "review-needed" | "uncertain";
  badge: string;
  confidence: number;
  verdict: string;
  humanSignals: string[];
  aiArtifacts: string[];
  provenanceNotes: string[];
}

export interface StudioAnalysisResult {
  insights: StudioInsights;
  humanityCertificate: HumanityCertificate;
  provider: string;
  model: string;
}

export type AnalysisStepId = "transcription" | "analysis" | "fallback";
export type AnalysisStepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface AnalysisStep {
  id: AnalysisStepId;
  label: string;
  status: AnalysisStepStatus;
  provider?: string;
  model?: string;
  message?: string;
}

export interface PipelineAnalysisResult extends StudioAnalysisResult {
  transcript?: string;
  mode: "transcript-pipeline" | "audio-native-fallback";
  steps: AnalysisStep[];
}

const googleApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const googleTextModel =
  process.env.GEMINI_TEXT_MODEL || "gemini-3.1-pro-preview";
const googleAudioModel =
  process.env.GEMINI_AUDIO_MODEL || "gemini-3.1-flash-preview";

const veniceApiKey = process.env.VENICE_API_KEY;
const veniceBaseUrl =
  process.env.VENICE_API_URL || "https://api.venice.ai/api/v1";
const veniceModel = process.env.VENICE_MODEL || "llama-3.3-70b";

const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
const elevenLabsSTTModel = process.env.ELEVENLABS_STT_MODEL || "scribe_v2";

const googleClient = googleApiKey
  ? new GoogleGenerativeAI(googleApiKey)
  : null;

// Kilocode (Kilo.ai / OpenRouter-like) Configuration
const kilocodeApiKey = process.env.KILOCODE_API_KEY;
const kilocodeBaseUrl = process.env.KILOCODE_API_URL || "https://api.kilo.ai/api/openrouter/";
const kilocodeModels = [
  { id: "kilo-auto/balanced", name: "Kilo Auto (Balanced)" },
  { id: "kilo-auto/free", name: "Kilo Auto (Free)" },
];
const kilocodeDefaultModel = process.env.KILOCODE_MODEL || kilocodeModels[0].id;

if (!googleApiKey && !veniceApiKey && !kilocodeApiKey && typeof process !== "undefined" && !process.env.NEXT_RUNTIME) {
  console.warn(
    "No AI providers (Gemini, Venice, Kilocode) are configured in environment variables"
  );
}

function getGoogleModel(model: string) {
  if (!googleClient) {
    throw new Error("Google Gemini is not configured");
  }

  return googleClient.getGenerativeModel({ model });
}

function parseJsonResponse<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  return JSON.parse(cleaned) as T;
}

async function runGoogleJsonPrompt<T>(args: {
  model: string;
  prompt: string;
  audio?: {
    audioBase64: string;
    mimeType: string;
  };
}): Promise<T> {
  const model = getGoogleModel(args.model);
  const parts: GoogleContentPart[] = [{ text: args.prompt }];

  if (args.audio) {
    parts.push({
      inlineData: {
        mimeType: args.audio.mimeType,
        data: args.audio.audioBase64,
      },
    });
  }

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const response = await result.response;
  return parseJsonResponse<T>(response.text());
}

async function runGoogleTextPrompt(prompt: string): Promise<string> {
  const model = getGoogleModel(googleTextModel);
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

async function runVeniceChat(messages: ChatMessage[]): Promise<string> {
  if (!veniceApiKey) {
    throw new Error("Venice AI is not configured");
  }

  const response = await fetch(`${veniceBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${veniceApiKey}`,
    },
    body: JSON.stringify({
      model: veniceModel,
      messages,
      temperature: 0.4,
      max_tokens: 1000,
      venice_parameters: {
        include_venice_system_prompt: false,
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Venice AI request failed: ${response.status} ${details}`);
  }

  const data = (await response.json()) as any;
  const content = data?.choices?.[0]?.message?.content;

  return content.trim();
}

async function runKilocodeChat(messages: ChatMessage[]): Promise<string> {
  if (!kilocodeApiKey) {
    throw new Error("Kilocode AI is not configured");
  }

  const response = await fetch(`${kilocodeBaseUrl}chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${kilocodeApiKey}`,
      "HTTP-Referer": "https://voisss.com", // Optional, for OpenRouter tracking
      "X-Title": "VOISSS",
    },
    body: JSON.stringify({
      model: kilocodeDefaultModel,
      messages,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Kilocode AI request failed: ${response.status} ${details}`);
  }

  const data = (await response.json()) as any;
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Kilocode AI returned an empty response");
  }

  return content.trim();
}

async function transcribeWithElevenLabs(file: File): Promise<{ transcript: string; provider: string; model: string }> {
  if (!elevenLabsApiKey) {
    throw new Error("ElevenLabs is not configured (ELEVENLABS_API_KEY missing)");
  }

  const form = new FormData();
  form.append("model_id", elevenLabsSTTModel);
  form.append("file", file);

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": elevenLabsApiKey,
    },
    body: form,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`ElevenLabs STT failed: ${response.status} ${details}`);
  }

  const data = await response.json() as { text?: string; language_code?: string };

  if (!data.text?.trim()) {
    throw new Error("ElevenLabs returned an empty transcript");
  }

  return {
    transcript: data.text.trim(),
    provider: "elevenlabs",
    model: elevenLabsSTTModel,
  };
}

export function getAIProviderStatus() {
  return {
    google: {
      configured: Boolean(googleApiKey),
      textModel: googleTextModel,
      audioModel: googleAudioModel,
    },
    venice: {
      configured: Boolean(veniceApiKey),
      model: veniceModel,
    },
    kilocode: {
      configured: Boolean(kilocodeApiKey),
      models: kilocodeModels,
    },
    elevenlabs: {
      configured: Boolean(elevenLabsApiKey),
      sttModel: elevenLabsSTTModel,
    },
    fallbackOrder: ["kilocode", "venice", "google"],
  };
}

export async function generateAssistantReply(prompt: string): Promise<{
  text: string;
  provider: "google" | "venice" | "kilocode";
  model: string;
}> {
  // Try Kilocode first (primary)
  if (kilocodeApiKey) {
    try {
      return {
        text: await runKilocodeChat([
          {
            role: "system",
            content: "You are the VOISSS assistant. Keep responses concise, natural, and ready for text-to-speech.",
          },
          { role: "user", content: prompt },
        ]),
        provider: "kilocode",
        model: kilocodeDefaultModel,
      };
    } catch (error) {
      console.error("Kilocode failed, trying Venice:", error);
    }
  }

  // Try Venice second (secondary)
  if (veniceApiKey) {
    try {
      return {
        text: await runVeniceChat([
          {
            role: "system",
            content: "You are the VOISSS assistant. Keep responses concise, natural, and ready for text-to-speech.",
          },
          { role: "user", content: prompt },
        ]),
        provider: "venice",
        model: veniceModel,
      };
    } catch (error) {
      console.error("Venice failed, trying Google:", error);
    }
  }

  // Final fallback to Google
  return {
    text: await runGoogleTextPrompt(prompt),
    provider: "google",
    model: googleTextModel,
  };
}

const studioAnalysisSchema = z.object({
  insights: z.object({
    title: z.string(),
    summary: z.array(z.string()),
    tags: z.array(z.string()),
    actionItems: z.array(z.string()),
  }),
  humanityCertificate: z.object({
    status: z.enum(["verified-human", "review-needed", "uncertain"]),
    badge: z.string(),
    confidence: z.number(),
    verdict: z.string(),
    humanSignals: z.array(z.string()),
    aiArtifacts: z.array(z.string()),
    provenanceNotes: z.array(z.string()),
  }),
});

export async function runJsonPrompt<T>(prompt: string, schema: z.ZodSchema<T>): Promise<{ data: T; provider: string; model: string }> {
  // Try Kilocode first (primary)
  if (kilocodeApiKey) {
    try {
      const content = await runKilocodeChat([
        { role: "system", content: "You are a specialized AI assistant that returns ONLY raw JSON. No talk, just JSON." },
        { role: "user", content: `${prompt}\n\nReturn strict JSON.` }
      ]);
      const data = parseJsonResponse<T>(content);
      return { data, provider: "kilocode", model: kilocodeDefaultModel };
    } catch (error) {
      console.error("Kilocode JSON prompt failed:", error);
    }
  }

  // Try Venice second (secondary)
  if (veniceApiKey) {
    try {
      const content = await runVeniceChat([
        { role: "system", content: "You are a specialized AI assistant that returns ONLY raw JSON following the provided schema. No talk, just JSON." },
        { role: "user", content: `${prompt}\n\nReturn strict JSON following this schema requirement.` }
      ]);
      const data = parseJsonResponse<T>(content);
      return { data, provider: "venice", model: veniceModel };
    } catch (error) {
      console.error("Venice JSON prompt failed:", error);
    }
  }

  // Fallback to Google (text model)
  const model = googleTextModel;
  const content = await runGoogleTextPrompt(prompt);
  const data = parseJsonResponse<T>(content);
  return { data, provider: "google", model };
}

function buildStudioTranscriptPrompt(transcript: string): string {
  return `
You are VOISSS Trust & Publishing Engine. Analyze the following transcript from a voice recording and return strict JSON.

Transcript:
"""${transcript}"""

Return:
{
  "insights": {
    "title": "A strong publishing title under 60 characters",
    "summary": ["point one", "point two", "point three"],
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "actionItems": ["caption for X/Farcaster", "caption for TikTok/Reels", "creator next step"]
  },
  "humanityCertificate": {
    "status": "verified-human" | "review-needed" | "uncertain",
    "badge": "Short trust badge label",
    "confidence": 0.0,
    "verdict": "One-sentence assessment",
    "humanSignals": ["signal 1", "signal 2", "signal 3"],
    "aiArtifacts": ["artifact 1", "artifact 2"],
    "provenanceNotes": ["note 1", "note 2"]
  }
}

Rules:
- Base conclusions on transcript content and any speech markers present.
- Since this is transcript-only (not raw audio), be conservative with authenticity assessments.
- Prefer "review-needed" over "verified-human" unless transcript evidence is very strong.
- Confidence must be between 0 and 1, and should be capped at 0.75 for transcript-only analysis.
- Return ONLY valid JSON.
`;
}

export async function generateStudioAnalysisWithPipeline(
  file: File,
  audioBase64: string,
  mimeType: string,
  onProgress?: (event: { step: AnalysisStep; steps: AnalysisStep[]; transcript?: string }) => void
): Promise<PipelineAnalysisResult> {
  const steps: AnalysisStep[] = [
    { id: "transcription", label: "Transcribing audio with ElevenLabs", status: "pending" },
    { id: "analysis", label: "Analyzing transcript", status: "pending" },
    { id: "fallback", label: "Gemini audio-native fallback", status: "pending" },
  ];

  function updateStep(id: AnalysisStepId, updates: Partial<AnalysisStep>) {
    const step = steps.find((s) => s.id === id)!;
    Object.assign(step, updates);
    onProgress?.({ step, steps: [...steps], transcript: undefined });
  }

  // ── Step 1: ElevenLabs Transcription ──
  let transcript: string | undefined;
  let sttProvider: string | undefined;
  let sttModel: string | undefined;

  try {
    updateStep("transcription", { status: "running" });
    const sttResult = await transcribeWithElevenLabs(file);
    transcript = sttResult.transcript;
    sttProvider = sttResult.provider;
    sttModel = sttResult.model;
    updateStep("transcription", {
      status: "completed",
      provider: sttProvider,
      model: sttModel,
      message: `Transcribed ${transcript.length} characters`,
    });
    onProgress?.({ step: steps.find((s) => s.id === "transcription")!, steps: [...steps], transcript });
  } catch (error) {
    console.error("ElevenLabs STT failed:", error);
    updateStep("transcription", {
      status: "failed",
      message: error instanceof Error ? error.message : "Transcription failed",
    });
  }

  // ── Step 2: Transcript Analysis (Kilocode → Venice → Gemini text) ──
  if (transcript) {
    try {
      updateStep("analysis", { status: "running" });
      const prompt = buildStudioTranscriptPrompt(transcript);
      const result = await runJsonPrompt<{
        insights: StudioInsights;
        humanityCertificate: HumanityCertificate;
      }>(prompt, studioAnalysisSchema);

      updateStep("analysis", {
        status: "completed",
        provider: result.provider,
        model: result.model,
      });
      updateStep("fallback", { status: "skipped" });

      return {
        insights: result.data.insights,
        humanityCertificate: result.data.humanityCertificate,
        provider: result.provider,
        model: result.model,
        transcript,
        mode: "transcript-pipeline",
        steps,
      };
    } catch (error) {
      console.error("Transcript analysis failed:", error);
      updateStep("analysis", {
        status: "failed",
        message: error instanceof Error ? error.message : "Analysis failed",
      });
    }
  } else {
    updateStep("analysis", { status: "skipped", message: "No transcript available" });
  }

  // ── Step 3: Gemini Audio-Native Fallback ──
  try {
    updateStep("fallback", { status: "running", message: "Falling back to Gemini multimodal" });
    const fallbackResult = await generateStudioAnalysisFromAudio(audioBase64, mimeType);
    updateStep("fallback", {
      status: "completed",
      provider: fallbackResult.provider,
      model: fallbackResult.model,
    });

    return {
      ...fallbackResult,
      transcript,
      mode: "audio-native-fallback",
      steps,
    };
  } catch (error) {
    updateStep("fallback", {
      status: "failed",
      message: error instanceof Error ? error.message : "Fallback failed",
    });
    throw new Error("All analysis pipelines failed. Please try again later.");
  }
}

export async function generateStudioAnalysisFromAudio(
  audioBase64: string,
  mimeType: string
): Promise<StudioAnalysisResult> {
  if (!audioBase64) {
    throw new Error("Audio data is empty");
  }

  const prompt = `
You are VOISSS Trust & Publishing Engine. Analyze the voice sample and return strict JSON.

Return:
{
  "insights": {
    "title": "A strong publishing title under 60 characters",
    "summary": ["point one", "point two", "point three"],
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "actionItems": ["caption for X/Farcaster", "caption for TikTok/Reels", "creator next step"]
  },
  "humanityCertificate": {
    "status": "verified-human" | "review-needed" | "uncertain",
    "badge": "Short trust badge label",
    "confidence": 0.0,
    "verdict": "One-sentence assessment",
    "humanSignals": ["signal 1", "signal 2", "signal 3"],
    "aiArtifacts": ["artifact 1", "artifact 2"],
    "provenanceNotes": ["note 1", "note 2"]
  }
}

Rules:
- Focus on likely human vocal performance markers, not biometric identification.
- Confidence must be between 0 and 1.
- If the sample is noisy, compressed, or too short, downgrade to "review-needed" or "uncertain".
- Be cautious: do not claim certainty when evidence is weak.
`;

  // Primary: Google Multimodal (Audio-native)
  if (googleClient) {
    try {
      const analysis = await runGoogleJsonPrompt<{
        insights: StudioInsights;
        humanityCertificate: HumanityCertificate;
      }>({
        model: googleAudioModel,
        prompt,
        audio: {
          audioBase64,
          mimeType,
        },
      });

      return {
        insights: analysis.insights,
        humanityCertificate: analysis.humanityCertificate,
        provider: "google",
        model: googleAudioModel,
      };
    } catch (error) {
      console.error("Primary Google Audio Analysis failed, falling back to text-only analysis:", error);
    }
  }

  // Fallback: Text-based analysis (simulated or using metadata)
  // In a real scenario, we might want to transcribe first, but for now we'll provide a generic fallback
  // using the text-only JSON prompt runner.
  const fallback = await runJsonPrompt<{
    insights: StudioInsights;
    humanityCertificate: HumanityCertificate;
  }>(prompt + "\n\nNote: You do not have the audio file, so perform a general metadata analysis based on voice-over best practices.", studioAnalysisSchema);

  return {
    insights: fallback.data.insights,
    humanityCertificate: fallback.data.humanityCertificate,
    provider: fallback.provider,
    model: fallback.model,
  };
}

export interface MarketTrend {
  title: string;
  description: string;
  demandLevel: "High" | "Medium" | "Low";
  growth: string; // e.g. "+15%"
  topTags: string[];
}

export interface MarketTrendResult {
  trends: MarketTrend[];
  topLanguages: string[];
  topCategories: string[];
  summary: string;
}

/**
 * Analyze market trends from scraped markdown data
 */
export async function analyzeMarketTrends(
  markdown: string
): Promise<MarketTrendResult> {
  const prompt = `
Analyze the following markdown content from a voice-over job board and extract the current market trends.
Return a structured JSON object with the following format:

{
  "trends": [
    {
      "title": "Short catchy trend name (e.g., 'Warm Corporate')",
      "description": "Brief explanation of why this is trending",
      "demandLevel": "High" | "Medium" | "Low",
      "growth": "Estimated growth percentage based on frequency (e.g., '+20%')",
      "topTags": ["tag1", "tag2"]
    }
  ],
  "topLanguages": ["English", "Spanish", "etc"],
  "topCategories": ["Commercial", "E-learning", "etc"],
  "summary": "A 2-sentence overview of the current voice-over market state"
}

Markdown Content:
${markdown.substring(0, 10000)} // Truncate to avoid context limits

Rules:
- Be specific about vocal styles (tones, accents, demographics).
- If no clear trends are found, provide generalized voice-over market insights.
- Return ONLY valid JSON.
`;

  const marketTrendSchema = z.object({
    trends: z.array(z.object({
      title: z.string(),
      description: z.string(),
      demandLevel: z.enum(["High", "Medium", "Low"]),
      growth: z.string(),
      topTags: z.array(z.string()),
    })),
    topLanguages: z.array(z.string()),
    topCategories: z.array(z.string()),
    summary: z.string(),
  });

  const result = await runJsonPrompt<MarketTrendResult>(prompt, marketTrendSchema);
  return result.data;
}

export async function generateContentFromAudio(
  audioBase64: string,
  mimeType: string
) {
  const analysis = await generateStudioAnalysisFromAudio(audioBase64, mimeType);
  return analysis.insights;
}


