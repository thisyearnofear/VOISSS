import { z } from 'zod';

// Mission System Types
export const MissionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  topic: z.string(), // "crypto", "gender-roles", "marriage", etc.
  difficulty: z.enum(['easy', 'medium', 'hard']),
  reward: z.number(), // STRK tokens
  expiresAt: z.date(),
  maxParticipants: z.number().optional(),
  currentParticipants: z.number(),
  isActive: z.boolean(),
  createdBy: z.string(), // curator address
  tags: z.array(z.string()),
  locationBased: z.boolean(), // true for taxi/local missions
  targetDuration: z.number(), // suggested clip length in seconds
  examples: z.array(z.string()), // example questions or conversation starters
  contextSuggestions: z.array(z.string()), // "taxi", "coffee shop", "street", etc.
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Mission = z.infer<typeof MissionSchema>;

export const MissionResponseSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  userId: z.string(),
  recordingId: z.string(),
  location: z.object({
    city: z.string(),
    country: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  context: z.string(), // "taxi", "coffee shop", "street interview", etc.
  participantConsent: z.boolean(),
  consentProof: z.string().optional(), // IPFS hash of consent recording/document
  isAnonymized: z.boolean(),
  voiceObfuscated: z.boolean(),
  submittedAt: z.date(),
  status: z.enum(['pending', 'approved', 'rejected', 'featured']),
  qualityScore: z.number().optional(), // 0-100 based on audio quality and content
  transcription: z.string().optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']).optional(),
  moderationFlags: z.array(z.string()).optional(),
});

export type MissionResponse = z.infer<typeof MissionResponseSchema>;

// Curation & Collections
export const HighlightReelSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  topic: z.string(),
  curatorAddress: z.string(),
  recordings: z.array(z.object({
    recordingId: z.string(),
    startTime: z.number().optional(), // for clips
    endTime: z.number().optional(),
    weight: z.number(), // importance in the reel (0-1)
  })),
  totalDuration: z.number(),
  rewardSplits: z.array(z.object({
    address: z.string(),
    percentage: z.number(), // 0-100
    role: z.enum(['creator', 'curator', 'platform']),
  })),
  mintedCoinId: z.string().optional(),
  createdAt: z.date(),
  isPublic: z.boolean(),
  tags: z.array(z.string()),
  geographicScope: z.string().optional(), // "global", "NYC", "Tokyo", etc.
});

export type HighlightReel = z.infer<typeof HighlightReelSchema>;

// Creator Economy
export const CreatorStatsSchema = z.object({
  userId: z.string(),
  totalRecordings: z.number(),
  totalEarnings: z.number(), // in STRK
  averageQualityScore: z.number(),
  topTopics: z.array(z.string()),
  followerCount: z.number(),
  featuredCount: z.number(), // how many times featured in highlight reels
  missionCompletions: z.number(),
  reputation: z.number(), // 0-100 based on community ratings
  badges: z.array(z.string()), // achievement badges
});

export type CreatorStats = z.infer<typeof CreatorStatsSchema>;

// Consent & Privacy
export const ConsentRecordSchema = z.object({
  id: z.string(),
  recordingId: z.string(),
  participantId: z.string().optional(), // if they provided identity
  consentType: z.enum(['verbal', 'written', 'digital']),
  consentText: z.string(), // what they agreed to
  consentAudioHash: z.string().optional(), // IPFS hash of consent recording
  timestamp: z.date(),
  ipAddress: z.string().optional(),
  location: z.string().optional(),
  canRevoke: z.boolean(),
  revokedAt: z.date().optional(),
  privacyLevel: z.enum(['public', 'anonymous', 'private']),
  dataRetentionPeriod: z.number().optional(), // days
});

export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;

// Analytics & Insights
export const TopicInsightSchema = z.object({
  topic: z.string(),
  totalRecordings: z.number(),
  averageSentiment: z.number(), // -1 to 1
  geographicDistribution: z.record(z.string(), z.number()), // country/city -> count
  demographicBreakdown: z.object({
    ageGroups: z.record(z.string(), z.number()).optional(),
    contexts: z.record(z.string(), z.number()), // taxi, street, etc.
  }),
  trendingKeywords: z.array(z.string()),
  timeSeriesData: z.array(z.object({
    date: z.date(),
    recordingCount: z.number(),
    averageSentiment: z.number(),
  })),
  lastUpdated: z.date(),
});

export type TopicInsight = z.infer<typeof TopicInsightSchema>;

// Platform Configuration
export const PlatformConfigSchema = z.object({
  missionCategories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    icon: z.string(),
    color: z.string(),
    defaultReward: z.number(),
  })),
  rewardStructure: z.object({
    creatorShare: z.number(), // percentage
    curatorShare: z.number(),
    platformShare: z.number(),
    minimumReward: z.number(),
    maximumReward: z.number(),
  }),
  qualityThresholds: z.object({
    minimumDuration: z.number(), // seconds
    maximumDuration: z.number(),
    minimumQualityScore: z.number(),
    requiresTranscription: z.boolean(),
  }),
  privacySettings: z.object({
    defaultConsentRequired: z.boolean(),
    allowAnonymousRecordings: z.boolean(),
    dataRetentionDays: z.number(),
    allowVoiceObfuscation: z.boolean(),
  }),
});

export type PlatformConfig = z.infer<typeof PlatformConfigSchema>;

// Mission Templates for Quick Creation
export const MISSION_TEMPLATES = {
  crypto: [
    {
      title: "Web3 Awareness Check",
      description: "Ask someone what they know about Web3 and blockchain technology",
      examples: ["Have you heard of Web3?", "What do you think about cryptocurrency?", "Do you use any blockchain apps?"],
      contextSuggestions: ["taxi", "coffee shop", "waiting area", "casual conversation"],
      targetDuration: 60,
      difficulty: "easy" as const,
    },
    {
      title: "Crypto Investment Perspectives",
      description: "Explore people's views on cryptocurrency as an investment",
      examples: ["Would you invest in Bitcoin?", "What's your biggest concern about crypto?", "How do you see crypto's future?"],
      contextSuggestions: ["financial district", "business meeting", "networking event"],
      targetDuration: 180,
      difficulty: "medium" as const,
    },
  ],
  social: [
    {
      title: "Remote Work Reality",
      description: "Capture perspectives on how remote work has changed people's lives",
      examples: ["How has remote work affected you?", "Do you prefer working from home?", "What's the biggest challenge of remote work?"],
      contextSuggestions: ["coffee shop", "coworking space", "home office"],
      targetDuration: 120,
      difficulty: "easy" as const,
    },
    {
      title: "Social Media Impact",
      description: "Explore how social media has changed relationships and communication",
      examples: ["How has social media changed dating?", "Do you think social media makes us more or less connected?", "What would life be like without social media?"],
      contextSuggestions: ["casual conversation", "dinner", "social gathering"],
      targetDuration: 240,
      difficulty: "medium" as const,
    },
  ],
  relationships: [
    {
      title: "Modern Marriage Views",
      description: "Understand contemporary perspectives on marriage and commitment",
      examples: ["What makes a good marriage?", "Is marriage still relevant today?", "How do you know when you've found 'the one'?"],
      contextSuggestions: ["dinner conversation", "wedding", "anniversary celebration"],
      targetDuration: 300,
      difficulty: "hard" as const,
    },
  ],
  local: [
    {
      title: "Neighborhood Changes",
      description: "Document how local communities are evolving",
      examples: ["How has this neighborhood changed?", "What do you love most about living here?", "What would you change about this area?"],
      contextSuggestions: ["local business", "community event", "street interview"],
      targetDuration: 150,
      difficulty: "medium" as const,
    },
  ],
} as const;

// Utility types for the mission system
export type MissionDifficulty = Mission['difficulty'];
export type MissionStatus = MissionResponse['status'];
export type ConsentType = ConsentRecord['consentType'];
export type PrivacyLevel = ConsentRecord['privacyLevel'];