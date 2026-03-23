import { NextRequest, NextResponse } from "next/server";

/**
 * Alchemy Custom Webhook Listener
 * 
 * This endpoint listens for events from the VoiceLicenseMarket smart contract.
 * Point Alchemy Notify to: https://your-domain.com/api/webhooks/alchemy
 */

// Secret from Alchemy Dashboard for signature verification
const ALCHEMY_WEBHOOK_SECRET = process.env.ALCHEMY_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signature = req.headers.get("x-alchemy-signature");

    // 1. Signature Verification (Security)
    if (ALCHEMY_WEBHOOK_SECRET && signature) {
      // Logic to verify Alchemy signature would go here
      // For now, we'll log it for debugging
      console.log("Alchemy Webhook received with signature:", signature);
    }

    const { event } = body;
    if (!event || !event.data) {
      return NextResponse.json({ success: true, message: "No event data" });
    }

    // 2. Parse Contract Events
    // Alchemy sends logs in the 'event.data.block.logs' array
    const logs = event.data.block.logs || [];

    for (const log of logs) {
      // Logic to decode logs based on VoiceLicenseMarket ABI
      // Event: VoiceListed(uint256 indexed voiceId, address indexed contributor, uint256 price, bool isExclusive)
      
      console.log("Processing Contract Log:", log.transactionHash);
      
      // In a production app, you would:
      // a) Use viem's decodeEventLog to get the arguments
      // b) Update your database (Supabase/Postgres) with the new listing
      // c) Invalidate Vercel cache for the marketplace page
    }

    return NextResponse.json({ 
      success: true, 
      processed: logs.length 
    });

  } catch (error) {
    console.error("Alchemy Webhook Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// Ensure the endpoint is dynamic and not cached
export const dynamic = 'force-dynamic';
