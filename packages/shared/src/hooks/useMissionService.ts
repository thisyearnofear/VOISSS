/**
 * useMissionService Hook
 * 
 * Provides a React hook interface to the mission service with version ledger integration.
 * This hook is designed to be used in client components and integrates with the version
 * ledger pattern for audio version management.
 */

import { useState, useEffect, useCallback } from 'react';
import { createMissionServiceWithLocalStorage } from '../services/persistent-mission-service';
import type { MissionService } from '../services/mission-service';
import type { Mission, MissionResponse } from '../types/socialfi';
import type { AudioVersion, VersionLedgerState } from '../types/audio-version';

export interface MissionServiceHook {
  missionService: MissionService;
  activeMissions: Mission[];
  userMissions: { active: Mission[]; completed: MissionResponse[] };
  isLoading: boolean;
  error: Error | null;
  refreshMissions: () => Promise<void>;
  acceptMission: (missionId: string, userId: string) => Promise<boolean>;
  submitMissionResponse: (
    responseData: Omit<MissionResponse, 'id' | 'submittedAt'>
  ) => Promise<MissionResponse>;
  getMissionById: (missionId: string) => Promise<Mission | null>;
  getMissionStats: (missionId: string) => Promise<{
    totalResponses: number;
    averageQuality: number;
    geographicDistribution: Record<string, number>;
    completionRate: number;
  }>;
}

export function useMissionService(userId: string | null): MissionServiceHook {
  const [missionService] = useState<MissionService>(() => 
    createMissionServiceWithLocalStorage('voisss_missions')
  );
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [userMissions, setUserMissions] = useState<{
    active: Mission[];
    completed: MissionResponse[];
  }>({ active: [], completed: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize and load missions
  const loadMissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load active missions
      const missions = await missionService.getActiveMissions();
      setActiveMissions(missions);

      // Load user missions if userId is available
      if (userId) {
        const userMissionData = await missionService.getUserMissions(userId);
        setUserMissions(userMissionData);
      } else {
        setUserMissions({ active: [], completed: [] });
      }

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load missions'));
      setActiveMissions([]);
      setUserMissions({ active: [], completed: [] });
    } finally {
      setIsLoading(false);
    }
  }, [missionService, userId]);

  // Initial load
  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  // Accept a mission
  const acceptMission = useCallback(
    async (missionId: string, userId: string): Promise<boolean> => {
      if (!userId) {
        throw new Error('User ID is required to accept a mission');
      }

      try {
        const result = await missionService.acceptMission(missionId, userId);
        if (result) {
          // Refresh missions to get updated state
          await loadMissions();
        }
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to accept mission'));
        throw err;
      }
    },
    [missionService, loadMissions]
  );

  // Submit a mission response
  const submitMissionResponse = useCallback(
    async (
      responseData: Omit<MissionResponse, 'id' | 'submittedAt'>
    ): Promise<MissionResponse> => {
      try {
        const response = await missionService.submitMissionResponse(responseData);
        await loadMissions();
        return response;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to submit mission response'));
        throw err;
      }
    },
    [missionService, loadMissions]
  );

  // Get mission by ID
  const getMissionById = useCallback(
    async (missionId: string): Promise<Mission | null> => {
      try {
        return await missionService.getMissionById(missionId);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to get mission'));
        throw err;
      }
    },
    [missionService]
  );

  // Get mission stats
  const getMissionStats = useCallback(
    async (missionId: string) => {
      try {
        return await missionService.getMissionStats(missionId);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to get mission stats'));
        throw err;
      }
    },
    [missionService]
  );

  return {
    missionService,
    activeMissions,
    userMissions,
    isLoading,
    error,
    refreshMissions: loadMissions,
    acceptMission,
    submitMissionResponse,
    getMissionById,
    getMissionStats,
  };
}

/**
 * Hook for integrating mission service with version ledger
 * This provides a bridge between mission operations and audio version management
 */
export function useMissionServiceWithVersionLedger(
  userId: string | null,
  versionLedgerState: VersionLedgerState
): MissionServiceHook & {
  createMissionResponseFromVersion: (
    missionId: string,
    versionId: string,
    additionalData: Partial<Omit<MissionResponse, 'recordingId' | 'userId' | 'missionId'>>
  ) => Promise<MissionResponse>;
} {
  const missionServiceHook = useMissionService(userId);

  const createMissionResponseFromVersion = useCallback(
    async (
      missionId: string,
      versionId: string,
      additionalData: Partial<Omit<MissionResponse, 'recordingId' | 'userId' | 'missionId'>> = {}
    ): Promise<MissionResponse> => {
      if (!userId) {
        throw new Error('User ID is required to submit a mission response');
      }

      const version = versionLedgerState.versions.find(v => v.id === versionId);
      if (!version) {
        throw new Error(`Version ${versionId} not found in ledger`);
      }

      // Create a response from the version
      const responseData: Omit<MissionResponse, 'id' | 'submittedAt'> = {
        missionId,
        userId,
        recordingId: versionId, // Use version ID as recording ID
        location: additionalData.location || { city: 'Unknown', country: 'Unknown' },
        context: additionalData.context ? additionalData.context : `Version ${versionId} (${version.source})`,
        participantConsent: additionalData.participantConsent ?? true,
        isAnonymized: additionalData.isAnonymized ?? false,
        voiceObfuscated: additionalData.voiceObfuscated ?? false,
        status: 'approved',
        transcription: additionalData.transcription,
      };

      return missionServiceHook.submitMissionResponse(responseData);
    },
    [missionServiceHook, userId, versionLedgerState.versions]
  );

  return {
    ...missionServiceHook,
    createMissionResponseFromVersion,
  };
}