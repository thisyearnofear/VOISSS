# ElevenLabs Power - Quick Start Examples

## ✅ Setup Complete!

Your ElevenLabs integration is ready to use. The API key is configured and the SDK is installed.

## What You Can Do

### 1. Text-to-Speech (TTS)
Convert text to natural-sounding speech:

```typescript
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient();

// Generate speech
const audio = await client.textToSpeech.convert("VOICE_ID", {
  text: "Hello! This is ElevenLabs speaking.",
  model_id: "eleven_multilingual_v2",
});

// Save to file
const chunks: Buffer[] = [];
for await (const chunk of audio) {
  chunks.push(chunk);
}
const audioBuffer = Buffer.concat(chunks);
writeFileSync("output.mp3", audioBuffer);
```

### 2. List Available Voices
Get all voices available in your account:

```typescript
const voices = await client.voices.getAll();

voices.voices.forEach(voice => {
  console.log(`${voice.name} - ${voice.voiceId}`);
});
```

### 3. Speech-to-Text (Transcription)
Transcribe audio files:

```typescript
const transcription = await client.speechToText.transcribe({
  audio: fs.createReadStream("audio.mp3"),
  model_id: "scribe_v1",
});

console.log(transcription.text);
```

### 4. Generate Sound Effects
Create custom sound effects:

```typescript
const soundEffect = await client.soundEffects.generate({
  text: "Dog barking in the distance",
  duration_seconds: 5,
});
```

### 5. Create Conversational Agents
Build voice-based AI agents with custom tools and knowledge bases.

## Available Capabilities

- **Text-to-Speech**: 30+ natural voices, multilingual support
- **Speech-to-Text**: Real-time and file transcription
- **Sound Effects**: AI-generated audio effects
- **Music Generation**: Create AI music (requires paid plan)
- **Conversational Agents**: Voice-based AI assistants

## Next Steps

1. **Upgrade Account**: The demo hit free tier limits. Consider upgrading for production use.
2. **Explore Voices**: Run the demo to see all 21 available voices
3. **Read Documentation**: Use the steering files for detailed guides:
   - Text-to-speech streaming
   - Voice settings customization
   - Real-time speech-to-text
   - Agent configuration

## Running the Demo

```bash
pnpm tsx scripts/elevenlabs-demo.ts
```

This will:
- List all available voices
- Attempt to generate sample speech (requires active subscription)

## Account Status

Your API key is configured, but you may need to:
- Upgrade from free tier for text-to-speech generation
- Avoid VPN/proxy if on free tier
- Check your ElevenLabs dashboard for usage limits

## Resources

- [ElevenLabs Dashboard](https://elevenlabs.io/app)
- [API Documentation](https://elevenlabs.io/docs)
- Power steering files in Kiro for detailed guides
