import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceListings } from '@/lib/marketplace-indexer';

/**
 * GET /api/marketplace/voices/[voiceId]
 *
 * Fetch a single voice by its listing ID.
 * Used by the SSR detail page to hydrate with full data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ voiceId: string }> }
): Promise<NextResponse> {
  try {
    const { voiceId } = await params;

    const allVoices = await getMarketplaceListings({});
    const voice = allVoices.find(
      (v) => v.id === voiceId || v.contractVoiceId === voiceId
    ) as typeof allVoices[number] | undefined;

    if (!voice) {
      return NextResponse.json(
        { success: false, error: 'Voice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { voice },
    });
  } catch (error) {
    console.error('Voice detail API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch voice details' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
