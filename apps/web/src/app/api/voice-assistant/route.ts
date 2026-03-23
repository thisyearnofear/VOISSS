import { NextRequest, NextResponse } from "next/server";
import {
  generateAssistantReply,
  getAIProviderStatus,
} from "../../../lib/gemini";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface VoiceAssistantRequest {
  message: string;
  context?: string;
  conversationHistory?: ConversationMessage[];
}

const SYSTEM_PROMPT = `You are VOISSS Assistant, a friendly and helpful AI voice assistant for the VOISSS platform - a decentralized AI-powered voice recording platform.

VOISSS features include:
- Voice Recording: High-quality voice capture with real-time waveform visualization
- AI Voice Transformation: Transform recordings into different voices using ElevenLabs
- Multi-Language Dubbing: Translate and dub recordings to 29+ languages
- AI Insights: AI-powered summaries, tags, action items, and humanity certificates for recordings
- Decentralized Storage: IPFS + Base blockchain for secure, decentralized storage
- Gasless Transactions: Zero-cost saves using Base smart accounts
- Transcript Composer: Create shareable video transcripts from audio

Your personality:
- Friendly, helpful, and concise
- You speak naturally as if in conversation
- Keep responses brief (2-3 sentences max) unless asked for details
- Use simple, clear language
- Be enthusiastic about voice technology

Action Commands:
You can trigger actions in the app by including a command at the end of your response in the format [ACTION:command].
Supported actions:
- [ACTION:studio] - Navigate to the Recording Studio
- [ACTION:help] - Navigate to the Help page
- [ACTION:transcript] - Open the Transcript Composer
- [ACTION:features] - View platform features

Example: "I can help you with that in the studio. [ACTION:studio]"

When users ask about features, provide helpful guidance. When they have technical issues, suggest solutions or direct them to the Help page.

Remember: Your responses will be read aloud using text-to-speech, so write naturally and conversationally. Do not speak the [ACTION:...] part, it is for the system.`;

export async function POST(request: NextRequest) {
  try {
    const body: VoiceAssistantRequest = await request.json();
    const { message, context, conversationHistory = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const aiStatus = getAIProviderStatus();
    if (!aiStatus.google.configured && !aiStatus.venice.configured) {
      return NextResponse.json(
        {
          response:
            "I'd love to help, but the AI providers are not configured yet. Set GEMINI_API_KEY or VENICE_API_KEY to enable the assistant.",
        },
        { status: 200 }
      );
    }

    const conversationContext = conversationHistory
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n");

    const fullPrompt = `${SYSTEM_PROMPT}

${context ? `Current Context: ${context}` : ""}

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ""}

User: ${message}

Respond naturally and helpfully. Keep your response concise (2-3 sentences) unless the user asks for more detail.`;

    const aiResult = await generateAssistantReply(fullPrompt);
    const cleanedResponse = aiResult.text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`/g, "")
      .replace(/#{1,6}\s/g, "")
      .trim();

    return NextResponse.json({
      response: cleanedResponse,
      model: aiResult.model,
      provider: aiResult.provider,
    });
  } catch (error) {
    console.error("Voice assistant error:", error);

    return NextResponse.json({
      response:
        "I apologize, I'm having a bit of trouble right now. Could you try asking that again?",
    });
  }
}

export async function GET() {
  const status = getAIProviderStatus();
  const hasElevenLabsKey = !!process.env.ELEVENLABS_API_KEY;

  return NextResponse.json({
    status: "ok",
    service: "voice-assistant",
    integrations: {
      gemini: status.google.configured
        ? `configured (${status.google.textModel})`
        : "missing GEMINI_API_KEY",
      venice: status.venice.configured
        ? `configured (${status.venice.model})`
        : "missing VENICE_API_KEY",
      elevenlabs: hasElevenLabsKey
        ? "configured"
        : "missing ELEVENLABS_API_KEY",
    },
  });
}
