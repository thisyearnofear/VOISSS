import { NextRequest, NextResponse } from "next/server";
import { getMissionService } from "@voisss/shared/server";

// Initialize mission service
const missionService = getMissionService();

/**
 * POST /api/missions/accept
 *
 * Accept a mission for the authenticated user.
 *
 * Request body:
 * {
 *   missionId: string
 * }
 *
 * Headers:
 * Authorization: Bearer <wallet_address>
 */
export async function POST(request: NextRequest) {
  try {
    // Extract address from Bearer token for verification
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authHeader.substring(7);
    if (!userId?.startsWith("0x") || userId.length !== 42) {
      return NextResponse.json(
        { error: "Invalid wallet address in authorization header" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { missionId } = body;

    if (!missionId) {
      return NextResponse.json(
        { error: "Mission ID is required" },
        { status: 400 }
      );
    }

    // Call service to accept mission
    const result = await missionService.acceptMission(missionId, userId);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error accepting mission:", error);
    const message =
      error instanceof Error ? error.message : "Failed to accept mission";

    // Check for specific error types if needed (e.g. already accepted)
    if (message.includes("already accepted")) {
        return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
