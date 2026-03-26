import { NextRequest, NextResponse } from 'next/server';
import { createFirecrawlService } from '@voisss/shared';

/**
 * Web Search Tool - For ElevenLabs Agent
 * 
 * Powered by Firecrawl (https://firecrawl.dev)
 * Performs real-time web searches to provide the agent with current information.
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Validate authorization
    const authHeader = request.headers.get('Authorization');
    const expectedToken = process.env.ELEVENLABS_AGENT_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      console.warn('Unauthorized access to web-search tool');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body (ElevenLabs sends arguments in the body)
    const body = await request.json();
    const { query, limit = 5 } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log(`🔍 ElevenLabs Agent searching for: "${query}"`);

    // 3. Initialize Firecrawl service
    const firecrawl = createFirecrawlService();
    
    // 4. Perform search
    const result = await firecrawl.search(query, {
      limit,
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true
      }
    });

    if (!result.success) {
      console.error('Firecrawl search failed:', result.error);
      return NextResponse.json({ 
        error: 'Search failed', 
        details: result.error 
      }, { status: 500 });
    }

    // 5. Format results for the AI agent and the UI
    // We want to provide a clean summary of the search results
    const formattedResults = result.data.web?.map((item, index) => ({
      index: index + 1,
      title: item.title,
      url: item.url,
      snippet: item.description,
      content: item.markdown?.substring(0, 1500) // Truncate content to avoid hitting context limits
    })) || [];

    // Format for UI rendering (consistent with our Message interface)
    const uiResults = result.data.web?.map(item => ({
      title: item.title,
      url: item.url,
      description: item.description
    })) || [];

    return NextResponse.json({
      query,
      results: formattedResults,
      searchResults: uiResults, // For our custom UI to pick up
      count: formattedResults.length,
      source: 'Firecrawl'
    });

  } catch (error: any) {
    console.error('Web search tool error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}

/**
 * Handle GET requests (standard for some tool configurations)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ 
      name: 'web_search',
      description: 'Search the web for real-time information and news',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query' },
          limit: { type: 'integer', description: 'Number of results (default 5)' }
        },
        required: ['query']
      }
    });
  }

  // If query is provided via GET, handle it the same as POST (optional convenience)
  // But ElevenLabs usually uses POST for tools with parameters
  return NextResponse.json({ error: 'Use POST for searching' }, { status: 405 });
}
