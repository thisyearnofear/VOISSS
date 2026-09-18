/**
 * Bankr Client — Runtime Grand Prize integration
 *
 * Bankr handbook: docs.bankr.bot + BankrBot/skills (SKILL.md)
 * - Wallet API  (sync):  GET /wallet/me, GET /wallet/portfolio, POST /wallet/transfer|swap|sign|submit
 * - Agent API   (async): POST /agent/prompt -> jobId, GET /agent/job/:id, POST /agent/job/:id/cancel
 * - LLM Gateway:         POST https://llm.bankr.bot/v1/chat/completions (+ Anthropic /v1/messages)
 * - Token launch:        bankr launch / POST /token-launches  (CLI covers interactive wizard)
 *
 * This module is intentionally thin — it gives the app a typed, testable
 * surface to call Bankr from API routes and server components without
 * scattering X-API-Key headers and poll logic everywhere.
 *
 * Auth: X-API-Key: bk_...  (Bankr API key, read-write for wallet actions).
 * LLM Gateway can use a separate key — pass llmKey explicitly or it falls
 * back to apiKey.  Keys live in env and are never exposed to the client.
 *
 * Docs:
 *  - https://docs.bankr.bot/cli/
 *  - https://github.com/BankrBot/skills/blob/main/bankr/SKILL.md
 *  - https://docs.bankr.bot/llm-gateway/overview
 *  - https://docs.bankr.bot/agent-api/overview (Agent API)
 *  - https://docs.bankr.bot/wallet-api/overview
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const BANKR_API_BASE = 'https://api.bankr.bot';
export const BANKR_LLM_BASE = 'https://llm.bankr.bot';

function bankrApiKey(): string | undefined {
  return process.env.BANKR_API_KEY ?? process.env.BANKR_APIKEY ?? undefined;
}
function bankrLlmKey(): string | undefined {
  return process.env.BANKR_LLM_KEY ?? process.env.BANKR_LLM_API_KEY ?? bankrApiKey();
}

export function isBankrConfigured(): boolean {
  return !!bankrApiKey();
}
export function isBankrLlmConfigured(): boolean {
  return !!bankrLlmKey();
}
export function getBankrStatus() {
  const apiKey = bankrApiKey();
  const llmKey = bankrLlmKey();
  const masked = (k?: string) => (k ? `${k.slice(0, 6)}...${k.slice(-4)}` : null);
  return {
    configured: !!apiKey,
    llmConfigured: !!llmKey,
    apiKeyMasked: masked(apiKey),
    llmKeyMasked: masked(llmKey),
    apiBase: BANKR_API_BASE,
    llmBase: BANKR_LLM_BASE,
    docs: {
      cli: 'https://docs.bankr.bot/cli/',
      walletApi: 'https://docs.bankr.bot/wallet-api/overview',
      agentApi: 'https://docs.bankr.bot/agent-api/overview',
      llmGateway: 'https://docs.bankr.bot/llm-gateway/overview',
      tokenLaunch: 'https://docs.bankr.bot/token-launching/overview',
      skill: 'https://github.com/BankrBot/skills/blob/main/bankr/SKILL.md',
    },
  };
}

// ---------------------------------------------------------------------------
// Low-level fetch helpers
// ---------------------------------------------------------------------------

type BankrFetchOpts = {
  method?: string;
  body?: unknown;
  apiKeyOverride?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

async function bankrFetch(path: string, opts: BankrFetchOpts = {}): Promise<Response> {
  const key = opts.apiKeyOverride ?? bankrApiKey();
  if (!key) throw new Error('BANKR_API_KEY not set — run `bankr login email ...` or set env');
  const headers: Record<string, string> = {
    'X-API-Key': key,
    'Content-Type': 'application/json',
    ...(opts.headers ?? {}),
  };
  return fetch(`${BANKR_API_BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body != null ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
}

async function bankrLlmFetch(path: string, init: RequestInit & { apiKeyOverride?: string } = {}): Promise<Response> {
  const key = init.apiKeyOverride ?? (init.headers as Record<string, string> | undefined)?.['X-API-Key'] ?? bankrLlmKey();
  if (!key) throw new Error('BANKR_LLM_KEY / BANKR_API_KEY not set — enable LLM Gateway at bankr.bot/api-keys');
  const headers: Record<string, string> = {
    'X-API-Key': key,
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  return fetch(`${BANKR_LLM_BASE}${path}`, {
    ...init,
    headers,
  });
}

// ---------------------------------------------------------------------------
// Wallet API (sync) — typed helpers
// ---------------------------------------------------------------------------

export interface BankrWalletInfo {
  address: string;
  addresses?: Record<string, string>;
  chain?: string;
  [k: string]: unknown;
}
export interface BankrPortfolioEntry {
  chain: string;
  symbol: string;
  address?: string;
  balance: string;
  usdValue?: string;
  [k: string]: unknown;
}

export async function bankrGetWalletInfo(apiKeyOverride?: string): Promise<BankrWalletInfo> {
  const res = await bankrFetch('/wallet/me', { apiKeyOverride });
  if (!res.ok) throw new Error(`Bankr /wallet/me ${res.status}: ${await res.text()}`);
  return res.json() as Promise<BankrWalletInfo>;
}

export async function bankrGetPortfolio(
  opts: { include?: 'pnl' | 'nfts' | 'all'; chain?: string; json?: boolean } = {},
  apiKeyOverride?: string
): Promise<unknown> {
  const params = new URLSearchParams();
  if (opts.include) params.set('include', opts.include);
  if (opts.chain) params.set('chain', opts.chain);
  if (opts.json) params.set('format', 'json');
  const qs = params.toString() ? `?${params}` : '';
  const res = await bankrFetch(`/wallet/portfolio${qs}`, { apiKeyOverride });
  if (!res.ok) throw new Error(`Bankr /wallet/portfolio ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function bankrTransfer(
  body: { to: string; amount: string; token?: string; chain?: string; native?: boolean },
  apiKeyOverride?: string
): Promise<unknown> {
  const res = await bankrFetch('/wallet/transfer', { method: 'POST', body, apiKeyOverride });
  if (!res.ok) throw new Error(`Bankr /wallet/transfer ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function bankrSwapQuote(
  body: { from: string; to: string; amount: string; chain?: string },
  apiKeyOverride?: string
): Promise<unknown> {
  const res = await bankrFetch('/wallet/swap-quote', { method: 'POST', body, apiKeyOverride });
  if (!res.ok) throw new Error(`Bankr /wallet/swap-quote ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function bankrSwap(
  body: { from: string; to: string; amount: string; chain?: string },
  apiKeyOverride?: string
): Promise<unknown> {
  const res = await bankrFetch('/wallet/swap', { method: 'POST', body, apiKeyOverride });
  if (!res.ok) throw new Error(`Bankr /wallet/swap ${res.status}: ${await res.text()}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Agent API (async prompt -> poll)
// ---------------------------------------------------------------------------

export interface BankrAgentPromptRequest {
  prompt: string;
  threadId?: string;
  model?: string;
}
export interface BankrAgentPromptResponse {
  jobId: string;
  threadId?: string;
  status: string;
  [k: string]: unknown;
}
export interface BankrAgentJobResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | string;
  response?: string;
  result?: unknown;
  error?: string;
  threadId?: string;
  [k: string]: unknown;
}

const TERMINAL_AGENT_STATUSES = new Set(['completed', 'failed', 'cancelled']);

export async function bankrAgentPrompt(
  req: BankrAgentPromptRequest,
  apiKeyOverride?: string
): Promise<BankrAgentPromptResponse> {
  const res = await bankrFetch('/agent/prompt', { method: 'POST', body: req, apiKeyOverride });
  if (!res.ok) throw new Error(`Bankr /agent/prompt ${res.status}: ${await res.text()}`);
  return res.json() as Promise<BankrAgentPromptResponse>;
}

export async function bankrAgentJob(jobId: string, apiKeyOverride?: string): Promise<BankrAgentJobResponse> {
  const res = await bankrFetch(`/agent/job/${encodeURIComponent(jobId)}`, { apiKeyOverride });
  if (!res.ok) throw new Error(`Bankr /agent/job/${jobId} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<BankrAgentJobResponse>;
}

export async function bankrAgentCancel(jobId: string, apiKeyOverride?: string): Promise<unknown> {
  const res = await bankrFetch(`/agent/job/${encodeURIComponent(jobId)}/cancel`, { method: 'POST', apiKeyOverride });
  if (!res.ok) throw new Error(`Bankr /agent/job/${jobId}/cancel ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function bankrAgentPromptAndPoll(
  req: BankrAgentPromptRequest,
  opts: { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal; apiKeyOverride?: string } = {}
): Promise<BankrAgentJobResponse> {
  const { intervalMs = 2000, timeoutMs = 90_000, signal, apiKeyOverride } = opts;
  const submitted = await bankrAgentPrompt(req, apiKeyOverride);
  const jobId = submitted.jobId;
  const started = Date.now();
  for (;;) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (Date.now() - started > timeoutMs) throw new Error(`Bankr agent poll timeout after ${timeoutMs}ms (job ${jobId})`);
    await new Promise<void>(resolve => setTimeout(resolve, intervalMs));
    const job = await bankrAgentJob(jobId, apiKeyOverride);
    if (TERMINAL_AGENT_STATUSES.has(job.status)) return job;
  }
}

// ---------------------------------------------------------------------------
// LLM Gateway (OpenAI-compatible + Anthropic-compatible)
// ---------------------------------------------------------------------------

export interface BankrChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
export interface BankrChatRequest {
  model: string;
  messages: BankrChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export async function bankrChatCompletion(
  req: BankrChatRequest,
  opts: { apiKeyOverride?: string; signal?: AbortSignal } = {}
): Promise<unknown> {
  const res = await bankrLlmFetch('/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify(req),
    signal: opts.signal,
    apiKeyOverride: opts.apiKeyOverride,
  });
  if (!res.ok) throw new Error(`Bankr LLM /v1/chat/completions ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function bankrAnthropicMessage(
  body: { model: string; max_tokens: number; messages: BankrChatMessage[]; [k: string]: unknown },
  opts: { apiKeyOverride?: string; signal?: AbortSignal } = {}
): Promise<unknown> {
  const res = await bankrLlmFetch('/v1/messages', {
    method: 'POST',
    body: JSON.stringify(body),
    signal: opts.signal,
    apiKeyOverride: opts.apiKeyOverride,
  });
  if (!res.ok) throw new Error(`Bankr LLM /v1/messages ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function bankrListModels(apiKeyOverride?: string): Promise<unknown> {
  const res = await bankrLlmFetch('/v1/models', { method: 'GET', apiKeyOverride });
  if (!res.ok) throw new Error(`Bankr LLM /v1/models ${res.status}: ${await res.text()}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Token launch (Base) — minimal helper; full wizard lives in @bankr/cli
// The API shape is documented at docs.bankr.bot/token-launching/overview
// We keep this as a thin wrapper so the app can offer a one-click demo
// launch without shelling out to the CLI.
// ---------------------------------------------------------------------------

export interface BankrTokenLaunchRequest {
  name: string;
  symbol?: string;
  chain?: 'base' | 'robinhood' | 'arbitrum';
  quoteToken?: string;
  image?: string;
  website?: string;
  tweet?: string;
  fee?: string;
  feeType?: 'x' | 'farcaster' | 'ens' | 'wallet';
  simulate?: boolean;
}

export async function bankrTokenLaunchPreview(
  req: BankrTokenLaunchRequest,
  apiKeyOverride?: string
): Promise<unknown> {
  // Prefer the documented REST path; fall back to CLI docs if the path differs.
  // Bankr docs: /token-launches and CLI `bankr launch --simulate` both work.
  const res = await bankrFetch('/token-launches', {
    method: 'POST',
    body: { ...req, simulate: req.simulate ?? true },
    apiKeyOverride,
  });
  if (!res.ok) throw new Error(`Bankr /token-launches ${res.status}: ${await res.text()}`);
  return res.json();
}
