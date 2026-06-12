/**
 * /api/acp/listener — auth + start/stop/status tests.
 *
 * The route uses the singleton `getAcpListener()` from
 * @voisss/shared/server. We mock that module so the tests don't
 * actually spawn `npx @virtuals-protocol/acp-cli` and don't write
 * to the reputation store.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockGetStatus = vi.fn();
const mockStart = vi.fn();
const mockStop = vi.fn();

vi.mock('@voisss/shared/server', () => ({
  getAcpListener: vi.fn(() => ({
    getStatus: mockGetStatus,
    start: mockStart,
    stop: mockStop,
  })),
}));

// Import after the mock is set up.
const { POST, GET } = await import('@/app/api/acp/listener/route');
import { NextRequest } from 'next/server';

const ADMIN_KEY = 'test-admin-key';

function authedRequest(body?: unknown, method: 'POST' | 'GET' = 'POST'): NextRequest {
  return new NextRequest(`http://localhost/api/acp/listener${method === 'GET' ? '' : ''}`, {
    method,
    headers: {
      Authorization: `Bearer ${ADMIN_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('POST /api/acp/listener', () => {
  beforeEach(() => {
    mockGetStatus.mockReset();
    mockStart.mockReset();
    mockStop.mockReset();
    process.env.ADMIN_API_KEY = ADMIN_KEY;
    process.env.ACP_AGENT_ID = 'test-agent-1';
  });

  it('rejects requests without a bearer token', async () => {
    const req = new NextRequest('http://localhost/api/acp/listener', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rejects requests with the wrong bearer token', async () => {
    const req = new NextRequest('http://localhost/api/acp/listener', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer not-the-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'start' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rejects an invalid action', async () => {
    const res = await POST(authedRequest({ action: 'restart' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/start.*stop/);
  });

  it('starts the listener when action=start', async () => {
    mockGetStatus.mockReturnValue({ isRunning: true, agentId: 'test-agent-1', autoBid: false, minBudget: 0.01, offeringIds: [] });
    mockStart.mockResolvedValue(undefined);
    const res = await POST(authedRequest({ action: 'start' }));
    expect(res.status).toBe(200);
    expect(mockStart).toHaveBeenCalledOnce();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.action).toBe('start');
    expect(body.status.isRunning).toBe(true);
  });

  it('stops the listener when action=stop', async () => {
    mockGetStatus.mockReturnValue({ isRunning: false, agentId: 'test-agent-1', autoBid: false, minBudget: 0.01, offeringIds: [] });
    mockStop.mockResolvedValue(undefined);
    const res = await POST(authedRequest({ action: 'stop' }));
    expect(res.status).toBe(200);
    expect(mockStop).toHaveBeenCalledOnce();
    const body = await res.json();
    expect(body.action).toBe('stop');
    expect(body.status.isRunning).toBe(false);
  });
});

describe('GET /api/acp/listener', () => {
  beforeEach(() => {
    mockGetStatus.mockReset();
    process.env.ADMIN_API_KEY = ADMIN_KEY;
  });

  it('rejects requests without a bearer token', async () => {
    const req = new NextRequest('http://localhost/api/acp/listener', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns the status snapshot when authorized', async () => {
    mockGetStatus.mockReturnValue({
      isRunning: false,
      agentId: 'test-agent-1',
      autoBid: true,
      minBudget: 0.5,
      offeringIds: ['019e98e8-f262-7aa9-938b-73664bae4fcd'],
    });
    const res = await GET(authedRequest(undefined, 'GET'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.agentId).toBe('test-agent-1');
    expect(body.data.autoBid).toBe(true);
    expect(body.data.offeringIds).toContain('019e98e8-f262-7aa9-938b-73664bae4fcd');
  });
});
