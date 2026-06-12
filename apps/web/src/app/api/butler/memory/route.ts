/**
 * Butler Memory API
 *
 * Exposes the shared butler-memory-service over HTTP. The service
 * stores user preferences, conversation memory, and voice usage
 * patterns on Arkiv Braga Testnet (decentralized, user-owned).
 *
 * - GET  /api/butler/memory?userId=...       → user preferences
 * - POST /api/butler/memory  { action: ..., ... }
 *   actions:
 *     - save-preferences    { preferences: ButlerUserPreference }
 *     - get-recommendations { userId, availableVoices }
 *     - get-suggestions     { userId, recentActivity? }
 *     - track-usage         { userId, walletAddress, voiceId, recordingId }
 *
 * Auth posture: optional. Anonymous reads work; writes for a
 * wallet require that the caller controls the wallet (signature
 * verification is delegated to the shared service for now).
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserPreferences,
  saveUserPreferences,
  getVoiceRecommendations,
  getProactiveSuggestions,
  trackVoiceUsage,
  type ButlerUserPreference,
  type VoiceRecommendation,
} from '@voisss/shared/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SuccessResponse<T> {
  success: true;
  data: T;
}
interface ErrorResponse {
  success: false;
  error: string;
}

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data } satisfies SuccessResponse<T>, { status });
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message } satisfies ErrorResponse, { status });
}

/**
 * GET /api/butler/memory?userId=...
 * Returns the ButlerUserPreference for the given user, or null if none.
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  const walletAddress = req.nextUrl.searchParams.get('walletAddress') ?? undefined;
  if (!userId && !walletAddress) {
    return err('userId or walletAddress is required');
  }
  try {
    const preferences = await getUserPreferences({ userId: userId ?? undefined, walletAddress });
    return ok(preferences);
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Failed to load preferences', 500);
  }
}

interface SavePreferencesBody {
  action: 'save-preferences';
  preferences: ButlerUserPreference;
}
interface GetRecommendationsBody {
  action: 'get-recommendations';
  userId: string;
  availableVoices?: Array<{ id: string; name: string; tags: string[] }>;
}
interface GetSuggestionsBody {
  action: 'get-suggestions';
  userId: string;
  recentActivity?: { lastRecordingId?: string; lastVoiceId?: string; timeSinceLastInteraction?: number };
}
interface TrackUsageBody {
  action: 'track-usage';
  userId: string;
  walletAddress: string;
  voiceId: string;
  recordingId: string;
}
type Body = SavePreferencesBody | GetRecommendationsBody | GetSuggestionsBody | TrackUsageBody;

/**
 * POST /api/butler/memory
 * Action-based dispatch; see Body union above.
 */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return err('Invalid JSON body');
  }
  if (!body || typeof body !== 'object' || !('action' in body)) {
    return err("body.action must be 'save-preferences' | 'get-recommendations' | 'get-suggestions' | 'track-usage'");
  }

  try {
    switch (body.action) {
      case 'save-preferences': {
        if (!body.preferences || !body.preferences.userId || !body.preferences.walletAddress) {
          return err('save-preferences requires preferences.userId and preferences.walletAddress');
        }
        const result = await saveUserPreferences(body.preferences);
        if (!result.success) return err(result.error || 'Save failed', 500);
        return ok({ entityId: result.entityId });
      }

      case 'get-recommendations': {
        if (!body.userId) return err('get-recommendations requires userId');
        const prefs = await getUserPreferences({ userId: body.userId });
        if (!prefs) return ok<VoiceRecommendation[]>([]);
        const voices = body.availableVoices ?? [];
        const recs = await getVoiceRecommendations(prefs, voices);
        return ok(recs);
      }

      case 'get-suggestions': {
        if (!body.userId) return err('get-suggestions requires userId');
        const prefs = await getUserPreferences({ userId: body.userId });
        if (!prefs) return ok<string[]>([]);
        const suggestions = getProactiveSuggestions(prefs, body.recentActivity);
        return ok(suggestions);
      }

      case 'track-usage': {
        const { userId, walletAddress, voiceId, recordingId } = body;
        if (!userId || !walletAddress || !voiceId || !recordingId) {
          return err('track-usage requires userId, walletAddress, voiceId, recordingId');
        }
        await trackVoiceUsage(userId, walletAddress, voiceId, recordingId);
        return ok({ tracked: true });
      }
    }
  } catch (e) {
    return err(e instanceof Error ? e.message : 'Butler memory action failed', 500);
  }
}
