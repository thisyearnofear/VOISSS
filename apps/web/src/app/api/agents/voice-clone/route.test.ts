/**
 * /api/agents/voice-clone — happy-path + 410 path tests.
 *
 * The alias route has no shared-service dependencies; we just verify
 * the response shape and status codes. No mocking required.
 */
import { describe, it, expect } from 'vitest';
import { GET, POST } from '@/app/api/agents/voice-clone/route';
import { NextRequest } from 'next/server';

describe('GET /api/agents/voice-clone', () => {
  it('returns a 200 with the canonical-path pointer', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.canonicalPath).toBe('/api/elevenlabs/clone-voice');
    expect(body.data.canonicalMethod).toBe('POST');
  });
});

describe('POST /api/agents/voice-clone', () => {
  it('returns 410 Gone with Location header pointing to canonical path', async () => {
    const req = new NextRequest('http://localhost/api/agents/voice-clone', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(410);
    expect(res.headers.get('Location')).toBe('/api/elevenlabs/clone-voice');
    expect(res.headers.get('X-VOISSS-Canonical-Path')).toBe('/api/elevenlabs/clone-voice');
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.canonicalPath).toBe('/api/elevenlabs/clone-voice');
  });
});
