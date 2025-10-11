import { IAudioTransformProvider, TransformOptions, VoiceInfo, VoiceVariantPreview, DubbingOptions, DubbingResult, DubbingLanguage } from '../../../types/audio';
import { SUPPORTED_DUBBING_LANGUAGES, LanguageInfo } from '../../../constants/languages';

// Minimal ElevenLabs client via fetch to keep deps light
const ELEVEN_API_BASE = 'https://api.elevenlabs.io/v1';

function getEnv(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export class ElevenLabsTransformProvider implements IAudioTransformProvider {
  private apiKey: string;
  private modelId: string;
  private outputFormat: string;
  private voicesCache: VoiceInfo[] | undefined;

  constructor() {
    this.apiKey = getEnv('ELEVENLABS_API_KEY');
    // Use eleven_multilingual_sts_v2 for speech-to-speech conversion (Voice Changer API)
    this.modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_sts_v2';
    this.outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_128';
  }

  async listVoices(): Promise<VoiceInfo[]> {
    if (this.voicesCache) return this.voicesCache;
    const res = await fetch(`${ELEVEN_API_BASE}/voices`, {
      headers: { 'xi-api-key': this.apiKey },
      // Next.js edge compat
      cache: 'no-store' as any,
    });
    if (!res.ok) throw new Error(`Failed to list voices: ${res.status}`);
    const data = await res.json();
    const voices: VoiceInfo[] = (data.voices || []).map((v: any) => ({
      voiceId: v.voice_id,
      name: v.name,
      description: v.description,
    }));
    this.voicesCache = voices;
    return this.voicesCache!;
  }

  async transformVoice(blob: Blob, options: TransformOptions): Promise<Blob> {
    const voiceId = options.voiceId;
    const modelId = options.modelId || this.modelId;
    const outputFormat = options.outputFormat || this.outputFormat;

    const form = new FormData();
    form.append('model_id', modelId);
    form.append('output_format', outputFormat);
    form.append('audio', blob, 'input.webm');

    const res = await fetch(`${ELEVEN_API_BASE}/speech-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': this.apiKey },
      body: form as any,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('ElevenLabs API Error:', {
        status: res.status,
        statusText: res.statusText,
        responseText: text,
        url: res.url,
        voiceId,
        modelId,
        outputFormat
      });
      throw new Error(`Voice transform failed: ${res.status} ${res.statusText} - ${text}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return new Blob([arrayBuffer], { type: 'audio/mpeg' });
  }

  async remixVoice(params: { baseVoiceId: string; description: string; text: string }): Promise<VoiceVariantPreview[]> {
    const res = await fetch(`${ELEVEN_API_BASE}/text-to-voice/remix`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        voice_id: params.baseVoiceId,
        voice_description: params.description,
        text: params.text,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Remix failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    const previews: VoiceVariantPreview[] = (data.previews || []).map((p: any) => ({
      generatedVoiceId: p.generated_voice_id,
      audioBase64: p.audio_base_64,
    }));
    return previews;
  }

  async createVoiceFromPreview(previewId: string, params: { name: string; description?: string }): Promise<{ voiceId: string }> {
    const res = await fetch(`${ELEVEN_API_BASE}/text-to-voice/create`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        voice_name: params.name,
        voice_description: params.description || '',
        generated_voice_id: previewId,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Create voice failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    return { voiceId: data.voice_id };
  }

  async dubAudio(blob: Blob, options: DubbingOptions): Promise<DubbingResult> {
    const startTime = Date.now();
    const targetLanguage = options.targetLanguage;
    const sourceLanguage = options.sourceLanguage;
    const modelId = options.modelId || this.modelId;

    const form = new FormData();
    // ElevenLabs Dubbing API expects 'file' or 'source_url'.
    // Use 'file' to upload the recorded audio blob.
    form.append('file', blob, 'input.webm');
    form.append('target_lang', targetLanguage);
    if (sourceLanguage) {
      form.append('source_lang', sourceLanguage);
    }
    if (options.preserveBackgroundAudio !== undefined) {
      form.append('preserve_background_audio', String(options.preserveBackgroundAudio));
    }

    const res = await fetch(`${ELEVEN_API_BASE}/dubbing`, {
      method: 'POST',
      headers: { 'xi-api-key': this.apiKey },
      body: form as any,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('ElevenLabs Dubbing API Error:', {
        status: res.status,
        statusText: res.statusText,
        responseText: text,
        url: res.url,
        targetLanguage,
        sourceLanguage,
        modelId
      });
      throw new Error(`Dubbing failed: ${res.status} ${res.statusText} - ${text}`);
    }

    const data = await res.json();
    const processingTime = Date.now() - startTime;

    return {
      dubbedAudio: new Blob([Buffer.from(data.audio_base64, 'base64')], { type: 'audio/mpeg' }),
      transcript: data.transcript,
      translatedTranscript: data.translated_transcript,
      detectedSpeakers: data.detected_speakers || 1,
      targetLanguage,
      processingTime
    };
  }

  async getSupportedDubbingLanguages(): Promise<DubbingLanguage[]> {
    // Return languages from shared constants with proper typing
    return SUPPORTED_DUBBING_LANGUAGES.map((lang: LanguageInfo) => ({
      code: lang.code,
      name: lang.name
    }));
  }
}

export function createElevenLabsProvider(): IAudioTransformProvider {
  return new ElevenLabsTransformProvider();
}
