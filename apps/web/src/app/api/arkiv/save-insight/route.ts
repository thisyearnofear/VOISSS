import { NextRequest } from "next/server";
import { createVoiceInsightEntity, arkivIdempotencyCache, getArkivExplorerUrl, getArkivTxExplorerUrl } from "@/lib/arkiv-service";

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

    // Idempotency check
    const idempotencyKey = req.headers.get('Idempotency-Key');
    if (idempotencyKey) {
      const cached = arkivIdempotencyCache.get(idempotencyKey);
      if (cached) {
        return Response.json({ success: true, cached: true, ...cached.result });
      }
    }

    const result = await createVoiceInsightEntity(insight, ownerAddress);

    const responseBody = {
      success: true,
      entityKey: result.entityKey,
      txHash: result.txHash,
      explorerUrl: getArkivExplorerUrl(result.entityKey),
      txExplorerUrl: getArkivTxExplorerUrl(result.txHash),
    };

    if (idempotencyKey) {
      arkivIdempotencyCache.set(idempotencyKey, responseBody);
    }

    return Response.json(responseBody);
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
