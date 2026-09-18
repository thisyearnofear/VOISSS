/**
 * Dynamic Wallet API — Runtime Track: Best Agentic Wallet or Payment Experience
 *
 * Demonstrates the Dynamic Server Wallet pattern (backend-owned, MPC).
 * Docs:
 *  - https://www.dynamic.xyz/docs/overview/agents/overview
 *  - https://www.dynamic.xyz/docs/node/wallets/server-wallets/overview
 *  - https://www.dynamic.xyz/docs/overview/agents/agent-payments
 *
 * Endpoints:
 *  GET  /api/agents/dynamic-wallet?agentAddress=0x...
 *        → status + wallet (if provisioned)
 *  POST /api/agents/dynamic-wallet  { agentAddress, action?: "create"|"sign" }
 *        → create or sign; action=sign requires message
 *
 * This is the verifiable integration judges will review:
 *  - DynamicWalletService.ts:signX402Authorization is called from
 *    PaymentRouter.processDynamicPayment and from vocalize when
 *    X-DYNAMIC-WALLET is set — both trace to this route's wallet.
 *
 * Security: never exposes shares; only walletMetadata + address.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers });
}

// Lazy load so builds without @dynamic-labs packages still succeed
async function getDynamicMod() {
  try {
    return await import('@voisss/shared/services/payment/DynamicWalletService');
  } catch (e) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const agentAddress = url.searchParams.get('agentAddress');
  const mod = await getDynamicMod();
  if (!mod) {
    return json({ success: false, error: 'Dynamic SDK not installed. Add @dynamic-labs-wallet/node-evm + @dynamic-labs-wallet/core or set DYNAMIC_WALLET_PRIVATE_KEY for EOA fallback.' }, 503);
  }
  const svc = mod.getDynamicWalletService();
  const status = svc.getStatus();

  if (!agentAddress) {
    return json({
      success: true,
      configured: status.configured,
      mode: status.mode,
      status,
      note: 'Pass ?agentAddress=0x... to look up a provisioned wallet. POST {agentAddress} to create one.',
      docs: {
        overview: 'https://www.dynamic.xyz/docs/overview/agents/overview',
        serverWallets: 'https://www.dynamic.xyz/docs/node/wallets/server-wallets/overview',
        agentPayments: 'https://www.dynamic.xyz/docs/overview/agents/agent-payments',
      },
    });
  }

  if (!isAddress(agentAddress)) {
    return json({ success: false, error: 'Invalid agentAddress' }, 400);
  }

  const wallet = svc.getWallet(agentAddress);
  return json({
    success: true,
    configured: status.configured,
    mode: status.mode,
    status,
    agentAddress,
    wallet: wallet ? { address: wallet.accountAddress, createdAt: wallet.createdAt, environmentId: wallet.environmentId } : null,
    hasWallet: !!wallet,
  });
}

export async function POST(req: NextRequest) {
  const mod = await getDynamicMod();
  if (!mod) {
    return json({ success: false, error: 'Dynamic SDK not installed' }, 503);
  }
  const svc = mod.getDynamicWalletService();
  const status = svc.getStatus();
  if (!status.configured) {
    return json({
      success: false,
      error: 'Dynamic wallet not configured',
      hint: 'Set DYNAMIC_API_TOKEN + DYNAMIC_ENVIRONMENT_ID for MPC (https://console.dynamic.xyz/dashboard/developer/api), or DYNAMIC_WALLET_PRIVATE_KEY=0x... for demo EOA fallback. See apps/web/.env.example.',
      status,
    }, 503);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const agentAddress = String((body.agentAddress as string) ?? '');
  if (!isAddress(agentAddress)) {
    return json({ success: false, error: 'agentAddress is required and must be 0x... (40 hex)' }, 400);
  }

  const action = String((body.action as string) ?? 'create');

  if (action === 'sign') {
    const message = String((body.message as string) ?? '');
    if (!message) return json({ success: false, error: 'message is required for action=sign' }, 400);
    try {
      const result = await svc.signMessage(agentAddress, message);
      return json({
        success: true,
        agentAddress,
        wallet: svc.getWallet(agentAddress)?.accountAddress ?? null,
        signature: result.signature,
        signer: result.address,
        method: result.method,
      });
    } catch (e) {
      return json({ success: false, error: (e as Error).message }, 500);
    }
  }

  // default: create / getOrCreate
  try {
    const wallet = await svc.getOrCreateWallet(agentAddress);
    if (!wallet) return json({ success: false, error: 'Failed to provision wallet — check Dynamic dashboard credentials' }, 500);
    return json({
      success: true,
      agentAddress,
      wallet: { address: wallet.accountAddress, createdAt: wallet.createdAt, environmentId: wallet.environmentId },
      mode: status.mode,
      method: (wallet.walletMetadata as Record<string, unknown>)?.fallback ? 'eoa-fallback' : 'mpc',
      usage: 'Include header X-DYNAMIC-WALLET: 1 on POST /api/agents/vocalize to have the server sign the x402 payment with this wallet.',
    });
  } catch (e) {
    return json({ success: false, error: (e as Error).message }, 500);
  }
}
