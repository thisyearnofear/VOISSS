import { Mission, MissionResponse, MISSION_TEMPLATES, MissionDifficulty } from '../types/socialfi';

export interface MissionService {
  // Mission Management
  getActiveMissions(): Promise<Mission[]>;
  getMissionById(id: string): Promise<Mission | null>;
  createMission(mission: Omit<Mission, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipants'>): Promise<Mission>;
  updateMission(id: string, updates: Partial<Mission>): Promise<Mission>;
  deactivateMission(id: string): Promise<void>;
  
  // Mission Participation
  acceptMission(missionId: string, userId: string): Promise<boolean>;
  submitMissionResponse(response: Omit<MissionResponse, 'id' | 'submittedAt'>): Promise<MissionResponse>;
  getUserMissions(userId: string): Promise<{ active: Mission[], completed: MissionResponse[] }>;
  
  // Mission Discovery
  getMissionsByTopic(topic: string): Promise<Mission[]>;
  getMissionsByLocation(city: string, country: string): Promise<Mission[]>;
  getRecommendedMissions(userId: string): Promise<Mission[]>;
  
  // Mission Templates
  getMissionTemplates(): any; // Flexible return type for templates
  createMissionFromTemplate(templateKey: string, templateIndex: number, customizations?: Partial<Mission>): Promise<Mission>;
  
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

  constructor() {
    this.initializeDefaultMissions();
  }

  private initializeDefaultMissions() {
    // Create some default missions for demo purposes
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

  async getActiveMissions(): Promise<Mission[]> {
    const now = new Date();
    return Array.from(this.missions.values())
      .filter(mission => mission.isActive && mission.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getMissionById(id: string): Promise<Mission | null> {
    return this.missions.get(id) || null;
  }

  async createMission(missionData: Omit<Mission, 'id' | 'createdAt' | 'updatedAt' | 'currentParticipants'>): Promise<Mission> {
    const mission: Mission = {
      ...missionData,
      id: this.generateId(),
      currentParticipants: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
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
    };

    this.responses.set(response.id, response);
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

  async getMissionsByTopic(topic: string): Promise<Mission[]> {
    const activeMissions = await this.getActiveMissions();
    return activeMissions.filter(mission => mission.topic === topic);
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
    if (!templates || !templates[templateIndex]) {
      throw new Error(`Template not found: ${templateKey}[${templateIndex}]`);
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
      locationBased: (template.contextSuggestions as unknown as string[]).includes("taxi") || (template.contextSuggestions as unknown as string[]).includes("street"),
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
    const mission = this.missions.get(missionId);
    if (!mission) {
      throw new Error(`Mission ${missionId} not found`);
    }

    const responses = Array.from(this.responses.values())
      .filter(response => response.missionId === missionId);

    const totalResponses = responses.length;
    const averageQuality = responses.length > 0 
      ? responses.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / responses.length 
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
      averageQuality,
      geographicDistribution,
      completionRate,
    };
  }
}

// Factory function to create mission service
export function createMissionService(): MissionService {
  return new DefaultMissionService();
}