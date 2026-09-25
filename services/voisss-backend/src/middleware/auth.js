const { UnauthorizedError, ForbiddenError } = require('./errors');
const { logger } = require('./logger');

/**
 * Auth model (fail-closed):
 *
 *  - PUBLIC paths (health, voice list, opaque job-status reads) need no key.
 *  - PROTECTED paths (ElevenLabs proxying, dubbing, export enqueue) require a
 *    valid API key via `Authorization: Bearer <key>` or `X-API-Key`. Keys are
 *    configured via API_KEYS=name:key[,...] (comma-separated).
 *  - MISSION WRITE paths additionally require a Bearer wallet address; the
 *    request body's userId must match it (identity binding, same trust level
 *    as the Next.js routes but enforced consistently here).
 *
 * If no API keys are configured, protected routes REJECT all requests.
 * Only an explicit ALLOW_UNAUTHENTICATED_DEV=true (non-production) disables
 * the requirement, for local development.
 */

function parseKeys(raw) {
  // Formats: "key1,key2" or "web:key1,agent:key2"
  const byName = new Map();
  (raw || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
    .forEach(entry => {
      const idx = entry.indexOf(':');
      if (idx > 0) {
        byName.set(entry.slice(0, idx), entry.slice(idx + 1));
      } else {
        byName.set(`key${byName.size + 1}`, entry);
      }
    });
  return byName;
}

// Config is read lazily so tests and runtime key rotation don't need a
// process restart. Module-level state is reserved for the static path lists.
function getConfig() {
  const apiKeys = parseKeys(process.env.API_KEYS);
  const keysByValue = new Map([...apiKeys.entries()].map(([name, key]) => [key, name]));
  const isProduction = process.env.NODE_ENV === 'production';
  const devUnauthAllowed = !isProduction && process.env.ALLOW_UNAUTHENTICATED_DEV === 'true';
  return { apiKeys, keysByValue, isProduction, devUnauthAllowed };
}

const PUBLIC_PATHS = [
  // [method, path regex] — paths are relative to the /api mount
  ['GET', /^\/health$/],
  ['GET', /^\/voices$/],
  ['GET', /^\/export\/[\w-]+\/status$/], // opaque job UUIDs
  ['GET', /^\/export\/user\/[^/]+$/],
  // Capability-based: ElevenLabs dubbing IDs are unguessable UUIDs held by
  // the client that started the job, so status/audio reads are safe to serve.
  ['GET', /^\/dubbing\/[\w-]+\/status$/],
  ['GET', /^\/dubbing\/[\w-]+\/audio\/[a-zA-Z-]+$/],
];

const PUBLIC_ROOT_PATHS = new Set(['/health']);

// Mission write routes accept Bearer wallet identity instead of an API key.
const WALLET_BEARER_PATHS = [];
// Mission writes retired on VPS — see server.js. If reintroducing, restore
// ['POST', /^\/missions\/(create|accept|submit)$/] and bindWalletIdentity wiring.

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

function isPublic(method, path) {
  if (PUBLIC_ROOT_PATHS.has(path)) return true;
  return PUBLIC_PATHS.some(([m, re]) => m === method && re.test(path));
}

function isWalletBearerPath(method, path) {
  return WALLET_BEARER_PATHS.some(([m, re]) => m === method && re.test(path));
}

function extractCredential(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return { type: 'bearer', value: authHeader.slice(7).trim() };
  }
  if (req.headers['x-api-key']) {
    return { type: 'apikey', value: req.headers['x-api-key'].trim() };
  }
  return null;
}

function authMiddleware(req, res, next) {
  const path = req.path;
  const method = req.method;

  if (isPublic(method, path)) {
    return next();
  }

  // Wallet-identity mission writes
  if (isWalletBearerPath(method, path)) {
    const cred = extractCredential(req);
    const address = cred?.type === 'bearer' ? cred.value : null;
    if (!address || !WALLET_REGEX.test(address)) {
      logger.warn({ requestId: req.id, path }, 'Mission write without wallet bearer');
      return next(new UnauthorizedError('Wallet address required in Authorization: Bearer header'));
    }
    req.user = { authenticated: true, kind: 'wallet', address };
    return next();
  }

  // Everything else requires an API key
  const { apiKeys, keysByValue, devUnauthAllowed } = getConfig();
  if (apiKeys.size === 0) {
    if (devUnauthAllowed) {
      logger.warn({ path }, 'API_KEYS unset — auth bypassed (ALLOW_UNAUTHENTICATED_DEV)');
      req.user = { authenticated: false, kind: 'anonymous' };
      return next();
    }
    logger.error({ requestId: req.id, path }, 'API_KEYS not configured — rejecting protected route');
    return next(new ForbiddenError('API access not configured'));
  }

  const cred = extractCredential(req);
  if (!cred) {
    logger.warn({ requestId: req.id, path }, 'Missing API key');
    return next(new UnauthorizedError('API key required'));
  }

  const keyName = keysByValue.get(cred.value);
  if (!keyName) {
    logger.warn({ requestId: req.id, path }, 'Invalid API key');
    return next(new UnauthorizedError('Invalid API key'));
  }

  req.user = { authenticated: true, kind: 'apikey', name: keyName };
  next();
}

/**
 * For mission writes: enforce body.userId (when present) equals the bearer
 * wallet address. Mounted after authMiddleware.
 */
function bindWalletIdentity(req, res, next) {
  if (req.user?.kind !== 'wallet') return next();
  const bodyUserId = req.body?.userId;
  if (typeof bodyUserId === 'string' && bodyUserId.toLowerCase() !== req.user.address.toLowerCase()) {
    return next(new ForbiddenError('userId does not match Authorization bearer address'));
  }
  if (typeof bodyUserId === 'string') {
    req.body.userId = req.user.address;
  }
  next();
}

module.exports = {
  authMiddleware,
  bindWalletIdentity,
  isPublic,
  isWalletBearerPath,
  _internals: { parseKeys, WALLET_REGEX, getConfig },
};
