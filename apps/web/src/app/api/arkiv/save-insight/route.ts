import { NextRequest } from "next/server";
import { createVoiceInsightEntity } from "@/lib/arkiv-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const { insight, ownerAddress } = body;

    if (!insight || !ownerAddress) {
      return Response.json(
        { success: false, error: "Missing insight or ownerAddress" },
        { status: 400 }
      );
    }

    const result = await createVoiceInsightEntity(insight, ownerAddress);

    return Response.json({
      success: true,
      entityKey: result.entityKey,
      txHash: result.txHash,
    });
  } catch (error) {
    console.error("Arkiv save insight error:", error);
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to save to Arkiv",
      },
      { status: 500 }
    );
  }
}
