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

export interface IAudioTransformProvider {
  listVoices(): Promise<VoiceInfo[]>;
  transformVoice(blob: Blob, options: TransformOptions): Promise<Blob>;
  remixVoice?(params: { baseVoiceId: string; description: string; text: string }): Promise<VoiceVariantPreview[]>;
  createVoiceFromPreview?(previewId: string, params: { name: string; description?: string }): Promise<{ voiceId: string }>;
}
