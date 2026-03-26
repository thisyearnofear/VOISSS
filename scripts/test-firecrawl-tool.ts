import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.join(process.cwd(), '.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000';
const AGENT_TOKEN = process.env.ELEVENLABS_AGENT_TOKEN || 'test-token';

async function testWebSearchTool() {
  console.log('🧪 Testing Web Search Tool (Firecrawl)...');
  
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error('❌ FIRECRAWL_API_KEY not found in .env');
    process.exit(1);
  }

  try {
    // 1. Test without auth (should fail)
    console.log('1. Testing unauthorized access...');
    try {
      await axios.post(`${API_URL}/api/tools/web-search`, { query: 'VOISSS project' });
      console.error('❌ Should have failed with 401');
    } catch (e: any) {
      if (e.response?.status === 401) {
        console.log('✅ Correctly denied unauthorized access');
      } else {
        console.error('❌ Unexpected error:', e.message);
      }
    }

    // 2. Test with auth (should succeed)
    console.log(`2. Testing authorized search at ${API_URL}/api/tools/web-search...`);
    const response = await axios.post(`${API_URL}/api/tools/web-search`, 
      { 
        query: 'ElevenLabs Firecrawl hackathon 2026',
        limit: 3
      },
      {
        headers: {
          'Authorization': `Bearer ${AGENT_TOKEN}`
        }
      }
    );

    if (response.status === 200) {
      console.log('✅ Search successful!');
      console.log('Query:', response.data.query);
      console.log('Results Count:', response.data.count);
      
      if (response.data.results && response.data.results.length > 0) {
        console.log('First result:', {
          title: response.data.results[0].title,
          url: response.data.results[0].url,
          snippet: response.data.results[0].snippet?.substring(0, 100) + '...'
        });
      } else {
        console.warn('⚠️ No results found (but request succeeded)');
      }
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.warn('💡 Tip: Make sure the local dev server is running (npm run dev)');
    }
  }
}

testWebSearchTool();
