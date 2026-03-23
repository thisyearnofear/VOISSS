import { GoogleGenerativeAI } from "@google/generative-ai";

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

const googleApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const googleTextModel =
  process.env.GEMINI_TEXT_MODEL || "gemini-3.1-pro-preview";
const googleAudioModel =
  process.env.GEMINI_AUDIO_MODEL || googleTextModel;

const veniceApiKey = process.env.VENICE_API_KEY;
const veniceBaseUrl =
  process.env.VENICE_API_URL || "https://api.venice.ai/api/v1";
const veniceModel = process.env.VENICE_MODEL || "llama-3.3-70b";

const googleClient = googleApiKey
  ? new GoogleGenerativeAI(googleApiKey)
  : null;

if (!googleApiKey && typeof window === "undefined") {
  console.warn(
    "Neither GEMINI_API_KEY nor GOOGLE_API_KEY is set in environment variables"
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

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new Error("Venice AI returned an empty response");
  }

  return content.trim();
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
    fallbackOrder: ["venice", "google"],
  };
}

export async function generateAssistantReply(prompt: string): Promise<{
  text: string;
  provider: "google" | "venice";
  model: string;
}> {
  if (veniceApiKey) {
    try {
      return {
        text: await runVeniceChat([
          {
            role: "system",
            content:
              "You are the VOISSS assistant. Keep responses concise, natural, and ready for text-to-speech.",
          },
          {
            role: "user",
            content: prompt,
          },
        ]),
        provider: "venice",
        model: veniceModel,
      };
    } catch (error) {
      console.error("Primary Venice text generation failed:", error);
    }
  }

  return {
    text: await runGoogleTextPrompt(prompt),
    provider: "google",
    model: googleTextModel,
  };
}

export async function generateStudioAnalysisFromAudio(
  audioBase64: string,
  mimeType: string
): Promise<StudioAnalysisResult> {
  if (!googleClient) {
    throw new Error(
      "Studio audio analysis requires GEMINI_API_KEY or GOOGLE_API_KEY"
    );
  }

  if (!audioBase64) {
    throw new Error("Audio data is empty");
  }

  const prompt = `
You are VOISSS Trust & Publishing Engine. Analyze the attached voice sample and return strict JSON.

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
}

export async function generateContentFromAudio(
  audioBase64: string,
  mimeType: string
) {
  const analysis = await generateStudioAnalysisFromAudio(audioBase64, mimeType);
  return analysis.insights;
}
