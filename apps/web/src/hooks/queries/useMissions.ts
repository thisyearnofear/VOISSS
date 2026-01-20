import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBaseAccount } from "../useBaseAccount";
import { Mission, MissionResponse } from "@voisss/shared/types/socialfi";
import { ApiResponse, isSuccessResponse, isErrorResponse } from "@voisss/shared/types/api.types";
import { queryKeys, handleQueryError } from "../../lib/query-client";

// Mission filters interface - CLEAN separation of concerns
interface MissionFilters {
  difficulty?: string;
  topic?: string;
  language?: string;
  rewardModel?: string;
  sortBy?: "newest" | "reward" | "participants";
  status?: "active" | "completed" | "expired";
}

// Enhanced mission response type - single source of truth
interface MissionsResponse {
  missions: Mission[];
  aggregations: {
    totalRewards: number;
    averageReward: number;
    difficultyDistribution: Record<string, number>;
    topicDistribution: Record<string, number>;
  };
}

// User missions response type
interface UserMissionsResponse {
  active: Mission[];
  completed: MissionResponse[];
}

// Mission submission data interface
interface MissionSubmissionData {
  missionId: string;
  recordingId: string;
  recordingIpfsHash?: string;
  location: {
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  context: string;
  participantConsent: boolean;
  consentProof?: string;
  isAnonymized: boolean;
  voiceObfuscated: boolean;
}

// Hook to fetch all missions with server-side filtering - PERFORMANT with caching
export function useMissions(filters: MissionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.missions.list(filters),
    queryFn: async (): Promise<Mission[]> => {
      try {
        // Build query parameters - CLEAN parameter construction
        const params = new URLSearchParams();

        if (filters.difficulty && filters.difficulty !== "all") {
          params.append("difficulty", filters.difficulty);
        }

        if (filters.topic && filters.topic !== "all") {
          params.append("topic", filters.topic);
        }

        if (filters.language && filters.language !== "all") {
          params.append("language", filters.language);
        }

        if (filters.status) {
          params.append("status", filters.status);
        }

        if (filters.sortBy) {
          params.append("sortBy", filters.sortBy);
        }

        // Use Next.js API routes directly - ENHANCEMENT FIRST
        const url = `/api/missions${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const apiResponse: ApiResponse<MissionsResponse> = await response.json();

        if (isErrorResponse(apiResponse)) {
          throw new Error(apiResponse.error.message);
        }

        if (!isSuccessResponse(apiResponse)) {
          throw new Error("Invalid API response format");
        }

        // Return missions with properly parsed dates - CLEAN data transformation
        return apiResponse.data.missions.map(mission => ({
          ...mission,
          expiresAt: new Date(mission.expiresAt),
          createdAt: new Date(mission.createdAt),
          updatedAt: new Date(mission.updatedAt),
        }));
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - PERFORMANT caching
    gcTime: 10 * 60 * 1000, // 10 minutes (replaces deprecated cacheTime)
    refetchOnWindowFocus: false, // PERFORMANT - prevent unnecessary refetches
    retry: (failureCount, error) => {
      // Smart retry logic - don't retry on 4xx errors
      if (error instanceof Error && error.message.includes('HTTP 4')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Hook to fetch a single mission by ID - MODULAR design
export function useMission(id: string) {
  return useQuery({
    queryKey: queryKeys.missions.detail(id),
    queryFn: async (): Promise<Mission> => {
      try {
        const response = await fetch(`/api/missions/${id}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const apiResponse: ApiResponse<Mission> = await response.json();

        if (isErrorResponse(apiResponse)) {
          throw new Error(apiResponse.error.message);
        }

        if (!isSuccessResponse(apiResponse)) {
          throw new Error("Invalid API response format");
        }

        const mission = apiResponse.data;
        return {
          ...mission,
          expiresAt: new Date(mission.expiresAt),
          createdAt: new Date(mission.createdAt),
          updatedAt: new Date(mission.updatedAt),
        };
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!id, // Only run when ID is provided
  });
}

// Hook to fetch user's missions - CLEAN separation of user-specific data
export function useUserMissions() {
  const { universalAddress: address } = useBaseAccount();

  return useQuery({
    queryKey: queryKeys.missions.userMissions(address || ""),
    queryFn: async (): Promise<UserMissionsResponse> => {
      if (!address) throw new Error("No address available");

      try {
        const response = await fetch(`/api/user/missions`, {
          headers: {
            Authorization: `Bearer ${address}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const apiResponse: ApiResponse<UserMissionsResponse> = await response.json();

        if (isErrorResponse(apiResponse)) {
          throw new Error(apiResponse.error.message);
        }

        if (!isSuccessResponse(apiResponse)) {
          throw new Error("Invalid API response format");
        }

        // Transform dates properly - CLEAN data transformation
        return {
          active: apiResponse.data.active.map(mission => ({
            ...mission,
            expiresAt: new Date(mission.expiresAt),
            createdAt: new Date(mission.createdAt),
            updatedAt: new Date(mission.updatedAt),
          })),
          completed: apiResponse.data.completed.map(response => ({
            ...response,
            submittedAt: new Date(response.submittedAt),
          })),
        };
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute - more frequent updates for user data
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!address, // Only run when address is available
  });
}

// Hook to accept a mission - MODULAR mutation with optimistic updates
export function useAcceptMission() {
  const queryClient = useQueryClient();
  const { universalAddress: address } = useBaseAccount();

  return useMutation({
    mutationFn: async (missionId: string) => {
      if (!address) throw new Error("Wallet not connected");

      const response = await fetch("/api/missions/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${address}`,
        },
        body: JSON.stringify({ missionId }),
      });

      if (!response.ok) {
        const apiResponse: ApiResponse = await response.json();
        if (isErrorResponse(apiResponse)) {
          throw new Error(apiResponse.error.message);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const apiResponse: ApiResponse<{ success: boolean }> = await response.json();

      if (isErrorResponse(apiResponse)) {
        throw new Error(apiResponse.error.message);
      }

      return apiResponse.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries - PERFORMANT cache management
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.userMissions(address || "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.lists() });
    },
  });
}

// Hook to complete a mission (submit response) - CLEAN business logic separation
export function useCompleteMission() {
  const queryClient = useQueryClient();
  const { universalAddress: address } = useBaseAccount();

  return useMutation({
    mutationFn: async (submissionData: MissionSubmissionData) => {
      if (!address) throw new Error("Wallet not connected");

      // Simple validation - CLEAN separation of concerns
      if (!submissionData.participantConsent) {
        throw new Error("Participant consent is required");
      }

      const response = await fetch("/api/missions/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${address}`,
        },
        body: JSON.stringify({
          ...submissionData,
          userId: address,
        }),
      });

      if (!response.ok) {
        const apiResponse: ApiResponse = await response.json();
        if (isErrorResponse(apiResponse)) {
          throw new Error(apiResponse.error.message);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const apiResponse: ApiResponse<{ submission: MissionResponse }> = await response.json();

      if (isErrorResponse(apiResponse)) {
        throw new Error(apiResponse.error.message);
      }

      return apiResponse.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries - PERFORMANT cache management
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.userMissions(address || "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.lists() });
    },
  });
}

// Hook to get mission statistics - MODULAR analytics
export function useMissionStats(missionId: string) {
  return useQuery({
    queryKey: queryKeys.missions.stats(missionId),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/missions/${missionId}/stats`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const apiResponse: ApiResponse<{
          totalResponses: number;
          averageQuality: number;
          geographicDistribution: Record<string, number>;
          completionRate: number;
        }> = await response.json();

        if (isErrorResponse(apiResponse)) {
          throw new Error(apiResponse.error.message);
        }

        return apiResponse.data;
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - stats don't change frequently
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!missionId, // Only run when mission ID is provided
  });
}