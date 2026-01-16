import { NextRequest, NextResponse } from 'next/server';
import { createMissionServiceWithMemoryDatabase } from '@voisss/shared/server';
import { MissionResponse } from '@voisss/shared/types/socialfi';

const missionService = createMissionServiceWithMemoryDatabase();

/**
 * GET /api/admin/submissions
 * 
 * List all submissions with optional filters
 * 
 * Query params:
 * - status: 'approved' | 'flagged' | 'removed'
 * - missionId: string (filter by mission)
 * - userId: string (filter by user wallet)
 * - after: ISO date string (submissions after this date)
 * 
 * Returns:
 * {
 *   submissions: MissionResponse[],
 *   total: number,
 *   filters: { status?, missionId?, userId?, after? }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Build filters
    const filters: Parameters<typeof missionService.getAllSubmissions>[0] = {};

    if (searchParams.has('status')) {
      const status = searchParams.get('status') as MissionResponse['status'];
      if (['approved', 'flagged', 'removed'].includes(status)) {
        filters.status = status;
      }
    }

    if (searchParams.has('missionId')) {
      filters.missionId = searchParams.get('missionId') || undefined;
    }

    if (searchParams.has('userId')) {
      filters.userId = searchParams.get('userId') || undefined;
    }

    if (searchParams.has('after')) {
      const afterStr = searchParams.get('after');
      if (afterStr) {
        filters.after = new Date(afterStr);
      }
    }

    const submissions = await missionService.getAllSubmissions(filters);

    return NextResponse.json(
      {
        submissions,
        total: submissions.length,
        filters,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching submissions:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch submissions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/submissions/{submissionId}/flag
 * POST /api/admin/submissions/{submissionId}/remove
 *
 * Action endpoints (see POST handler below)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, submissionId, reason } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submissionId' },
        { status: 400 }
      );
    }

    let updated: MissionResponse;

    switch (action) {
      case 'flag': {
        if (!reason) {
          return NextResponse.json(
            { error: 'Missing reason for flag' },
            { status: 400 }
          );
        }
        updated = await missionService.flagSubmission(submissionId, reason);
        break;
      }

      case 'remove': {
        if (!reason) {
          return NextResponse.json(
            { error: 'Missing reason for removal' },
            { status: 400 }
          );
        }
        updated = await missionService.removeSubmission(submissionId, reason);
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Expected: flag, remove` },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { success: true, submission: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin action error:', error);
    const message = error instanceof Error ? error.message : 'Failed to perform action';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
