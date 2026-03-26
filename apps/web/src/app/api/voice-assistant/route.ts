import { NextRequest, NextResponse } from "next/server";
import {
  generateAssistantReply,
  getAIProviderStatus,
} from "../../../lib/gemini";
import { createFirecrawlService, shouldTriggerWebSearch } from "@voisss/shared";

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

When users ask about current events, news, or real-time information, you will receive web search results. Use these to provide accurate, up-to-date answers.

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

    // Check if we should perform a web search (for current events, news, real-time info)
    const shouldSearch = shouldTriggerWebSearch(message);

    let searchResults = null;
    let searchQuery = message;

    // Perform web search if relevant
    if (shouldSearch && process.env.FIRECRAWL_API_KEY) {
      try {
        const firecrawl = createFirecrawlService(process.env.FIRECRAWL_API_KEY);
        const searchResult = await firecrawl.search(searchQuery, {
          limit: 3,
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true
          }
        });

        if (searchResult.success && searchResult.data.web) {
          searchResults = searchResult.data.web.map(item => ({
            title: item.title,
            url: item.url,
            description: item.description
          }));
        }
      } catch (searchError) {
        console.error('Web search error:', searchError);
        // Continue without search results
      }
    }

    const conversationContext = conversationHistory
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n");

    let promptWithContext = `${SYSTEM_PROMPT}

${context ? `Current Context: ${context}` : ""}

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ""}

User: ${message}

`;

    // Add search results context if available
    if (searchResults && searchResults.length > 0) {
      promptWithContext += `
Web Search Results:
${searchResults.map((r, i) => `${i + 1}. ${r.title} - ${r.description} (${r.url})`).join('\n')}

Based on these search results, provide accurate and up-to-date information.`;
    }

    promptWithContext += `
Respond naturally and helpfully. Keep your response concise (2-3 sentences) unless the user asks for more detail.`;

    const aiResult = await generateAssistantReply(promptWithContext);
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
      searchResults: searchResults || undefined,
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
