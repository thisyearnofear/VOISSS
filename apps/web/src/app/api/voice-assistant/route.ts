import { NextRequest, NextResponse } from 'next/server';
import { model } from '../../../lib/gemini';

/**
 * Voice Assistant API - Combines Gemini intelligence for conversational AI
 * 
 * This endpoint:
 * 1. Receives user message and conversation history
 * 2. Uses Gemini to generate intelligent, contextual responses
 * 3. Returns response text (which frontend then sends to ElevenLabs TTS)
 * 
 * For AI Partner Catalyst Hackathon (ElevenLabs + Google Cloud challenge)
 */

interface ConversationMessage {
    role: 'user' | 'assistant';
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
- AI Insights: Gemini-powered summaries, tags, and action items for recordings
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
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Check if Gemini is configured
        if (!process.env.GOOGLE_API_KEY) {
            return NextResponse.json(
                {
                    response: "I'd love to help, but I'm not fully configured yet. Please check that the Google API key is set up correctly."
                },
                { status: 200 }
            );
        }

        // Build conversation context for Gemini
        const conversationContext = conversationHistory
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        const fullPrompt = `${SYSTEM_PROMPT}

${context ? `Current Context: ${context}` : ''}

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ''}

User: ${message}

Respond naturally and helpfully. Keep your response concise (2-3 sentences) unless the user asks for more detail.`;

        // Generate response using Gemini
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const responseText = response.text().trim();

        // Clean up any markdown or formatting that might interfere with TTS
        const cleanedResponse = responseText
            .replace(/\*\*/g, '') // Remove bold markers
            .replace(/\*/g, '')   // Remove italic markers
            .replace(/`/g, '')    // Remove code markers
            .replace(/#{1,6}\s/g, '') // Remove heading markers
            .trim();

        return NextResponse.json({
            response: cleanedResponse,
            model: 'gemini-3-flash'
        });

    } catch (error) {
        console.error('Voice assistant error:', error);

        // Return a friendly fallback message instead of error
        return NextResponse.json({
            response: "I apologize, I'm having a bit of trouble right now. Could you try asking that again?"
        });
    }
}

// GET handler for health check
export async function GET() {
    const hasGoogleKey = !!process.env.GOOGLE_API_KEY;
    const hasElevenLabsKey = !!process.env.ELEVENLABS_API_KEY;

    return NextResponse.json({
        status: 'ok',
        service: 'voice-assistant',
        integrations: {
            gemini: hasGoogleKey ? 'configured' : 'missing GOOGLE_API_KEY',
            elevenlabs: hasElevenLabsKey ? 'configured' : 'missing ELEVENLABS_API_KEY'
        }
    });
}
