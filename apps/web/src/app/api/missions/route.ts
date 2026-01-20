import { NextRequest, NextResponse } from "next/server";
import { getMissionService } from "@voisss/shared/server";
import {
  createSuccessResponse,
  createErrorResponse,
  API_ERROR_CODES,
  type ApiResponse,
  type MissionQueryParams,
} from "@voisss/shared/types/api.types";
import { Mission } from "@voisss/shared/types/socialfi";

// Initialize mission service (uses Postgres if configured, otherwise Memory)
const missionService = getMissionService();

export const dynamic = "force-dynamic"; // Disable static caching for this route

/**
 * GET /api/missions
 * 
 * Enhanced endpoint with server-side filtering, pagination, and search
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const queryParams: MissionQueryParams = {
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '20', 10), 100), // Max 100 per page
      difficulty: searchParams.getAll('difficulty').filter(Boolean),
      topics: searchParams.getAll('topic').filter(Boolean),
      languages: searchParams.getAll('language').filter(Boolean),
      status: searchParams.getAll('status').filter(Boolean),
      search: searchParams.get('search') || undefined,
      createdBy: searchParams.get('createdBy') || undefined,
      minReward: searchParams.get('minReward') ? parseInt(searchParams.get('minReward')!) : undefined,
      maxReward: searchParams.get('maxReward') ? parseInt(searchParams.get('maxReward')!) : undefined,
      locationBased: searchParams.get('locationBased') ? searchParams.get('locationBased') === 'true' : undefined,
      sortBy: searchParams.get('sortBy') || 'newest',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    // Validate pagination parameters
    if (queryParams.page < 1) {
      return NextResponse.json(
        createErrorResponse(
          API_ERROR_CODES.VALIDATION_FAILED,
          "Page must be greater than 0",
          undefined,
          "page"
        ),
        { status: 400 }
      );
    }

    if (queryParams.limit < 1 || queryParams.limit > 100) {
      return NextResponse.json(
        createErrorResponse(
          API_ERROR_CODES.VALIDATION_FAILED,
          "Limit must be between 1 and 100",
          undefined,
          "limit"
        ),
        { status: 400 }
      );
    }

    // Get missions with filtering (for now, we'll use the existing service and filter client-side)
    // TODO: Implement server-side filtering in the mission service
    const allMissions = await missionService.getActiveMissions();

    // Apply filters
    let filteredMissions = allMissions;

    // Filter by difficulty
    if (queryParams.difficulty && queryParams.difficulty.length > 0) {
      filteredMissions = filteredMissions.filter(mission =>
        queryParams.difficulty!.includes(mission.difficulty)
      );
    }

    // Filter by topics
    if (queryParams.topics && queryParams.topics.length > 0) {
      filteredMissions = filteredMissions.filter(mission =>
        mission.topic && queryParams.topics!.includes(mission.topic)
      );
    }

    // Filter by languages
    if (queryParams.languages && queryParams.languages.length > 0) {
      filteredMissions = filteredMissions.filter(mission =>
        queryParams.languages!.includes(mission.language)
      );
    }

    // Filter by status
    if (queryParams.status && queryParams.status.length > 0) {
      const now = new Date();
      filteredMissions = filteredMissions.filter(mission => {
        const status = mission.isActive && mission.expiresAt > now ? 'active' :
          !mission.isActive ? 'completed' : 'expired';
        return queryParams.status!.includes(status);
      });
    }

    // Filter by creator
    if (queryParams.createdBy) {
      filteredMissions = filteredMissions.filter(mission =>
        mission.createdBy.toLowerCase() === queryParams.createdBy!.toLowerCase()
      );
    }

    // Filter by reward range
    if (queryParams.minReward !== undefined) {
      filteredMissions = filteredMissions.filter(mission =>
        mission.baseReward >= queryParams.minReward!
      );
    }

    if (queryParams.maxReward !== undefined) {
      filteredMissions = filteredMissions.filter(mission =>
        mission.baseReward <= queryParams.maxReward!
      );
    }

    // Filter by location-based
    if (queryParams.locationBased !== undefined) {
      filteredMissions = filteredMissions.filter(mission =>
        mission.locationBased === queryParams.locationBased
      );
    }

    // Search functionality
    if (queryParams.search) {
      const searchTerm = queryParams.search.toLowerCase();
      filteredMissions = filteredMissions.filter(mission =>
        mission.title.toLowerCase().includes(searchTerm) ||
        mission.description.toLowerCase().includes(searchTerm) ||
        (mission.topic && mission.topic.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    filteredMissions.sort((a, b) => {
      let comparison = 0;

      switch (queryParams.sortBy) {
        case 'reward':
          comparison = a.baseReward - b.baseReward;
          break;
        case 'participants':
          comparison = a.currentParticipants - b.currentParticipants;
          break;
        case 'newest':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return queryParams.sortOrder === 'desc' ? -comparison : comparison;
    });

    // Calculate pagination
    const total = filteredMissions.length;
    const totalPages = Math.ceil(total / queryParams.limit);
    const offset = (queryParams.page - 1) * queryParams.limit;
    const paginatedMissions = filteredMissions.slice(offset, offset + queryParams.limit);

    // Calculate aggregations
    const totalRewards = filteredMissions.reduce((sum, mission) => sum + mission.baseReward, 0);
    const averageReward = filteredMissions.length > 0 ? totalRewards / filteredMissions.length : 0;

    const difficultyDistribution = filteredMissions.reduce((acc, mission) => {
      acc[mission.difficulty] = (acc[mission.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topicDistribution = filteredMissions.reduce((acc, mission) => {
      if (mission.topic) {
        acc[mission.topic] = (acc[mission.topic] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      createSuccessResponse(
        {
          missions: paginatedMissions,
          aggregations: {
            totalRewards,
            averageReward: Math.round(averageReward * 100) / 100,
            difficultyDistribution,
            topicDistribution,
          },
        },
        { processingTime },
        {
          page: queryParams.page,
          limit: queryParams.limit,
          total,
          totalPages,
          hasNext: queryParams.page < totalPages,
          hasPrev: queryParams.page > 1,
        }
      ),
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch missions:", error);

    return NextResponse.json(
      createErrorResponse(
        API_ERROR_CODES.INTERNAL_ERROR,
        "Failed to fetch missions"
      ),
      { status: 500 }
    );
  }
}
