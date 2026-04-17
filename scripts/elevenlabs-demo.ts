import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { writeFileSync } from "fs";
import { config } from "dotenv";

// Load environment variables
config();

async function textToSpeechDemo() {
  console.log("🎙️  ElevenLabs Text-to-Speech Demo\n");

  // Initialize the client (uses ELEVENLABS_API_KEY from environment)
  const client = new ElevenLabsClient();

  try {
    // First, get a voice ID
    const voices = await client.voices.getAll();
    const firstVoice = voices.voices[0];
    
    console.log(`Using voice: ${firstVoice.name} (${firstVoice.voiceId})`);
    
    // Generate speech from text
    console.log("Generating speech...");
    const audio = await client.textToSpeech.convert(firstVoice.voiceId, {
      text: "Hello! This is a demo of ElevenLabs text to speech. It's amazing how natural this sounds!",
      model_id: "eleven_multilingual_v2",
    });

    // Convert the audio stream to a buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Save to file
    const outputPath = "output/demo-speech.mp3";
    writeFileSync(outputPath, audioBuffer);
    console.log(`✅ Audio saved to: ${outputPath}`);
    console.log(`📊 Audio size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

async function listVoicesDemo() {
  console.log("\n🎤 Available Voices Demo\n");

  const client = new ElevenLabsClient();

  try {
    const voices = await client.voices.getAll();
    
    console.log(`Found ${voices.voices.length} voices:\n`);
    
    // Show first 5 voices as examples
    voices.voices.slice(0, 5).forEach((voice, index) => {
      console.log(`${index + 1}. ${voice.name}`);
      console.log(`   ID: ${voice.voiceId}`);
      console.log(`   Category: ${voice.category || "N/A"}`);
      console.log(`   Description: ${voice.description || "No description"}\n`);
    });
    
    return voices.voices;
  } catch (error) {
    console.error("❌ Error:", error);
    return [];
  }
}

// Run the demos
async function main() {
  console.log("=".repeat(50));
  console.log("  ElevenLabs Power Demo");
  console.log("=".repeat(50) + "\n");

  const voices = await listVoicesDemo();
  if (voices.length > 0) {
    await textToSpeechDemo();
  }

  console.log("\n" + "=".repeat(50));
  console.log("  Demo Complete!");
  console.log("=".repeat(50));
}

main();
