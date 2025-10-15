import { IAudioTransformProvider, TransformOptions, VoiceInfo, VoiceVariantPreview, DubbingOptions, DubbingResult, DubbingLanguage } from '../../../types/audio';
import { SUPPORTED_DUBBING_LANGUAGES, LanguageInfo } from '../../../constants/languages';

// Use dedicated backend if configured, otherwise direct ElevenLabs API
// Check both NEXT_PUBLIC_VOISSS_API (client-side) and VOISSS_API (server-side)
const USE_BACKEND = typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_VOISSS_API || process.env.VOISSS_API);
const API_BASE = USE_BACKEND
  ? (process.env.NEXT_PUBLIC_VOISSS_API || process.env.VOISSS_API)
  : 'https://api.elevenlabs.io/v1';

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
    // API key only needed for direct API calls, not for backend
    this.apiKey = USE_BACKEND ? '' : getEnv('ELEVENLABS_API_KEY');
    this.modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_sts_v2';
    this.outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_44100_128';
  }

  async listVoices(): Promise<VoiceInfo[]> {
    if (this.voicesCache) return this.voicesCache;
    
    const url = USE_BACKEND ? `${API_BASE}/api/voices` : `${API_BASE}/voices`;
    const headers: Record<string, string> = USE_BACKEND ? {} : { 'xi-api-key': this.apiKey };
    
    const res = await fetch(url, {
      headers,
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
    
    // Normalize blob MIME type
    const originalType = (blob.type || '').toLowerCase();
    const normalizedType = originalType.split(';')[0] || 'audio/webm';
    const buffer = await blob.arrayBuffer();
    const normalizedBlob = new Blob([buffer], { type: normalizedType });
    const filename = normalizedType.includes('webm') ? 'input.webm' :
                     normalizedType.includes('ogg') ? 'input.ogg' :
                     normalizedType.includes('mpeg') || normalizedType.includes('mp3') ? 'input.mp3' : 'input';
    
    if (USE_BACKEND) {
      // Backend API format
      form.append('audio', normalizedBlob, filename);
      form.append('voiceId', voiceId);
      form.append('modelId', modelId);
      form.append('outputFormat', outputFormat);
    } else {
      // Direct ElevenLabs API format
      form.append('model_id', modelId);
      form.append('output_format', outputFormat);
      form.append('audio', normalizedBlob, filename);
    }

    const url = USE_BACKEND ? `${API_BASE}/api/transform` : `${API_BASE}/speech-to-speech/${voiceId}`;
    const headers: Record<string, string> = USE_BACKEND ? {} : { 'xi-api-key': this.apiKey };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: form as any,
    });
    
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('Voice transform error:', {
        status: res.status,
        statusText: res.statusText,
        responseText: text,
        voiceId,
        modelId,
        outputFormat,
        backend: USE_BACKEND
      });
      throw new Error(`Voice transform failed: ${res.status} ${res.statusText} - ${text}`);
    }
    
    const arrayBuffer = await res.arrayBuffer();
    return new Blob([arrayBuffer], { type: 'audio/mpeg' });
  }

  async remixVoice(params: { baseVoiceId: string; description: string; text: string }): Promise<VoiceVariantPreview[]> {
    const res = await fetch(`${API_BASE}/text-to-voice/remix`, {
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
    const res = await fetch(`${API_BASE}/text-to-voice/create`, {
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

  async startDubbingJob(blob: Blob, options: DubbingOptions): Promise<string> {
    const targetLanguage = options.targetLanguage;
    const sourceLanguage = options.sourceLanguage;
    const modelId = options.modelId || this.modelId;

    const form = new FormData();
    const originalType = (blob.type || '').toLowerCase();
    const normalizedType = originalType.split(';')[0] || 'audio/webm';
    const buffer = await blob.arrayBuffer();
    const normalizedBlob = new Blob([buffer], { type: normalizedType });
    const filename = normalizedType.includes('webm') ? 'input.webm' :
                     normalizedType.includes('ogg') ? 'input.ogg' :
                     normalizedType.includes('mpeg') || normalizedType.includes('mp3') ? 'input.mp3' : 'input';
    
    form.append(USE_BACKEND ? 'audio' : 'file', normalizedBlob, filename);
    form.append(USE_BACKEND ? 'targetLanguage' : 'target_lang', targetLanguage);
    
    if (sourceLanguage) {
      form.append(USE_BACKEND ? 'sourceLanguage' : 'source_lang', sourceLanguage);
    }
    if (options.modelId) {
      form.append(USE_BACKEND ? 'modelId' : 'model_id', options.modelId);
    }
    if (options.preserveBackgroundAudio !== undefined) {
      form.append(USE_BACKEND ? 'preserveBackgroundAudio' : 'drop_background_audio',
                  USE_BACKEND ? String(options.preserveBackgroundAudio) : String(!options.preserveBackgroundAudio));
    }

    const url = USE_BACKEND ? `${API_BASE}/api/dubbing/start` : `${API_BASE}/dubbing`;
    const headers: Record<string, string> = USE_BACKEND ? {} : { 'xi-api-key': this.apiKey };

    const createRes = await fetch(url, {
      method: 'POST',
      headers,
      body: form as any,
    });
    
    if (!createRes.ok) {
      const text = await createRes.text().catch(() => '');
      console.error('Dubbing start error:', {
        status: createRes.status,
        statusText: createRes.statusText,
        responseText: text,
        targetLanguage,
        sourceLanguage,
        modelId,
        backend: USE_BACKEND
      });
      throw new Error(`Dubbing failed to start: ${createRes.status} ${createRes.statusText} - ${text}`);
    }
    
    const createData = await createRes.json();
    const dubbingId = createData.dubbing_id;
    if (!dubbingId) {
      throw new Error('Dubbing API did not return a dubbing_id');
    }

    return dubbingId;
  }

  async getDubbingStatus(dubbingId: string): Promise<{ status: string; error?: string }> {
    const url = USE_BACKEND ? `${API_BASE}/api/dubbing/${dubbingId}/status` : `${API_BASE}/dubbing/${dubbingId}`;
    const headers: Record<string, string> = USE_BACKEND ? {} : { 'xi-api-key': this.apiKey };
    
    const statusRes = await fetch(url, { headers });
    
    if (!statusRes.ok) {
      const text = await statusRes.text().catch(() => '');
      throw new Error(`Failed to get dubbing status: ${statusRes.status} ${statusRes.statusText} - ${text}`);
    }
    
    const statusData = await statusRes.json();
    return {
      status: statusData.status,
      error: statusData.error
    };
  }

  async getDubbedAudio(dubbingId: string, targetLanguage: string): Promise<DubbingResult> {
    const url = USE_BACKEND
      ? `${API_BASE}/api/dubbing/${dubbingId}/audio/${targetLanguage}`
      : `${API_BASE}/dubbing/${dubbingId}/audio/${targetLanguage}`;
    const headers: Record<string, string> = USE_BACKEND ? {} : { 'xi-api-key': this.apiKey };
    
    const audioRes = await fetch(url, { headers });
    
    if (!audioRes.ok) {
      const text = await audioRes.text().catch(() => '');
      throw new Error(`Failed to fetch dubbed audio: ${audioRes.status} ${audioRes.statusText} - ${text}`);
    }
    
    const audioBuffer = await audioRes.arrayBuffer();

    return {
      dubbedAudio: new Blob([audioBuffer], { type: 'audio/mpeg' }),
      transcript: '',
      translatedTranscript: '',
      detectedSpeakers: 1,
      targetLanguage,
      processingTime: 0,
    };
  }

  async dubAudio(blob: Blob, options: DubbingOptions): Promise<DubbingResult> {
    // Start job
    const dubbingId = await this.startDubbingJob(blob, options);

    // Poll for completion with extended timeout for production
    const pollStart = Date.now();
    const maxWaitMs = 180_000; // 3 minutes for dubbing operations
    const pollIntervalMs = 2000; // Check every 2 seconds
    let status = 'dubbing';
    let pollCount = 0;

    while (status !== 'dubbed') {
      const elapsed = Date.now() - pollStart;
      
      if (elapsed > maxWaitMs) {
        throw new Error(`Dubbing is taking longer than expected (${Math.round(elapsed / 1000)}s). The job may still be processing. Please check back in a moment or try with a shorter audio clip.`);
      }

      const statusResult = await this.getDubbingStatus(dubbingId);
      status = statusResult.status;
      pollCount++;

      if (status === 'failed') {
        const errMsg = statusResult.error || 'Dubbing job failed';
        throw new Error(errMsg);
      }

      if (status !== 'dubbed') {
        // Log progress every 10 polls (20 seconds)
        if (pollCount % 10 === 0) {
          console.log(`Dubbing in progress... (${Math.round(elapsed / 1000)}s elapsed, status: ${status})`);
        }
        await new Promise((r) => setTimeout(r, pollIntervalMs));
      }
    }

    // Get final result
    return await this.getDubbedAudio(dubbingId, options.targetLanguage);
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
