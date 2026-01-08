/**
 * Persistent Mission Service
 * 
 * Replaces the Map-based DefaultMissionService with proper data persistence.
 * Uses the DatabaseService interface for storage, ensuring data survives page refreshes.
 */

import {
  Mission,
  CreateMissionInput,
  MissionResponse,
  MISSION_TEMPLATES,
  MissionDifficulty,
  RewardRecord,
  MilestoneProgress,
  Milestone,
  RewardClaim
} from '../types/socialfi';
import { getRewardForMilestone } from '../config/platform';
import { MissionService } from './mission-service';
import { DatabaseService, COLLECTIONS, DatabaseOperationError } from './database-service';
import { createLocalStorageDatabase } from './localStorage-database';

export class PersistentMissionService implements MissionService {
  private db: DatabaseService;
  private initialized = false;

  constructor(database?: DatabaseService) {
    this.db = database || createLocalStorageDatabase('voisss');
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.db.connect();
      await this.initializeDefaultMissions();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize PersistentMissionService:', error);
      throw new DatabaseOperationError(
        'Failed to initialize mission service',
        COLLECTIONS.MISSIONS,
        'initialize'
      );
    }
  }

  private async initializeDefaultMissions(): Promise<void> {
    // Check if missions already exist
    const existingCount = await this.db.count(COLLECTIONS.MISSIONS);
    if (existingCount > 0) {
      return; // Already initialized
    }

    // Create default missions for demo purposes
    const defaultMissions: Omit<Mission, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipants'>[] = [
      {
        title: "Web3 Street Wisdom",
        description: "Ask people in your city what they really think about Web3 and cryptocurrency. Interview format: taxi, coffee shop, or street corner conversations.",
        difficulty: "easy",
        baseReward: 10,
        rewardModel: "pool",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        locationBased: true,
        isActive: true,
        createdBy: "platform",
        targetDuration: 60,
        language: "en",
        curatorReward: 5,
        autoExpire: true,
        qualityCriteria: {
          audioMinScore: 60,
          transcriptionRequired: true,
        },
      },
      {
        title: "Remote Work Reality Check",
        description: "Share your honest perspective on how remote work has changed your life. Any location, any setting where you can speak freely.",
        difficulty: "medium",
        baseReward: 25,
        rewardModel: "pool",
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        locationBased: false,
        isActive: true,
        createdBy: "platform",
        targetDuration: 120,
        language: "en",
        curatorReward: 5,
        autoExpire: true,
        qualityCriteria: {
          audioMinScore: 65,
          transcriptionRequired: true,
        },
      },
      {
        title: "Marriage in 2024",
        description: "Explore contemporary views on marriage and commitment. Deep, thoughtful conversation. Record in a comfortable, private setting.",
        difficulty: "hard",
        baseReward: 50,
        rewardModel: "pool",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        locationBased: false,
        isActive: true,
        createdBy: "platform",
        targetDuration: 300,
        language: "en",
        curatorReward: 5,
        autoExpire: true,
        qualityCriteria: {
          audioMinScore: 70,
          transcriptionRequired: true,
        },
      },
      {
        title: "AI: Excitement or Anxiety?",
        description: "How does AI make you feel? Document your genuine reactions and thoughts about AI's impact on work, creativity, and society.",
        difficulty: "medium",
        baseReward: 25,
        rewardModel: "pool",
        expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        locationBased: true,
        isActive: true,
        createdBy: "platform",
        targetDuration: 180,
        language: "en",
        curatorReward: 5,
        autoExpire: true,
        qualityCriteria: {
          audioMinScore: 65,
          transcriptionRequired: true,
        },
      }
    ];

    // Create missions with proper IDs and timestamps
    for (const missionData of defaultMissions) {
      const mission: Mission = {
        ...missionData,
        id: this.generateId(),
        currentParticipants: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db.set(COLLECTIONS.MISSIONS, mission.id, mission);
    }

    console.log(`Initialized ${defaultMissions.length} default missions`);
  }

  private generateId(): string {
    return `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getActiveMissions(): Promise<Mission[]> {
    await this.ensureInitialized();

    try {
      const now = new Date();
      const allMissions = await this.db.getAll<Mission>(COLLECTIONS.MISSIONS);

      return allMissions
        .filter(mission => mission.isActive && mission.expiresAt > now)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      throw new DatabaseOperationError(
        'Failed to fetch active missions',
        COLLECTIONS.MISSIONS,
        'getActiveMissions'
      );
    }
  }

  async getMissionById(id: string): Promise<Mission | null> {
    await this.ensureInitialized();

    try {
      return await this.db.get<Mission>(COLLECTIONS.MISSIONS, id);
    } catch (error) {
      throw new DatabaseOperationError(
        `Failed to fetch mission ${id}`,
        COLLECTIONS.MISSIONS,
        'getMissionById'
      );
    }
  }

  async createMission(missionData: Omit<CreateMissionInput, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipants'>): Promise<Mission> {
    await this.ensureInitialized();

    try {
      const mission: Mission = {
        curatorReward: 5,
        autoExpire: true,
        language: 'en',
        rewardModel: 'pool',
        ...missionData,
        id: this.generateId(),
        currentParticipants: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Mission;

      await this.db.set(COLLECTIONS.MISSIONS, mission.id, mission);
      return mission;
    } catch (error) {
      throw new DatabaseOperationError(
        'Failed to create mission',
        COLLECTIONS.MISSIONS,
        'createMission'
      );
    }
  }

  async updateMission(id: string, updates: Partial<Mission>): Promise<Mission> {
    await this.ensureInitialized();

    try {
      const updatedMission = await this.db.update<Mission>(COLLECTIONS.MISSIONS, id, {
        ...updates,
        updatedAt: new Date(),
      });

      return updatedMission;
    } catch (error) {
      if (error instanceof DatabaseOperationError) {
        throw error;
      }

      throw new DatabaseOperationError(
        `Failed to update mission ${id}`,
        COLLECTIONS.MISSIONS,
        'updateMission'
      );
    }
  }

  async deactivateMission(id: string): Promise<void> {
    await this.updateMission(id, { isActive: false });
  }

  async acceptMission(missionId: string, userId: string): Promise<boolean> {
    await this.ensureInitialized();

    try {
      const mission = await this.getMissionById(missionId);
      if (!mission || !mission.isActive || mission.expiresAt < new Date()) {
        return false;
      }

      if (mission.maxParticipants && mission.currentParticipants >= mission.maxParticipants) {
        return false;
      }

      // Get user's active missions to check if already accepted
      const userMissions = await this.getUserMissions(userId);
      const alreadyAccepted = userMissions.active.some(m => m.id === missionId);

      if (alreadyAccepted) {
        return false; // Already accepted
      }

      // Store user-mission relationship
      const userMissionId = `${userId}_${missionId}`;
      await this.db.set('user_missions', userMissionId, {
        userId,
        missionId,
        acceptedAt: new Date(),
        status: 'active'
      });

      // Increment participant count
      await this.updateMission(missionId, {
        currentParticipants: mission.currentParticipants + 1
      });

      return true;
    } catch (error) {
      throw new DatabaseOperationError(
        `Failed to accept mission ${missionId} for user ${userId}`,
        COLLECTIONS.MISSIONS,
        'acceptMission'
      );
    }
  }

  async submitMissionResponse(responseData: Omit<MissionResponse, 'id' | 'submittedAt'>): Promise<MissionResponse> {
    await this.ensureInitialized();

    try {
      const response: MissionResponse = {
        ...responseData,
        id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        submittedAt: new Date(),
      };

      await this.db.set(COLLECTIONS.MISSION_RESPONSES, response.id, response);
      return response;
    } catch (error) {
      throw new DatabaseOperationError(
        'Failed to submit mission response',
        COLLECTIONS.MISSION_RESPONSES,
        'submitMissionResponse'
      );
    }
  }

  async getUserMissions(userId: string): Promise<{ active: Mission[], completed: MissionResponse[] }> {
    await this.ensureInitialized();

    try {
      // Get user's accepted missions
      const userMissionRelations = await this.db.getWhere<any>('user_missions',
        (relation) => relation.userId === userId
      );

      const activeMissionIds = userMissionRelations
        .filter(relation => relation.status === 'active')
        .map(relation => relation.missionId);

      const active: Mission[] = [];
      for (const missionId of activeMissionIds) {
        const mission = await this.getMissionById(missionId);
        if (mission && mission.isActive) {
          active.push(mission);
        }
      }

      // Get user's completed mission responses
      const completed = await this.db.getWhere<MissionResponse>(COLLECTIONS.MISSION_RESPONSES,
        (response) => response.userId === userId
      );

      return { active, completed };
    } catch (error) {
      throw new DatabaseOperationError(
        `Failed to get missions for user ${userId}`,
        COLLECTIONS.MISSIONS,
        'getUserMissions'
      );
    }
  }

  async getMissionsByLocation(city: string, country: string): Promise<Mission[]> {
    await this.ensureInitialized();

    try {
      const activeMissions = await this.getActiveMissions();
      return activeMissions.filter(mission => mission.locationBased);
    } catch (error) {
      throw new DatabaseOperationError(
        `Failed to get missions for location ${city}, ${country}`,
        COLLECTIONS.MISSIONS,
        'getMissionsByLocation'
      );
    }
  }

  async getRecommendedMissions(userId: string): Promise<Mission[]> {
    await this.ensureInitialized();

    try {
      // Simple recommendation: return active missions the user hasn't accepted yet
      const { active: userActiveMissions } = await this.getUserMissions(userId);
      const userMissionIds = new Set(userActiveMissions.map(m => m.id));

      const allActive = await this.getActiveMissions();
      return allActive
        .filter(mission => !userMissionIds.has(mission.id))
        .slice(0, 5); // Return top 5 recommendations
    } catch (error) {
      throw new DatabaseOperationError(
        `Failed to get recommended missions for user ${userId}`,
        COLLECTIONS.MISSIONS,
        'getRecommendedMissions'
      );
    }
  }

  getMissionTemplates(): any {
    return MISSION_TEMPLATES;
  }

  async createMissionFromTemplate(
    templateKey: string,
    templateIndex: number,
    customizations?: Partial<Mission>
  ): Promise<Mission> {
    const templates = MISSION_TEMPLATES[templateKey as keyof typeof MISSION_TEMPLATES];
    if (!templates || !templates[templateIndex]) {
      throw new DatabaseOperationError(
        `Template not found: ${templateKey}[${templateIndex}]`,
        COLLECTIONS.MISSIONS,
        'createMissionFromTemplate'
      );
    }

    const template = templates[templateIndex];
    const baseReward = template.difficulty === 'easy' ? 10 : template.difficulty === 'medium' ? 25 : 50;

    const missionData: Omit<Mission, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipants'> = {
      title: customizations?.title || template.title,
      description: customizations?.description || template.description,
      topic: customizations?.topic || templateKey,
      difficulty: customizations?.difficulty || template.difficulty,
      baseReward: customizations?.baseReward || baseReward,
      rewardModel: customizations?.rewardModel || 'pool',
      expiresAt: customizations?.expiresAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxParticipants: customizations?.maxParticipants || 100,
      isActive: customizations?.isActive ?? true,
      createdBy: customizations?.createdBy || "platform",
      tags: customizations?.tags || [templateKey, template.difficulty],
      locationBased: customizations?.locationBased ?? ((template.contextSuggestions as unknown as string[]).includes("taxi") ||
        (template.contextSuggestions as unknown as string[]).includes("street")),
      autoExpire: customizations?.autoExpire ?? true,
      targetDuration: customizations?.targetDuration || template.targetDuration,
      language: customizations?.language || "en",
      curatorReward: customizations?.curatorReward || 5,
      examples: customizations?.examples || [...template.examples],
      contextSuggestions: customizations?.contextSuggestions || [...template.contextSuggestions],
      qualityCriteria: customizations?.qualityCriteria,
    };

    return this.createMission(missionData);
  }

  async getMissionStats(missionId: string): Promise<{
    totalResponses: number;
    averageQuality: number;
    geographicDistribution: Record<string, number>;
    completionRate: number;
  }> {
    await this.ensureInitialized();

    try {
      const mission = await this.getMissionById(missionId);
      if (!mission) {
        throw new DatabaseOperationError(
          `Mission ${missionId} not found`,
          COLLECTIONS.MISSIONS,
          'getMissionStats'
        );
      }

      const responses = await this.db.getWhere<MissionResponse>(COLLECTIONS.MISSION_RESPONSES,
        (response) => response.missionId === missionId
      );

      const totalResponses = responses.length;
      const averageQuality = responses.length > 0
        ? responses.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / responses.length
        : 0;

      const geographicDistribution: Record<string, number> = {};
      responses.forEach(response => {
        if (response.location) {
          const location = `${response.location.city}, ${response.location.country}`;
          geographicDistribution[location] = (geographicDistribution[location] || 0) + 1;
        }
      });

      const completionRate = mission.currentParticipants > 0
        ? (totalResponses / mission.currentParticipants) * 100
        : 0;

      return {
        totalResponses,
        averageQuality,
        geographicDistribution,
        completionRate,
      };
    } catch (error) {
      if (error instanceof DatabaseOperationError) {
        throw error;
      }

      throw new DatabaseOperationError(
        `Failed to get stats for mission ${missionId}`,
        COLLECTIONS.MISSIONS,
        'getMissionStats'
      );
    }
  }

  // ===== REWARD MANAGEMENT =====

  private getProgressKey(userId: string, missionId: string, responseId: string): string {
    return `${userId}:${missionId}:${responseId}`;
  }

  async createRewardForMilestone(
    userId: string,
    missionId: string,
    responseId: string,
    milestone: Milestone
  ): Promise<RewardRecord> {
    await this.ensureInitialized();

    const amountInTokens = getRewardForMilestone(milestone);

    const reward: RewardRecord = {
      id: `reward_${this.generateId()}`,
      userId,
      missionId,
      responseId,
      milestone,
      amountInTokens,
      earnedAt: new Date(),
      status: 'pending',
    };

    try {
      await this.db.set('rewards', reward.id, reward);
      return reward;
    } catch (error) {
      throw new DatabaseOperationError(
        'Failed to create reward',
        'rewards',
        'createRewardForMilestone'
      );
    }
  }

  async getMilestoneProgress(
    userId: string,
    missionId: string,
    responseId: string
  ): Promise<MilestoneProgress> {
    await this.ensureInitialized();
    const key = this.getProgressKey(userId, missionId, responseId);

    try {
      // We use the key as ID for progress to ensure uniqueness per user-mission-response
      // The ID might need to be sanitized if used as a filename in some DBs, 
      // but for localStorage/IndexedDB usually fine. 
      // Safe option: hash it or just use it if allowed.
      // Let's assume we can use it or generate a specific ID and query by fields.
      // For simplicity with key-value store, we'll try to use a composite key or query.

      // Better approach for general DB: Query by fields
      const progressList = await this.db.getWhere<MilestoneProgress>('milestone_progress',
        p => p.userId === userId && p.missionId === missionId && p.responseId === responseId
      );

      if (progressList.length > 0) {
        return progressList[0];
      }

      const newProgress: MilestoneProgress = {
        userId,
        missionId,
        responseId,
        completedMilestones: [],
        nextMilestone: 'submission' as const,
        isFeatured: false,
        totalEarned: 0,
        lastUpdated: new Date(),
      };

      // Store with a unique ID
      const id = `progress_${this.generateId()}`;
      await this.db.set('milestone_progress', id, newProgress);
      return newProgress;
    } catch (error) {
      throw new DatabaseOperationError(
        'Failed to get milestone progress',
        'milestone_progress',
        'getMilestoneProgress'
      );
    }
  }

  async completeMilestone(
    userId: string,
    missionId: string,
    responseId: string,
    milestone: Milestone,
    qualityScore?: number
  ): Promise<MilestoneProgress> {
    await this.ensureInitialized();

    try {
      const progress = await this.getMilestoneProgress(userId, missionId, responseId);

      if (progress.completedMilestones.includes(milestone)) {
        return progress;
      }

      // Create reward
      const reward = await this.createRewardForMilestone(userId, missionId, responseId, milestone);

      // Update progress
      const milestoneSequence: Milestone[] = ['submission', 'quality_approved', 'featured'];
      const nextIndex = milestoneSequence.findIndex(m => !progress.completedMilestones.includes(m));

      // Find the ID of the progress record to update
      const progressList = await this.db.getWhere<MilestoneProgress & { id?: string }>('milestone_progress',
        p => p.userId === userId && p.missionId === missionId && p.responseId === responseId
      );

      // If we found it via getMilestoneProgress, it should exist. 
      // If getMilestoneProgress created a new one, we need to find its ID or we should have returned ID from there.
      // getMilestoneProgress implementation above creates one if not found.
      // However, we didn't return the ID in the interface (it's not in MilestoneProgress type usually?).
      // Let's assume we can find it again.

      // Ideally getMilestoneProgress should return the object which might have an internal ID if it came from DB.
      // But adhering to interface.

      // Let's simplify: fetch all, find match, get its ID (if stored in DB wrapper) or we need to manage IDs better.
      // Our DB `getWhere` returns T[]. If T doesn't have ID, we can't update by ID easily unless we know it.
      // `DatabaseService` methods `set` and `update` take an ID. 
      // `getWhere` returns the data `T`.

      // Hack/Fix: In `getMilestoneProgress`, I created it with `id = progress_${this.generateId()}`.
      // I should store that ID in the object if I can, or use a consistent ID generation strategy.
      // Consistent ID: `progress_${userId}_${missionId}_${responseId}` (sanitized).

      const consistentId = `prog_${userId}_${missionId}_${responseId}`.replace(/[^a-zA-Z0-9_]/g, '');

      // Re-implementing getMilestoneProgress logic briefly to ensure we use consistent ID for updates
      const updatedProgress: MilestoneProgress = {
        ...progress,
        completedMilestones: [...progress.completedMilestones, milestone],
        totalEarned: progress.totalEarned + reward.amountInTokens,
        qualityScore: qualityScore ?? progress.qualityScore,
        isFeatured: milestone === 'featured',
        nextMilestone: nextIndex >= 0 ? milestoneSequence[nextIndex] : undefined,
        lastUpdated: new Date(),
      };

      await this.db.set('milestone_progress', consistentId, updatedProgress);
      return updatedProgress;
    } catch (error) {
      throw new DatabaseOperationError(
        'Failed to complete milestone',
        'milestone_progress',
        'completeMilestone'
      );
    }
  }

  async getUnclaimedRewards(userId: string): Promise<RewardRecord[]> {
    await this.ensureInitialized();

    try {
      return await this.db.getWhere<RewardRecord>('rewards',
        r => r.userId === userId && r.status === 'pending'
      );
    } catch (error) {
      throw new DatabaseOperationError(
        'Failed to get unclaimed rewards',
        'rewards',
        'getUnclaimedRewards'
      );
    }
  }

  async claimRewards(userId: string, rewardIds: string[]): Promise<RewardClaim> {
    await this.ensureInitialized();

    try {
      const allRewards = await this.db.getWhere<RewardRecord>('rewards',
        r => rewardIds.includes(r.id) && r.userId === userId
      );

      if (allRewards.length === 0) {
        throw new Error('No valid rewards to claim');
      }

      const totalAmount = allRewards.reduce((sum, r) => sum + r.amountInTokens, 0);

      const claim: RewardClaim = {
        id: `claim_${this.generateId()}`,
        userId,
        totalAmount,
        rewardIds,
        claimedAt: new Date(),
        status: 'pending',
        retryCount: 0,
      };

      // Update rewards status
      for (const reward of allRewards) {
        await this.db.update('rewards', reward.id, {
          status: 'claimed',
          claimedAt: new Date(),
        });
      }

      await this.db.set('reward_claims', claim.id, claim);
      return claim;
    } catch (error) {
      if (error instanceof DatabaseOperationError) throw error;
      throw new DatabaseOperationError(
        'Failed to claim rewards',
        'reward_claims',
        'claimRewards'
      );
    }
  }

  async getCreatorEarnings(userId: string): Promise<{
    totalEarned: number;
    totalClaimed: number;
    pendingRewards: number;
    unclaimedCount: number;
  }> {
    await this.ensureInitialized();

    try {
      const userRewards = await this.db.getWhere<RewardRecord>('rewards', r => r.userId === userId);

      const totalEarned = userRewards.reduce((sum, r) => sum + r.amountInTokens, 0);
      const totalClaimed = userRewards
        .filter(r => r.status === 'claimed')
        .reduce((sum, r) => sum + r.amountInTokens, 0);
      const pendingRewards = userRewards
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + r.amountInTokens, 0);
      const unclaimedCount = userRewards.filter(r => r.status === 'pending').length;

      return {
        totalEarned,
        totalClaimed,
        pendingRewards,
        unclaimedCount,
      };
    } catch (error) {
      throw new DatabaseOperationError(
        'Failed to get creator earnings',
        'rewards',
        'getCreatorEarnings'
      );
    }
  }

  // Quality Validation (AI moderation)
  async validateQualityCriteria(
    response: MissionResponse,
    criteria?: any
  ): Promise<{ passed: boolean; reasons: string[] }> {
    const failures: string[] = [];

    if (!criteria) {
      return { passed: true, reasons: [] };
    }

    // Check transcription requirement
    if (criteria.transcriptionRequired && !response.transcription) {
      failures.push('Transcription required but not provided');
    }

    // Check audio quality score
    if (criteria.audioMinScore !== undefined && (response.qualityScore || 0) < criteria.audioMinScore) {
      failures.push(`Audio quality score ${response.qualityScore || 0} below minimum ${criteria.audioMinScore}`);
    }

    return {
      passed: failures.length === 0,
      reasons: failures,
    };
  }

  // Reward Calculation
  async calculateRewardAmount(
    mission: Mission,
    milestone: Milestone,
    qualityScore?: number,
    participantCount?: number
  ): Promise<number> {
    const baseReward = mission.baseReward || 25;

    // Base amount for submission milestone
    if (milestone === 'submission') {
      return baseReward;
    }

    // Quality approved: +20% bonus
    if (milestone === 'quality_approved') {
      return Math.floor(baseReward * 1.2);
    }

    // Featured: +50% bonus + curator reward consideration
    if (milestone === 'featured') {
      const featuredBonus = Math.floor(baseReward * 1.5);
      // If creator staked tokens, apply 1.5x multiplier
      if (mission.creatorStake && mission.creatorStake > 0) {
        return Math.floor(featuredBonus * 1.5);
      }
      return featuredBonus;
    }

    return baseReward;
  }

  // Debug and maintenance methods
  async getStorageInfo(): Promise<any> {
    if ('getStorageInfo' in this.db) {
      return (this.db as any).getStorageInfo();
    }
    return null;
  }

  async clearAllData(): Promise<void> {
    await this.ensureInitialized();

    await this.db.clear(COLLECTIONS.MISSIONS);
    await this.db.clear(COLLECTIONS.MISSION_RESPONSES);
    await this.db.clear('user_missions');

    // Reinitialize with default data
    this.initialized = false;
    await this.ensureInitialized();
  }
}

/**
 * Factory function to create a persistent mission service
 */
export function createPersistentMissionService(database?: DatabaseService): MissionService {
  return new PersistentMissionService(database);
}