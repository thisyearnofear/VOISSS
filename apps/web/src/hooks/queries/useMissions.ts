import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBaseAccount } from "../useBaseAccount";
import { createModerationService } from "@voisss/shared";
import { Mission, MissionResponse } from "@voisss/shared/types/socialfi";
import { queryKeys, handleQueryError } from "../../lib/query-client";

// Create service instances
const moderationService = createModerationService();

// Mission filters interface
interface MissionFilters {
  difficulty?: string;
  topic?: string;
  language?: string;
  rewardModel?: string;
  sortBy?: "newest" | "reward" | "participants";
  status?: "active" | "completed" | "expired";
}

// Hook to fetch all missions with filtering
export function useMissions(filters: MissionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.missions.list(filters),
    queryFn: async () => {
      try {
        const response = await fetch("/api/missions");
        if (!response.ok) {
          throw new Error("Failed to fetch missions");
        }
        const data = await response.json();
        // Revive dates for client-side filtering
        const missions = data.map(
          (
            m: Omit<Mission, "expiresAt" | "createdAt"> & {
              expiresAt: string;
              createdAt: string;
            }
          ) => ({
            ...m,
            expiresAt: new Date(m.expiresAt),
            createdAt: new Date(m.createdAt),
          })
        );

        // Apply filters
        let filteredMissions = missions;

        if (filters.difficulty && filters.difficulty !== "all") {
          filteredMissions = filteredMissions.filter(
            (m: Mission) => m.difficulty === filters.difficulty
          );
        }

        if (filters.topic && filters.topic !== "all") {
          filteredMissions = filteredMissions.filter(
            (m: Mission) => m.topic === filters.topic
          );
        }

        if (filters.language && filters.language !== "all") {
          filteredMissions = filteredMissions.filter(
            (m: Mission) => m.language === filters.language
          );
        }

        if (filters.rewardModel && filters.rewardModel !== "all") {
          filteredMissions = filteredMissions.filter(
            (m: Mission) => m.rewardModel === filters.rewardModel
          );
        }

        if (filters.status) {
          const now = new Date();
          filteredMissions = filteredMissions.filter((m: Mission) => {
            switch (filters.status) {
              case "active":
                return m.isActive && m.expiresAt > now;
              case "completed":
                return !m.isActive;
              case "expired":
                return m.expiresAt <= now;
              default:
                return true;
            }
          });
        }

        // Apply sorting
        switch (filters.sortBy) {
          case "reward":
            filteredMissions.sort(
              (a: Mission, b: Mission) => b.baseReward - a.baseReward
            );
            break;
          case "participants":
            filteredMissions.sort(
              (a: Mission, b: Mission) =>
                b.currentParticipants - a.currentParticipants
            );
            break;
          case "newest":
          default:
            filteredMissions.sort(
              (a: Mission, b: Mission) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
            break;
        }

        return filteredMissions;
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for mission data
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

// Hook to fetch a specific mission
export function useMission(missionId: string) {
  return useQuery({
    queryKey: [...queryKeys.missions.detail(missionId)],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/missions/${missionId}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error("Mission not found");
          throw new Error("Failed to fetch mission");
        }
        return await response.json();
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    enabled: !!missionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch user's missions
export function useUserMissions() {
  const { universalAddress: address } = useBaseAccount();

  return useQuery({
    queryKey: queryKeys.missions.userMissions(address || ""),
    queryFn: async () => {
      if (!address) return { active: [], completed: [] };

      try {
        const response = await fetch(`/api/user/missions?address=${address}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user missions");
        }
        return await response.json();
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    enabled: !!address,
    staleTime: 1 * 60 * 1000, // 1 minute for user missions
  });
}

// Hook to accept a mission
export function useAcceptMission() {
  const queryClient = useQueryClient();
  const { universalAddress: address } = useBaseAccount();

  return useMutation({
    mutationFn: async (missionId: string) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      try {
        const response = await fetch("/api/missions/accept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${address}`,
          },
          body: JSON.stringify({ missionId }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to accept mission");
        }

        return await response.json();
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    onSuccess: (_, missionId) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.missions.detail(missionId),
      });
      if (address) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.missions.userMissions(address),
        });
      }
    },
  });
}

// Hook to complete a mission with moderation
export const useCompleteMission = () => {
  const queryClient = useQueryClient();
  const { universalAddress: address } = useBaseAccount();

  return useMutation({
    mutationFn: async ({
      missionId,
      recordingId,
      location,
      context,
      transcription,
    }: {
      missionId: string;
      recordingId: string;
      location: {
        city: string;
        country: string;
        coordinates?: { lat: number; lng: number };
      };
      context: string;
      transcription?: string;
    }) => {
      if (!address) throw new Error("Wallet not connected");

      // Get mission to access quality criteria
      const missionRes = await fetch(`/api/missions/${missionId}`);
      if (!missionRes.ok) throw new Error("Mission not found");
      const mission = await missionRes.json();

      // Build response
      const response: Omit<MissionResponse, "id" | "submittedAt"> & {
        status?: "approved" | "flagged" | "removed";
      } = {
        missionId,
        userId: address,
        recordingId,
        location,
        context,
        participantConsent: true,
        isAnonymized: false,
        voiceObfuscated: false,
        status: "approved" as const,
        transcription,
      };

      // Run moderation check
      const modResult = await moderationService.evaluateQuality(
        response as MissionResponse,
        mission.qualityCriteria
      );

      // Set status based on moderation result
      if (modResult.suggestion === "reject") {
        response.status = "flagged";
      } else if (modResult.suggestion === "review") {
        response.status = "approved"; // Auto-approve, human review happens separately
      } else {
        response.status = "approved"; // Auto-approved
      }

      const submitRes = await fetch("/api/missions/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${address}`,
        },
        body: JSON.stringify(response),
      });

      if (!submitRes.ok) {
        const error = await submitRes.json();
        throw new Error(error.error || "Failed to submit mission");
      }

      return await submitRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.all });
      if (address) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.missions.stats(address),
        });
      }
    },
  });
};

// Hook to get mission statistics
export const useMissionStats = () => {
  const { universalAddress: address } = useBaseAccount();

  return useQuery({
    queryKey: queryKeys.missions.stats(address || ""),
    queryFn: async () => {
      const response = await fetch("/api/missions");
      if (!response.ok) {
        throw new Error("Failed to fetch missions stats");
      }
      const missions = await response.json();

      return {
        totalMissions: missions.length,
        activeMissions: missions.filter((m: Mission) => m.isActive).length,
        completedMissions: missions.filter((m: Mission) => !m.isActive).length,
        totalRewards: missions.reduce(
          (sum: number, m: Mission) => sum + (m.baseReward || 0),
          0
        ),
        averageReward:
          missions.length > 0
            ? missions.reduce(
                (sum: number, m: Mission) => sum + (m.baseReward || 0),
                0
              ) / missions.length
            : 0,
        languageDistribution: missions.reduce(
          (acc: Record<string, number>, m: Mission) => {
            acc[m.language] = (acc[m.language] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    },
    enabled: !!address,
  });
};
