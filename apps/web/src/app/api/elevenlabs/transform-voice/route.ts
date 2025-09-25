import { NextRequest } from 'next/server';
import { createElevenLabsProvider } from '@voisss/shared';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'Expected multipart/form-data' }), { status: 400 });
    }

    const form = await req.formData();
    const file = form.get('audio');
    const voiceId = String(form.get('voiceId') || '');
    const modelId = String(form.get('modelId') || '');
    const outputFormat = String(form.get('outputFormat') || '');

    if (!(file instanceof Blob)) {
      return new Response(JSON.stringify({ error: 'Missing audio file' }), { status: 400 });
    }
    if (!voiceId) {
      return new Response(JSON.stringify({ error: 'Missing voiceId' }), { status: 400 });
    }

    const provider = createElevenLabsProvider();
    const transformed = await provider.transformVoice(file, { voiceId, modelId, outputFormat });

    // Return as a binary response
    return new Response(await transformed.arrayBuffer(), {
      status: 200,
      headers: {
        'content-type': transformed.type || 'audio/mpeg',
        'cache-control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('transform-voice error', err);
    return new Response(JSON.stringify({ error: err?.message || 'Internal error' }), { status: 500 });
  }
}
