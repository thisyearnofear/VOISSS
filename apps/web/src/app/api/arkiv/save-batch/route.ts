import { NextRequest } from "next/server";
import { createInsightWithCertificate } from "@/lib/arkiv-service";

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

    const result = await createInsightWithCertificate(insight, cert, ownerAddress);

    return Response.json({
      success: true,
      insightEntityKey: result.insightEntityKey,
      certEntityKey: result.certEntityKey,
      txHash: result.txHash,
    });
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
