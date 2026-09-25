import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const baseEnv = { ...process.env };

// auth.js reads env lazily (getConfig()), so a single require is fine —
// setting process.env before each test is enough.
const auth = require('../src/middleware/auth');

function mockReq(method, path, opts = {}) {
  return {
    method,
    path,
    headers: opts.headers || {},
    body: opts.body || {},
    id: 'test-req',
  };
}

function runAuth(auth, method, path, opts) {
  const req = mockReq(method, path, opts);
  let err;
  auth.authMiddleware(req, {}, (e) => { err = e; });
  return { err, req };
}

describe('auth middleware — fail-closed', () => {
  afterEach(() => {
    process.env = { ...baseEnv };
  });

  it('rejects protected routes when API_KEYS is unset (production)', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.API_KEYS;
    delete process.env.ALLOW_UNAUTHENTICATED_DEV;
    const { err } = runAuth(auth, 'POST', '/export/request', {});
    expect(err).toBeTruthy();
    expect(err.statusCode).toBe(403);
  });

  it('bypasses in dev when ALLOW_UNAUTHENTICATED_DEV=true', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.API_KEYS;
    process.env.ALLOW_UNAUTHENTICATED_DEV = 'true';
    const { err, req } = runAuth(auth, 'POST', '/export/request', {});
    expect(err).toBeUndefined();
    expect(req.user.kind).toBe('anonymous');
  });

  it('never bypasses in production even with ALLOW_UNAUTHENTICATED_DEV', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.API_KEYS;
    process.env.ALLOW_UNAUTHENTICATED_DEV = 'true';
    const { err } = runAuth(auth, 'POST', '/export/request', {});
    expect(err).toBeTruthy();
    expect(err.statusCode).toBe(403);
  });
});

describe('auth middleware — public paths', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    process.env.API_KEYS = 'testkey123';
  });
  afterEach(() => {
    process.env = { ...baseEnv };
  });

  it('allows GET /health without a key', () => {
    const { err } = runAuth(auth, 'GET', '/health', {});
    expect(err).toBeUndefined();
  });

  it('allows GET /voices without a key', () => {
    const { err } = runAuth(auth, 'GET', '/voices', {});
    expect(err).toBeUndefined();
  });

  it('allows opaque export job status reads without a key', () => {
    const { err } = runAuth(auth, 'GET', '/export/export_abc-123/status', {});
    expect(err).toBeUndefined();
  });

  it('allows dubbing status/audio reads by unguessable id', () => {
    const { err1 } = runAuth(auth, 'GET', '/dubbing/550e8400-e29b-41d4-a716-446655440000/status', {});
    const { err2 } = runAuth(auth, 'GET', '/dubbing/550e8400-e29b-41d4-a716-446655440000/audio/eng', {});
    expect(err1).toBeUndefined();
    expect(err2).toBeUndefined();
  });

  it('retired missions now require auth (no longer public)', () => {
    // VPS cleanup Phase 2: /missions removed from PUBLIC_PATHS — now 401 without a key
    const { err1 } = runAuth(auth, 'GET', '/missions', {});
    const { err2 } = runAuth(auth, 'GET', '/missions/mission_123', {});
    const { err3 } = runAuth(auth, 'GET', '/missions/user/0x' + 'a'.repeat(40), {});
    expect(err1?.statusCode).toBe(401);
    expect(err2?.statusCode).toBe(401);
    expect(err3?.statusCode).toBe(401);
  });
});

describe('auth middleware — API key protection', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    process.env.API_KEYS = 'web:key123,agent:key456';
  });
  afterEach(() => {
    process.env = { ...baseEnv };
  });

  it('rejects POST /export/request with no key', () => {
    const { err } = runAuth(auth, 'POST', '/export/request', {});
    expect(err.statusCode).toBe(401);
  });

  it('accepts a valid X-API-Key', () => {
    const { err, req } = runAuth(auth, 'POST', '/export/request', {
      headers: { 'x-api-key': 'key123' },
    });
    expect(err).toBeUndefined();
    expect(req.user.name).toBe('web');
    expect(req.user.kind).toBe('apikey');
  });

  it('accepts a valid Bearer API key', () => {
    const { err, req } = runAuth(auth, 'POST', '/export/request', {
      headers: { authorization: 'Bearer key456' },
    });
    expect(err).toBeUndefined();
    expect(req.user.name).toBe('agent');
  });

  it('rejects an invalid key', () => {
    const { err } = runAuth(auth, 'POST', '/export/request', {
      headers: { 'x-api-key': 'wrong' },
    });
    expect(err.statusCode).toBe(401);
  });
});

describe('auth middleware — wallet identity (mission writes)', () => {
  const ADDR = '0x' + 'a'.repeat(40);
  const ADDR2 = '0x' + 'b'.repeat(40);

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    process.env.API_KEYS = 'key123';
  });
  afterEach(() => {
    process.env = { ...baseEnv };
  });

  it('retired mission writes now require API key, not wallet bearer', () => {
    // VPS cleanup Phase 2: WALLET_BEARER_PATHS is empty — /missions/* now falls through to API-key auth
    const { err } = runAuth(auth, 'POST', '/missions/create', {});
    expect(err.statusCode).toBe(401);
    expect(err.message).toContain('API key');
  });

  it('even a wallet bearer no longer authenticates retired mission writes', () => {
    const { err } = runAuth(auth, 'POST', '/missions/create', {
      headers: { authorization: `Bearer not-a-wallet` },
    });
    expect(err.statusCode).toBe(401);
    expect(err.message).toContain('API key');
  });

  it('wallet bearer is ignored for retired missions (requires API key)', () => {
    const { err } = runAuth(auth, 'POST', '/missions/accept', {
      headers: { authorization: `Bearer ${ADDR}` },
    });
    // No longer a wallet path — falls through to API-key check, so wallet token is treated as invalid API key
    expect(err.statusCode).toBe(401);
  });

  it('bindWalletIdentity is inert when not a wallet request (missions retired)', () => {
    const req = mockReq('POST', '/missions/accept', {
      headers: { authorization: `Bearer ${ADDR}` },
      body: { userId: ADDR2 },
    });
    // No longer a wallet path, so auth sets no wallet user — bindWalletIdentity no-ops
    let authErr;
    auth.authMiddleware(req, {}, (e) => { authErr = e; });
    expect(authErr?.statusCode).toBe(401);
    let bindErr;
    auth.bindWalletIdentity(req, {}, (e) => { bindErr = e; });
    expect(bindErr).toBeUndefined(); // inert when req.user.kind !== 'wallet'
  });

  it('bindWalletIdentity still enforces userId match for any remaining wallet path (if reintroduced)', () => {
    // Directly inject a wallet user to test the helper in isolation
    const req = mockReq('POST', '/missions/accept', {
      headers: {},
      body: { userId: ADDR },
    });
    req.user = { kind: 'wallet', address: ADDR };
    let bindErr;
    auth.bindWalletIdentity(req, {}, (e) => { bindErr = e; });
    expect(bindErr).toBeUndefined();
    expect(req.body.userId).toBe(ADDR);
  });
});
