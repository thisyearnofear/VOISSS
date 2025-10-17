import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';

const ELEVEN_API_BASE = 'https://api.elevenlabs.io/v1';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Require authentication for TTS
    const user = requireAuth(req);
    console.log(`TTS request from: ${user.address}`);
    
    const { text, voiceId } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400 });
    }
    if (!voiceId) {
      return new Response(JSON.stringify({ error: 'Missing voiceId' }), { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ElevenLabs API key not configured' }), { status: 500 });
    }

    // Use the free text-to-speech endpoint
    const response = await fetch(`${ELEVEN_API_BASE}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('ElevenLabs TTS Error:', {
        status: response.status,
        statusText: response.statusText,
        responseText: text,
        url: response.url,
        voiceId
      });
      
      let userFriendlyMessage = `Text-to-Speech failed: ${response.status} ${response.statusText}`;
      if (text.includes('quota')) {
        userFriendlyMessage = 'ElevenLabs API quota exceeded. Please wait or upgrade your plan.';
      } else if (response.status === 401) {
        userFriendlyMessage = 'Invalid ElevenLabs API key. Please check your configuration.';
      }
      
      return new Response(JSON.stringify({ error: userFriendlyMessage }), { status: response.status });
    }

    // Return audio data
    const audioBuffer = await response.arrayBuffer();
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });

  } catch (err: any) {
    console.error('text-to-speech error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal server error' }), 
      { status: 500 }
    );
  }
}