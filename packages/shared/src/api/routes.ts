/**
 * VOISSS API Route Registry
 *
 * SINGLE SOURCE OF TRUTH for every HTTP endpoint exposed by the platform.
 *
 * The Next.js app router reads filesystem layout from apps/web/src/app/api/.../route.ts.
 * This file mirrors that layout in typed form, so we can:
 *
 *   1. Assert at build/CI time that the registry matches the filesystem
 *      (see scripts/check-routes.ts).
 *   2. Generate OpenAPI specs and human-readable API docs from one place.
 *   3. Mark routes as live / planned / deprecated to keep marketing claims honest.
 *   4. Group routes for doc navigation.
 *
 * Convention: dynamic segments use Next.js [param] form here. The OpenAPI
 * generator (Phase 7A) translates them to {param}.
 *
 * To add a new route:
 *   1. Add it to ROUTES below with status: 'live'.
 *   2. Run pnpm run check:routes -- the checker will confirm the file exists.
 *
 * To deprecate a route:
 *   - Change its status to 'deprecated' and add a deprecatedReason.
 *   - Do NOT delete it from the registry until the file is removed from disk.
 */

export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';

export type RouteStatus = 'live' | 'planned' | 'deprecated';

export type AuthRequirement = 'none' | 'optional' | 'required' | 'admin';

export type RouteGroup =
  | 'agent'
  | 'marketplace'
  | 'engagement'
  | 'arkiv'
  | 'missions'
  | 'elevenlabs'
  | 'auth'
  | 'webhooks'
  | 'admin'
  | 'tools'
  | 'transcript'
  | 'studio'
  | 'system'
  | 'x402'
  | 'health'
  | 'user'
  | 'token'
  | 'analytics'
  | 'referral'
  | 'temp-audio'
  | 'base';

export interface RouteDefinition {
  /** HTTP method */
  method: HttpMethod;
  /** API path, with Next.js `[param]` form for dynamic segments */
  path: string;
  /** Implementation status. 'planned' routes have no file. */
  status: RouteStatus;
  /** Doc grouping key */
  group: RouteGroup;
  /** One-line description */
  summary: string;
  /** Auth posture: does the caller need to prove anything? */
  auth: AuthRequirement;
  /** Longer description (optional) */
  description?: string;
  /** Free-form tags for filtering (optional) */
  tags?: string[];
  /** If deprecated, why and what to use instead (optional) */
  deprecatedReason?: string;
}

// =============================================================================
// Registry
// =============================================================================

export const ROUTES: readonly RouteDefinition[] = [
  // ---------- agent (external AI agent integration) ----------
  {
    method: 'GET',
    path: '/api/agents/vocalize',
    status: 'live',
    group: 'agent',
    summary: 'Get agent credit info, tier, and pricing',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/agents/vocalize',
    status: 'live',
    group: 'agent',
    summary: 'Generate AI voice from text',
    auth: 'optional',
    description:
      'Generates voice via ElevenLabs. Payment via credits, token tier, x402 USDC, or OWS multi-chain.',
  },
  {
    method: 'POST',
    path: '/api/agents/vocalize/quote',
    status: 'live',
    group: 'agent',
    summary: 'Get a payment quote before vocalize',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/agents/generate-and-submit',
    status: 'live',
    group: 'agent',
    summary: 'Generate voice and submit to mission in one call',
    auth: 'optional',
  },
  {
    method: 'GET',
    path: '/api/agents/themes',
    status: 'live',
    group: 'agent',
    summary: 'List active themes (missions)',
    auth: 'none',
  },
  {
    method: 'GET',
    path: '/api/agents/themes/[themeId]',
    status: 'live',
    group: 'agent',
    summary: 'Get theme details',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/agents/submit',
    status: 'live',
    group: 'agent',
    summary: 'Submit a recording to a mission',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/agents/register',
    status: 'live',
    group: 'agent',
    summary: 'Register an agent for API access',
    auth: 'none',
  },
  {
    method: 'GET',
    path: '/api/agents/register',
    status: 'live',
    group: 'agent',
    summary: 'Look up an agent profile',
    auth: 'none',
  },
  {
    method: 'GET',
    path: '/api/agents/verify',
    status: 'live',
    group: 'agent',
    summary: 'Get a verification challenge',
    auth: 'none',
    description: 'Reverse-CAPTCHA for AI-agent-only flows.',
  },
  {
    method: 'POST',
    path: '/api/agents/verify',
    status: 'live',
    group: 'agent',
    summary: 'Submit a verification challenge response',
    auth: 'none',
  },
  {
    method: 'GET',
    path: '/api/agents/events',
    status: 'live',
    group: 'agent',
    summary: 'Poll agent events',
    auth: 'optional',
  },
  {
    method: 'POST',
    path: '/api/agents/events',
    status: 'live',
    group: 'agent',
    summary: 'Subscribe to event types (webhook or future WS)',
    auth: 'optional',
  },
  {
    method: 'DELETE',
    path: '/api/agents/events',
    status: 'live',
    group: 'agent',
    summary: 'Unsubscribe from events',
    auth: 'optional',
  },
  {
    method: 'GET',
    path: '/api/agents/market-intelligence',
    status: 'live',
    group: 'agent',
    summary: 'Get market intelligence (REST)',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/agents/market-intelligence',
    status: 'live',
    group: 'agent',
    summary: 'Trigger market intelligence run',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/agents/market-intelligence/stream',
    status: 'live',
    group: 'agent',
    summary: 'Stream market intelligence results',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/agents/conversational/market',
    status: 'live',
    group: 'agent',
    summary: 'ElevenLabs-compatible conversational market endpoint',
    auth: 'none',
  },
  {
    method: 'GET',
    path: '/api/agents/openapi.json',
    status: 'live',
    group: 'agent',
    summary: 'OpenAPI 3.0 spec (legacy hand-written; auto-gen coming)',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/agents/voice-clone',
    status: 'live',
    group: 'agent',
    summary: 'Voice-clone alias (returns 410 pointing to canonical path)',
    auth: 'none',
    description:
      'Documented ACP default path. Returns 410 Gone with Location header pointing to /api/elevenlabs/clone-voice. GET returns the same pointer as JSON.',
  },
  {
    method: 'GET',
    path: '/api/agents/voice-clone',
    status: 'live',
    group: 'agent',
    summary: 'Voice-clone alias pointer (GET version)',
    auth: 'none',
    description: 'GET returns the canonical-path pointer as JSON.',
  },

  // ---------- marketplace ----------
  {
    method: 'GET',
    path: '/api/marketplace/voices',
    status: 'live',
    group: 'marketplace',
    summary: 'Browse voice listings',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/marketplace/license',
    status: 'live',
    group: 'marketplace',
    summary: 'Purchase a voice license via x402',
    auth: 'none',
  },
  {
    method: 'GET',
    path: '/api/marketplace/license',
    status: 'live',
    group: 'marketplace',
    summary: 'Get licenses for an address (currently returns empty list)',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/marketplace/synthesize',
    status: 'live',
    group: 'marketplace',
    summary: 'Synthesize a voice from a licensed listing',
    auth: 'required',
  },
  {
    method: 'GET',
    path: '/api/marketplace/trends',
    status: 'live',
    group: 'marketplace',
    summary: 'Get marketplace trends',
    auth: 'none',
  },

  // ---------- engagement ----------
  {
    method: 'GET',
    path: '/api/engagement',
    status: 'live',
    group: 'engagement',
    summary:
      'Unified engagement endpoint. action=metrics|achievements|streak|leaderboard|notifications',
    auth: 'none',
    tags: ['unified'],
  },
  {
    method: 'POST',
    path: '/api/engagement',
    status: 'live',
    group: 'engagement',
    summary:
      'Unified engagement endpoint. action=check-achievements|update-streak|mark-read',
    auth: 'none',
    tags: ['unified'],
  },

  // ---------- referral (legacy/separate from engagement) ----------
  {
    method: 'POST',
    path: '/api/referral/generate',
    status: 'live',
    group: 'referral',
    summary: 'Generate a referral code (currently a hash, no DB persistence)',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/referral/track',
    status: 'live',
    group: 'referral',
    summary: 'Track a referral click (logs only)',
    auth: 'none',
  },

  // ---------- arkiv (decentralized data layer) ----------
  {
    method: 'POST',
    path: '/api/arkiv/save-insight',
    status: 'live',
    group: 'arkiv',
    summary: 'Save a VoiceInsight entity to Arkiv Braga',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/arkiv/save-certificate',
    status: 'live',
    group: 'arkiv',
    summary: 'Save a HumanityCertificate entity to Arkiv Braga',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/arkiv/save-batch',
    status: 'live',
    group: 'arkiv',
    summary: 'Atomically create insight + certificate with ownership transfer',
    auth: 'none',
  },
  {
    method: 'GET',
    path: '/api/arkiv/query',
    status: 'live',
    group: 'arkiv',
    summary: 'Query Arkiv entities with filters',
    auth: 'none',
  },

  // ---------- missions ----------
  {
    method: 'GET',
    path: '/api/missions',
    status: 'live',
    group: 'missions',
    summary: 'List active missions',
    auth: 'none',
  },
  {
    method: 'GET',
    path: '/api/missions/[id]',
    status: 'live',
    group: 'missions',
    summary: 'Get a single mission by id',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/missions/accept',
    status: 'live',
    group: 'missions',
    summary: 'Accept a mission for a user',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/missions/submit',
    status: 'live',
    group: 'missions',
    summary: 'Submit a recording to a mission',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/missions/create',
    status: 'live',
    group: 'missions',
    summary: 'Create a new mission',
    auth: 'none',
  },

  // ---------- elevenlabs ----------
  {
    method: 'POST',
    path: '/api/elevenlabs/import',
    status: 'live',
    group: 'elevenlabs',
    summary: 'Import voices from an ElevenLabs account via API key',
    auth: 'none',
    description:
      'Takes an ElevenLabs API key and optional voice IDs. Fetches the user\'s voices and returns them as importable VOISSS listings.',
  },
  {
    method: 'POST',
    path: '/api/elevenlabs/list-voices',
    status: 'live',
    group: 'elevenlabs',
    summary: 'List available ElevenLabs voices (POST-only at this path)',
    auth: 'none',
    tags: ['quirk'],
    description: 'Despite the GET-style path name, this is implemented as POST.',
  },
  {
    method: 'POST',
    path: '/api/elevenlabs/text-to-speech',
    status: 'live',
    group: 'elevenlabs',
    summary: 'Text-to-speech via ElevenLabs',
    auth: 'required',
  },
  {
    method: 'POST',
    path: '/api/elevenlabs/transform-voice',
    status: 'live',
    group: 'elevenlabs',
    summary: 'Speech-to-speech voice transformation',
    auth: 'required',
  },
  {
    method: 'POST',
    path: '/api/elevenlabs/clone-voice',
    status: 'live',
    group: 'elevenlabs',
    summary: 'Clone a contributor voice, archive reference samples to IPFS',
    auth: 'required',
  },
  {
    method: 'POST',
    path: '/api/elevenlabs/dub-audio',
    status: 'live',
    group: 'elevenlabs',
    summary: 'Dub audio to a target language',
    auth: 'required',
  },
  {
    method: 'GET',
    path: '/api/elevenlabs/get-models',
    status: 'live',
    group: 'elevenlabs',
    summary: 'List available ElevenLabs models',
    auth: 'none',
  },

  // ---------- studio / voice assistant ----------
  {
    method: 'POST',
    path: '/api/studio-insights/stream',
    status: 'live',
    group: 'studio',
    summary: 'Stream studio insights (SSE) for an audio file',
    auth: 'none',
  },
  {
    method: 'GET',
    path: '/api/voice-assistant',
    status: 'live',
    group: 'studio',
    summary: 'Voice assistant status and configured integrations',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/voice-assistant',
    status: 'live',
    group: 'studio',
    summary: 'Send a message to the voice assistant',
    auth: 'none',
  },

  // ---------- transcript ----------
  {
    method: 'POST',
    path: '/api/transcript/transcribe',
    status: 'live',
    group: 'transcript',
    summary: 'Transcribe an audio file',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/transcript/export',
    status: 'live',
    group: 'transcript',
    summary: 'Export a transcript',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/transcript/share-link',
    status: 'live',
    group: 'transcript',
    summary: 'Generate a shareable transcript link',
    auth: 'none',
  },

  // ---------- auth ----------
  {
    method: 'POST',
    path: '/api/auth/nonce',
    status: 'live',
    group: 'auth',
    summary: 'Get a SIWE nonce',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/auth/verify',
    status: 'live',
    group: 'auth',
    summary: 'Verify a SIWE signature',
    auth: 'none',
  },
  {
    method: 'GET',
    path: '/api/auth/verify-session',
    status: 'live',
    group: 'auth',
    summary: 'Check current session',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/auth/logout',
    status: 'live',
    group: 'auth',
    summary: 'End the current session',
    auth: 'none',
  },

  // ---------- user ----------
  {
    method: 'GET',
    path: '/api/user/missions',
    status: 'live',
    group: 'user',
    summary: 'Get a user\'s accepted/completed missions',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/user/token-balance',
    status: 'live',
    group: 'user',
    summary: 'Get a user\'s token balance',
    auth: 'none',
  },

  // ---------- tokens ----------
  {
    method: 'POST',
    path: '/api/token/burn',
    status: 'live',
    group: 'token',
    summary: 'Burn $VOISSS tokens for an action',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/tokens/check-papajams',
    status: 'live',
    group: 'token',
    summary: 'Check $PAPAJAMS balance',
    auth: 'none',
  },

  // ---------- base (chain-specific) ----------
  {
    method: 'POST',
    path: '/api/base/save-recording',
    status: 'live',
    group: 'base',
    summary: 'Save a recording to VoiceRecords on Base',
    auth: 'required',
  },
  {
    method: 'GET',
    path: '/api/base/save-recording',
    status: 'live',
    group: 'base',
    summary: 'Get save-recording endpoint metadata',
    auth: 'none',
  },

  // ---------- webhooks ----------
  {
    method: 'POST',
    path: '/api/webhooks/alchemy',
    status: 'live',
    group: 'webhooks',
    summary: 'Alchemy webhook receiver (Base events)',
    auth: 'admin',
  },

  // ---------- admin ----------
  {
    method: 'POST',
    path: '/api/admin/retry-ipfs',
    status: 'live',
    group: 'admin',
    summary: 'Retry an IPFS upload (admin)',
    auth: 'admin',
  },
  {
    method: 'POST',
    path: '/api/admin/rewards/distribute',
    status: 'live',
    group: 'admin',
    summary: 'Distribute rewards (admin)',
    auth: 'admin',
  },
  {
    method: 'GET',
    path: '/api/admin/rewards/distribute',
    status: 'live',
    group: 'admin',
    summary: 'Get reward distribution status (admin)',
    auth: 'admin',
  },
  {
    method: 'GET',
    path: '/api/admin/submissions',
    status: 'live',
    group: 'admin',
    summary: 'List submissions (admin)',
    auth: 'admin',
  },
  {
    method: 'POST',
    path: '/api/admin/submissions',
    status: 'live',
    group: 'admin',
    summary: 'Moderate a submission (admin)',
    auth: 'admin',
  },

  // ---------- tools ----------
  {
    method: 'GET',
    path: '/api/tools/platform-stats',
    status: 'live',
    group: 'tools',
    summary: 'Platform-wide statistics',
    auth: 'none',
  },
  {
    method: 'HEAD',
    path: '/api/tools/platform-stats',
    status: 'live',
    group: 'tools',
    summary: 'Platform stats (HEAD exposed automatically by Next.js)',
    auth: 'none',
    description: 'Generated by Next.js for force-static routes.',
  },
  {
    method: 'GET',
    path: '/api/tools/blockchain-stats',
    status: 'live',
    group: 'tools',
    summary: 'Blockchain statistics',
    auth: 'none',
  },
  {
    method: 'HEAD',
    path: '/api/tools/blockchain-stats',
    status: 'live',
    group: 'tools',
    summary: 'Blockchain stats (HEAD exposed automatically by Next.js)',
    auth: 'none',
    description: 'Generated by Next.js for force-static routes.',
  },
  {
    method: 'POST',
    path: '/api/tools/web-search',
    status: 'live',
    group: 'tools',
    summary: 'Web search via Firecrawl',
    auth: 'none',
  },
  {
    method: 'GET',
    path: '/api/tools/web-search',
    status: 'live',
    group: 'tools',
    summary: 'Web search GET stub',
    auth: 'none',
  },

  // ---------- analytics ----------
  {
    method: 'GET',
    path: '/api/analytics/hackathon',
    status: 'live',
    group: 'analytics',
    summary: 'Hackathon-specific analytics',
    auth: 'none',
  },

  // ---------- temp audio ----------
  {
    method: 'GET',
    path: '/api/temp-audio/[id]',
    status: 'live',
    group: 'temp-audio',
    summary: 'Fetch a temporarily stored audio file (IPFS fallback)',
    auth: 'none',
  },

  // ---------- x402 ----------
  {
    method: 'GET',
    path: '/api/x402/health',
    status: 'live',
    group: 'x402',
    summary: 'x402 configuration health check',
    auth: 'none',
  },

  // ---------- system ----------
  {
    method: 'GET',
    path: '/api/health',
    status: 'live',
    group: 'health',
    summary: 'Service health + feature configuration',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/contact',
    status: 'live',
    group: 'system',
    summary: 'Contact form submission',
    auth: 'none',
  },
  {
    method: 'POST',
    path: '/api/errors',
    status: 'live',
    group: 'system',
    summary: 'Client error reporting',
    auth: 'none',
  },
  {
    method: 'GET',
    path: '/api/diag/ai',
    status: 'live',
    group: 'system',
    summary: 'AI provider diagnostics',
    auth: 'none',
  },

  {
    method: 'POST',
    path: '/api/acp/listener',
    status: 'live',
    group: 'system',
    summary: 'Control the ACP autonomous-job listener (admin)',
    auth: 'admin',
    description:
      'Wraps getAcpListener() in @voisss/shared/server. Admin auth via ADMIN_API_KEY.',
  },
  {
    method: 'GET',
    path: '/api/acp/listener',
    status: 'live',
    group: 'system',
    summary: 'Get ACP listener status (admin)',
    auth: 'admin',
  },
  {
    method: 'GET',
    path: '/api/butler/memory',
    status: 'live',
    group: 'system',
    summary: 'Get a user\'s butler preferences',
    auth: 'none',
    description:
      'Query: userId or walletAddress. Wraps butler-memory-service.ts (Arkiv-backed).',
  },
  {
    method: 'POST',
    path: '/api/butler/memory',
    status: 'live',
    group: 'system',
    summary:
      'Butler memory actions: save-preferences, get-recommendations, get-suggestions, track-usage',
    auth: 'optional',
  },
] as const;

// =============================================================================
// Helpers
// =============================================================================

/** All routes marked `live` — the ones we promise to handle. */
export function getLiveRoutes(): readonly RouteDefinition[] {
  return ROUTES.filter((r) => r.status === 'live');
}

/** Routes grouped by their `group` field, for doc navigation. */
export function getRoutesByGroup(): Record<RouteGroup, RouteDefinition[]> {
  const out = {} as Record<RouteGroup, RouteDefinition[]>;
  for (const r of ROUTES) {
    if (!out[r.group]) out[r.group] = [];
    out[r.group].push(r);
  }
  for (const k of Object.keys(out) as RouteGroup[]) {
    out[k].sort((a, b) => a.path.localeCompare(b.path));
  }
  return out;
}

/** Lookup by `method + path` tuple. */
export function findRoute(
  method: HttpMethod,
  path: string
): RouteDefinition | undefined {
  return ROUTES.find((r) => r.method === method && r.path === path);
}

/** Total counts for sanity checks. */
export function getRouteCounts(): {
  total: number;
  live: number;
  planned: number;
  deprecated: number;
  byGroup: Record<string, number>;
} {
  const byGroup: Record<string, number> = {};
  let live = 0;
  let planned = 0;
  let deprecated = 0;
  for (const r of ROUTES) {
    if (r.status === 'live') live++;
    else if (r.status === 'planned') planned++;
    else if (r.status === 'deprecated') deprecated++;
    byGroup[r.group] = (byGroup[r.group] || 0) + 1;
  }
  return { total: ROUTES.length, live, planned, deprecated, byGroup };
}
