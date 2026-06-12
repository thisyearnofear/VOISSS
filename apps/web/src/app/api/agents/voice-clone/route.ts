/**
 * /api/agents/voice-clone
 *
 * Alias for /api/elevenlabs/clone-voice. The ACP listener's default
 * route for the VoiceClone offering is /api/agents/voice-clone, so
 * this route exists to keep that wiring honest — no agent will hit
 * a 404 because the doc'd path and the actual path disagree.
 *
 * Implementation: this is a thin internal re-dispatch. We do NOT
 * forward the raw request body (multipart form data is tricky to
 * re-stream), so instead we tell the caller to use the canonical
 * path and link them to it. This is a deliberate trade-off: zero
 * behavioural drift vs. handling multipart forwarding.
 *
 * If you actually need server-side forwarding of the upload, the
 * right approach is a service-level merge: extract a cloneVoice()
 * function from both routes and call it from each. That is a
 * larger refactor and out of scope for this alias.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CANONICAL_PATH = '/api/elevenlabs/clone-voice';

/**
 * GET /api/agents/voice-clone
 * Returns a redirect-style pointer to the canonical path. Agents
 * that follow the ACP spec land here; we tell them where to go.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: {
        message:
          'POST /api/agents/voice-clone is an alias for the canonical voice-clone route. ' +
          'Send your multipart upload to /api/elevenlabs/clone-voice instead.',
        canonicalPath: CANONICAL_PATH,
        canonicalMethod: 'POST',
        accepts: 'multipart/form-data with fields: name (required), consent (required, "true"), samples (file[]), description?, labels?',
      },
    },
    { status: 200 }
  );
}

/**
 * POST /api/agents/voice-clone
 * Returns 410 Gone with a clear pointer to the canonical route.
 * 410 is the right code: this path will never accept uploads; it
 * exists only to document the rename.
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Use /api/elevenlabs/clone-voice for voice cloning.',
      canonicalPath: CANONICAL_PATH,
    },
    {
      status: 410,
      headers: {
        'Location': CANONICAL_PATH,
        'X-VOISSS-Canonical-Path': CANONICAL_PATH,
      },
    }
  );
}
