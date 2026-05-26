import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    services: {
      arkiv: { status: "unknown", message: "Check individual endpoints for connectivity" },
      payment: {
        status: process.env.X402_PAY_TO_ADDRESS ? "configured" : "not_configured",
        message: process.env.X402_PAY_TO_ADDRESS
          ? `Payments routed to ${process.env.X402_PAY_TO_ADDRESS.slice(0, 6)}...`
          : "X402_PAY_TO_ADDRESS not set. Payments via credits/tier only.",
      },
      ai: {
        elevenlabs: process.env.ELEVENLABS_API_KEY ? "configured" : "not_configured",
      },
      ipfs: {
        pinata: process.env.PINATA_API_KEY && process.env.PINATA_API_SECRET ? "configured" : "not_configured",
        fallback: "Temporary storage available",
      },
      arkiv: {
        configured: !!(process.env.ARKIV_PRIVATE_KEY || process.env.NEXT_PUBLIC_ARKIV_PRIVATE_KEY),
        network: "braga-testnet",
        explorer: "https://explorer.braga.hoodi.arkiv.network",
        features: [
          "entity creation with ownership transfer",
          "batch operations (insight + certificate)",
          "numeric time-range queries (gt/lt)",
          "differentiated expiry (30/365/730 days)",
          "wallet-gated reads via $owner",
          "explorer links for all entities",
          "idempotent writes via Idempotency-Key",
        ],
      },
    },
  };

  return NextResponse.json(status, { status: 200 });
}