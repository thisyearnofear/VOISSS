/**
 * Firecrawl Service - Shared logic for web search and scraping
 * 
 * Powered by Firecrawl (https://firecrawl.dev)
 * Used to provide real-time web intelligence to AI agents.
 */

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

export interface FirecrawlSearchResult {
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

export class FirecrawlService {
  private apiKey: string;
  private apiBase: string = 'https://api.firecrawl.dev/v2'; // Default to v2 for latest features like search

  constructor(apiKey?: string) {
    this.apiKey = apiKey || (typeof process !== 'undefined' ? process.env.FIRECRAWL_API_KEY : '') || '';
  }

  /**
   * Search the web using Firecrawl
   */
  async search(query: string, options: FirecrawlSearchOptions = {}): Promise<FirecrawlSearchResult> {
    if (!this.apiKey) {
      return {
        success: false,
        data: {},
        error: 'FIRECRAWL_API_KEY is not configured',
      };
    }

    try {
      const response = await fetch(`${this.apiBase}/search`, {
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
      const response = await fetch(`${this.apiBase}/scrape`, {
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
}

/**
 * Factory function to create a Firecrawl service instance
 */
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
