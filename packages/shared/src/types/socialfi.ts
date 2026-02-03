import { z } from 'zod';

// Mission System Types
export const QualityCriteriaSchema = z.object({
  audioMinScore: z.number().min(0).max(100).optional(), // 0-100 quality score
  transcriptionRequired: z.boolean().default(false),
  minimumDuration: z.number().optional(), // seconds
  maximumDuration: z.number().optional(), // seconds
});

// Quality Scoring - for mission creators to define scoring rubrics
export const QualityScoreItemSchema = z.object({
  name: z.string(), // e.g., "Engagement Level", "Accuracy", "Clarity"
  description: z.string(), // e.g., "How engaged was the participant?"
  weight: z.number().min(0).max(100), // importance (0-100), sum should = 100
  rubric: z.array(z.object({
    score: z.number().min(0).max(10), // 0-10 scale per criterion
    description: z.string(), // e.g., "10: Very engaged, asking follow-up questions"
  })),
});

export const QualityRubricSchema = z.object({
  missionId: z.string(),
  createdBy: z.string(),
  items: z.array(QualityScoreItemSchema), // e.g., [Engagement, Clarity, Authenticity]
  totalWeight: z.number(), // should be 100
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

// Scoring result for a single submission
export const SubmissionScoreSchema = z.object({
  responseId: z.string(),
  missionId: z.string(),
  scoredBy: z.string(), // mission creator or reviewer address
  scores: z.array(z.object({
    itemName: z.string(), // references QualityRubric.items[].name
    score: z.number().min(0).max(10),
    notes: z.string().optional(),
  })),
  overallScore: z.number().min(0).max(100), // weighted average
  scoredAt: z.union([z.date(), z.string()]),
  notes: z.string().optional(), // general feedback
});

// Reward mapping: score ranges → token amounts
export const RewardMappingSchema = z.object({
  missionId: z.string(),
  createdBy: z.string(),
  brackets: z.array(z.object({
    minScore: z.number().min(0).max(100),
    maxScore: z.number().min(0).max(100),
    papajamsAmount: z.number().min(0), // creator portion
    voisssAmount: z.number().min(0), // platform portion
    description: z.string().optional(), // e.g., "Excellent - top tier"
  })),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export const MissionSchema = z.object({
  // Core fields
  id: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  targetDuration: z.number(), // suggested clip length in seconds (30-600)
  expiresAt: z.union([z.date(), z.string()]),
  locationBased: z.boolean().default(false), // true for taxi/local missions

  // Reward configuration
  baseReward: z.string(), // per submission, calculated from difficulty (string for precision)
  rewardModel: z.enum(['pool', 'flat_rate', 'performance']).default('pool'),
  budgetAllocation: z.string().optional(), // total tokens allocated to mission (string for precision)
  creatorStake: z.string().optional(), // tokens staked by creator for confidence (string for precision)
  curatorReward: z.number().min(0).max(100).default(5), // % of featured rewards to creator
  requiredTier: z.enum(['none', 'basic', 'pro', 'premium']).optional(), // minimum tier required to accept

  // Quality & content
  qualityCriteria: QualityCriteriaSchema.optional(),
  language: z.string().default('en'), // ISO 639-1 code: en, es, fr, etc.

  // Metadata
  createdBy: z.string(), // creator address
  currentParticipants: z.number().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  publishedAt: z.union([z.date(), z.string()]).optional(),
  autoExpire: z.boolean().default(true),

  // Submissions tracking
  submissions: z.array(z.string()).default([]), // array of MissionResponse IDs

  // Additional fields for mission management
  maxParticipants: z.number().min(1).optional(), // max number of participants
  topic: z.string().optional(), // mission topic/category
  tags: z.array(z.string()).optional(), // tags for categorization
  reward: z.number().optional(), // alternative reward field
  examples: z.array(z.string()).optional(), // example responses
  contextSuggestions: z.array(z.string()).optional(), // suggested contexts for recording
});

export type Mission = z.infer<typeof MissionSchema>;
export type CreateMissionInput = z.input<typeof MissionSchema>;
export type QualityCriteria = z.infer<typeof QualityCriteriaSchema>;
export type QualityScoreItem = z.infer<typeof QualityScoreItemSchema>;
export type QualityRubric = z.infer<typeof QualityRubricSchema>;
export type SubmissionScore = z.infer<typeof SubmissionScoreSchema>;
export type RewardMapping = z.infer<typeof RewardMappingSchema>;

export const MissionResponseSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  userId: z.string(), // wallet address of submitter
  recordingId: z.string(),
  recordingIpfsHash: z.string().optional(), // IPFS hash of the recording
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
  submittedAt: z.union([z.date(), z.string()]),
  status: z.enum(['approved', 'flagged', 'removed']).default('approved'), // Auto-approved on submission
  transcription: z.string().optional(),
  sentiment: z.enum(['positive', 'negative', 'neutral', 'mixed']).optional(),

  // Quality Scoring
  qualityScore: z.number().min(0).max(100).optional(), // 0-100 overall score from rubric
  qualityScoreId: z.string().optional(), // reference to SubmissionScore record
  suggestedReward: z.object({
    papajamsAmount: z.number().min(0),
    voisssAmount: z.number().min(0),
  }).optional(), // calculated from RewardMapping based on qualityScore

  // Moderation
  flaggedAt: z.union([z.date(), z.string()]).optional(),
  flagReason: z.string().optional(), // why it was flagged/removed
  removedAt: z.union([z.date(), z.string()]).optional(),
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
  createdAt: z.union([z.date(), z.string()]),
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
  timestamp: z.union([z.date(), z.string()]),
  ipAddress: z.string().optional(),
  location: z.string().optional(),
  canRevoke: z.boolean(),
  revokedAt: z.union([z.date(), z.string()]).optional(),
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
    date: z.union([z.date(), z.string()]),
    recordingCount: z.number(),
    averageSentiment: z.number(),
  })),
  lastUpdated: z.union([z.date(), z.string()]),
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

// Reward Milestones for Mission Completion
export const MilestoneSchema = z.enum([
  'submission',        // Submitted recording to mission
  'quality_approved',  // Passed quality review threshold
  'featured',         // Featured in a highlight reel
]);

export type Milestone = z.infer<typeof MilestoneSchema>;

// Reward Record - tracks earned rewards per user
export const RewardRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  missionId: z.string(),
  responseId: z.string(), // MissionResponse ID
  milestone: MilestoneSchema,
  amountInTokens: z.string(), // string for precision
  earnedAt: z.union([z.date(), z.string()]),
  claimedAt: z.union([z.date(), z.string()]).optional(),
  transactionHash: z.string().optional(),
  status: z.enum(['pending', 'claimed', 'failed']),
});

export type RewardRecord = z.infer<typeof RewardRecordSchema>;

// Milestone Progress - tracks user's progress through reward milestones
export const MilestoneProgressSchema = z.object({
  userId: z.string(),
  missionId: z.string(),
  responseId: z.string(),
  completedMilestones: z.array(MilestoneSchema),
  nextMilestone: MilestoneSchema.optional(),
  totalEarned: z.string(), // string for precision
  qualityScore: z.number().optional(),
  isFeatured: z.boolean().default(false),
  lastUpdated: z.union([z.date(), z.string()]),
});

export type MilestoneProgress = z.infer<typeof MilestoneProgressSchema>;

// Reward Claim - when user claims their earned rewards
export const RewardClaimSchema = z.object({
  id: z.string(),
  userId: z.string(),
  totalAmount: z.string(), // string for precision
  rewardIds: z.array(z.string()),
  claimedAt: z.union([z.date(), z.string()]),
  transactionHash: z.string().optional(),
  status: z.enum(['pending', 'success', 'failed']),
  retryCount: z.number().default(0),
  lastRetryAt: z.union([z.date(), z.string()]).optional(),
  error: z.string().optional(),
});

export type RewardClaim = z.infer<typeof RewardClaimSchema>;

// Utility types for the mission system
export type MissionDifficulty = Mission['difficulty'];
export type MissionStatus = MissionResponse['status'];
export type ConsentType = ConsentRecord['consentType'];
export type PrivacyLevel = ConsentRecord['privacyLevel'];
export type MilestoneType = Milestone;