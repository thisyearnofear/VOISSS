import { NextRequest, NextResponse } from "next/server";
import { getMissionService } from "@voisss/shared/server";
import { getTokenAccessService } from "@voisss/shared/services/token";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  API_ERROR_CODES,
  type ApiResponse,
} from "@voisss/shared/types/api.types";
import { QualityCriteria } from "@voisss/shared/types/socialfi";

const missionService = getMissionService();
const tokenAccessService = getTokenAccessService();

// Base reward by difficulty
const REWARD_BY_DIFFICULTY = {
  easy: 10,
  medium: 25,
  hard: 50,
};

/**
 * POST /api/missions/create
 *
 * Creates a new mission with simplified form fields.
 * Automatically calculates baseReward from difficulty.
 *
 * Validates:
 * - User address format and auth
 * - Dual-token requirements ($papajams + $voisss)
 * - Required fields (title, description, difficulty, duration)
 * - Duration and expiration ranges
 */

interface CreateMissionRequest {
  // Core fields
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  targetDuration: number;
  expirationDays: number;
  locationBased?: boolean;

  // Advanced fields (optional)
  language?: string;
  rewardModel?: "pool" | "flat_rate" | "performance";
  budgetAllocation?: number;
  creatorStake?: number;
  qualityCriteria?: QualityCriteria;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  const startTime = Date.now();

  try {
    // Extract address from Bearer token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        createErrorResponse(
          API_ERROR_CODES.UNAUTHORIZED,
          "Authorization header required"
        ),
        { status: 401 }
      );
    }

    const userAddress = authHeader.substring(7);
    if (!userAddress?.startsWith("0x") || userAddress.length !== 42) {
      return NextResponse.json(
        createErrorResponse(
          API_ERROR_CODES.INVALID_TOKEN,
          "Invalid wallet address format"
        ),
        { status: 401 }
      );
    }

    // Validate creator eligibility using consolidated service
    let eligibilityResult;
    try {
      eligibilityResult = await tokenAccessService.validateCreatorEligibility(userAddress);
    } catch (error) {
      console.error("[missions-create] Failed to validate eligibility:", error);
      return NextResponse.json(
        createErrorResponse(
          API_ERROR_CODES.SERVICE_UNAVAILABLE,
          "Unable to verify token requirements",
          { details: "Please ensure you have tokens on Base chain and try again" }
        ),
        { status: 503 }
      );
    }

    if (!eligibilityResult.eligible) {
      return NextResponse.json(
        createErrorResponse(
          API_ERROR_CODES.INSUFFICIENT_BALANCE,
          eligibilityResult.reason || "Insufficient token balance",
          {
            requiredBalance: eligibilityResult.requiredBalance?.toString(),
            currentBalance: eligibilityResult.currentBalance?.toString(),
            recommendations: eligibilityResult.recommendations,
          }
        ),
        { status: 403 }
      );
    }

    // Parse and validate request
    let body: CreateMissionRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        createErrorResponse(
          API_ERROR_CODES.INVALID_FORMAT,
          "Invalid JSON in request body"
        ),
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        createValidationErrorResponse("title", "Title is required"),
        { status: 400 }
      );
    }

    if (!body.description?.trim()) {
      return NextResponse.json(
        createValidationErrorResponse("description", "Description is required"),
        { status: 400 }
      );
    }

    if (!body.difficulty) {
      return NextResponse.json(
        createValidationErrorResponse("difficulty", "Difficulty is required"),
        { status: 400 }
      );
    }

    if (!body.targetDuration) {
      return NextResponse.json(
        createValidationErrorResponse("targetDuration", "Target duration is required"),
        { status: 400 }
      );
    }

    // Validate difficulty
    if (!["easy", "medium", "hard"].includes(body.difficulty)) {
      return NextResponse.json(
        createValidationErrorResponse(
          "difficulty",
          "Invalid difficulty. Must be: easy, medium, or hard"
        ),
        { status: 400 }
      );
    }

    // Validate duration range
    if (body.targetDuration < 30 || body.targetDuration > 600) {
      return NextResponse.json(
        createValidationErrorResponse(
          "targetDuration",
          "Target duration must be between 30 and 600 seconds"
        ),
        { status: 400 }
      );
    }

    // Validate expiration
    const expirationDays = body.expirationDays || 14;
    if (expirationDays < 1 || expirationDays > 90) {
      return NextResponse.json(
        createValidationErrorResponse(
          "expirationDays",
          "Expiration must be between 1 and 90 days"
        ),
        { status: 400 }
      );
    }

    // Calculate base reward from difficulty
    const baseReward = String(REWARD_BY_DIFFICULTY[body.difficulty]);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Create mission via service
    const mission = await missionService.createMission({
      title: body.title.trim(),
      description: body.description.trim(),
      difficulty: body.difficulty,
      baseReward,
      rewardModel: body.rewardModel || "pool",
      targetDuration: body.targetDuration,
      locationBased: body.locationBased || false,
      language: body.language || "en",
      qualityCriteria: body.qualityCriteria,
      budgetAllocation: body.budgetAllocation !== undefined ? String(body.budgetAllocation) : undefined,
      creatorStake: body.creatorStake !== undefined ? String(body.creatorStake) : undefined,
      isActive: true, // Auto-publish for now
      createdBy: userAddress,
      expiresAt,
      autoExpire: true,
    });

    const processingTime = Date.now() - startTime;

    return NextResponse.json(
      createSuccessResponse(
        { mission },
        { processingTime }
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error("Mission creation error:", error);
    const message = error instanceof Error ? error.message : "Failed to create mission";

    return NextResponse.json(
      createErrorResponse(
        API_ERROR_CODES.INTERNAL_ERROR,
        message
      ),
      { status: 500 }
    );
  }
}