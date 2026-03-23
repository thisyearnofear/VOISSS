import { NextRequest, NextResponse } from "next/server";
import { getMarketplaceListings } from "@/lib/marketplace-indexer";

/**
 * GET /api/marketplace/voices
 *
 * Browse available voice listings.
 * Query params: language, tone, minPrice, maxPrice, licenseType, contributor
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);

    const language = searchParams.get("language");
    const tone = searchParams.get("tone");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const contributor = searchParams.get("contributor");
    const licenseType = searchParams.get("licenseType") as
      | "exclusive"
      | "non-exclusive"
      | null;

    const voices = await getMarketplaceListings({
      language,
      tone,
      minPrice,
      maxPrice,
      contributor,
      licenseType,
    });

    return NextResponse.json({
      success: true,
      data: {
        voices,
        total: voices.length,
      },
    });
  } catch (error) {
    console.error("Marketplace browse error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch voice listings",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
