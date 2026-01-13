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
  QualityCriteria,
} from '../types/socialfi';
import { PLATFORM_CONFIG, getRewardForMilestone } from '../config/platform';

export interface MissionService {
  // Mission Management
  getActiveMissions(): Promise<Mission[]>;
  getMissionById(id: string): Promise<Mission | null>;
  createMission(mission: Omit<CreateMissionInput, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipants'>): Promise<Mission>;
  updateMission(id: string, updates: Partial<Mission>): Promise<Mission>;
  deactivateMission(id: string): Promise<void>;

  // Mission Participation
  acceptMission(missionId: string, userId: string): Promise<boolean>;
  submitMissionResponse(response: Omit<MissionResponse, 'id' | 'submittedAt'>): Promise<MissionResponse>;
  getUserMissions(userId: string): Promise<{ active: Mission[], completed: MissionResponse[] }>;
  
  // Submission Management
  getSubmission(id: string): Promise<MissionResponse | null>;
  getSubmissionsByMission(missionId: string, status?: MissionResponse['status']): Promise<MissionResponse[]>;
  getAllSubmissions(filters?: { status?: MissionResponse['status']; missionId?: string; userId?: string; after?: Date }): Promise<MissionResponse[]>;
  flagSubmission(submissionId: string, reason: string): Promise<MissionResponse>;
  removeSubmission(submissionId: string, reason: string): Promise<MissionResponse>;
  updateEngagement(submissionId: string, views: number, likes: number, comments: number): Promise<MissionResponse>;

  // Mission Discovery
  getMissionsByLocation(city: string, country: string): Promise<Mission[]>;
  getRecommendedMissions(userId: string): Promise<Mission[]>;

  // Mission Templates
  getMissionTemplates(): any;
  createMissionFromTemplate(templateKey: string, templateIndex: number, customizations?: Partial<Mission>): Promise<Mission>;

  // Reward Management
  createRewardForMilestone(userId: string, missionId: string, responseId: string, milestone: Milestone, qualityScore?: number): Promise<RewardRecord>;
  getMilestoneProgress(userId: string, missionId: string, responseId: string): Promise<MilestoneProgress>;
  completeMilestone(userId: string, missionId: string, responseId: string, milestone: Milestone, qualityScore?: number): Promise<MilestoneProgress>;
  getUnclaimedRewards(userId: string): Promise<RewardRecord[]>;
  claimRewards(userId: string, rewardIds: string[]): Promise<RewardClaim>;
  getCreatorEarnings(userId: string): Promise<{ totalEarned: number; totalClaimed: number; pendingRewards: number; unclaimedCount: number }>;

  // Moderation & Quality
  validateQualityCriteria(response: MissionResponse, criteria?: QualityCriteria): Promise<{ passed: boolean; reasons: string[] }>;
  calculateRewardAmount(mission: Mission, milestone: Milestone, qualityScore?: number, participantCount?: number): Promise<number>;

  // Analytics
  getMissionStats(missionId: string): Promise<{
    totalResponses: number;
    averageQuality: number;
    geographicDistribution: Record<string, number>;
    completionRate: number;
  }>;
}

export class DefaultMissionService implements MissionService {
  private missions: Map<string, Mission> = new Map();
  private responses: Map<string, MissionResponse> = new Map();
  private userMissions: Map<string, string[]> = new Map(); // userId -> missionIds
  private rewards: Map<string, RewardRecord> = new Map();
  private progress: Map<string, MilestoneProgress> = new Map();
  private claims: Map<string, RewardClaim> = new Map();

  constructor() {
    this.initializeDefaultMissions();
  }

  private initializeDefaultMissions() {
    // Create some default missions for demo purposes
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
        submissions: [],
        qualityCriteria: {
          audioMinScore: 65,
          transcriptionRequired: true,
        },
      }
    ];

    defaultMissions.forEach(mission => {
      const fullMission: Mission = {
        ...mission,
        id: this.generateId(),
        currentParticipants: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.missions.set(fullMission.id, fullMission);
    });
  }

  private generateId(): string {
    return `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  // Quality Validation - now auto-approve on submission, so this is optional
  async validateQualityCriteria(
    response: MissionResponse,
    criteria?: QualityCriteria
  ): Promise<{ passed: boolean; reasons: string[] }> {
    const failures: string[] = [];

    if (!criteria) {
      return { passed: true, reasons: [] };
    }

    // Check transcription requirement
    if (criteria.transcriptionRequired && !response.transcription) {
      failures.push('Transcription required but not provided');
    }

    // Check duration bounds (if we had duration in response)
    // This would require parsing the recording metadata
    // For now, we'll assume these are validated at submission

    return {
      passed: failures.length === 0,
      reasons: failures,
    };
  }

  async getActiveMissions(): Promise<Mission[]> {
    const now = new Date();
    return Array.from(this.missions.values())
      .filter(mission => mission.isActive && mission.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getMissionById(id: string): Promise<Mission | null> {
    return this.missions.get(id) || null;
  }

  async createMission(missionData: Omit<CreateMissionInput, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipants'>): Promise<Mission> {
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

    this.missions.set(mission.id, mission);
    return mission;
  }

  async updateMission(id: string, updates: Partial<Mission>): Promise<Mission> {
    const mission = this.missions.get(id);
    if (!mission) {
      throw new Error(`Mission ${id} not found`);
    }

    const updatedMission = {
      ...mission,
      ...updates,
      updatedAt: new Date(),
    };

    this.missions.set(id, updatedMission);
    return updatedMission;
  }

  async deactivateMission(id: string): Promise<void> {
    await this.updateMission(id, { isActive: false });
  }

  async acceptMission(missionId: string, userId: string): Promise<boolean> {
    const mission = this.missions.get(missionId);
    if (!mission || !mission.isActive || mission.expiresAt < new Date()) {
      return false;
    }

    if (mission.maxParticipants && mission.currentParticipants >= mission.maxParticipants) {
      return false;
    }

    // Add to user's active missions
    const userMissions = this.userMissions.get(userId) || [];
    if (!userMissions.includes(missionId)) {
      userMissions.push(missionId);
      this.userMissions.set(userId, userMissions);

      // Increment participant count
      await this.updateMission(missionId, {
        currentParticipants: mission.currentParticipants + 1
      });
    }

    return true;
  }

  async submitMissionResponse(responseData: Omit<MissionResponse, 'id' | 'submittedAt'>): Promise<MissionResponse> {
    const response: MissionResponse = {
      ...responseData,
      id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      submittedAt: new Date(),
      status: 'approved', // Auto-approve on submission
      views: responseData.views || 0,
      likes: responseData.likes || 0,
      comments: responseData.comments || 0,
    };

    this.responses.set(response.id, response);

    // Update mission: add submission to submissions array
    const mission = this.missions.get(responseData.missionId);
    if (mission) {
      mission.submissions = mission.submissions || [];
      mission.submissions.push(response.id);
      mission.updatedAt = new Date();
    }

    // Automatically complete 'submission' milestone
    await this.completeMilestone(responseData.userId, responseData.missionId, response.id, 'submission', 0);

    return response;
  }

  async getUserMissions(userId: string): Promise<{ active: Mission[], completed: MissionResponse[] }> {
    const userMissionIds = this.userMissions.get(userId) || [];
    const active = userMissionIds
      .map(id => this.missions.get(id))
      .filter((mission): mission is Mission => mission !== undefined && mission.isActive);

    const completed = Array.from(this.responses.values())
      .filter(response => response.userId === userId);

    return { active, completed };
  }

  async getMissionsByLocation(city: string, country: string): Promise<Mission[]> {
    const activeMissions = await this.getActiveMissions();
    return activeMissions.filter(mission => mission.locationBased);
  }

  async getRecommendedMissions(userId: string): Promise<Mission[]> {
    // Simple recommendation: return active missions the user hasn't accepted yet
    const { active: userActiveMissions } = await this.getUserMissions(userId);
    const userMissionIds = new Set(userActiveMissions.map(m => m.id));

    const allActive = await this.getActiveMissions();
    return allActive
      .filter(mission => !userMissionIds.has(mission.id))
      .slice(0, 5); // Return top 5 recommendations
  }

  getMissionTemplates(): typeof MISSION_TEMPLATES {
    return MISSION_TEMPLATES;
  }

  async createMissionFromTemplate(
    templateKey: string,
    templateIndex: number,
    customizations?: Partial<Mission>
  ): Promise<Mission> {
    const templates = MISSION_TEMPLATES[templateKey as keyof typeof MISSION_TEMPLATES];
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
      submissions: [],
      tags: customizations?.tags || [templateKey, template.difficulty],
      locationBased: customizations?.locationBased ?? ((template.contextSuggestions as unknown as string[]).includes("taxi") || (template.contextSuggestions as unknown as string[]).includes("street")),
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
    const mission = this.missions.get(missionId);
    if (!mission) {
      throw new Error(`Mission ${missionId} not found`);
    }

    const responses = Array.from(this.responses.values())
      .filter(response => response.missionId === missionId);

    const totalResponses = responses.length;
    // Average engagement score (views + likes + comments)
    const averageEngagement = responses.length > 0
      ? responses.reduce((sum, r) => sum + (r.views + r.likes + r.comments), 0) / responses.length
      : 0;

    const geographicDistribution: Record<string, number> = {};
    responses.forEach(response => {
      const location = `${response.location.city}, ${response.location.country}`;
      geographicDistribution[location] = (geographicDistribution[location] || 0) + 1;
    });

    const completionRate = mission.currentParticipants > 0
      ? (totalResponses / mission.currentParticipants) * 100
      : 0;

    return {
      totalResponses,
      averageQuality: Math.round(averageEngagement),
      geographicDistribution,
      completionRate,
    };
  }

  // ===== REWARD MANAGEMENT =====

  private getProgressKey(userId: string, missionId: string, responseId: string): string {
    return `${userId}:${missionId}:${responseId}`;
  }

  async createRewardForMilestone(
    userId: string,
    missionId: string,
    responseId: string,
    milestone: Milestone,
    qualityScore?: number
  ): Promise<RewardRecord> {
    const mission = this.missions.get(missionId);
    if (!mission) {
      throw new Error(`Mission ${missionId} not found`);
    }

    const amountInTokens = await this.calculateRewardAmount(mission, milestone, qualityScore);

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

    this.rewards.set(reward.id, reward);
    return reward;
  }

  async getMilestoneProgress(
    userId: string,
    missionId: string,
    responseId: string
  ): Promise<MilestoneProgress> {
    const key = this.getProgressKey(userId, missionId, responseId);

    if (this.progress.has(key)) {
      return this.progress.get(key)!;
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

    this.progress.set(key, newProgress);
    return newProgress;
  }

  async completeMilestone(
    userId: string,
    missionId: string,
    responseId: string,
    milestone: Milestone,
    qualityScore?: number
  ): Promise<MilestoneProgress> {
    const key = this.getProgressKey(userId, missionId, responseId);
    const progress = await this.getMilestoneProgress(userId, missionId, responseId);

    if (progress.completedMilestones.includes(milestone)) {
      return progress;
    }

    const reward = await this.createRewardForMilestone(userId, missionId, responseId, milestone);

    const milestoneSequence: Milestone[] = ['submission', 'quality_approved', 'featured'];
    const nextIndex = milestoneSequence.findIndex(m => !progress.completedMilestones.includes(m));

    const updated: MilestoneProgress = {
      ...progress,
      completedMilestones: [...progress.completedMilestones, milestone],
      totalEarned: progress.totalEarned + reward.amountInTokens,
      qualityScore,
      isFeatured: milestone === 'featured',
      nextMilestone: nextIndex >= 0 ? milestoneSequence[nextIndex] : undefined,
      lastUpdated: new Date(),
    };

    this.progress.set(key, updated);
    return updated;
  }

  async getUnclaimedRewards(userId: string): Promise<RewardRecord[]> {
    return Array.from(this.rewards.values()).filter(
      r => r.userId === userId && r.status === 'pending'
    );
  }

  async claimRewards(userId: string, rewardIds: string[]): Promise<RewardClaim> {
    const recordsToClaimArray = rewardIds
      .map(id => this.rewards.get(id))
      .filter((r): r is RewardRecord => r !== undefined && r.userId === userId);

    if (recordsToClaimArray.length === 0) {
      throw new Error('No valid rewards to claim');
    }

    const totalAmount = recordsToClaimArray.reduce((sum, r) => sum + r.amountInTokens, 0);

    const claim: RewardClaim = {
      id: `claim_${this.generateId()}`,
      userId,
      totalAmount,
      rewardIds,
      claimedAt: new Date(),
      status: 'pending',
      retryCount: 0,
    };

    for (const record of recordsToClaimArray) {
      this.rewards.set(record.id, {
        ...record,
        status: 'claimed',
        claimedAt: new Date(),
      });
    }

    this.claims.set(claim.id, claim);
    return claim;
  }

  async getCreatorEarnings(userId: string): Promise<{
    totalEarned: number;
    totalClaimed: number;
    pendingRewards: number;
    unclaimedCount: number;
  }> {
    const userRewards = Array.from(this.rewards.values()).filter(r => r.userId === userId);

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
  }

  // ===== SUBMISSION MANAGEMENT =====

  async getSubmission(id: string): Promise<MissionResponse | null> {
    return this.responses.get(id) || null;
  }

  async getSubmissionsByMission(missionId: string, status?: MissionResponse['status']): Promise<MissionResponse[]> {
    const submissions = Array.from(this.responses.values())
      .filter(r => r.missionId === missionId);
    
    if (status) {
      return submissions.filter(r => r.status === status);
    }
    return submissions;
  }

  async getAllSubmissions(filters?: {
    status?: MissionResponse['status'];
    missionId?: string;
    userId?: string;
    after?: Date;
  }): Promise<MissionResponse[]> {
    let submissions = Array.from(this.responses.values());

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
      submissions = submissions.filter(r => r.submittedAt >= filters.after!);
    }

    // Sort by submission date, newest first
    return submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  async flagSubmission(submissionId: string, reason: string): Promise<MissionResponse> {
    const submission = this.responses.get(submissionId);
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    const updated: MissionResponse = {
      ...submission,
      status: 'flagged',
      flaggedAt: new Date(),
      flagReason: reason,
    };

    this.responses.set(submissionId, updated);
    return updated;
  }

  async removeSubmission(submissionId: string, reason: string): Promise<MissionResponse> {
    const submission = this.responses.get(submissionId);
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    const updated: MissionResponse = {
      ...submission,
      status: 'removed',
      removedAt: new Date(),
      flagReason: reason,
    };

    this.responses.set(submissionId, updated);

    // Remove from mission's submissions array
    const mission = this.missions.get(submission.missionId);
    if (mission && mission.submissions) {
      mission.submissions = mission.submissions.filter(id => id !== submissionId);
      mission.updatedAt = new Date();
    }

    return updated;
  }

  async updateEngagement(submissionId: string, views: number, likes: number, comments: number): Promise<MissionResponse> {
    const submission = this.responses.get(submissionId);
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    const updated: MissionResponse = {
      ...submission,
      views,
      likes,
      comments,
    };

    this.responses.set(submissionId, updated);
    return updated;
  }
}

// Factory function to create mission service
export function createMissionService(): MissionService {
  return new DefaultMissionService();
}