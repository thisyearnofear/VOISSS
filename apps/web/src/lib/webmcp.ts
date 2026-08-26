/**
 * WebMCP Integration for VOISSS
 *
 * Exposes voice marketplace tools to AI agents running in the browser.
 * Two modes:
 *  - Native: document.modelContext (Chrome 149+ Origin Trial, ChatGPT browser)
 *  - Polyfill: loads from demos/shared/webmcp-polyfill.js if native not available
 *
 * Tools registered:
 *  1. list_voices — browse voices with filters
 *  2. play_voice_sample — play audio for a voice
 *  3. get_voice_details — full info for a specific voice
 *  4. license_voice — open license checkout
 *  5. vocalize — generate speech from text
 */

// ---------------------------------------------------------------------------
// Polyfill: load Google's WebMCP polyfill if native support is absent
// ---------------------------------------------------------------------------

async function loadPolyfill(): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).document?.modelContext) {
    return; // native support already present
  }

  try {
    const res = await fetch('/webmcp-polyfill.js');
    if (res.ok) {
      const text = await res.text();
      // eslint-disable-next-line no-eval
      eval(text);
    }
  } catch {
    // Polyfill not available — native API will be undefined and tools
    // won't register. This is fine; non-WebMCP browsers just see normal UI.
    console.warn('[VOISSS WebMCP] Polyfill not found — tools won\'t register');
  }
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

interface Voice {
  id: string;
  name: string;
  description: string;
  tags: string[];
  price: string;
  previewUrl: string;
  tone?: string;
  language?: string;
  licenseType?: string;
  contributor?: string;
}

function buildFilterParams(filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/api/marketplace/voices?${qs}` : '/api/marketplace/voices';
}

function findVoiceById(voices: Voice[], id: string): Voice | undefined {
  return voices.find((v) => v.id === id || v.id.replace('voice_', '') === id);
}

async function fetchVoices(filters?: Record<string, string | undefined>): Promise<Voice[]> {
  const res = await fetch(buildFilterParams(filters ?? {}));
  const data = await res.json();
  return data.success ? data.data.voices : [];
}

// ---------------------------------------------------------------------------
// Register all tools
// ---------------------------------------------------------------------------

export async function initWebMCP(): Promise<void> {
  // Load polyfill if needed (only on client)
  if (typeof window !== 'undefined') {
    await loadPolyfill();
  }

  const ctx = typeof window !== 'undefined' ? (window.document as any).modelContext : undefined;
  if (!ctx) {
    console.debug('[VOISSS WebMCP] No modelContext available — skipping tool registration');
    return;
  }

  // 1. list_voices
  await ctx.registerTool({
    name: 'list_voices',
    description:
      'Browse available human voices on the VOISSS voice licensing marketplace. Returns voice ID, name, description, tags, tone, language, monthly price, and a preview audio URL. Supports filtering by language code (e.g. "en"), tone (professional, casual, friendly, deep, energetic, calm), and license type (exclusive or non-exclusive).',
    inputSchema: {
      type: 'object',
      properties: {
        language: { type: 'string', description: '2-letter language code, e.g. en, es, fr, de' },
        tone: {
          type: 'string',
          enum: ['professional', 'casual', 'friendly', 'deep', 'energetic', 'calm', 'authoritative'],
          description: 'Voice tone or personality style',
        },
        licenseType: {
          type: 'string',
          enum: ['exclusive', 'non-exclusive'],
          description: 'License type to filter by',
        },
      },
    },
    async execute(params: { language?: string; tone?: string; licenseType?: string }) {
      try {
        const voices = await fetchVoices({
          language: params.language,
          tone: params.tone,
          licenseType: params.licenseType,
        });
        return { voices, total: voices.length };
      } catch (err) {
        return { error: 'Failed to fetch voices', details: String(err) };
      }
    },
  });

  // 2. play_voice_sample
  await ctx.registerTool({
    name: 'play_voice_sample',
    description:
      'Play the voice sample audio for a specific VOISSS voice in the browser. Shows the audio player UI with the selected voice. Use this to let the user hear a voice before deciding to license or generate speech.',
    inputSchema: {
      type: 'object',
      required: ['voiceId'],
      properties: {
        voiceId: { type: 'string', description: 'The VOISSS voice ID (e.g. voice_21m00Tcm4TlvDq8ikWAM)' },
      },
    },
    async execute(params: { voiceId: string }) {
      const { voiceId } = params;
      // Try to find and play the audio element on the marketplace page
      const audioEl = document.querySelector(`audio[data-voice-id="${voiceId}"]`) as HTMLAudioElement | null;
      if (audioEl) {
        await audioEl.play();
        return { status: 'playing', voiceId, audioElement: audioEl.outerHTML };
      }
      // Fallback: navigate to the voice card section and try to play
      return {
        status: 'not_found',
        voiceId,
        note: 'Voice sample not found on current page. Navigate to the marketplace page to see voice samples.',
      };
    },
  });

  // 3. get_voice_details
  await ctx.registerTool({
    name: 'get_voice_details',
    description:
      'Get detailed information about a specific VOISSS voice including tags, description, pricing, license terms, and contributor info. Use this after list_voices to get full details about a particular voice.',
    inputSchema: {
      type: 'object',
      required: ['voiceId'],
      properties: {
        voiceId: { type: 'string', description: 'The VOISSS voice ID' },
      },
    },
    async execute(params: { voiceId: string }) {
      const { voiceId } = params;
      try {
        const voices = await fetchVoices();
        const voice = findVoiceById(voices, voiceId);
        if (voice) return voice;
        return { error: 'Voice not found', voiceId };
      } catch (err) {
        return { error: 'Failed to fetch voice details', details: String(err) };
      }
    },
  });

  // 4. license_voice
  await ctx.registerTool({
    name: 'license_voice',
    description:
      'Request a license for a VOISSS voice. Opens the license checkout flow on the marketplace page. Non-exclusive licenses cost $49 USD, exclusive licenses cost $490 USD. The agent should confirm with the user before calling this.',
    inputSchema: {
      type: 'object',
      required: ['voiceId', 'licenseType'],
      properties: {
        voiceId: { type: 'string', description: 'The VOISSS voice ID to license' },
        licenseType: { type: 'string', enum: ['exclusive', 'non-exclusive'], description: 'Type of license' },
      },
    },
    async execute(params: { voiceId: string; licenseType: 'exclusive' | 'non-exclusive' }) {
      const { voiceId, licenseType } = params;
      const price = licenseType === 'exclusive' ? '$490' : '$49';
      return {
        status: 'checkout_opened',
        voiceId,
        licenseType,
        price,
        note: 'Navigate to the VOISSS marketplace to complete the license purchase.',
        url: `/marketplace?voiceId=${encodeURIComponent(voiceId)}&licenseType=${encodeURIComponent(licenseType)}`,
      };
    },
  });

  // 5. vocalize
  await ctx.registerTool({
    name: 'vocalize',
    description:
      'Generate speech from text using a VOISSS voice. Returns an audio URL and recording ID. Free for preview (up to 30 seconds, preview:true). Paid generation requires payment via the VOISSS payment flow. Use this after selecting a voice from list_voices.',
    inputSchema: {
      type: 'object',
      required: ['text', 'voiceId'],
      properties: {
        text: { type: 'string', description: 'Text content to convert to speech (max 5000 chars)' },
        voiceId: { type: 'string', description: 'The VOISSS voice ID to use for synthesis' },
        preview: {
          type: 'boolean',
          description: 'If true, generate a free 30-second preview without payment',
          default: false,
        },
      },
    },
    async execute(params: { text: string; voiceId: string; preview?: boolean }) {
      const { text, voiceId, preview } = params;
      try {
        const res = await fetch('/api/agents/vocalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceId, preview }),
        });
        const data = await res.json();

        if (res.status === 402) {
          return { error: 'payment_required', details: data.payment };
        }
        if (data.success) {
          return {
            audioUrl: data.data.audioUrl,
            cost: data.data.cost,
            recordingId: data.data.recordingId,
            preview: !!preview,
          };
        }
        return { error: 'generation_failed', details: data.error };
      } catch (err) {
        return { error: 'generation_failed', details: String(err) };
      }
    },
  });

  console.info('[VOISSS WebMCP] 5 tools registered successfully');
}