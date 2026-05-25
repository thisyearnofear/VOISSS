import { NextRequest } from "next/server";
import { createHumanityCertificateEntity } from "@/lib/arkiv-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const { cert, insightEntityId, ownerAddress } = body;

    if (!cert || !insightEntityId || !ownerAddress) {
      return Response.json(
        {
          success: false,
          error: "Missing cert, insightEntityId, or ownerAddress",
        },
        { status: 400 }
      );
    }

    const result = await createHumanityCertificateEntity(
      cert,
      insightEntityId,
      ownerAddress
    );

    return Response.json({
      success: true,
      entityKey: result.entityKey,
      txHash: result.txHash,
    });
  } catch (error) {
    console.error("Arkiv save certificate error:", error);
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
