import { NextRequest, NextResponse } from "next/server";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/payments/stripe/webhook
 *
 * Receives Stripe webhook events. On checkout.session.completed,
 * credits are added to the agent's VOISSS account.
 *
 * Required env:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET  (from Stripe dashboard → Webhooks → signing secret)
 */
export async function POST(request: NextRequest) {
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" });

    const rawBody = await request.text();
    let event: import("stripe").Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("[Stripe Webhook] Signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as import("stripe").Stripe.Checkout.Session;

      const agentAddress = session.metadata?.agentAddress;
      const creditsUsdc = session.metadata?.creditsUsdc;
      const pack = session.metadata?.pack;

      if (!agentAddress || !creditsUsdc) {
        console.error("[Stripe Webhook] Missing metadata:", session.metadata);
        // Acknowledge to Stripe — don't retry
        return NextResponse.json({ received: true });
      }

      console.log(
        `[Stripe Webhook] Payment complete. Adding ${creditsUsdc} USDC credits to ${agentAddress} (${pack} pack)`
      );

      // Add credits to agent account
      await addCreditsToAgent(agentAddress, BigInt(creditsUsdc), pack || "stripe", session.id);

      console.log(`[Stripe Webhook] ✅ Credits added to ${agentAddress}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

/**
 * Add USDC credits to an agent's account.
 * 
 * In production this would call the AgentRegistry contract or your DB.
 * This implementation writes to the internal credits store.
 */
async function addCreditsToAgent(
  agentAddress: string,
  creditsUsdc: bigint,
  pack: string,
  stripeSessionId: string
) {
  try {
    // Record the credit grant in the DB / in-memory store
    // In production: call AgentRegistry.depositUSDC or a DB transaction
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "https://voisss.netlify.app"}/api/agents/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Internal service call — use admin key
          Authorization: `Bearer ${process.env.ADMIN_API_KEY}`,
        },
        body: JSON.stringify({
          agentAddress,
          action: "add-stripe-credits",
          amount: creditsUsdc.toString(),
          pack,
          stripeSessionId,
          source: "stripe",
        }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      console.error("[addCreditsToAgent] Failed:", data);
    }
  } catch (error) {
    console.error("[addCreditsToAgent] Error:", error);
    // Don't throw — we've already received payment, manual intervention needed
    // In production: add to a dead-letter queue
  }
}
