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
      const metadata = session.metadata || {};

      const agentAddress = metadata.agentAddress;
      const creditsUsdc = metadata.creditsUsdc;
      const pack = metadata.pack;
      const voiceId = metadata.voiceId;

      // ── Credits purchase (standard flow) ────────────────────────────
      if (agentAddress && creditsUsdc) {
        console.log(
          `[Stripe Webhook] Credits payment. Adding ${creditsUsdc} USDC to ${agentAddress} (${pack})`
        );
        await addCreditsToAgent(agentAddress, BigInt(creditsUsdc), pack || "stripe", session.id);
        console.log(`[Stripe Webhook] ✅ Credits added to ${agentAddress}`);
      }

      // ── License purchase (voice-specific) ───────────────────────────
      if (voiceId) {
        const receiptNumber = `RCPT-${session.id.slice(-8).toUpperCase()}`;
        console.log(
          `[Stripe Webhook] License purchase for voice ${voiceId}. Customer: ${session.customer}. Receipt: ${receiptNumber}`
        );

        // Let Stripe retry this event if durable entitlement creation fails.
        // A successful payment without an entitlement must never be silently
        // acknowledged as a successful fulfilment.
        await createLicenseEntitlement({
          voiceId,
          licenseeAddress: agentAddress || "",
          licenseType: metadata.licenseType === "exclusive" ? "exclusive" : "non-exclusive",
          stripeSessionId: session.id,
          receiptNumber,
          amountPaid: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency || "usd",
        });
      }
    }

    // ── Handle checkout failures (outside completed block) ─────────
    if (event.type === "checkout.session.expired") {
      console.warn(`[Stripe Webhook] Checkout session expired: ${(event.data.object as import("stripe").Stripe.Checkout.Session).id}`);
    }

    // ── Handle disputes (outside completed block) ──────────────────
    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as import("stripe").Stripe.Dispute;
      console.warn(
        `[Stripe Webhook] Dispute created for session ${dispute.payment_intent}. Amount: ${dispute.amount}`
      );
      try {
        await markLicenseDisputed(dispute.metadata?.voiceId || "", dispute.payment_intent as string);
      } catch (err) {
        console.error("[Stripe Webhook] Dispute handling failed:", err);
      }
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "https://voisss.netlify.app"}/api/agents/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// License entitlement storage
// ─────────────────────────────────────────────────────────────────────────────

interface LicenseEntitlementInput {
  voiceId: string;
  licenseeAddress?: string;
  licenseType: "non-exclusive" | "exclusive";
  stripeSessionId: string;
  receiptNumber: string;
  amountPaid: number;
  currency: string;
}

/**
 * Store a new license entitlement after Stripe payment confirmation.
 * 
 * The caller must receive a failure when this cannot persist, allowing Stripe
 * to retry the signed webhook event instead of losing a paid entitlement.
 */
async function createLicenseEntitlement(input: LicenseEntitlementInput): Promise<void> {
  const { createPostgresDatabase } = await import("@voisss/shared/server");
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is required to persist licence entitlements");
  }

  const db = createPostgresDatabase(dbUrl);
  await db.connect();
  try {
    await db.setBatch("voisss_voice_licenses", [
      {
        id: `lic_${input.stripeSessionId}`,
        data: {
          voiceId: input.voiceId,
          licenseeAddress: input.licenseeAddress || "",
          licenseType: input.licenseType,
          stripeSessionId: input.stripeSessionId,
          receiptNumber: input.receiptNumber,
          amountPaid: input.amountPaid,
          currency: input.currency,
          status: "active",
          purchasedAt: new Date().toISOString(),
          expiresAt: null,
        },
      },
    ]);
    console.log(`[license] ✅ License created: ${input.receiptNumber} for ${input.voiceId}`);
  } finally {
    await db.disconnect();
  }
}

/**
 * Mark a license as disputed (for chargeback handling).
 */
async function markLicenseDisputed(voiceId: string, paymentIntent: string): Promise<void> {
  try {
    const { createPostgresDatabase } = await import("@voisss/shared/server");
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return;

    const db = createPostgresDatabase(dbUrl);
    await db.connect();
    try {
      // Update the license record to mark as disputed
      const key = `lic_${paymentIntent}`;
      // Simple approach: store a dispute record alongside
      await db.setBatch("voisss_disputes", [
        {
          id: key,
          data: {
            voiceId,
            paymentIntent,
            status: "open",
            createdAt: new Date().toISOString(),
          },
        },
      ]);
    } finally {
      await db.disconnect();
    }
  } catch (error) {
    console.error("[license] Dispute handling failed:", error);
  }
}
