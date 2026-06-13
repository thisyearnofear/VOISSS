import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Bypass the real CDP JWT generation: the auth header is irrelevant
// to what these tests exercise. Hoisted by vitest before any import.
vi.mock('@coinbase/cdp-sdk/auth', () => ({
  generateJwt: vi.fn().mockResolvedValue('test.jwt.token'),
}));

import { X402Client, X402_CONSTANTS } from './x402Client';
import { getAddress } from 'viem';
import {
  createPaymentRequiredResponse,
  createPaymentSuccessResponse,
  parsePaymentHeader,
  getX402Client,
  resetX402Client,
} from './x402Client';

const VALID_ADDR = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const RESOURCE = 'https://voisss.ai/api/v1/voice/generate';

describe('X402Client.createRequirements — address handling', () => {
  const client = new X402Client();

  it('checksums a lowercase address', () => {
    const req = client.createRequirements(RESOURCE, '$0.01', VALID_ADDR);
    expect(req.payTo).toBe(getAddress(VALID_ADDR));
  });

  it('trims whitespace around the address', () => {
    const dirty = `  ${VALID_ADDR}  `;
    const req = client.createRequirements(RESOURCE, '$0.01', dirty);
    expect(req.payTo).toBe(getAddress(VALID_ADDR));
  });

  it('throws when payTo is the empty string (no silent fallback)', () => {
    expect(() => client.createRequirements(RESOURCE, '$0.01', '')).toThrow(/REQUIRED/);
  });

  it('throws when payTo is just whitespace', () => {
    expect(() => client.createRequirements(RESOURCE, '$0.01', '   ')).toThrow(/REQUIRED/);
  });

  it('throws on a malformed address (not a hex string)', () => {
    expect(() => client.createRequirements(RESOURCE, '$0.01', 'not-an-address')).toThrow();
  });

  it('throws on a hex string of the wrong length', () => {
    expect(() => client.createRequirements(RESOURCE, '$0.01', '0x1234')).toThrow();
  });
});

describe('X402Client.createRequirements — amount parsing', () => {
  const client = new X402Client();

  it('parses "$1.50" as 1,500,000 USDC wei', () => {
    const req = client.createRequirements(RESOURCE, '$1.50', VALID_ADDR);
    expect(req.maxAmountRequired).toBe('1500000');
  });

  it('parses "0.01" as 10,000 USDC wei', () => {
    const req = client.createRequirements(RESOURCE, '0.01', VALID_ADDR);
    expect(req.maxAmountRequired).toBe('10000');
  });

  it('treats a plain-numeric string as already-in-wei (no scaling)', () => {
    const req = client.createRequirements(RESOURCE, '47000', VALID_ADDR);
    expect(req.maxAmountRequired).toBe('47000');
  });

  it('accepts bigint directly', () => {
    const req = client.createRequirements(RESOURCE, 124n, VALID_ADDR);
    expect(req.maxAmountRequired).toBe('124');
  });

  it('pads sub-cent fractions to 6 decimals (0.001 → 1000 wei)', () => {
    const req = client.createRequirements(RESOURCE, '0.001', VALID_ADDR);
    expect(req.maxAmountRequired).toBe('1000');
  });

  it('truncates over-precise fractions at 6 decimals (0.00000019 → 0 wei)', () => {
    // The slice(0,6) of "00000019" is "000000" → 0. So 0.00000019 becomes 0 wei.
    // This is a deliberate trade-off documented in the code; the test pins it.
    const req = client.createRequirements(RESOURCE, '0.00000019', VALID_ADDR);
    expect(req.maxAmountRequired).toBe('0');
  });

  it('rejects a totally unparseable amount string', () => {
    expect(() => client.createRequirements(RESOURCE, 'abc', VALID_ADDR)).toThrow(/Invalid amount/);
  });
});

describe('X402Client.createRequirements — network & asset', () => {
  it('defaults to base mainnet', () => {
    const client = new X402Client();
    const req = client.createRequirements(RESOURCE, '$0.01', VALID_ADDR);
    expect(req.network).toBe('base');
    expect(req.asset).toBe(X402_CONSTANTS.USDC_BASE);
  });

  it('uses Sepolia identifiers when network is base-sepolia', () => {
    const client = new X402Client({ network: 'base-sepolia' });
    const req = client.createRequirements(RESOURCE, '$0.01', VALID_ADDR);
    expect(req.network).toBe('base-sepolia');
    expect(req.asset).toBe(X402_CONSTANTS.USDC_BASE_SEPOLIA);
  });

  it('exposes usdcAddress and networkId as getters', () => {
    const client = new X402Client();
    expect(client.usdcAddress).toBe(X402_CONSTANTS.USDC_BASE);
    expect(client.networkId).toBe('base');
  });
});

describe('X402Client.createRequirements — extras', () => {
  it('includes the EIP-712 name and version in extras', () => {
    const client = new X402Client();
    const req = client.createRequirements(RESOURCE, '$0.01', VALID_ADDR);
    expect(req.extra).toEqual({
      name: X402_CONSTANTS.EIP712_NAME,
      version: X402_CONSTANTS.EIP712_VERSION,
    });
  });

  it('uses the configured maxTimeoutSeconds', () => {
    const client = new X402Client({ maxTimeoutSeconds: 30 });
    const req = client.createRequirements(RESOURCE, '$0.01', VALID_ADDR);
    expect(req.maxTimeoutSeconds).toBe(30);
  });

  it('sets scheme=exact, mimeType=application/json', () => {
    const client = new X402Client();
    const req = client.createRequirements(RESOURCE, '$0.01', VALID_ADDR);
    expect(req.scheme).toBe('exact');
    expect(req.mimeType).toBe('application/json');
  });

  it('passes through the description', () => {
    const client = new X402Client();
    const req = client.createRequirements(RESOURCE, '$0.01', VALID_ADDR, 'Voice generation: 470 chars');
    expect(req.description).toBe('Voice generation: 470 chars');
  });
});

describe('parsePaymentHeader', () => {
  it('parses a JSON-encoded X-PAYMENT header', () => {
    const payload = {
      signature: '0xabc',
      from: VALID_ADDR,
      to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      value: '47000',
      validAfter: '0',
      validBefore: '9999999999',
      nonce: '0x' + 'a'.repeat(64),
    };
    const header = JSON.stringify(payload);
    expect(parsePaymentHeader(header)).toEqual(payload);
  });

  it('accepts a base64-encoded header (b64 wrapper)', () => {
    const payload = {
      signature: '0xabc',
      from: VALID_ADDR,
      to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      value: '47000',
      validAfter: '0',
      validBefore: '9999999999',
      nonce: '0x' + 'a'.repeat(64),
    };
    const b64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    expect(parsePaymentHeader(b64)).toEqual(payload);
  });

  it('returns null for an empty header', () => {
    expect(parsePaymentHeader(null)).toBeNull();
    expect(parsePaymentHeader('')).toBeNull();
  });

  it('returns null for garbage input', () => {
    expect(parsePaymentHeader('not-json-at-all')).toBeNull();
  });
});

describe('createPaymentRequiredResponse', () => {
  it('returns a Response with status 402 and a JSON body containing requirements', async () => {
    const client = new X402Client();
    const req = client.createRequirements(RESOURCE, '$0.01', VALID_ADDR);
    const res = createPaymentRequiredResponse(req);

    expect(res.status).toBe(402);
    const text = await res.text();
    const body = JSON.parse(text);
    expect(body.error).toBe('Payment required');
    expect(body.requirements).toBeDefined();
    expect(body.requirements.payTo).toBe(getAddress(VALID_ADDR));
  });
});

describe('createPaymentSuccessResponse', () => {
  it('returns 200 with the data body and a payment-response header carrying the txHash', async () => {
    const txHash = '0x' + 'f'.repeat(64);
    const data = { success: true, recordingId: 'rec_1' };
    const res = createPaymentSuccessResponse(data, txHash);
    expect(res.status).toBe(200);
    const header = res.headers.get(X402_CONSTANTS.PAYMENT_RESPONSE_HEADER);
    expect(header).toBeTruthy();
    expect(JSON.parse(header!)).toEqual({ txHash });
    const body = await res.json();
    expect(body).toEqual(data);
  });
});

describe('X402 client singleton (getX402Client / resetX402Client)', () => {
  beforeEach(() => resetX402Client());
  afterEach(() => resetX402Client());

  it('returns the same instance for repeated calls', () => {
    const a = getX402Client();
    const b = getX402Client();
    expect(a).toBe(b);
  });

  it('applies new config on the first call only (singleton is sticky)', () => {
    const a = getX402Client();
    const b = getX402Client({ network: 'base-sepolia' });
    // Second call ignores the override; both should be the base-mainnet instance.
    expect(b).toBe(a);
    expect(a.networkId).toBe('base');
  });

  it('resetX402Client forces a fresh instance next call', () => {
    const a = getX402Client({ network: 'base-sepolia' });
    expect(a.networkId).toBe('base-sepolia');
    resetX402Client();
    const b = getX402Client();
    expect(b).not.toBe(a);
    expect(b.networkId).toBe('base');
  });
});

describe('X402Client.verifyPayment — network failure paths', () => {
  let client: X402Client;
  let payment: import('./x402Client').X402PaymentPayload;
  let requirements: import('./x402Client').X402PaymentRequirements;

  beforeEach(() => {
    // Pass keys via config (not env) because the env is read at module
    // load time, which is too early to be set inside a test.
    client = new X402Client({
      cdpApiKeyId: 'test-id',
      cdpApiKeySecret: 'test-secret',
    });
    payment = {
      signature: '0xabc',
      from: VALID_ADDR,
      to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      value: '47000',
      validAfter: '0',
      validBefore: '9999999999',
      nonce: '0x' + 'a'.repeat(64),
    };
    requirements = client.createRequirements(RESOURCE, '$0.01', VALID_ADDR);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns success:false with a structured error when the facilitator is unreachable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const result = await client.verifyPayment(payment, requirements);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns success:false when the facilitator returns 5xx', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('boom', { status: 500 }) as unknown as Response
    );
    const result = await client.verifyPayment(payment, requirements);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/500/);
  });

  it('returns success:true with a txHash when the facilitator accepts', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, txHash: '0xfeed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as Response
    );
    const result = await client.verifyPayment(payment, requirements);
    expect(result.success).toBe(true);
    expect(result.txHash).toBe('0xfeed');
  });
});
