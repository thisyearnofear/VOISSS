import { NextRequest, NextResponse } from "next/server";
import { getMissionService } from "@voisss/shared/server";
import { AgentTheme } from "@voisss/shared";

const missionService = getMissionService();

interface RouteParams {
  params: Promise<{ themeId: string }>;
}

/**
 * GET /api/agents/themes/[themeId]
 * 
 * Get details for a specific theme/mission.
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { themeId } = await params;

    if (!themeId) {
      return NextResponse.json({
        success: false,
        error: "Theme ID is required",
      }, { status: 400 });
    }

    const mission = await missionService.getMissionById(themeId);

    if (!mission) {
      return NextResponse.json({
        success: false,
        error: "Theme not found",
      }, { status: 404 });
    }

    const theme: AgentTheme = {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      difficulty: mission.difficulty,
      targetDuration: mission.targetDuration,
      language: mission.language,
      topic: mission.topic,
      tags: mission.tags,
      examples: mission.examples,
      contextSuggestions: mission.contextSuggestions,
      baseReward: mission.baseReward,
      expiresAt: mission.expiresAt instanceof Date 
        ? mission.expiresAt.toISOString() 
        : new Date(mission.expiresAt).toISOString(),
      isActive: mission.isActive,
      currentParticipants: mission.currentParticipants,
      maxParticipants: mission.maxParticipants,
    };

    return NextResponse.json({
      success: true,
      data: theme,
    });

  } catch (error) {
    console.error("Theme detail API error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch theme",
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
