import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function gone() {
  return NextResponse.json(
    {
      error: "Gone",
      code: "MISSIONS_RETIRED",
      message: "Missions have been retired. See /sell for contributor flow and /api/agents/vocalize for generation. The on-chain and Hetzner mission store is no longer served.",
      docs: "/sell",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST() { return gone(); }
