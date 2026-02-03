/**
 * Persistent Mission Service
 * 
 * Replaces the Map-based DefaultMissionService with proper data persistence.
 * Uses the DatabaseService interface for storage, ensuring data survives page refreshes.
 * Implements validation using Zod schemas and robust ID generation.
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
  RewardClaim,
  MissionSchema,
  MissionResponseSchema
} from '../types/socialfi';
import { getRewardForMilestone } from '../config/platform';
import { MissionService } from './mission-service';
import { DatabaseService, COLLECTIONS, DatabaseOperationError, DatabaseValidationError } from './database-service';
import { createLocalStorageDatabase } from './localStorage-database';
import { createInMemoryDatabase } from './memory-database';

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
      // Don't throw here to allow partial functionality, or log and rethrow
      // throw new DatabaseOperationError('Failed to initialize', COLLECTIONS.MISSIONS, 'initialize');
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
        baseReward: "10",
        rewardModel: "pool",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        locationBased: true,
        isActive: true,
        createdBy: "platform",
        targetDuration: 60,
        language: "en",
        curatorReward: 5,
        autoExpire: true,
        submissions: [],
        qualityCriteria: {
          audioMinScore: 60,
          transcriptionRequired: true,
        },
      },
      {
        title: "Remote Work Reality Check",
        description: "Share your honest perspective on how remote work has changed your life. Any location, any setting where you can speak freely.",
        difficulty: "medium",
        baseReward: "25",
        rewardModel: "pool",
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        locationBased: false,
        isActive: true,
        createdBy: "platform",
        targetDuration: 120,
        language: "en",
        curatorReward: 5,
        autoExpire: true,
        submissions: [],
        qualityCriteria: {
          audioMinScore: 65,
          transcriptionRequired: true,
        },
      },
      {
        title: "Marriage in 2024",
        description: "Explore contemporary views on marriage and commitment. Deep, thoughtful conversation. Record in a comfortable, private setting.",
        difficulty: "hard",
        baseReward: "50",
        rewardModel: "pool",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        locationBased: false,
        isActive: true,
        createdBy: "platform",
        targetDuration: 300,
        language: "en",
        curatorReward: 5,
        autoExpire: true,
        submissions: [],
        qualityCriteria: {
          audioMinScore: 70,
          transcriptionRequired: true,
        },
      },
      {
        title: "AI: Excitement or Anxiety?",
        description: "How does AI make you feel? Document your genuine reactions and thoughts about AI's impact on work, creativity, and society.",
        difficulty: "medium",
        baseReward: "25",
        rewardModel: "pool",
        expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        locationBased: true,
        isActive: true,
        createdBy: "platform",
        targetDuration: 180,
        language: "en",
        curatorReward: 5,
        autoExpire: true,
        submissions: [],
        qualityCriteria: {
          audioMinScore: 65,
          transcriptionRequired: true,
        },
      },
      {
        title: "Global Coffee Culture",
        description: "Visit a local cafe and capture a conversation about what coffee culture means in your city. Is it a social ritual or a fuel for work?",
        difficulty: "easy",
        baseReward: "15",
        rewardModel: "pool",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        locationBased: true,
        isActive: true,
        createdBy: "platform",
        targetDuration: 90,
        language: "en",
        curatorReward: 5,
        autoExpire: true,
        submissions: [],
        qualityCriteria: {
          audioMinScore: 60,
          transcriptionRequired: false,
        },
      },
      {
        title: "The Future of Education",
        description: "Interview a student or teacher about how they think learning will change in the next decade. Focus on digital vs. physical classrooms.",
        difficulty: "hard",
        baseReward: "60",
        rewardModel: "pool",
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        locationBased: false,
        isActive: true,
        createdBy: "platform",
        targetDuration: 400,
        language: "en",
        curatorReward: 10,
        autoExpire: true,
        submissions: [],
        qualityCriteria: {
          audioMinScore: 75,
          transcriptionRequired: true,
        },
      },
      {
        title: "Mental Health in Tech",
        description: "A safe space to share perspectives on burnout, work-life balance, and the psychological impact of constant connectivity in the tech industry.",
        difficulty: "medium",
        baseReward: "35",
        rewardModel: "pool",
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        locationBased: false,
        isActive: true,
        createdBy: "platform",
        targetDuration: 240,
        language: "en",
        curatorReward: 5,
        autoExpire: true,
        submissions: [],
        qualityCriteria: {
          audioMinScore: 70,
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
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async getActiveMissions(): Promise<Mission[]> {
    await this.ensureInitialized();

    try {
      const now = new Date();
      const allMissions = await this.db.getAll<Mission>(COLLECTIONS.MISSIONS);

      return allMissions
        .filter(mission => mission.isActive && new Date(mission.expiresAt) > now)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
        submissions: [],
        language: 'en',
        rewardModel: 'pool',
        ...missionData,
        id: this.generateId(),
        currentParticipants: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Mission;

      // Validate schema
      const result = MissionSchema.safeParse(mission);
      if (!result.success) {
        throw new DatabaseValidationError(`Invalid mission data: ${result.error.message}`, COLLECTIONS.MISSIONS);
      }

      await this.db.set(COLLECTIONS.MISSIONS, mission.id, mission);
      return mission;
    } catch (error) {
      if (error instanceof DatabaseValidationError) throw error;
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
      const existing = await this.getMissionById(id);
      if (!existing) {
         throw new DatabaseOperationError(`Mission ${id} not found`, COLLECTIONS.MISSIONS, 'updateMission');
      }

      const updated = { ...existing, ...updates, updatedAt: new Date() };
      
      // Partial validation could be complex, for now we assume updates are valid or rely on type safety
      // To be safe, we could validate the merged object
      const result = MissionSchema.safeParse(updated);
      if (!result.success) {
        throw new DatabaseValidationError(`Invalid mission update: ${result.error.message}`, COLLECTIONS.MISSIONS);
      }

      await this.db.set(COLLECTIONS.MISSIONS, id, updated);
      return updated;
    } catch (error) {
      if (error instanceof DatabaseOperationError || error instanceof DatabaseValidationError) {
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
        id: `response_${this.generateId()}`,
        submittedAt: new Date(),
      };

      // Validate schema
      const result = MissionResponseSchema.safeParse(response);
      if (!result.success) {
        throw new DatabaseValidationError(`Invalid submission data: ${result.error.message}`, COLLECTIONS.MISSION_RESPONSES);
      }

      await this.db.set(COLLECTIONS.MISSION_RESPONSES, response.id, response);
      
      // Update mission to include this submission ID
      const mission = await this.getMissionById(responseData.missionId);
      if (mission) {
          const submissions = mission.submissions || [];
          if (!submissions.includes(response.id)) {
             await this.updateMission(mission.id, {
                 submissions: [...submissions, response.id]
             });
          }
      }

      return response;
    } catch (error) {
      if (error instanceof DatabaseValidationError) throw error;
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
    const baseReward = template.difficulty === 'easy' ? '10' : template.difficulty === 'medium' ? '25' : '50';

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
      submissions: [],
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
      // Average quality score (simplified without engagement metrics)
      const averageQuality = 0; // Placeholder for future quality metrics

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

    const amountInTokens = String(getRewardForMilestone(milestone));

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
        totalEarned: '0',
        lastUpdated: new Date(),
      };

      // Store with a unique ID
      const consistentId = `prog_${userId}_${missionId}_${responseId}`.replace(/[^a-zA-Z0-9_]/g, '');
      await this.db.set('milestone_progress', consistentId, newProgress);
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
      
      const consistentId = `prog_${userId}_${missionId}_${responseId}`.replace(/[^a-zA-Z0-9_]/g, '');

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

      const totalAmount = allRewards.reduce((sum, r) => (BigInt(sum) + BigInt(r.amountInTokens)).toString(), '0');

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
    totalEarned: string;
    totalClaimed: string;
    pendingRewards: string;
    unclaimedCount: number;
  }> {
    await this.ensureInitialized();

    try {
      const userRewards = await this.db.getWhere<RewardRecord>('rewards', r => r.userId === userId);

      const totalEarned = userRewards.reduce((sum, r) => (BigInt(sum) + BigInt(r.amountInTokens)).toString(), '0');
      const totalClaimed = userRewards
        .filter(r => r.status === 'claimed')
        .reduce((sum, r) => (BigInt(sum) + BigInt(r.amountInTokens)).toString(), '0');
      const pendingRewards = userRewards
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => (BigInt(sum) + BigInt(r.amountInTokens)).toString(), '0');
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

    // Note: Submissions are auto-approved, quality validation is optional now

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
  ): Promise<string> {
    const baseReward = BigInt(mission.baseReward || '25');

    // Base amount for submission milestone
    if (milestone === 'submission') {
      return baseReward.toString();
    }

    // Quality approved: +20% bonus
    if (milestone === 'quality_approved') {
      return ((baseReward * 120n) / 100n).toString();
    }

    // Featured: +50% bonus + curator reward consideration
    if (milestone === 'featured') {
      const featuredBonus = (baseReward * 150n) / 100n;
      // If creator staked tokens, apply 1.5x multiplier
      const stake = mission.creatorStake ? BigInt(mission.creatorStake) : 0n;
      if (stake > 0n) {
        return ((featuredBonus * 150n) / 100n).toString();
      }
      return featuredBonus.toString();
    }

    return baseReward.toString();
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

  // ===== SUBMISSION MANAGEMENT =====

  async getSubmission(id: string): Promise<MissionResponse | null> {
    await this.ensureInitialized();
    try {
        return await this.db.get<MissionResponse>(COLLECTIONS.MISSION_RESPONSES, id);
    } catch (error) {
        throw new DatabaseOperationError(`Failed to get submission ${id}`, COLLECTIONS.MISSION_RESPONSES, 'getSubmission');
    }
  }

  async getSubmissionsByMission(missionId: string, status?: MissionResponse['status']): Promise<MissionResponse[]> {
    await this.ensureInitialized();
    try {
        const submissions = await this.db.getWhere<MissionResponse>(COLLECTIONS.MISSION_RESPONSES,
            (r) => r.missionId === missionId
        );
        if (status) {
            return submissions.filter(r => r.status === status);
        }
        return submissions;
    } catch (error) {
        throw new DatabaseOperationError('Failed to get submissions by mission', COLLECTIONS.MISSION_RESPONSES, 'getSubmissionsByMission');
    }
  }

  async getAllSubmissions(filters?: {
    status?: MissionResponse['status'];
    missionId?: string;
    userId?: string;
    after?: Date;
  }): Promise<MissionResponse[]> {
    await this.ensureInitialized();
    try {
        let submissions = await this.db.getAll<MissionResponse>(COLLECTIONS.MISSION_RESPONSES);

        if (filters?.status) {
          submissions = submissions.filter(r => r.status === filters.status);
        }
        if (filters?.missionId) {
          submissions = submissions.filter(r => r.missionId === filters.missionId);
        }
        if (filters?.userId) {
          submissions = submissions.filter(r => r.userId === filters.userId);
        }
        if (filters?.after) {
          const afterTime = filters.after.getTime();
          submissions = submissions.filter(r => new Date(r.submittedAt).getTime() >= afterTime);
        }

        // Sort by submission date, newest first
        return submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    } catch (error) {
        throw new DatabaseOperationError('Failed to get all submissions', COLLECTIONS.MISSION_RESPONSES, 'getAllSubmissions');
    }
  }

  async flagSubmission(submissionId: string, reason: string): Promise<MissionResponse> {
    await this.ensureInitialized();
    try {
        const submission = await this.getSubmission(submissionId);
        if (!submission) {
            throw new Error(`Submission ${submissionId} not found`);
        }

        const updated = await this.db.update<MissionResponse>(COLLECTIONS.MISSION_RESPONSES, submissionId, {
            status: 'flagged',
            flaggedAt: new Date(),
            flagReason: reason
        });
        
        return updated;
    } catch (error) {
        if (error instanceof DatabaseOperationError) throw error;
        throw new DatabaseOperationError(`Failed to flag submission ${submissionId}`, COLLECTIONS.MISSION_RESPONSES, 'flagSubmission');
    }
  }

  async removeSubmission(submissionId: string, reason: string): Promise<MissionResponse> {
    await this.ensureInitialized();
    try {
        const submission = await this.getSubmission(submissionId);
        if (!submission) {
            throw new Error(`Submission ${submissionId} not found`);
        }

        const updated = await this.db.update<MissionResponse>(COLLECTIONS.MISSION_RESPONSES, submissionId, {
            status: 'removed',
            removedAt: new Date(),
            flagReason: reason
        });

        // Remove from mission's submissions array
        const mission = await this.getMissionById(submission.missionId);
        if (mission && mission.submissions) {
            const newSubmissions = mission.submissions.filter(id => id !== submissionId);
            await this.updateMission(mission.id, { submissions: newSubmissions });
        }

        return updated;
    } catch (error) {
        if (error instanceof DatabaseOperationError) throw error;
        throw new DatabaseOperationError(`Failed to remove submission ${submissionId}`, COLLECTIONS.MISSION_RESPONSES, 'removeSubmission');
    }
  }

}

/**
 * Factory function to create mission service with explicit database dependency.
 * This removes the smart factory pattern and makes database initialization explicit.
 * 
 * @param database - The database service to use for persistence
 * @returns MissionService instance
 */
export function createMissionService(database: DatabaseService): MissionService {
  return new PersistentMissionService(database);
}

/**
 * Factory function to create mission service with LocalStorage database.
 * This is the recommended way to create a mission service for browser environments.
 * 
 * @param namespace - The namespace to use for LocalStorage keys
 * @returns MissionService instance
 */
export function createMissionServiceWithLocalStorage(namespace: string = 'voisss'): MissionService {
  return new PersistentMissionService(createLocalStorageDatabase(namespace));
}

/**
 * Factory function to create mission service with in-memory database.
 * This is suitable for testing and development environments.
 * 
 * @returns MissionService instance
 */
export function createMissionServiceWithMemoryDatabase(): MissionService {
  return new PersistentMissionService(createInMemoryDatabase());
}

// Alias for backward compatibility
export const createPersistentMissionService = createMissionService;
