import { NextRequest } from "next/server";
import { queryVoiceInsights, queryHumanityCertificates } from "@/lib/arkiv-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const ownerAddress = searchParams.get("ownerAddress") || undefined;
    const entityType = searchParams.get("entityType") || "VoiceInsight";
    const parentInsightId = searchParams.get("parentInsightId") || undefined;

    if (entityType === "HumanityCertificate") {
      const entities = await queryHumanityCertificates(
        ownerAddress,
        parentInsightId
      );
      return Response.json({ success: true, entities });
    }

    const entities = await queryVoiceInsights(ownerAddress);
    return Response.json({ success: true, entities });
  } catch (error) {
    console.error("Arkiv query error:", error);
    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to query Arkiv",
      },
      { status: 500 }
    );
  }
}
