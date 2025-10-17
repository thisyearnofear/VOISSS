import { NextResponse } from 'next/server';

/**
 * Logout user by clearing session cookie
 * POST /api/auth/logout
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear session cookie
  response.cookies.delete('voisss_session');
  
  return response;
}
