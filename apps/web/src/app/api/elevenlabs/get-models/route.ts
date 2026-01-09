import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const ELEVEN_API_BASE = 'https://api.elevenlabs.io/v1';

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('get-models: ELEVENLABS_API_KEY is not defined in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: API key missing' },
        { status: 500 }
      );
    }

    // Get available models
    const modelsResponse = await fetch(`${ELEVEN_API_BASE}/models`, {
      headers: { 'xi-api-key': apiKey },
    });

    if (!modelsResponse.ok) {
      const text = await modelsResponse.text().catch(() => '');
      console.error(`get-models: ElevenLabs API error ${modelsResponse.status}: ${text}`);
      return NextResponse.json(
        { error: `Failed to fetch models: ${modelsResponse.status} ${text}` },
        { status: modelsResponse.status }
      );
    }

    const modelsData = await modelsResponse.json();

    // Filter models that can do speech-to-speech
    const speechToSpeechModels = modelsData.filter((model: any) =>
      model.can_do_voice_conversion ||
      model.can_do_streaming ||
      model.name?.includes('turbo') ||
      model.name?.includes('flash')
    );

    return NextResponse.json({
      allModels: modelsData,
      speechToSpeechModels,
      recommendedForSpeechToSpeech: speechToSpeechModels.map((m: any) => ({
        model_id: m.model_id,
        name: m.name,
        can_do_voice_conversion: m.can_do_voice_conversion,
        can_do_streaming: m.can_do_streaming,
        description: m.description
      }))
    });

  } catch (err: any) {
    console.error('get-models handler error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}