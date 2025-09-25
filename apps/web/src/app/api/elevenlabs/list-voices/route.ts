import { NextRequest } from 'next/server';
import { createElevenLabsProvider } from '@voisss/shared';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest) {
  try {
    const provider = createElevenLabsProvider();
    const voices = await provider.listVoices();
    return new Response(JSON.stringify({ voices }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err: any) {
    console.error('list-voices error', err);
    return new Response(JSON.stringify({ error: err?.message || 'Internal error' }), { status: 500 });
  }
}
