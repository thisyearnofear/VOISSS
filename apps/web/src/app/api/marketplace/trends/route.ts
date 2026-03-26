import { NextRequest, NextResponse } from 'next/server';
import { createFirecrawlService } from '@voisss/shared';
import { analyzeMarketTrends, MarketTrendResult } from '@/lib/gemini';

/**
 * Marketplace Trends API
 * 
 * 1. Scrapes voice-over job boards via Firecrawl
 * 2. Analyzes market demand via Gemini
 * 3. Returns structured trends for creators
 */

// Simple in-memory cache for the prototype (1-hour TTL)
let cachedTrends: { data: MarketTrendResult; timestamp: number } | null = null;
const CACHE_TTL = 3600 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Return cached data if valid
    if (!forceRefresh && cachedTrends && (Date.now() - cachedTrends.timestamp < CACHE_TTL)) {
      return NextResponse.json({
        success: true,
        data: cachedTrends.data,
        cached: true,
        timestamp: cachedTrends.timestamp
      });
    }

    // 1. Initialize Firecrawl and scrape a job board
    const firecrawl = createFirecrawlService();
    
    // Using Voice123 as the primary target for the prototype
    console.log('🌐 Scraping voice-over market trends...');
    const scrapeResult = await firecrawl.scrapeMarketTrends('voice123');

    if (!scrapeResult.success || !scrapeResult.data?.markdown) {
      console.error('Failed to scrape market trends:', scrapeResult.error);
      
      // If scrape fails but we have old cache, return it as fallback
      if (cachedTrends) {
        return NextResponse.json({
          success: true,
          data: cachedTrends.data,
          warning: 'Live scrape failed, returning cached fallback'
        });
      }

      return NextResponse.json({ 
        success: false, 
        error: 'Failed to retrieve live market data' 
      }, { status: 500 });
    }

    // 2. Analyze the markdown content via Gemini
    console.log('🧠 Analyzing market data via Gemini...');
    const trends = await analyzeMarketTrends(scrapeResult.data.markdown);

    // 3. Cache and return the results
    cachedTrends = {
      data: trends,
      timestamp: Date.now()
    };

    return NextResponse.json({
      success: true,
      data: trends,
      timestamp: cachedTrends.timestamp
    });

  } catch (error: any) {
    console.error('Marketplace trends API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}
