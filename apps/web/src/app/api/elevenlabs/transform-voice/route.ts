import { NextRequest } from 'next/server';
import { createElevenLabsProvider } from '@voisss/shared';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Require authentication for AI features
    const user = requireAuth(req);
    console.log(`Transform request from: ${user.address}`);
    
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
    // Handle auth errors
    if (err.message === 'No authentication token' || err.message === 'Invalid or expired session') {
      return new Response(JSON.stringify({ 
        error: 'Please sign in to use AI voice transformation' 
      }), { status: 401 });
    }
    
    console.error('transform-voice error:', {
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
      cause: err?.cause,
      fullError: err
    });
    
    // Check for specific ElevenLabs API errors
    const errorMessage = err?.message || 'Internal error';
    let status = 500;
    let userFriendlyMessage = errorMessage;
    
    if (errorMessage.includes('missing the permission speech_to_speech')) {
      status = 402; // Payment required
      userFriendlyMessage = 'Speech-to-Speech feature requires an upgraded ElevenLabs plan. Please upgrade your ElevenLabs account or use a different API key.';
    } else if (errorMessage.includes('model_can_not_do_voice_conversion')) {
      status = 400;
      userFriendlyMessage = 'The selected model does not support voice conversion. Use eleven_multilingual_sts_v2 or eleven_english_sts_v2 for speech-to-speech conversion.';
    } else if (errorMessage.includes('401')) {
      status = 401;
      userFriendlyMessage = 'Invalid ElevenLabs API key. Please check your API key configuration.';
    } else if (errorMessage.includes('quota')) {
      status = 429;
      userFriendlyMessage = 'ElevenLabs API quota exceeded. Please wait or upgrade your plan.';
    }
    
    const errorDetails = process.env.NODE_ENV === 'development' ? {
      error: userFriendlyMessage,
      originalError: errorMessage,
      stack: err?.stack,
      type: err?.name
    } : { error: userFriendlyMessage };
    
    return new Response(JSON.stringify(errorDetails), { status });
  }
}
