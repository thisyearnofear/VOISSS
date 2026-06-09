import { NextRequest, NextResponse } from 'next/server';
import { getAcpListener } from '@voisss/shared';

/**
 * ACP Listener Control API
 *
 * POST /api/acp/listener/start - Start listening for jobs
 * POST /api/acp/listener/stop - Stop listening
 * GET /api/acp/listener/status - Get listener status
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - ADMIN_API_KEY required' },
        { status: 401 }
      );
    }

    const listener = getAcpListener();

    switch (action) {
      case 'start':
        await listener.start();
        return NextResponse.json({
          success: true,
          message: 'ACP Listener started',
          status: listener.getStatus(),
        });

      case 'stop':
        await listener.stop();
        return NextResponse.json({
          success: true,
          message: 'ACP Listener stopped',
          status: listener.getStatus(),
        });

      case 'restart':
        await listener.stop();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await listener.start();
        return NextResponse.json({
          success: true,
          message: 'ACP Listener restarted',
          status: listener.getStatus(),
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: start, stop, or restart' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('ACP Listener control error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const listener = getAcpListener();
    const status = listener.getStatus();

    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('ACP Listener status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
