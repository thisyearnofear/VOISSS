/**
 * ACP Listener Control API
 *
 * Wraps the shared AcpListenerService so the autonomous-job discovery
 * loop can be started, stopped, and inspected via HTTP. Admin-only.
 *
 * - POST /api/acp/listener        { action: 'start' | 'stop' }
 * - GET  /api/acp/listener        → status snapshot
 *
 * Auth: requires `Authorization: Bearer ${ADMIN_API_KEY}` on every
 * request. Returns 401 if missing/wrong.
 *
 * This route was previously `planned` in the route registry. With
 * this file, it becomes `live` and the check:routes script enforces
 * that the registry matches.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAcpListener } from '@voisss/shared/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return false; // fail closed
  const header = req.headers.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  return token.length > 0 && token === expected;
}

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized: provide Authorization: Bearer ${ADMIN_API_KEY}' },
    { status: 401 }
  );
}

/**
 * POST /api/acp/listener
 * Body: { action: 'start' | 'stop' }
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  let body: { action?: string } = {};
  try {
    body = (await req.json()) as { action?: string };
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const action = body.action;
  if (action !== 'start' && action !== 'stop') {
    return NextResponse.json(
      { success: false, error: "action must be 'start' or 'stop'" },
      { status: 400 }
    );
  }

  const listener = getAcpListener();

  try {
    if (action === 'start') {
      await listener.start();
      return NextResponse.json({
        success: true,
        action: 'start',
        status: listener.getStatus(),
      });
    } else {
      await listener.stop();
      return NextResponse.json({
        success: true,
        action: 'stop',
        status: listener.getStatus(),
      });
    }
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Listener action failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/acp/listener
 * Returns a status snapshot.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return unauthorized();

  const listener = getAcpListener();
  return NextResponse.json({
    success: true,
    data: listener.getStatus(),
  });
}
