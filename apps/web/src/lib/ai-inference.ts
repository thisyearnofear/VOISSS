import { 
  getInferenceService, 
  getStudioAnalysisService,
  InferenceResponse,
  StudioAnalysisResult,
  PipelineAnalysisResult,
  AnalysisStep,
  AnalysisStepId,
  MarketTrendResult,
  StudioInsights,
  HumanityCertificate
} from "@voisss/shared/server";

export type { 
  StudioInsights, 
  HumanityCertificate, 
  StudioAnalysisResult,
  AnalysisStep,
  AnalysisStepId,
  PipelineAnalysisResult,
  MarketTrendResult
};

export function getAIProviderStatus() {
  const inferenceService = getInferenceService();
  const config = inferenceService.getConfig();
  
  return {
    google: {
      configured: Boolean(config.google?.apiKey),
      textModel: config.google?.textModel || "gemini-3.1-pro-preview",
      audioModel: config.google?.audioModel || "gemini-3.1-flash-preview",
    },
    acpCompute: {
      configured: Boolean(config.acpCompute?.apiKey),
      agentId: config.acpCompute?.agentId,
      model: config.acpCompute?.model || "llama-3.3-70b",
    },
    venice: {
      configured: Boolean(config.venice?.apiKey),
      model: config.venice?.model || "llama-3.3-70b",
    },
    kilocode: {
      configured: Boolean(config.kilocode?.apiKey),
      model: config.kilocode?.model || "kilo-auto/balanced",
    },
    routeway: {
      configured: Boolean(config.routeway?.apiKey),
      model: config.routeway?.model || "kimi-k2-0905:free",
    },
    fallbackOrder: config.fallbackOrder || ["acpCompute", "kilocode", "venice", "google"],
  };
}

export async function generateAssistantReply(prompt: string): Promise<InferenceResponse> {
  const inferenceService = getInferenceService();
  return inferenceService.runChat([
    {
      role: "system",
      content: "You are the VOISSS assistant. Keep responses concise, natural, and ready for text-to-speech.",
    },
    { role: "user", content: prompt },
  ]);
}

export async function runJsonPrompt<T>(prompt: string, schema?: any): Promise<{ data: T; provider: string; model: string }> {
  const inferenceService = getInferenceService();
  return inferenceService.runJsonPrompt<T>(prompt, schema);
}

export async function generateStudioAnalysisWithPipeline(
  file: File,
  audioBase64: string,
  mimeType: string,
  onProgress?: (event: { step: AnalysisStep; steps: AnalysisStep[]; transcript?: string }) => void
): Promise<PipelineAnalysisResult> {
  const studioService = getStudioAnalysisService();
  return studioService.generateStudioAnalysisWithPipeline(file, audioBase64, mimeType, onProgress);
}

export async function generateStudioAnalysisFromAudio(
  audioBase64: string,
  mimeType: string
): Promise<StudioAnalysisResult> {
  const studioService = getStudioAnalysisService();
  return studioService.analyzeAudioNative(audioBase64, mimeType);
}

export async function analyzeMarketTrends(
  markdown: string
): Promise<MarketTrendResult> {
  const studioService = getStudioAnalysisService();
  return studioService.analyzeMarketTrends(markdown);
}

export async function generateContentFromAudio(
  audioBase64: string,
  mimeType: string
) {
  const analysis = await generateStudioAnalysisFromAudio(audioBase64, mimeType);
  return analysis.insights;
}
