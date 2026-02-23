import { NextResponse } from 'next/server';
import { getX402Client } from '@voisss/shared';
import { checkX402Config } from '@/lib/x402-startup-check';

/**
 * GET /api/x402/health
 * 
 * Health check endpoint for x402 configuration
 * Returns configuration status without exposing sensitive data
 */
export async function GET() {
  try {
    const x402Client = getX402Client();
    const status = checkX402Config();
    
    return NextResponse.json({
      status: status.valid ? 'healthy' : 'misconfigured',
      timestamp: new Date().toISOString(),
      config: {
        ...status.config,
        usdcAddress: x402Client.usdcAddress,
        network: x402Client.networkId,
      },
      issues: status.issues.length > 0 ? status.issues : undefined,
      warnings: status.warnings.length > 0 ? status.warnings : undefined,
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
