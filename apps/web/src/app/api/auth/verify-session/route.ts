import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

/**
 * Verify existing session cookie
 * GET /api/auth/verify-session
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    
    return NextResponse.json({
      authenticated: true,
      address: user.address,
      subAccount: user.subAccount,
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
    });
  }
}