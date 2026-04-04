import { NextRequest, NextResponse } from 'next/server';
import { runJsonPrompt } from '@/lib/ai-inference';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider') || 'kilocode';
  
  try {
    const result = await runJsonPrompt(
      "You are a test assistant. Return a JSON object with the key 'status' set to 'active' and 'provider' set to the name of the service you are running on.",
      z.object({ status: z.string(), provider: z.string() })
    );
    
    return NextResponse.json({
      success: true,
      data: result,
      env: {
        VENICE: !!process.env.VENICE_API_KEY,
        KILOCODE: !!process.env.KILOCODE_API_KEY,
        GEMINI: !!process.env.GEMINI_API_KEY,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      env: {
        VENICE: !!process.env.VENICE_API_KEY,
        KILOCODE: !!process.env.KILOCODE_API_KEY,
        GEMINI: !!process.env.GEMINI_API_KEY,
      }
    }, { status: 500 });
  }
}
