/**
 * Minimal stateless auth following Core Principles
 * - No database, no sessions
 * - Single source of truth for auth logic
 * - Clean, modular, reusable
 */

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const AUTH_SECRET = process.env.AUTH_JWT_SECRET || 'dev-secret-change-in-prod';
const NONCE_SECRET = process.env.AUTH_NONCE_SECRET || 'nonce-secret-change-in-prod';

// JWT payload for authenticated user
export interface AuthUser {
  address: string;           // Universal Base Account address
  subAccount?: string;       // Sub account address (optional)
  iat: number;              // Issued at
  exp: number;              // Expires at
}

// Generate a sealed nonce (stateless, no DB needed)
export function generateNonce(): string {
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const sealed = jwt.sign(
    { nonce, exp: Math.floor(Date.now() / 1000) + 300 }, // 5 min expiry
    NONCE_SECRET
  );
  return sealed;
}

// Verify sealed nonce
export function verifyNonce(sealedNonce: string): string {
  try {
    const payload = jwt.verify(sealedNonce, NONCE_SECRET) as { nonce: string; exp: number };
    return payload.nonce;
  } catch {
    throw new Error('Invalid or expired nonce');
  }
}

// Build the message to sign (EIP-191)
export function buildSignInMessage(params: {
  address: string;
  nonce: string;
  chainId: number;
  domain: string;
}): string {
  const issuedAt = new Date().toISOString();
  return `VOISSS Sign In

I am signing in to VOISSS

Address: ${params.address}
Domain: ${params.domain}
Chain ID: ${params.chainId}
Nonce: ${params.nonce}
Issued At: ${issuedAt}`;
}

// Verify signature and create session JWT
export async function verifySignatureAndCreateSession(params: {
  address: string;
  subAccount?: string;
  message: string;
  signature: string;
  nonce: string;
}): Promise<string> {
  // 1. Verify message contains nonce
  if (!params.message.includes(params.nonce)) {
    throw new Error('Message does not contain nonce');
  }

  // 2. Verify signature using viem public client (supports Smart Accounts + EOA)
  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  const isValid = await publicClient.verifyMessage({
    address: params.address as `0x${string}`,
    message: params.message,
    signature: params.signature as `0x${string}`,
  });

  if (!isValid) {
    throw new Error('Signature verification failed');
  }

  // 3. Create session JWT (1 hour expiry)
  const now = Math.floor(Date.now() / 1000);
  const sessionJwt = jwt.sign(
    {
      address: params.address,
      subAccount: params.subAccount,
      iat: now,
      exp: now + 3600, // 1 hour
    } as AuthUser,
    AUTH_SECRET
  );

  return sessionJwt;
}

// Verify session JWT and return user
export function verifySession(token: string): AuthUser {
  try {
    return jwt.verify(token, AUTH_SECRET) as AuthUser;
  } catch {
    throw new Error('Invalid or expired session');
  }
}

// Middleware helper for Next.js API routes
export function requireAuth(request: NextRequest): AuthUser {
  // Check cookie first (web)
  const cookieToken = request.cookies.get('voisss_session')?.value;
  
  // Check Authorization header (mobile/other clients)
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : null;

  const token = cookieToken || bearerToken;
  
  if (!token) {
    throw new Error('No authentication token');
  }

  return verifySession(token);
}

// Express middleware for Hetzner backend
export function expressAuthMiddleware() {
  return (req: any, res: any, next: any) => {
    const authHeader = req.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing authentication token' });
    }

    try {
      req.user = verifySession(token);
      next();
    } catch (error) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
