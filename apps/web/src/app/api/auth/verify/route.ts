import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAndCreateSession } from '@/lib/auth';

/**
 * Verify wallet signature and create session
 * POST /api/auth/verify
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, subAccount, message, signature, nonce } = body;

    // Validate required fields
    if (!address || !message || !signature || !nonce) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify signature and create session
    const sessionToken = await verifySignatureAndCreateSession({
      address,
      subAccount,
      message,
      signature,
      nonce,
    });

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      address,
      subAccount,
      expiresIn: 3600,
    });

    // Set HttpOnly cookie for web clients
    response.cookies.set('voisss_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600, // 1 hour
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Authentication failed:', error);
    return NextResponse.json(
      { 
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 401 }
    );
  }
}
