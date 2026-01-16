import { NextRequest, NextResponse } from "next/server";
import { getMissionService } from "@voisss/shared/server";

// Initialize mission service (uses Postgres if configured, otherwise Memory)
const missionService = getMissionService();

export const dynamic = "force-dynamic"; // Disable static caching for this route

/**
 * GET /api/missions
 *
 * Fetch all active missions.
 * Used by the frontend to display the mission board.
 */
export async function GET() {
  try {
    // Fetch active missions from the server-side service
    // This ensures we get data from the persistent store (Postgres)
    const missions = await missionService.getActiveMissions();

    return NextResponse.json(missions, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching missions:", error);
    return NextResponse.json(
      { error: "Failed to fetch missions" },
      { status: 500 }
    );
  }
}
