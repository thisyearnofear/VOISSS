import { NextRequest } from "next/server";
import { createInsightWithCertificate, arkivIdempotencyCache, getArkivExplorerUrl, getArkivTxExplorerUrl } from "@/lib/arkiv-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const { insight, cert, ownerAddress } = body;

    if (!insight || !cert || !ownerAddress) {
      return Response.json(
        {
          success: false,
          error: "Missing insight, cert, or ownerAddress",
        },
        { status: 400 }
      );
    }

    // Check idempotency key to prevent duplicate entity creation
    const idempotencyKey = req.headers.get('Idempotency-Key');
    if (idempotencyKey) {
      const cached = arkivIdempotencyCache.get(idempotencyKey);
      if (cached) {
        return Response.json({
          success: true,
          cached: true,
          ...cached.result,
        });
      }
    }

    const result = await createInsightWithCertificate(insight, cert, ownerAddress);

    const responseBody = {
      success: true,
      insightEntityKey: result.insightEntityKey,
      certEntityKey: result.certEntityKey,
      txHash: result.txHash,
      insightExplorerUrl: result.insightExplorerUrl,
      certExplorerUrl: result.certExplorerUrl,
      txExplorerUrl: getArkivTxExplorerUrl(result.txHash),
    };

    // Cache for idempotency
    if (idempotencyKey) {
      arkivIdempotencyCache.set(idempotencyKey, responseBody);
    }

    return Response.json(responseBody);
  } catch (error) {
    console.error("Arkiv batch save error:", error);
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to batch save to Arkiv",
      },
      { status: 500 }
    );
  }
}
