import { z } from "zod";
import { InferenceService } from "./inference-service";
import { 
  StudioInsights, 
  HumanityCertificate, 
  StudioAnalysisResult, 
  PipelineAnalysisResult,
  AnalysisStep,
  AnalysisStepId
} from "./types";

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

export class StudioAnalysisService {
  private inferenceService: InferenceService;
  private elevenLabsApiKey?: string;
  private elevenLabsSTTModel?: string;

  constructor(inferenceService: InferenceService, config?: { elevenLabsApiKey?: string, elevenLabsSTTModel?: string }) {
    this.inferenceService = inferenceService;
    this.elevenLabsApiKey = config?.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY;
    this.elevenLabsSTTModel = config?.elevenLabsSTTModel || process.env.ELEVENLABS_STT_MODEL || "scribe_v2";
  }

  private buildStudioTranscriptPrompt(transcript: string): string {
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

  private buildStudioAudioPrompt(): string {
    return `
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
  }

  async transcribeWithElevenLabs(file: any): Promise<{ transcript: string; provider: string; model: string }> {
    if (!this.elevenLabsApiKey) {
      throw new Error("ElevenLabs is not configured (ELEVENLABS_API_KEY missing)");
    }

    const form = new FormData();
    form.append("model_id", this.elevenLabsSTTModel!);
    form.append("file", file);

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": this.elevenLabsApiKey,
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
      model: this.elevenLabsSTTModel!,
    };
  }

  async analyzeTranscript(transcript: string): Promise<StudioAnalysisResult> {
    const prompt = this.buildStudioTranscriptPrompt(transcript);
    const result = await this.inferenceService.runJsonPrompt<{
      insights: StudioInsights;
      humanityCertificate: HumanityCertificate;
    }>(prompt, studioAnalysisSchema);

    return {
      insights: result.data.insights,
      humanityCertificate: result.data.humanityCertificate,
      provider: result.provider,
      model: result.model,
    };
  }

  async analyzeAudioNative(audioBase64: string, mimeType: string): Promise<StudioAnalysisResult> {
    const prompt = this.buildStudioAudioPrompt();
    
    try {
      const result = await this.inferenceService.runGoogleAudioPrompt<{
        insights: StudioInsights;
        humanityCertificate: HumanityCertificate;
      }>({
        prompt,
        audioBase64,
        mimeType,
      });

      return {
        insights: result.data.insights,
        humanityCertificate: result.data.humanityCertificate,
        provider: result.provider,
        model: result.model,
      };
    } catch (error) {
      console.error("Audio-native analysis failed, falling back to text analysis of metadata:", error);
      
      const fallbackPrompt = prompt + "\n\nNote: You do not have the audio file, so perform a general metadata analysis based on voice-over best practices.";
      const result = await this.inferenceService.runJsonPrompt<{
        insights: StudioInsights;
        humanityCertificate: HumanityCertificate;
      }>(fallbackPrompt, studioAnalysisSchema);

      return {
        insights: result.data.insights,
        humanityCertificate: result.data.humanityCertificate,
        provider: result.provider,
        model: result.model,
      };
    }
  }

  async generateStudioAnalysisWithPipeline(
    file: any,
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

    let transcript: string | undefined;

    try {
      updateStep("transcription", { status: "running" });
      const sttResult = await this.transcribeWithElevenLabs(file);
      transcript = sttResult.transcript;
      updateStep("transcription", {
        status: "completed",
        provider: sttResult.provider,
        model: sttResult.model,
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

    if (transcript) {
      try {
        updateStep("analysis", { status: "running" });
        const result = await this.analyzeTranscript(transcript);

        updateStep("analysis", {
          status: "completed",
          provider: result.provider,
          model: result.model,
        });
        updateStep("fallback", { status: "skipped" });

        return {
          insights: result.insights,
          humanityCertificate: result.humanityCertificate,
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

    try {
      updateStep("fallback", { status: "running", message: "Falling back to Gemini multimodal" });
      const fallbackResult = await this.analyzeAudioNative(audioBase64, mimeType);
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

  async analyzeMarketTrends(markdown: string): Promise<any> {
    const prompt = `
Analyze the following markdown content from a voice-over job board and extract the current market trends.
Return a structured JSON object.

Markdown Content:
${markdown.substring(0, 10000)}

Rules:
- Be specific about vocal styles (tones, accents, demographics).
- Return ONLY valid JSON.
`;

    return this.inferenceService.runJsonPrompt(prompt);
  }
}
