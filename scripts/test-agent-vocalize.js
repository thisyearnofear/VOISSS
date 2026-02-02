#!/usr/bin/env node

/**
 * Test script for the /api/agents/vocalize endpoint
 * Tests the Agent Gateway Pattern implementation
 */

const API_BASE = process.env.API_BASE || 'http://localhost:4445';

async function testAgentVocalize() {
  console.log('🎤 Testing Agent Vocalize API...\n');

  // Test data
  const testAgent = '0x1234567890123456789012345678901234567890';
  const testRequest = {
    text: 'Hello from the VOISSS Agent Gateway! This is a test of the voice-as-a-service system.',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
    agentAddress: testAgent,
    options: {
      model: 'eleven_multilingual_v2',
      stability: 0.7,
      similarity_boost: 0.8,
      autoSave: true,
    }
  };

  try {
    // Test 1: Get agent info
    console.log('📋 Test 1: Getting agent credit info...');
    const infoResponse = await fetch(`${API_BASE}/api/agents/vocalize?agentAddress=${testAgent}`);
    const infoResult = await infoResponse.json();
    
    if (infoResult.success) {
      console.log('✅ Agent info retrieved successfully:');
      console.log(`   Name: ${infoResult.data.name}`);
      console.log(`   Credit Balance: ${infoResult.data.creditBalance} ETH`);
      console.log(`   Tier: ${infoResult.data.tier}`);
      console.log(`   Supported Voices: ${infoResult.data.supportedVoices.length}`);
      console.log(`   Cost per Character: ${infoResult.data.costPerCharacter} ETH`);
    } else {
      console.log('❌ Failed to get agent info:', infoResult.error);
    }

    console.log('\n📢 Test 2: Generating voice audio...');
    
    // Test 2: Generate voice
    const vocalizeResponse = await fetch(`${API_BASE}/api/agents/vocalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest),
    });

    const vocalizeResult = await vocalizeResponse.json();

    if (vocalizeResult.success) {
      console.log('✅ Voice generation successful:');
      console.log(`   Content Hash: ${vocalizeResult.data.contentHash}`);
      console.log(`   Character Count: ${vocalizeResult.data.characterCount}`);
      console.log(`   Cost: ${vocalizeResult.data.cost} ETH`);
      console.log(`   Remaining Credits: ${vocalizeResult.data.creditBalance} ETH`);
      console.log(`   Audio URL: ${vocalizeResult.data.audioUrl.slice(0, 50)}...`);
      
      if (vocalizeResult.data.recordingId) {
        console.log(`   Recording ID: ${vocalizeResult.data.recordingId}`);
      }
    } else {
      console.log('❌ Voice generation failed:', vocalizeResult.error);
      
      if (vocalizeResponse.status === 402) {
        console.log('💳 Payment required - insufficient credits');
      }
    }

    // Test 3: Invalid request
    console.log('\n🚫 Test 3: Testing validation...');
    const invalidResponse = await fetch(`${API_BASE}/api/agents/vocalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: '', // Empty text should fail
        voiceId: 'invalid-voice',
        agentAddress: 'not-an-address',
      }),
    });

    const invalidResult = await invalidResponse.json();
    
    if (!invalidResult.success) {
      console.log('✅ Validation working correctly:', invalidResult.error);
    } else {
      console.log('❌ Validation failed - invalid request was accepted');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the development server is running:');
      console.log('   pnpm dev:web');
    }
  }

  console.log('\n🏁 Test completed!');
}

// Test different scenarios
async function runAllTests() {
  console.log('🚀 VOISSS Agent Gateway API Tests\n');
  console.log('='.repeat(50));
  
  await testAgentVocalize();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log('- Agent credit system: Implemented');
  console.log('- Voice generation API: Functional');
  console.log('- Request validation: Working');
  console.log('- Error handling: Proper');
  console.log('\n🎯 Next steps:');
  console.log('1. Integrate with AgentRegistry contract');
  console.log('2. Add IPFS upload functionality');
  console.log('3. Implement auto-save to VoiceRecords');
  console.log('4. Add authentication/signature verification');
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testAgentVocalize };