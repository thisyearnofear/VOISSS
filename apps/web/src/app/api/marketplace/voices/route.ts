import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/marketplace/voices
 * 
 * Browse available voice listings
 * Query params: language, tone, minPrice, maxPrice, licenseType
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse filters
    const language = searchParams.get('language');
    const tone = searchParams.get('tone');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const licenseType = searchParams.get('licenseType') as 'exclusive' | 'non-exclusive' | null;
    
    // TODO: Fetch from database/blockchain
    // For MVP, return mock data structure
    const mockListings = [
      {
        id: "voice_001",
        contributorAddress: "0x1234...",
        price: "49000000", // 49 USDC (6 decimals)
        licenseType: "non-exclusive",
        voiceProfile: {
          tone: "professional",
          pitch: "medium",
          language: "en-US",
          accent: "neutral",
          tags: ["corporate", "friendly", "clear"]
        },
        metadata: {
          duration: 30,
          sampleRate: 44100,
          ipfsHash: "Qm...",
          createdAt: Date.now() - 86400000,
        },
        stats: {
          views: 150,
          purchases: 5,
          usageCount: 1250
        },
        status: "approved",
        sampleUrl: "https://ipfs.io/ipfs/Qm..." // Preview audio
      }
    ];
    
    // Apply filters
    let filtered = mockListings;
    
    if (language) {
      filtered = filtered.filter(v => v.voiceProfile.language === language);
    }
    
    if (tone) {
      filtered = filtered.filter(v => v.voiceProfile.tone === tone);
    }
    
    if (licenseType) {
      filtered = filtered.filter(v => v.licenseType === licenseType);
    }
    
    if (minPrice) {
      const min = parseInt(minPrice);
      filtered = filtered.filter(v => parseInt(v.price) >= min);
    }
    
    if (maxPrice) {
      const max = parseInt(maxPrice);
      filtered = filtered.filter(v => parseInt(v.price) <= max);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        voices: filtered,
        total: filtered.length,
        filters: {
          language,
          tone,
          minPrice,
          maxPrice,
          licenseType
        }
      }
    });
    
  } catch (error) {
    console.error("Marketplace browse error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch voice listings"
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
