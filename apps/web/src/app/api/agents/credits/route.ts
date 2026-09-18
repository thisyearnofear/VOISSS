/**
 * GET /api/agents/credits?agentAddress=0x...
 *
 * Returns live credit balance for the deposit modal + AgentCreditPanel.
 * Backed by PaymentRouter (InMemory store in dev → AgentRegistry on Base in prod).
 * Kept deliberately tolerant — never throws for missing chain/DB, just degrades.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPaymentRouter, formatUSDC } from "@voisss/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paymentRouter = getPaymentRouter({
  preference: "credits_first",
  x402PayTo: process.env.X402_PAY_TO_ADDRESS || "",
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentAddress = searchParams.get("agentAddress");

  if (!agentAddress || !/^0x[a-fA-F0-9]{40}$/.test(agentAddress)) {
    return NextResponse.json(
      { success: false, error: "Valid agentAddress required (0x + 40 hex)" },
      { status: 400 }
    );
  }

  try {
    // Cheap: quote for 1000 chars so the panel can show per-char cost alongside balance
    const [balanceWei, quote] = await Promise.all([
      paymentRouter.getCreditBalance(agentAddress),
      paymentRouter
        .getQuote(agentAddress, "voice_generation", 1000)
        .catch(() => null),
    ]);

    // The in-memory store exposes only balance; other fields stay 0 for now.
    // When wired to AgentRegistry on Base, these become durable on-chain reads.
    const balance = {
      usdcBalance: balanceWei.toString(),
      usdcLocked: "0",
      totalSpent: "0",
      lastTopUp: null as string | null,
    };

    return NextResponse.json({
      success: true,
      data: {
        agentAddress,
        balance,
        balanceFormatted: formatUSDC(balanceWei),
        balanceWei: balanceWei.toString(),
        // convenience for the dashboard — mirrors GET /api/agents/vocalize shape
        quote: quote
          ? {
              currentTier: quote.currentTier,
              discountPercent: quote.discountPercent,
              unitCost: quote.unitCost.toString(),
              sampleCost: quote.estimatedCost.toString(),
              availableMethods: quote.availableMethods,
              recommendedMethod: quote.recommendedMethod,
            }
          : null,
        transactions: [] as never[],
      },
    });
  } catch (e) {
    console.error("[credits] GET failed:", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to read balance" },
      { status: 500 }
    );
  }
}
