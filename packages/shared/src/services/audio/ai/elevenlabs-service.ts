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
    // Normalize blob MIME type: browsers often set 'audio/webm;codecs=opus', which
    // can be rejected by upstream APIs. Strip codecs and ensure a supported content type.
    const originalType = (blob.type || '').toLowerCase();
    const normalizedType = originalType.split(';')[0] || 'audio/webm';
    const buffer = await blob.arrayBuffer();
    const normalizedBlob = new Blob([buffer], { type: normalizedType });
    const filename = normalizedType.includes('webm')
      ? 'input.webm'
      : normalizedType.includes('ogg')
      ? 'input.ogg'
      : normalizedType.includes('mpeg') || normalizedType.includes('mp3')
      ? 'input.mp3'
      : 'input';
    form.append('audio', normalizedBlob, filename);

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

    // Build multipart form for job creation
    const form = new FormData();
    // Normalize blob MIME type for upstream API acceptance
    const originalType = (blob.type || '').toLowerCase();
    const normalizedType = originalType.split(';')[0] || 'audio/webm';
    const buffer = await blob.arrayBuffer();
    const normalizedBlob = new Blob([buffer], { type: normalizedType });
    const filename = normalizedType.includes('webm')
      ? 'input.webm'
      : normalizedType.includes('ogg')
      ? 'input.ogg'
      : normalizedType.includes('mpeg') || normalizedType.includes('mp3')
      ? 'input.mp3'
      : 'input';
    form.append('file', normalizedBlob, filename);
    form.append('target_lang', targetLanguage);
    if (sourceLanguage) {
      form.append('source_lang', sourceLanguage);
    }
    if (options.modelId) {
      form.append('model_id', options.modelId);
    }
    if (options.preserveBackgroundAudio !== undefined) {
      form.append('drop_background_audio', String(!options.preserveBackgroundAudio));
    }

    // Create dubbing job (returns dubbing_id)
    const createRes = await fetch(`${ELEVEN_API_BASE}/dubbing`, {
      method: 'POST',
      headers: { 'xi-api-key': this.apiKey },
      body: form as any,
    });
    if (!createRes.ok) {
      const text = await createRes.text().catch(() => '');
      console.error('ElevenLabs Dubbing API Error (create):', {
        status: createRes.status,
        statusText: createRes.statusText,
        responseText: text,
        url: createRes.url,
        targetLanguage,
        sourceLanguage,
        modelId
      });
      throw new Error(`Dubbing failed to start: ${createRes.status} ${createRes.statusText} - ${text}`);
    }
    const createData = await createRes.json();
    const dubbingId = createData.dubbing_id;
    if (!dubbingId) {
      throw new Error('Dubbing API did not return a dubbing_id');
    }

    // Poll job status until completed or timed out
    const pollStart = Date.now();
    const maxWaitMs = 60_000; // 60s cap for web UX
    const pollIntervalMs = 1500;
    let status = 'dubbing';
    while (status !== 'dubbed') {
      if (Date.now() - pollStart > maxWaitMs) {
        throw new Error('Dubbing timed out. Please try again later.');
      }
      const statusRes = await fetch(`${ELEVEN_API_BASE}/dubbing/${dubbingId}`, {
        headers: { 'xi-api-key': this.apiKey },
      });
      if (!statusRes.ok) {
        const text = await statusRes.text().catch(() => '');
        throw new Error(`Failed to get dubbing status: ${statusRes.status} ${statusRes.statusText} - ${text}`);
      }
      const statusData = await statusRes.json();
      status = statusData.status;
      if (status === 'failed') {
        const errMsg = statusData.error || 'Dubbing job failed';
        throw new Error(errMsg);
      }
      if (status !== 'dubbed') {
        await new Promise((r) => setTimeout(r, pollIntervalMs));
      }
    }

    // Retrieve dubbed audio (streamed MP3/MP4)
    const audioRes = await fetch(`${ELEVEN_API_BASE}/dubbing/${dubbingId}/audio/${targetLanguage}`, {
      headers: { 'xi-api-key': this.apiKey },
    });
    if (!audioRes.ok) {
      const text = await audioRes.text().catch(() => '');
      throw new Error(`Failed to fetch dubbed audio: ${audioRes.status} ${audioRes.statusText} - ${text}`);
    }
    const audioBuffer = await audioRes.arrayBuffer();

    const processingTime = Date.now() - startTime;
    return {
      dubbedAudio: new Blob([audioBuffer], { type: 'audio/mpeg' }),
      transcript: '',
      translatedTranscript: '',
      detectedSpeakers: 1,
      targetLanguage,
      processingTime,
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
