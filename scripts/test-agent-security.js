#!/usr/bin/env node

/**
 * Test script for agent security and rate limiting integration
 * Run with: node scripts/test-agent-security.js
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function testAgentSecurity() {
  console.log('🧪 Testing Agent Security Integration...\n');

  // Test 1: Agent verification
  console.log('1. Testing agent verification...');
  try {
    const response = await fetch(`${BASE_URL}/api/agents/vocalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', // Browser UA (should fail)
      },
      body: JSON.stringify({
        text: 'Hello world',
        voiceId: 'test-voice',
        agentAddress: '0x1234567890123456789012345678901234567890'
      })
    });

    if (response.status === 403) {
      console.log('✅ Agent verification working - browser UA rejected');
    } else {
      console.log('⚠️  Agent verification may not be working properly');
    }
  } catch (error) {
    console.log('❌ Agent verification test failed:', error.message);
  }

  // Test 2: Proper agent request
  console.log('\n2. Testing proper agent request...');
  try {
    const response = await fetch(`${BASE_URL}/api/agents/vocalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VoissAgent/1.0 (AI Assistant; +https://voisss.netlify.app)',
        'X-Agent-ID': 'test-agent-123',
        'X-Skip-Agent-Verification': 'true' // Skip for testing
      },
      body: JSON.stringify({
        text: 'Hello world',
        voiceId: 'test-voice',
        agentAddress: '0x1234567890123456789012345678901234567890'
      })
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 402) {
      console.log('✅ Payment required response (expected for test)');
    } else if (response.status === 500) {
      console.log('⚠️  Server error (may need ElevenLabs API key)');
    } else {
      console.log('✅ Request processed successfully');
    }

    // Check rate limit headers
    const rateLimitHeaders = {};
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('x-ratelimit')) {
        rateLimitHeaders[key] = value;
      }
    });

    if (Object.keys(rateLimitHeaders).length > 0) {
      console.log('✅ Rate limit headers present:', rateLimitHeaders);
    }

  } catch (error) {
    console.log('❌ Proper agent request test failed:', error.message);
  }

  // Test 3: Event subscription
  console.log('\n3. Testing event subscription...');
  try {
    const response = await fetch(`${BASE_URL}/api/agents/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VoissAgent/1.0 (AI Assistant; +https://voisss.netlify.app)',
        'X-Agent-ID': 'test-agent-123'
      },
      body: JSON.stringify({
        agentId: 'test-agent-123',
        eventTypes: ['voice.generation.completed', 'mission.created'],
        filters: {
          priority: 'high'
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Event subscription successful:', data.data?.subscriptionId);
    } else {
      console.log(`⚠️  Event subscription failed: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Event subscription test failed:', error.message);
  }

  // Test 4: Rate limiting (multiple requests)
  console.log('\n4. Testing rate limiting...');
  const requests = [];
  for (let i = 0; i < 10; i++) {
    requests.push(
      fetch(`${BASE_URL}/api/agents/vocalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'VoissAgent/1.0 (AI Assistant; +https://voisss.netlify.app)',
          'X-Agent-ID': 'rate-limit-test-agent',
          'X-Skip-Agent-Verification': 'true'
        },
        body: JSON.stringify({
          text: `Test message ${i}`,
          voiceId: 'test-voice'
        })
      })
    );
  }

  try {
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);

    if (rateLimited.length > 0) {
      console.log(`✅ Rate limiting working - ${rateLimited.length}/10 requests rate limited`);
    } else {
      console.log('⚠️  No rate limiting detected (may need higher request volume)');
    }
  } catch (error) {
    console.log('❌ Rate limiting test failed:', error.message);
  }

  console.log('\n🏁 Security integration tests completed!');
}

// Run tests
testAgentSecurity().catch(console.error);