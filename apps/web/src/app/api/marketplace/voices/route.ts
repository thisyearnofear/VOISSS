import { NextRequest, NextResponse } from "next/server";
import { getMarketplaceCatalog } from "@/lib/marketplace-indexer";

const VALID_LICENSE_TYPES = ["exclusive", "non-exclusive"] as const;

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
    const rawLicenseType = searchParams.get("licenseType");

    // Validate licenseType if provided
    const licenseType = rawLicenseType
      ? VALID_LICENSE_TYPES.includes(rawLicenseType as typeof VALID_LICENSE_TYPES[number])
        ? (rawLicenseType as typeof VALID_LICENSE_TYPES[number])
        : null
      : null;

    if (rawLicenseType && !licenseType) {
      return NextResponse.json({
        success: false,
        error: `Invalid licenseType. Must be one of: ${VALID_LICENSE_TYPES.join(', ')}`
      }, { status: 400 });
    }

    // Merged catalog: on-chain licensed listings + platform (ElevenLabs)
    // voices. Origin is passed so the catalog fetch can use the same-origin
    // /api/voices proxy where one is configured.
    const voices = await getMarketplaceCatalog(
      {
        language,
        tone,
        minPrice,
        maxPrice,
        contributor,
        licenseType,
      },
      new URL(req.url).origin
    );

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
