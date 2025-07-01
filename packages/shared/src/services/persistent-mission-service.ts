/**
 * Persistent Mission Service
 * 
 * Replaces the Map-based DefaultMissionService with proper data persistence.
 * Uses the DatabaseService interface for storage, ensuring data survives page refreshes.
 */

import { Mission, MissionResponse, MISSION_TEMPLATES, MissionDifficulty } from '../types/socialfi';
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
        description: "Ask people in your city what they really think about Web3 and cryptocurrency",
        topic: "crypto",
        difficulty: "easy",
        reward: 10,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        maxParticipants: 100,
        isActive: true,
        createdBy: "platform",
        tags: ["crypto", "web3", "street-interview", "public-opinion"],
        locationBased: true,
        targetDuration: 60,
        examples: [
          "Have you heard of Web3?",
          "What do you think about Bitcoin?",
          "Would you use cryptocurrency for daily purchases?",
          "Do you think blockchain will change the world?"
        ],
        contextSuggestions: ["taxi", "coffee shop", "street", "waiting area"]
      },
      {
        title: "Remote Work Reality Check",
        description: "Capture honest perspectives on how remote work has changed people's lives",
        topic: "work",
        difficulty: "medium",
        reward: 20,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        maxParticipants: 50,
        isActive: true,
        createdBy: "platform",
        tags: ["remote-work", "lifestyle", "productivity", "work-life-balance"],
        locationBased: false,
        targetDuration: 120,
        examples: [
          "How has remote work affected your daily routine?",
          "Do you prefer working from home or the office?",
          "What's the biggest challenge of remote work?",
          "Has remote work made you more or less productive?"
        ],
        contextSuggestions: ["coffee shop", "coworking space", "home office", "video call"]
      },
      {
        title: "Marriage in 2024",
        description: "Explore contemporary views on marriage, commitment, and relationships",
        topic: "relationships",
        difficulty: "hard",
        reward: 50,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        maxParticipants: 25,
        isActive: true,
        createdBy: "platform",
        tags: ["marriage", "relationships", "commitment", "modern-love"],
        locationBased: false,
        targetDuration: 300,
        examples: [
          "What makes a good marriage in today's world?",
          "Is marriage still relevant?",
          "How do you know when you've found 'the one'?",
          "What's the biggest challenge facing couples today?"
        ],
        contextSuggestions: ["dinner conversation", "wedding", "anniversary", "intimate setting"]
      },
      {
        title: "AI Anxiety or Excitement?",
        description: "Document real people's feelings about AI's impact on their lives and work",
        topic: "technology",
        difficulty: "medium",
        reward: 25,
        expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
        maxParticipants: 75,
        isActive: true,
        createdBy: "platform",
        tags: ["ai", "technology", "future", "jobs", "automation"],
        locationBased: true,
        targetDuration: 180,
        examples: [
          "How do you feel about AI taking over jobs?",
          "Have you used ChatGPT or other AI tools?",
          "What excites or worries you most about AI?",
          "Do you think AI will make life better or worse?"
        ],
        contextSuggestions: ["workplace", "university", "tech meetup", "casual conversation"]
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

  async createMission(missionData: Omit<Mission, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipants'>): Promise<Mission> {
    await this.ensureInitialized();

    try {
      const mission: Mission = {
        ...missionData,
        id: this.generateId(),
        currentParticipants: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
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

  async getMissionsByTopic(topic: string): Promise<Mission[]> {
    await this.ensureInitialized();

    try {
      const activeMissions = await this.getActiveMissions();
      return activeMissions.filter(mission => mission.topic === topic);
    } catch (error) {
      throw new DatabaseOperationError(
        `Failed to get missions for topic ${topic}`,
        COLLECTIONS.MISSIONS,
        'getMissionsByTopic'
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
      title: template.title,
      description: template.description,
      topic: templateKey,
      difficulty: template.difficulty,
      reward: baseReward,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
      maxParticipants: 100,
      isActive: true,
      createdBy: "platform",
      tags: [templateKey, template.difficulty],
      locationBased: (template.contextSuggestions as unknown as string[]).includes("taxi") || 
                    (template.contextSuggestions as unknown as string[]).includes("street"),
      targetDuration: template.targetDuration,
      examples: [...template.examples],
      contextSuggestions: [...template.contextSuggestions],
      ...customizations,
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