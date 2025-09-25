import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const ELEVEN_API_BASE = 'https://api.elevenlabs.io/v1';

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ElevenLabs API key not configured' }), { status: 500 });
    }

    // Get available models
    const modelsResponse = await fetch(`${ELEVEN_API_BASE}/models`, {
      headers: { 'xi-api-key': apiKey },
    });

    if (!modelsResponse.ok) {
      const text = await modelsResponse.text().catch(() => '');
      return new Response(JSON.stringify({ 
        error: `Failed to fetch models: ${modelsResponse.status} ${text}` 
      }), { status: modelsResponse.status });
    }

    const modelsData = await modelsResponse.json();
    
    // Filter models that can do speech-to-speech
    const speechToSpeechModels = modelsData.filter((model: any) => 
      model.can_do_voice_conversion || 
      model.can_do_streaming ||
      model.name?.includes('turbo') ||
      model.name?.includes('flash')
    );

    return new Response(JSON.stringify({
      allModels: modelsData,
      speechToSpeechModels,
      recommendedForSpeechToSpeech: speechToSpeechModels.map((m: any) => ({
        model_id: m.model_id,
        name: m.name,
        can_do_voice_conversion: m.can_do_voice_conversion,
        can_do_streaming: m.can_do_streaming,
        description: m.description
      }))
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('test-models error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal server error' }), 
      { status: 500 }
    );
  }
}