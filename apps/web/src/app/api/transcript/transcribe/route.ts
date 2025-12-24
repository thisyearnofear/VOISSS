import { NextRequest, NextResponse } from 'next/server';
import { TimedTranscriptSchema } from '@voisss/shared/types/transcript';

export const runtime = 'nodejs';

/**
 * Accuracy-first transcription endpoint.
 *
 * Returns the canonical TimedTranscript (with word-level timings when available).
 *
 * Uses OpenAI Whisper-compatible API if `OPENAI_API_KEY` is configured.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured. Transcription is unavailable.' },
        { status: 501 }
      );
    }

    const form = await req.formData();
    const file = form.get('audio');
    const language = String(form.get('language') || '').trim() || undefined;

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }

    // Forward to OpenAI transcription endpoint
    // NOTE: We request verbose_json + word timestamps when supported.
    const upstream = new FormData();
    upstream.append('file', file, (file as any).name || 'audio.webm');
    upstream.append('model', process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1');
    upstream.append('response_format', 'verbose_json');
    upstream.append('timestamp_granularities[]', 'word');
    if (language) upstream.append('language', language);

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstream,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || `Transcription failed: ${res.status}` },
        { status: res.status }
      );
    }

    const transcript = mapOpenAIVerboseJsonToTimedTranscript(data);
    const validated = TimedTranscriptSchema.parse(transcript);

    return NextResponse.json({ ok: true, transcript: validated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Transcription failed' }, { status: 500 });
  }
}

function toMs(seconds: number | undefined): number {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return 0;
  return Math.max(0, Math.round(seconds * 1000));
}

function stableIdFromIndex(prefix: string, index: number) {
  return `${prefix}_${index}`;
}

/**
 * Maps OpenAI Whisper `verbose_json` format into canonical TimedTranscript.
 *
 * Expected shape (subset):
 * - text: string
 * - language?: string
 * - segments?: Array<{ start: number; end: number; text: string; words?: Array<{ word: string; start: number; end: number }> }>
 */
function mapOpenAIVerboseJsonToTimedTranscript(payload: any) {
  const language = typeof payload?.language === 'string' ? payload.language : 'en';
  const segmentsSrc = Array.isArray(payload?.segments) ? payload.segments : [];

  const segments = segmentsSrc.map((s: any, idx: number) => {
    const wordsSrc = Array.isArray(s?.words) ? s.words : undefined;
    return {
      id: stableIdFromIndex('seg', idx),
      startMs: toMs(s?.start),
      endMs: toMs(s?.end),
      text: String(s?.text || '').trim(),
      words: wordsSrc
        ? wordsSrc
            .filter((w: any) => w && typeof w.word === 'string')
            .map((w: any, wi: number) => ({
              word: String(w.word).trim(),
              startMs: toMs(w.start),
              endMs: toMs(w.end),
              confidence: typeof w.confidence === 'number' ? w.confidence : undefined,
            }))
        : undefined,
    };
  });

  const id = `tt_openai_${Date.now()}`;

  return {
    id,
    language,
    text: typeof payload?.text === 'string' ? payload.text : segments.map((s: any) => s.text).join(' '),
    segments,
    provider: 'openai',
    createdAt: new Date().toISOString(),
  };
}
