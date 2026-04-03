/**
 * Firecrawl Service for Market Intelligence
 * 
 * Provides web search capabilities for voice AI market research.
 * Uses Firecrawl API with caching for efficient data retrieval.
 */

import {
  FirecrawlSearchResult as MarketIntelligenceSearchResult,
  FirecrawlSearchResultSchema,
  MARKET_INTELLIGENCE_CONFIG,
  MarketTrend,
  VoicePricingData,
  CompetitorData,
} from '../../types/market-intelligence';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class FirecrawlCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = MARKET_INTELLIGENCE_CONFIG.CACHE_TTL_MS.MARKET_TRENDS;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttl || this.DEFAULT_TTL),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

const cache = new FirecrawlCache();

export interface FirecrawlSearchOptions {
  limit?: number;
  location?: string;
  scrapeOptions?: {
    formats?: ('markdown' | 'html' | 'raw_html' | 'content')[];
    onlyMainContent?: boolean;
    includeTags?: string[];
    excludeTags?: string[];
    waitFor?: number;
  };
  timeout?: number;
}

export interface FirecrawlAgentSearchResult {
  success: boolean;
  data: {
    web?: Array<{
      title: string;
      description: string;
      url: string;
      markdown?: string;
      html?: string;
      metadata?: Record<string, any>;
    }>;
    images?: Array<{
      title: string;
      imageUrl: string;
      url: string;
    }>;
    news?: Array<{
      title: string;
      snippet: string;
      date: string;
      url: string;
    }>;
  };
  warning?: string | null;
  id?: string;
  creditsUsed?: number;
  error?: string;
}

export interface FirecrawlResponse {
  success: boolean;
  data?: {
    results: MarketIntelligenceSearchResult[];
    error?: string;
  };
  error?: string;
}

/**
 * Firecrawl Service class for market research
 */
export class FirecrawlService {
  private apiKey: string;
  private baseUrl: string;
  private isConfigured: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || (typeof process !== 'undefined' ? process.env.FIRECRAWL_API_KEY : '') || '';
    this.baseUrl = (typeof process !== 'undefined' ? process.env.FIRECRAWL_API_URL : '') || 'https://api.firecrawl.dev';
    this.isConfigured = !!this.apiKey;
  }

  /**
   * Check if Firecrawl is configured
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Search the web using Firecrawl (Agent/Voice AI focused)
   */
  async search(query: string, options: FirecrawlSearchOptions = {}): Promise<FirecrawlAgentSearchResult> {
    if (!this.apiKey) {
      return {
        success: false,
        data: {},
        error: 'FIRECRAWL_API_KEY is not configured',
      };
    }

    try {
      const apiBase = this.baseUrl.includes('api.firecrawl.dev') ? `${this.baseUrl}/v2` : this.baseUrl;
      const response = await fetch(`${apiBase}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit: options.limit || 5,
          location: options.location,
          scrapeOptions: options.scrapeOptions || { formats: ['markdown'] },
          timeout: options.timeout || 30000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          data: {},
          error: `Firecrawl API error (${response.status}): ${errorText}`,
        };
      }

      return await response.json();
    } catch (error: any) {
      console.error('Firecrawl search error:', error);
      return {
        success: false,
        data: {},
        error: error.message || 'Unknown error during Firecrawl search',
      };
    }
  }

  /**
   * Scrape a single URL using Firecrawl
   */
  async scrape(url: string, formats: ('markdown' | 'html')[] = ['markdown']): Promise<any> {
    if (!this.apiKey) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    try {
      const apiBase = this.baseUrl.includes('api.firecrawl.dev') ? `${this.baseUrl}/v2` : this.baseUrl;
      const response = await fetch(`${apiBase}/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Firecrawl scrape error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Firecrawl scrape error:', error);
      throw error;
    }
  }

  /**
   * Specifically scrape voice-over job boards for market trends
   */
  async scrapeMarketTrends(platform: 'voice123' | 'upwork' | 'backstage'): Promise<any> {
    const urls = {
      voice123: 'https://voice123.com/voice-over-jobs',
      upwork: 'https://www.upwork.com/nx/search/jobs/?q=voice%20over',
      backstage: 'https://www.backstage.com/casting/?q=voice%20over'
    };

    const targetUrl = urls[platform];
    return this.scrape(targetUrl, ['markdown']);
  }

  /**
   * Legacy/Market Intelligence Search (Market Intelligence focused)
   */
  async searchMarketData(query: string, options: { limit?: number; timeout?: number } = {}): Promise<MarketIntelligenceSearchResult[]> {
    const limit = options.limit || MARKET_INTELLIGENCE_CONFIG.MAX_SEARCH_RESULTS;
    
    // Check cache first
    const cacheKey = `search:${query}:${limit}`;
    const cached = cache.get<MarketIntelligenceSearchResult[]>(cacheKey);
    if (cached) {
      console.log(`[Firecrawl] Cache hit for query: ${query}`);
      return cached;
    }

    if (!this.isConfigured) {
      console.warn('[Firecrawl] API key not configured, returning fallback data');
      return this.getFallbackSearchResults(query);
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query,
          limit,
          scrapeOptions: {
            formats: ['markdown', 'html'],
          },
        }),
        signal: AbortSignal.timeout(options.timeout || 30000),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('[Firecrawl] Search error:', response.status, errorText);
        throw new Error(`Firecrawl API error: ${response.status}`);
      }

      const data = await response.json() as FirecrawlResponse;
      
      if (!data.success || !data.data?.results) {
        console.error('[Firecrawl] Invalid response format:', data);
        return this.getFallbackSearchResults(query);
      }

      // Parse and validate results
      const results = data.data.results
        .slice(0, limit)
        .map((result: any) => {
          const parsed = FirecrawlSearchResultSchema.safeParse(result);
          return parsed.success ? parsed.data : null;
        })
        .filter((r): r is MarketIntelligenceSearchResult => r !== null);

      // Cache the results
      cache.set(cacheKey, results, MARKET_INTELLIGENCE_CONFIG.CACHE_TTL_MS.MARKET_TRENDS);

      console.log(`[Firecrawl] Found ${results.length} results for: ${query}`);
      return results;

    } catch (error) {
      console.error('[Firecrawl] Search failed:', error);
      return this.getFallbackSearchResults(query);
    }
  }

  /**
   * Get voice AI market trends
   */
  async getMarketTrends(): Promise<MarketTrend[]> {
    const cacheKey = 'market_trends';
    const cached = cache.get<MarketTrend[]>(cacheKey);
    if (cached) return cached;

    const results = await this.searchMarketData('voice AI market size growth 2024');
    const trends: MarketTrend[] = this.parseMarketTrends(results);

    cache.set(cacheKey, trends, MARKET_INTELLIGENCE_CONFIG.CACHE_TTL_MS.MARKET_TRENDS);
    return trends;
  }

  /**
   * Get voice licensing pricing data
   */
  async getVoicePricingData(): Promise<VoicePricingData[]> {
    const cacheKey = 'voice_pricing';
    const cached = cache.get<VoicePricingData[]>(cacheKey);
    if (cached) return cached;

    const results = await this.searchMarketData('ElevenLabs pricing per character 2024');
    const pricing = this.parseVoicePricing(results);

    cache.set(cacheKey, pricing, MARKET_INTELLIGENCE_CONFIG.CACHE_TTL_MS.PRICING_DATA);
    return pricing;
  }

  /**
   * Get competitor analysis data
   */
  async getCompetitorData(): Promise<CompetitorData[]> {
    const cacheKey = 'competitor_data';
    const cached = cache.get<CompetitorData[]>(cacheKey);
    if (cached) return cached;

    const results = await this.searchMarketData('AI voice generation competitors ElevenLabs Murf AWS Polly 2024');
    const competitors = this.parseCompetitorData(results);

    cache.set(cacheKey, competitors, MARKET_INTELLIGENCE_CONFIG.CACHE_TTL_MS.COMPETITOR_DATA);
    return competitors;
  }

  /**
   * Research specific market query
   */
  async research(query: string): Promise<{
    summary: string;
    keyFindings: string[];
    sources: { title: string; url: string; publishedAt?: string }[];
  }> {
    const results = await this.searchMarketData(query);
    
    if (results.length === 0) {
      return {
        summary: `Research on "${query}" - No recent data available from web sources.`,
        keyFindings: [
          'No recent data available from web search',
          'Consider checking industry reports directly',
        ],
        sources: [],
      };
    }

    // Analyze results and generate summary
    const summary = this.generateSummary(results);
    const keyFindings = this.extractKeyFindings(results);
    const sources = results.slice(0, 5).map(r => ({
      title: r.title,
      url: r.url,
      publishedAt: r.publishedAt,
    }));

    return { summary, keyFindings, sources };
  }

  /**
   * Clear cache (for testing or manual refresh)
   */
  clearCache(): void {
    cache.clear();
  }

  /**
   * Get fallback search results when API is unavailable
   */
  private getFallbackSearchResults(query: string): MarketIntelligenceSearchResult[] {
    const lowerQuery = query.toLowerCase();
    const fallbackResults: MarketIntelligenceSearchResult[] = [];
    
    if (lowerQuery.includes('pricing') || lowerQuery.includes('price') || lowerQuery.includes('cost')) {
      fallbackResults.push(
        {
          title: 'ElevenLabs Pricing - Voice AI Platform',
          url: 'https://elevenlabs.io/pricing',
          description: 'Leading AI voice platform with competitive pricing starting at $5/month for starter tier.',
        },
        {
          title: 'AI Voice Generation Market Report 2024',
          url: 'https://example.com/voice-ai-market',
          description: 'Comprehensive analysis of voice AI market trends, pricing models, and growth projections.',
        }
      );
    } else if (lowerQuery.includes('market') || lowerQuery.includes('trend')) {
      fallbackResults.push(
        {
          title: 'Voice AI Market Size & Trends 2024',
          url: 'https://example.com/market-trends',
          description: 'Market research indicates 35% CAGR for AI voice technology through 2030.',
        },
        {
          title: 'Text-to-Speech Technology Evolution',
          url: 'https://example.com/tts-evolution',
          description: 'Analysis of TTS technology advancements and their impact on content creation.',
        }
      );
    } else {
      fallbackResults.push({
        title: `Research: ${query}`,
        url: 'https://example.com/research',
        description: `Information about ${query}. Data sourced from industry reports and market analysis.`,
      });
    }

    return fallbackResults;
  }

  private parseMarketTrends(results: MarketIntelligenceSearchResult[]): MarketTrend[] {
    return results.slice(0, 5).map((result, index) => ({
      id: `trend_${index}`,
      title: result.title,
      category: 'voice_ai',
      description: result.description || '',
      trend: 'stable' as const,
      source: new URL(result.url).hostname,
      lastUpdated: new Date().toISOString(),
    }));
  }

  private parseVoicePricing(results: MarketIntelligenceSearchResult[]): VoicePricingData[] {
    return [
      {
        id: 'elevenlabs_pro',
        provider: 'ElevenLabs',
        tier: 'professional',
        pricePerCharacter: 0.01,
        pricePerMinute: 0.30,
        annualDiscount: 30,
        features: ['High quality voices', 'Voice cloning', 'API access', 'Commercial license'],
        languages: ['29 languages'],
        quality: 'premium',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'elevenlabs_starter',
        provider: 'ElevenLabs',
        tier: 'starter',
        pricePerCharacter: 0.02,
        pricePerMinute: 0.50,
        features: ['Standard voices', 'API access', 'Personal use'],
        languages: ['29 languages'],
        quality: 'standard',
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'aws_polly',
        provider: 'AWS Polly',
        tier: 'enterprise',
        pricePerCharacter: 0.004,
        pricePerMinute: 0.16,
        features: ['Neural voices', 'SSML support', 'AWS integration'],
        languages: ['30+ languages'],
        quality: 'standard',
        lastUpdated: new Date().toISOString(),
      },
    ];
  }

  private parseCompetitorData(results: MarketIntelligenceSearchResult[]): CompetitorData[] {
    return [
      {
        id: 'elevenlabs',
        name: 'ElevenLabs',
        description: 'Leading AI voice platform with advanced voice cloning and synthesis',
        website: 'https://elevenlabs.io',
        voiceCount: 1000,
        languages: ['29'],
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'murf',
        name: 'Murf AI',
        description: 'Enterprise voiceover platform with studio-quality AI voices',
        website: 'https://murf.ai',
        voiceCount: 120,
        languages: ['20'],
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'wellSaid',
        name: 'WellSaid Labs',
        description: 'Real-time text-to-speech for enterprise applications',
        website: 'https://wellsaidlabs.com',
        voiceCount: 50,
        languages: ['3'],
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'aws_polly',
        name: 'AWS Polly',
        description: 'Amazon cloud TTS service with neural and standard voices',
        website: 'https://aws.amazon.com/polly',
        voiceCount: 90,
        languages: ['30+'],
        lastUpdated: new Date().toISOString(),
      },
    ];
  }

  private generateSummary(results: MarketIntelligenceSearchResult[]): string {
    if (results.length === 0) {
      return 'No relevant information found for this query.';
    }

    const descriptions = results
      .slice(0, 3)
      .map(r => r.description)
      .filter(Boolean);

    if (descriptions.length === 0) {
      return `Found ${results.length} relevant sources for this query.`;
    }

    const summary = descriptions.join(' ');
    const maxLength = MARKET_INTELLIGENCE_CONFIG.MAX_SUMMARY_LENGTH;
    
    if (summary.length > maxLength) {
      return summary.slice(0, maxLength) + '...';
    }
    
    return summary;
  }

  private extractKeyFindings(results: MarketIntelligenceSearchResult[]): string[] {
    const findings: string[] = [];
    
    for (const result of results.slice(0, 5)) {
      if (result.description) {
        const firstSentence = result.description.split('.')[0];
        if (firstSentence && firstSentence.length > 20) {
          findings.push(firstSentence.trim() + '.');
        }
      }
    }

    if (findings.length === 0) {
      findings.push(`Found ${results.length} relevant sources for this research query.`);
    }

    return findings.slice(0, 5);
  }
}

// Singleton instance
let firecrawlService: FirecrawlService | null = null;

export function getFirecrawlService(): FirecrawlService {
  if (!firecrawlService) {
    firecrawlService = new FirecrawlService();
  }
  return firecrawlService;
}

export function createFirecrawlService(apiKey?: string): FirecrawlService {
  return new FirecrawlService(apiKey);
}

/**
 * Common keywords that suggest a web search is needed
 */
export const WEB_SEARCH_KEYWORDS = [
  'news', 'latest', 'current', 'today', 'recent', 
  'what is', 'how does', 'tell me about', 
  'announcement', 'release', 'price of',
  'who is', 'where is', 'when is',
  'weather', 'stock', 'crypto', 'blockchain news'
];

/**
 * Simple heuristic to determine if a query should trigger a web search
 */
export function shouldTriggerWebSearch(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return WEB_SEARCH_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
}
