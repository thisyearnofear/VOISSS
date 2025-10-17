import { NextResponse } from 'next/server';
import { generateNonce } from '@/lib/auth';

/**
 * Generate a nonce for wallet signing
 * POST /api/auth/nonce
 */
export async function POST() {
  try {
    // Generate simple nonce (not sealed since Base Account handles auth)
    const nonce = crypto.randomUUID().replace(/-/g, '');

    return NextResponse.json({ nonce });
  } catch (error) {
    console.error('Nonce generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}
