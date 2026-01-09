#!/usr/bin/env node

/**
 * ElevenLabs API Test Script
 * Tests ElevenLabs API connectivity and basic functionality
 */

require('dotenv').config();

const ELEVEN_API_BASE = 'https://api.elevenlabs.io/v1';
const API_KEY = process.env.ELEVENLABS_API_KEY;

async function testElevenLabsAPI() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 ElevenLabs API Test');
  console.log('='.repeat(60) + '\n');

  // Check API key
  if (!API_KEY) {
    console.error('❌ ELEVENLABS_API_KEY environment variable not set');
    process.exit(1);
  }
  console.log(`✅ API Key loaded (length: ${API_KEY.length})`);

  try {
    // Test 1: Get models
    console.log('\n📋 Test 1: Fetching available models...');
    const modelsResponse = await fetch(`${ELEVEN_API_BASE}/models`, {
      headers: { 'xi-api-key': API_KEY },
      timeout: 30000
    });

    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text();
      throw new Error(`Models API failed (${modelsResponse.status}): ${errorText}`);
    }

    const models = await modelsResponse.json();
    console.log(`✅ Successfully fetched ${models.length} models`);
    
    // Show first 3 models
    models.slice(0, 3).forEach((model, i) => {
      console.log(`   ${i + 1}. ${model.name} (${model.model_id})`);
    });

    // Test 2: Get voices
    console.log('\n🎤 Test 2: Fetching available voices...');
    const voicesResponse = await fetch(`${ELEVEN_API_BASE}/voices`, {
      headers: { 'xi-api-key': API_KEY },
      timeout: 30000
    });

    if (!voicesResponse.ok) {
      const errorText = await voicesResponse.text();
      throw new Error(`Voices API failed (${voicesResponse.status}): ${errorText}`);
    }

    const voicesData = await voicesResponse.json();
    const voices = voicesData.voices || [];
    console.log(`✅ Successfully fetched ${voices.length} voices`);
    
    // Show first 3 voices
    voices.slice(0, 3).forEach((voice, i) => {
      console.log(`   ${i + 1}. ${voice.name} (${voice.voice_id})`);
    });

    // Test 3: Get user subscription info
    console.log('\n💳 Test 3: Checking user subscription...');
    const userResponse = await fetch(`${ELEVEN_API_BASE}/user`, {
      headers: { 'xi-api-key': API_KEY },
      timeout: 30000
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      throw new Error(`User API failed (${userResponse.status}): ${errorText}`);
    }

    const userData = await userResponse.json();
    console.log(`✅ User subscription info retrieved`);
    console.log(`   Plan: ${userData.subscription?.tier || 'Unknown'}`);
    console.log(`   Characters remaining: ${userData.subscription?.character_count || 'Unknown'}`);

    // Test 4: Get voice settings
    if (voices.length > 0) {
      const firstVoiceId = voices[0].voice_id;
      console.log(`\n⚙️  Test 4: Getting voice settings for "${voices[0].name}"...`);
      
      const voiceSettingsResponse = await fetch(`${ELEVEN_API_BASE}/voices/${firstVoiceId}/settings`, {
        headers: { 'xi-api-key': API_KEY },
        timeout: 30000
      });

      if (!voiceSettingsResponse.ok) {
        const errorText = await voiceSettingsResponse.text();
        throw new Error(`Voice settings API failed (${voiceSettingsResponse.status}): ${errorText}`);
      }

      const voiceSettings = await voiceSettingsResponse.json();
      console.log(`✅ Voice settings retrieved`);
      console.log(`   Stability: ${voiceSettings.stability}`);
      console.log(`   Similarity boost: ${voiceSettings.similarity_boost}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All ElevenLabs API tests passed!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error(`❌ Test failed: ${error.message}`);
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }
}

testElevenLabsAPI();
