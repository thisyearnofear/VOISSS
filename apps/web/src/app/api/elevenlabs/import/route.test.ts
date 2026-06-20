import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

const createRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/elevenlabs/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/elevenlabs/import', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects missing API key', async () => {
    const res = await POST(createRequest({}));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain('API key');
  });

  it('rejects invalid API key format', async () => {
    const res = await POST(createRequest({ apiKey: 'invalid-key' }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toContain('sk_');
  });

  it('rejects invalid ElevenLabs API key (401)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Unauthorized', { status: 401 }),
    );
    const res = await POST(createRequest({ apiKey: 'sk_test_validformat' }));
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error).toContain('Invalid');
  });

  it('returns imported voices on success', async () => {
    const mockVoices = {
      voices: [
        { voice_id: 'v1', name: 'Voice Alpha', category: 'cloned' },
        { voice_id: 'v2', name: 'Voice Beta', category: 'professional' },
      ],
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockVoices), { status: 200 }),
    );
    const res = await POST(createRequest({ apiKey: 'sk_test_validformat' }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.voices).toHaveLength(2);
    expect(json.data.totalImported).toBe(2);
    expect(json.data.voices[0].name).toBe('Voice Alpha');
    expect(json.data.voices[1].elevenlabsVoiceId).toBe('v2');
  });

  it('filters to selected voice IDs', async () => {
    const mockVoices = {
      voices: [
        { voice_id: 'v1', name: 'Voice Alpha', category: 'cloned' },
        { voice_id: 'v2', name: 'Voice Beta', category: 'professional' },
        { voice_id: 'v3', name: 'Voice Gamma', category: 'generated' },
      ],
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockVoices), { status: 200 }),
    );
    const res = await POST(
      createRequest({ apiKey: 'sk_test_validformat', selectedVoiceIds: ['v1', 'v3'] }),
    );
    const json = await res.json();
    expect(json.data.voices).toHaveLength(2);
    expect(json.data.voices.map((v: any) => v.voiceId)).toEqual(['v1', 'v3']);
  });

  it('returns 404 when no voices exist on account', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ voices: [] }), { status: 200 }),
    );
    const res = await POST(createRequest({ apiKey: 'sk_test_validformat' }));
    expect(res.status).toBe(404);
  });
});
