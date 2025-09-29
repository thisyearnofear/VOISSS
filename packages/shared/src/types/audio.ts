export interface VoiceInfo {
  voiceId: string;
  name?: string;
  description?: string;
}

export interface VoiceVariantPreview {
  generatedVoiceId: string;
  // Optional: base64 or URL for previewing
  audioBase64?: string;
}

export interface TransformOptions {
  voiceId: string;
  modelId?: string; // default via env
  outputFormat?: string; // default via env
}

export interface DubbingLanguage {
  code: string;
  name: string;
  nativeName?: string;
}

export interface DubbingOptions extends TransformOptions {
  targetLanguage: string;
  sourceLanguage?: string; // auto-detect if not provided
  preserveBackgroundAudio?: boolean;
  modelId?: string; // default via env
}

export interface DubbingResult {
  dubbedAudio: Blob;
  transcript?: string;
  translatedTranscript?: string;
  detectedSpeakers?: number;
  targetLanguage: string;
  processingTime?: number;
}

export interface IAudioTransformProvider {
  listVoices(): Promise<VoiceInfo[]>;
  transformVoice(blob: Blob, options: TransformOptions): Promise<Blob>;
  dubAudio?(blob: Blob, options: DubbingOptions): Promise<DubbingResult>;
  getSupportedDubbingLanguages?(): Promise<DubbingLanguage[]>;
  remixVoice?(params: { baseVoiceId: string; description: string; text: string }): Promise<VoiceVariantPreview[]>;
  createVoiceFromPreview?(previewId: string, params: { name: string; description?: string }): Promise<{ voiceId: string }>;
}
