import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { config } from "dotenv";

// Load environment variables
config();

/**
 * Simple example showing the basic ElevenLabs workflow
 */
async function simpleExample() {
  console.log("🎯 ElevenLabs Simple Example\n");

  // Initialize client (automatically uses ELEVENLABS_API_KEY from .env)
  const client = new ElevenLabsClient();

  try {
    // Step 1: Get available voices
    console.log("📋 Fetching available voices...");
    const voicesResponse = await client.voices.getAll();
    const voices = voicesResponse.voices;

    console.log(`✅ Found ${voices.length} voices\n`);

    // Step 2: Show some voice options
    console.log("🎤 Sample Voices:");
    voices.slice(0, 3).forEach((voice, i) => {
      console.log(`   ${i + 1}. ${voice.name}`);
      console.log(`      ID: ${voice.voiceId}`);
      console.log(`      Category: ${voice.category}`);
      console.log(`      Use case: ${voice.labels?.use_case || "general"}\n`);
    });

    // Step 3: Show how to use a voice for TTS (code example)
    const exampleVoice = voices[0];
    console.log("💡 To generate speech with this voice:\n");
    console.log(`const audio = await client.textToSpeech.convert("${exampleVoice.voiceId}", {`);
    console.log(`  text: "Your text here",`);
    console.log(`  model_id: "eleven_multilingual_v2",`);
    console.log(`});\n`);

    console.log("📝 Note: Text-to-speech generation requires an active subscription.");
    console.log("   Visit https://elevenlabs.io/app to manage your account.\n");

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    
    if (error.statusCode === 401) {
      console.log("\n💡 Tip: Check your ELEVENLABS_API_KEY in the .env file");
    }
  }
}

// Run the example
simpleExample();
