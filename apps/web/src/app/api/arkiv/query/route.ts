import { NextRequest } from "next/server";
import {
  queryVoiceInsights,
  queryHumanityCertificates,
  type QueryFilters,
} from "@/lib/arkiv-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType") || "VoiceInsight";

    const filters: QueryFilters = {
      ownerAddress: searchParams.get("ownerAddress") || undefined,
      searchTerm: searchParams.get("searchTerm") || undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!, 10)
        : undefined,
      createdAfter: searchParams.get("createdAfter")
        ? parseInt(searchParams.get("createdAfter")!, 10)
        : undefined,
      createdBefore: searchParams.get("createdBefore")
        ? parseInt(searchParams.get("createdBefore")!, 10)
        : undefined,
    };

    if (entityType === "HumanityCertificate") {
      const result = await queryHumanityCertificates({
        ...filters,
        parentInsightId:
          searchParams.get("parentInsightId") || undefined,
      });
      return Response.json({
        success: true,
        entities: result.entities,
        hasNextPage: result.hasNextPage,
      });
    }

    const result = await queryVoiceInsights(filters);
    return Response.json({
      success: true,
      entities: result.entities,
      hasNextPage: result.hasNextPage,
    });
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
