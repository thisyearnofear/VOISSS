import { NextRequest, NextResponse } from "next/server";
import { getMissionService } from "@voisss/shared/server";
import { AgentTheme } from "@voisss/shared";

const missionService = getMissionService();

/**
 * GET /api/agents/themes
 * 
 * List available themes (missions) for agent voice submissions.
 * Transforms internal Mission format to simplified AgentTheme for external consumption.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const difficulty = searchParams.get('difficulty');
    const language = searchParams.get('language');
    const topic = searchParams.get('topic');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const allMissions = await missionService.getActiveMissions();
    
    // Filter missions based on query params
    let filtered = allMissions.filter(m => m.isActive);
    
    if (difficulty) {
      filtered = filtered.filter(m => m.difficulty === difficulty);
    }
    if (language) {
      filtered = filtered.filter(m => m.language === language);
    }
    if (topic) {
      filtered = filtered.filter(m => 
        m.topic?.toLowerCase().includes(topic.toLowerCase()) ||
        m.tags?.some(t => t.toLowerCase().includes(topic.toLowerCase()))
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    // Transform to AgentTheme format
    const themes: AgentTheme[] = paginated.map(mission => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: {
        themes,
        total,
        hasMore: offset + limit < total,
        limit,
        offset,
      },
    });

  } catch (error) {
    console.error("Themes API error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch themes",
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
