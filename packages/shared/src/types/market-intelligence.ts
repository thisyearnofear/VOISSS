/**
 * Market Intelligence Types
 * 
 * Types for the Voice Market Intelligence Agent system
 * that researches voice AI market trends and generates audio reports.
 */

import { z } from 'zod';

// Market Intelligence Request
export const MarketIntelligenceRequestSchema = z.object({
  query: z.string().min(1).max(500),
  agentAddress: z.string().optional(),
  voiceId: z.string().optional(),
  depth: z.enum(['quick', 'comprehensive']).default('quick'),
  topic: z.string().optional(),
  publishToMission: z.boolean().default(false),
  missionId: z.string().optional(),
});

export type MarketIntelligenceRequest = z.infer<typeof MarketIntelligenceRequestSchema>;

// Market Intelligence Report
export const MarketIntelligenceReportSchema = z.object({
  id: z.string(),
  query: z.string(),
  topic: z.string().optional(),
  summary: z.string(),
  keyFindings: z.array(z.string()),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string(),
    publishedAt: z.string().optional(),
  })),
  audioUrl: z.string().optional(),
  audioIpfsHash: z.string().optional(),
  missionId: z.string().optional(),
  createdAt: z.union([z.date(), z.string()]),
  createdBy: z.string(),
  agentGenerated: z.boolean().default(true),
  depth: z.enum(['quick', 'comprehensive']),
  processingTimeMs: z.number().optional(),
});

export type MarketIntelligenceReport = z.infer<typeof MarketIntelligenceReportSchema>;

// Market Trend Data
export const MarketTrendSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  description: z.string(),
  currentValue: z.number().optional(),
  previousValue: z.number().optional(),
  changePercent: z.number().optional(),
  trend: z.enum(['up', 'down', 'stable']),
  source: z.string(),
  lastUpdated: z.union([z.date(), z.string()]),
  dataPoints: z.array(z.object({
    date: z.union([z.date(), z.string()]),
    value: z.number(),
  })).optional(),
});

export type MarketTrend = z.infer<typeof MarketTrendSchema>;

// Competitor Data
export const CompetitorDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  website: z.string().optional(),
  marketShare: z.number().optional(),
  pricing: z.array(z.object({
    model: z.string(),
    pricePerMinute: z.number().optional(),
    features: z.array(z.string()),
  })).optional(),
  voiceCount: z.number().optional(),
  languages: z.array(z.string()).optional(),
  lastUpdated: z.union([z.date(), z.string()]),
});

export type CompetitorData = z.infer<typeof CompetitorDataSchema>;

// Voice Licensing Pricing
export const VoicePricingDataSchema = z.object({
  id: z.string(),
  provider: z.string(),
  tier: z.enum(['starter', 'professional', 'enterprise']),
  pricePerCharacter: z.number(),
  pricePerMinute: z.number(),
  annualDiscount: z.number().optional(),
  features: z.array(z.string()),
  languages: z.array(z.string()),
  quality: z.enum(['standard', 'premium', 'ultra']),
  lastUpdated: z.union([z.date(), z.string()]),
});

export type VoicePricingData = z.infer<typeof VoicePricingDataSchema>;

// Research Progress Event
export const MarketResearchProgressSchema = z.object({
  reportId: z.string(),
  stage: z.enum(['init', 'searching', 'analyzing', 'synthesizing', 'generating_voice', 'publishing', 'completed', 'failed']),
  progress: z.number().min(0).max(100),
  message: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.union([z.date(), z.string()]),
});

export type MarketResearchProgress = z.infer<typeof MarketResearchProgressSchema>;

// Firecrawl Search Result
export const FirecrawlSearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  description: z.string().optional(),
  content: z.string().optional(),
  publishedAt: z.string().optional(),
  score: z.number().optional(),
});

export type FirecrawlSearchResult = z.infer<typeof FirecrawlSearchResultSchema>;

// Market Intelligence Config
export const MARKET_INTELLIGENCE_CONFIG = {
  DEFAULT_TOPICS: [
    'voice AI market trends',
    'text to speech pricing',
    'ElevenLabs competitors',
    'voice cloning technology',
    'AI voice generation industry',
  ],
  CACHE_TTL_MS: {
    MARKET_TRENDS: 60 * 60 * 1000, // 1 hour
    PRICING_DATA: 24 * 60 * 60 * 1000, // 24 hours
    COMPETITOR_DATA: 12 * 60 * 60 * 1000, // 12 hours
  },
  MAX_SEARCH_RESULTS: 10,
  MAX_SUMMARY_LENGTH: 2000,
  DEFAULT_VOICE_ID: '21m00tcm4mlvu1f8ms1j', // Rachel voice
} as const;

// Market Intelligence Event Types
export const MARKET_INTELLIGENCE_EVENT_TYPES = {
  MARKET_RESEARCH_STARTED: 'market_intelligence.research_started',
  MARKET_SEARCH_COMPLETED: 'market_intelligence.search_completed',
  MARKET_ANALYSIS_COMPLETED: 'market_intelligence.analysis_completed',
  MARKET_REPORT_GENERATED: 'market_intelligence.report_generated',
  MARKET_REPORT_PUBLISHED: 'market_intelligence.report_published',
  MARKET_RESEARCH_FAILED: 'market_intelligence.research_failed',
} as const;
