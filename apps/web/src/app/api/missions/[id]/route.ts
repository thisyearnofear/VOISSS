import { NextRequest, NextResponse } from "next/server";
import { getMissionService } from "@voisss/shared/server";

// Initialize mission service
const missionService = getMissionService();

export const dynamic = "force-dynamic";

/**
 * GET /api/missions/[id]
 *
 * Fetch a single mission details by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const missionId = params.id;

    if (!missionId) {
      return NextResponse.json(
        { error: "Mission ID is required" },
        { status: 400 }
      );
    }

    const mission = await missionService.getMissionById(missionId);

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    return NextResponse.json(mission, { status: 200 });
  } catch (error) {
    console.error(`Error fetching mission ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch mission details" },
      { status: 500 }
    );
  }
}
