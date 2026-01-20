import { NextRequest, NextResponse } from 'next/server';

/**
 * Platform Stats Tool - For ElevenLabs Agent
 * 
 * Returns current VOISSS platform statistics.
 * Used by the voice assistant to provide real-time platform metrics.
 */

export async function GET(request: NextRequest) {
  try {
    // Validate authorization header
    const authHeader = request.headers.get('Authorization');
    const expectedToken = process.env.ELEVENLABS_TOOL_SECRET_KEY;

    if (!expectedToken) {
      console.warn('ELEVENLABS_TOOL_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Tool not configured' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.warn('Unauthorized tool access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // TODO: Replace with actual data fetching from your database/contracts
    // For now, return mock data with realistic statistics
    const platformStats = {
      total_transformations: 1250,
      total_users: 450,
      storage_used_mb: 5240,
      recordings_this_week: 180,
      languages_supported: 29,
      average_transformation_time_seconds: 12,
      platform_uptime_percent: 99.8,
      wallet_connections: 287,
    };

    return NextResponse.json(platformStats, {
      headers: {
        'Cache-Control': 'public, s-maxage=60', // Cache for 60 seconds
      },
    });
  } catch (error) {
    console.error('Platform stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform statistics' },
      { status: 500 }
    );
  }
}

// Health check
export async function HEAD() {
  return NextResponse.json({}, { status: 200 });
}
