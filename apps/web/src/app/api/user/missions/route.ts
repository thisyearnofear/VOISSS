import { NextRequest, NextResponse } from "next/server";
import { getMissionService } from "@voisss/shared/server";

// Initialize mission service
const missionService = getMissionService();

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/missions
 *
 * Fetch missions associated with a specific user (accepted, completed, etc.)
 *
 * Query params:
 * - address: string (User wallet address)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Validate address format
    if (!address.startsWith("0x") || address.length !== 42) {
      return NextResponse.json(
        { error: "Invalid Ethereum address format" },
        { status: 400 }
      );
    }

    const userMissions = await missionService.getUserMissions(address);

    return NextResponse.json(userMissions, { status: 200 });
  } catch (error) {
    console.error("Error fetching user missions:", error);
    return NextResponse.json(
      { error: "Failed to fetch user missions" },
      { status: 500 }
    );
  }
}
