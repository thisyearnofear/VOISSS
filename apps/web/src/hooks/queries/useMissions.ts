import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBaseAccount } from '../useBaseAccount';
import { createPersistentMissionService } from '@voisss/shared';
import { Mission, MissionResponse } from '@voisss/shared/types/socialfi';
import { queryKeys, handleQueryError } from '../../lib/query-client';

// Create mission service instance
const missionService = createPersistentMissionService();

// Mission filters interface
interface MissionFilters {
  topic?: string;
  difficulty?: string;
  sortBy?: 'newest' | 'reward' | 'participants';
  status?: 'active' | 'completed' | 'expired';
}

// Hook to fetch all missions with filtering
export function useMissions(filters: MissionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.missions.list(filters),
    queryFn: async () => {
      try {
        const missions = await missionService.getActiveMissions();
        
        // Apply filters
        let filteredMissions = missions;
        
        if (filters.topic && filters.topic !== 'all') {
          filteredMissions = filteredMissions.filter((m: Mission) => m.topic === filters.topic);
        }
        
        if (filters.difficulty && filters.difficulty !== 'all') {
          filteredMissions = filteredMissions.filter((m: Mission) => m.difficulty === filters.difficulty);
        }
        
        if (filters.status) {
          const now = new Date();
          filteredMissions = filteredMissions.filter((m: Mission) => {
            switch (filters.status) {
              case 'active':
                return m.isActive && m.expiresAt > now;
              case 'completed':
                return !m.isActive;
              case 'expired':
                return m.expiresAt <= now;
              default:
                return true;
            }
          });
        }
        
        // Apply sorting
        switch (filters.sortBy) {
          case 'reward':
            filteredMissions.sort((a: Mission, b: Mission) => b.reward - a.reward);
            break;
          case 'participants':
            filteredMissions.sort((a: Mission, b: Mission) => b.currentParticipants - a.currentParticipants);
            break;
          case 'newest':
          default:
            filteredMissions.sort((a: Mission, b: Mission) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
        const mission = await missionService.getMissionById(missionId);
        if (!mission) {
          throw new Error('Mission not found');
        }
        return mission;
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
    queryKey: queryKeys.missions.userMissions(address || ''),
    queryFn: async () => {
      if (!address) return [];
      
      try {
        return await missionService.getUserMissions(address);
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
        throw new Error('Wallet not connected');
      }
      
      try {
        return await missionService.acceptMission(missionId, address);
      } catch (error) {
        throw handleQueryError(error);
      }
    },
    onSuccess: (_, missionId) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.detail(missionId) });
      if (address) {
        queryClient.invalidateQueries({ queryKey: queryKeys.missions.userMissions(address) });
      }
    },
  });
}

// Hook to complete a mission
export const useCompleteMission = () => {
  const queryClient = useQueryClient();
  const { universalAddress: address } = useBaseAccount();

  return useMutation({
    mutationFn: async ({ 
      missionId, 
      recordingId, 
      location, 
      context 
    }: { 
      missionId: string; 
      recordingId: string; 
      location: { city: string; country: string; coordinates?: { lat: number; lng: number } };
      context: string;
    }) => {
      if (!address) throw new Error('Wallet not connected');

      const response: Omit<MissionResponse, 'id' | 'submittedAt'> = {
        missionId,
        userId: address,
        recordingId,
        location,
        context,
        participantConsent: true,
        isAnonymized: false,
        voiceObfuscated: false,
        status: 'pending' as const,
        qualityScore: 85,
      };

      return await missionService.submitMissionResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.all });
      if (address) {
        queryClient.invalidateQueries({ queryKey: queryKeys.missions.stats(address) });
      }
    },
  });
};

// Hook to get mission statistics
export const useMissionStats = () => {
  const { universalAddress: address } = useBaseAccount();
  
  return useQuery({
    queryKey: queryKeys.missions.stats(address || ''),
    queryFn: async () => {
      const missions = await missionService.getActiveMissions();
      
      return {
        totalMissions: missions.length,
        activeMissions: missions.filter((m: Mission) => m.isActive).length,
        completedMissions: missions.filter((m: Mission) => !m.isActive).length,
        totalRewards: missions.reduce((sum: number, m: Mission) => sum + m.reward, 0),
        averageReward: missions.length > 0 
          ? missions.reduce((sum: number, m: Mission) => sum + m.reward, 0) / missions.length 
          : 0,
        topTopics: missions
           .reduce((acc: Record<string, number>, m: Mission) => {
             acc[m.topic] = (acc[m.topic] || 0) + 1;
             return acc;
           }, {} as Record<string, number>),
      };
    },
    enabled: !!address,
  });
};