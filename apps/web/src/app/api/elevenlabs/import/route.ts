import { NextRequest, NextResponse } from 'next/server';

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  preview_url?: string;
  labels?: Record<string, string>;
}

interface ImportRequest {
  apiKey: string;
  selectedVoiceIds?: string[];
}

interface ImportedVoice {
  voiceId: string;
  name: string;
  elevenlabsVoiceId: string;
  previewUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ImportRequest = await request.json();
    const { apiKey, selectedVoiceIds } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { success: false, error: 'ElevenLabs API key is required' },
        { status: 400 },
      );
    }

    if (!apiKey.startsWith('sk_')) {
      return NextResponse.json(
        { success: false, error: 'Invalid ElevenLabs API key format (must start with sk_)' },
        { status: 400 },
      );
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Invalid ElevenLabs API key' },
          { status: 401 },
        );
      }
      return NextResponse.json(
        { success: false, error: `ElevenLabs API error: ${response.statusText}` },
        { status: 502 },
      );
    }

    const data = await response.json();
    const voices: ElevenLabsVoice[] = data.voices || [];

    if (voices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No voices found on this ElevenLabs account' },
        { status: 404 },
      );
    }

    let targetVoices = voices;
    if (selectedVoiceIds && selectedVoiceIds.length > 0) {
      targetVoices = voices.filter((v) => selectedVoiceIds.includes(v.voice_id));
      if (targetVoices.length === 0) {
        return NextResponse.json(
          { success: false, error: 'None of the specified voice IDs were found' },
          { status: 404 },
        );
      }
    }

    const imported: ImportedVoice[] = targetVoices.map((v) => ({
      voiceId: v.voice_id,
      name: v.name,
      elevenlabsVoiceId: v.voice_id,
      previewUrl: v.preview_url,
    }));

    return NextResponse.json({
      success: true,
      data: {
        voices: imported,
        totalImported: imported.length,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
