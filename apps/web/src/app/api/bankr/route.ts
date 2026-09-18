/**
 * Bankr API — Runtime Grand Prize integration surface
 *
 * GET  /api/bankr           → status (no auth) — judges can verify setup
 * GET  /api/bankr?view=wallet | portfolio | llm-models | status
 * POST /api/bankr { action: "prompt", prompt, threadId? }
 * POST /api/bankr { action: "chat", model, messages }
 * POST /api/bankr { action: "token-preview", name, symbol, chain, simulate? }
 *
 * All Bankr calls use server-held BANKR_API_KEY / BANKR_LLM_KEY — never
 * exposed to the client. When keys are not set the route returns a
 * structured 503 with setup instructions, so builds don't break and judges
 * get a clear path to reproduce.
 *
 * Docs:
 *  - https://docs.bankr.bot/cli/
 *  - https://github.com/BankrBot/skills/blob/main/bankr/SKILL.md
 *  - https://docs.bankr.bot/llm-gateway/overview
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  isBankrConfigured,
  isBankrLlmConfigured,
  getBankrStatus,
  bankrGetWalletInfo,
  bankrGetPortfolio,
  bankrAgentPrompt,
  bankrListModels,
  bankrChatCompletion,
} from '@/lib/bankr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function notConfigured(detail?: string) {
  return NextResponse.json(
    {
      success: false,
      configured: false,
      error: detail ?? 'Bankr not configured',
      setup: {
        step1: 'npm i -g @bankr/cli && bankr login email you@example.com --code 123456 --accept-terms --key-name "VOISSS Runtime" --llm',
        step2: 'Add to env: BANKR_API_KEY=bk_...  (and optionally BANKR_LLM_KEY=...)',
        docs: 'https://docs.bankr.bot/cli/ — see also BankrBot/skills SKILL.md',
        verify: 'bankr whoami  &&  curl https://voisss.netlify.app/api/bankr',
      },
      status: getBankrStatus(),
    },
    { status: 503 }
  );
}

export async function GET(req: NextRequest) {
  const status = getBankrStatus();
  const view = new URL(req.url).searchParams.get('view') ?? 'status';

  if (view === 'status') {
    return NextResponse.json({ success: true, status, configured: status.configured, llmConfigured: status.llmConfigured });
  }

  if (!isBankrConfigured()) return notConfigured(`Bankr API key required for view=${view}`);

  try {
    if (view === 'wallet') {
      const info = await bankrGetWalletInfo();
      return NextResponse.json({ success: true, data: info });
    }
    if (view === 'portfolio') {
      const data = await bankrGetPortfolio();
      return NextResponse.json({ success: true, data });
    }
    if (view === 'llm-models') {
      if (!isBankrLlmConfigured()) return notConfigured('LLM Gateway key required — enable at bankr.bot/api-keys (add --llm)');
      const data = await bankrListModels();
      return NextResponse.json({ success: true, data });
    }
    return NextResponse.json({ success: false, error: `Unknown view: ${view}` }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }
  const action = String(body.action ?? '');

  if (action === 'prompt') {
    if (!isBankrConfigured()) return notConfigured();
    const prompt = String(body.prompt ?? '');
    if (!prompt) return NextResponse.json({ success: false, error: 'prompt is required' }, { status: 400 });
    try {
      const res = await bankrAgentPrompt({ prompt, threadId: body.threadId as string | undefined });
      return NextResponse.json({ success: true, data: res });
    } catch (e) {
      return NextResponse.json({ success: false, error: (e as Error).message }, { status: 502 });
    }
  }

  if (action === 'chat') {
    if (!isBankrLlmConfigured()) return notConfigured('LLM Gateway not configured — set BANKR_LLM_KEY or enable --llm on your Bankr key');
    const model = String(body.model ?? 'claude-haiku-4.5');
    const messages = body.messages as { role: 'system' | 'user' | 'assistant'; content: string }[] | undefined;
    if (!messages?.length) return NextResponse.json({ success: false, error: 'messages is required' }, { status: 400 });
    try {
      const data = await bankrChatCompletion({ model, messages });
      return NextResponse.json({ success: true, data });
    } catch (e) {
      return NextResponse.json({ success: false, error: (e as Error).message }, { status: 502 });
    }
  }

  if (action === 'token-preview') {
    if (!isBankrConfigured()) return notConfigured();
    const name = String(body.name ?? '');
    if (!name) return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
    try {
      const { bankrTokenLaunchPreview } = await import('@/lib/bankr');
      const data = await bankrTokenLaunchPreview({
        name,
        symbol: body.symbol as string | undefined,
        chain: (body.chain as 'base' | 'robinhood' | 'arbitrum' | undefined) ?? 'base',
        image: body.image as string | undefined,
        simulate: true,
      });
      return NextResponse.json({ success: true, data });
    } catch (e) {
      return NextResponse.json({ success: false, error: (e as Error).message }, { status: 502 });
    }
  }

  return NextResponse.json({ success: false, error: `Unknown action: ${action}. Use action=prompt|chat|token-preview` }, { status: 400 });
}
