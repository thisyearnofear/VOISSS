import { NextRequest, NextResponse } from "next/server";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Credit pack definitions — fiat price → USDC credits
const CREDIT_PACKS = {
  starter: { priceUSD: 5, creditsUSD: 5, label: "Starter Pack" },
  builder: { priceUSD: 10, creditsUSD: 11, label: "Builder Pack" }, // +10% bonus
  pro: { priceUSD: 25, creditsUSD: 30, label: "Pro Pack" }, // +20% bonus
  scale: { priceUSD: 50, creditsUSD: 65, label: "Scale Pack" }, // +30% bonus
};

export type CreditPack = keyof typeof CREDIT_PACKS;

// POST /api/payments/stripe — create a Stripe checkout session
export async function POST(request: NextRequest) {
  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { pack, agentAddress, successUrl, cancelUrl } = body;

    if (!pack || !CREDIT_PACKS[pack as CreditPack]) {
      return NextResponse.json(
        {
          error: "Invalid pack. Choose: starter, builder, pro, scale",
          available: Object.keys(CREDIT_PACKS),
        },
        { status: 400 }
      );
    }

    if (!agentAddress || !agentAddress.startsWith("0x")) {
      return NextResponse.json(
        { error: "agentAddress required (your wallet address starting with 0x)" },
        { status: 400 }
      );
    }

    const selectedPack = CREDIT_PACKS[pack as CreditPack];

    // Dynamically import Stripe to avoid build issues if not installed
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `VOISSS ${selectedPack.label}`,
              description: `$${selectedPack.creditsUSD} in voice API credits (~${(selectedPack.creditsUSD * 1_000_000).toLocaleString()} characters). 70% goes to voice contributors.`,
              images: ["https://voisss.netlify.app/og-image.png"],
            },
            unit_amount: selectedPack.priceUSD * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url:
        successUrl ||
        `${request.headers.get("origin") || "https://voisss.netlify.app"}/studio?credits=success&pack=${pack}`,
      cancel_url:
        cancelUrl ||
        `${request.headers.get("origin") || "https://voisss.netlify.app"}/studio?credits=cancelled`,
      metadata: {
        agentAddress,
        pack,
        creditsUSD: selectedPack.creditsUSD.toString(),
        // USDC amount in 6 decimal units (USDC has 6 decimals)
        creditsUsdc: (selectedPack.creditsUSD * 1_000_000).toString(),
      },
      customer_email: undefined, // Let Stripe collect
      payment_intent_data: {
        metadata: {
          agentAddress,
          pack,
          service: "voisss-voice-credits",
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
        pack: selectedPack,
      },
    });
  } catch (error) {
    console.error("[Stripe] Checkout session error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create checkout",
      },
      { status: 500 }
    );
  }
}

// GET /api/payments/stripe — list available packs
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      packs: Object.entries(CREDIT_PACKS).map(([key, pack]) => ({
        id: key,
        ...pack,
        bonusPercent:
          key === "starter"
            ? 0
            : key === "builder"
            ? 10
            : key === "pro"
            ? 20
            : 30,
        charactersApprox: pack.creditsUSD * 1_000_000,
      })),
      note: "Credits are added to your VOISSS wallet address automatically after payment. 70% of all API revenue goes to voice contributors.",
    },
  });
}
