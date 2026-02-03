import {
  Mission,
  CreateMissionInput,
  MissionResponse,
  RewardRecord,
  MilestoneProgress,
  Milestone,
  RewardClaim,
  QualityCriteria,
} from '../types/socialfi';

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
  getCreatorEarnings(userId: string): Promise<{ totalEarned: string; totalClaimed: string; pendingRewards: string; unclaimedCount: number }>;

  // Moderation & Quality
  validateQualityCriteria(response: MissionResponse, criteria?: QualityCriteria): Promise<{ passed: boolean; reasons: string[] }>;
  calculateRewardAmount(mission: Mission, milestone: Milestone, qualityScore?: number, participantCount?: number): Promise<string>;

  // Analytics
  getMissionStats(missionId: string): Promise<{
    totalResponses: number;
    averageQuality: number;
    geographicDistribution: Record<string, number>;
    completionRate: number;
  }>;
}
