const { UnauthorizedError } = require('./errors');
const { logger } = require('./logger');

const VALID_API_KEYS = new Set(
  (process.env.API_KEYS || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
);

const SKIP_AUTH_PATHS = new Set([
  '/health',
  '/api/health'
]);

function authMiddleware(req, res, next) {
  if (SKIP_AUTH_PATHS.has(req.path)) {
    return next();
  }

  if (VALID_API_KEYS.size === 0) {
    logger.warn('No API keys configured - authentication disabled');
    return next();
  }

  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  let providedKey = null;

  if (authHeader?.startsWith('Bearer ')) {
    providedKey = authHeader.slice(7);
  } else if (apiKey) {
    providedKey = apiKey;
  }

  if (!providedKey) {
    logger.warn({ requestId: req.id, path: req.path }, 'Missing API key');
    return next(new UnauthorizedError('API key required'));
  }

  if (!VALID_API_KEYS.has(providedKey)) {
    logger.warn({ requestId: req.id, path: req.path }, 'Invalid API key');
    return next(new UnauthorizedError('Invalid API key'));
  }

  req.user = { authenticated: true };
  next();
}

function optionalAuth(req, res, next) {
  if (SKIP_AUTH_PATHS.has(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  if (authHeader?.startsWith('Bearer ') || apiKey) {
    return authMiddleware(req, res, next);
  }

  req.user = { authenticated: false };
  next();
}

module.exports = { authMiddleware, optionalAuth };
