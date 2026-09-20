import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { transcribeFile, transcribeUrl } from "@/lib/scribe";

export const runtime = "nodejs";

/**
 * POST /api/elevenlabs/transcribe
 *
 * Multipart form with `file` field, or JSON `{ "audioUrl": "..." }`.
 * Returns Scribe v2 transcript + detected language.
 */
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let result;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof Blob)) {
        return NextResponse.json(
          { success: false, error: "Missing audio file" },
          { status: 400 }
        );
      }
      result = await transcribeFile(apiKey, file, (file as File).name || "audio.mp3");
    } else {
      const { audioUrl } = await req.json();
      if (!audioUrl || typeof audioUrl !== "string") {
        return NextResponse.json(
          { success: false, error: "Missing audioUrl" },
          { status: 400 }
        );
      }
      result = await transcribeUrl(apiKey, audioUrl);
    }

    console.log(`Scribe transcript for ${user.address}: ${result.words ?? "?"} words, lang=${result.languageCode}`);
    return NextResponse.json({ success: true, data: result });
  } catch (err: unknown) {
    console.error("transcribe error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
