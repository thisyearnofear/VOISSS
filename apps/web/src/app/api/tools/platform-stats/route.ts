import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

/**
 * Platform Stats Tool - For ElevenLabs Agent
 * 
 * Returns real-time VOISSS platform statistics from:
 * - PostgreSQL: export jobs (transformations)
 * - Base blockchain: voice records (total recordings, users)
 */

// Initialize database connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable not set');
    }
    pool = new Pool({ connectionString: databaseUrl });
  }
  return pool;
}

export async function GET(request: NextRequest) {
  try {
    // Platform stats are public data - no authentication needed
    // These endpoints are read-only and return public statistics

    // Fetch real-time statistics
    const [
      transformationStats,
      blockchainStats,
      this_week_stats
    ] = await Promise.all([
      fetchTransformationStats(),
      fetchBlockchainStats(),
      fetchThisWeekStats(),
    ]);

    const platformStats = {
      total_transformations: transformationStats.completed_jobs,
      total_users: blockchainStats.unique_users,
      total_onchain_recordings: blockchainStats.total_recordings,
      storage_used_mb: blockchainStats.estimated_storage_mb,
      recordings_this_week: this_week_stats.weekly_transformations,
      languages_supported: 29, // ElevenLabs supports 29 languages
      average_transformation_time_seconds: transformationStats.avg_duration_ms ? Math.round(transformationStats.avg_duration_ms / 1000) : 0,
      wallet_connections: blockchainStats.wallet_connections,
    };

    return NextResponse.json(platformStats, {
      headers: {
        'Cache-Control': 'public, s-maxage=30', // Cache for 30 seconds for fresh data
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

/**
 * Fetch transformation statistics from PostgreSQL
 */
async function fetchTransformationStats() {
  const client = await getPool().connect();
  try {
    const result = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
        AVG(duration_ms) FILTER (WHERE status = 'completed' AND duration_ms IS NOT NULL) as avg_duration_ms
      FROM export_jobs
    `);

    const row = result.rows[0];
    return {
      completed_jobs: parseInt(row.completed_jobs || '0'),
      avg_duration_ms: parseFloat(row.avg_duration_ms || '0'),
    };
  } catch (err) {
    console.error('Error fetching transformation stats:', err);
    return { completed_jobs: 0, avg_duration_ms: 0 };
  } finally {
    client.release();
  }
}

/**
 * Fetch blockchain statistics from the blockchain-stats endpoint
 */
async function fetchBlockchainStats() {
  try {
    // Call our own blockchain-stats endpoint (public endpoint, no auth needed)
    const response = await fetch(
      `${process.env.NODE_ENV === 'production' ? 'https://voisss.netlify.app' : 'http://localhost:3000'}/api/tools/blockchain-stats`,
      {
        method: 'GET',
      }
    ).catch(() => null);

    if (response?.ok) {
      const stats = await response.json();
      return {
        total_recordings: stats.total_recordings || 0,
        unique_users: stats.unique_users || 0,
        wallet_connections: stats.wallet_connections || 0,
        estimated_storage_mb: stats.estimated_storage_mb || 0,
      };
    }

    // Fallback if blockchain stats unavailable
    return {
      total_recordings: 0,
      unique_users: 0,
      wallet_connections: 0,
      estimated_storage_mb: 0,
    };
  } catch (err) {
    console.error('Error fetching blockchain stats:', err);
    return {
      total_recordings: 0,
      unique_users: 0,
      wallet_connections: 0,
      estimated_storage_mb: 0,
    };
  }
}

/**
 * Fetch this week's transformation statistics
 */
async function fetchThisWeekStats() {
  const client = await getPool().connect();
  try {
    const result = await client.query(`
      SELECT COUNT(*) as weekly_count
      FROM export_jobs
      WHERE status = 'completed' 
      AND completed_at >= NOW() - INTERVAL '7 days'
    `);

    const row = result.rows[0];
    return { weekly_transformations: parseInt(row.weekly_count || '0') };
  } catch (err) {
    console.error('Error fetching weekly stats:', err);
    return { weekly_transformations: 0 };
  } finally {
    client.release();
  }
}

// Health check
export async function HEAD() {
  return NextResponse.json({}, { status: 200 });
}
