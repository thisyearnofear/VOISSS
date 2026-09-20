import { NextRequest, NextResponse } from "next/server";
import {
  getMarketplaceCatalog,
  type MarketplaceVoice,
} from "@/lib/marketplace-indexer";
import {
  getIdentifier,
  getRateLimitHeaders,
  rateLimiters,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Same Vercel AI Gateway as the Jev route — same catalog, same gateway,
// different model. Falls back to the OpenAI API directly when a key exists.
const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const GATEWAY_MODEL = "openai/gpt-4o-mini";
const OPENAI_MODEL = "gpt-4o-mini";

const MAX_VOICES_PER_CALL = 40;
const MIN_BRIEF_LENGTH = 3;
const MAX_BRIEF_LENGTH = 1000;
const MAX_FIELD_LENGTH = 200;

interface ScorableVoice {
  id: string;
  title?: string;
  tone?: string;
  pitch?: string;
  language?: string;
  accent?: string;
  tags?: string[];
  licenseType?: string;
}

// Brief cache of the merged catalog — mirrors the voice-match route so both
// evaluators score the identical voice set on a shared keystroke.
let listingsCache: { voices: MarketplaceVoice[]; at: number } | null = null;
const LISTINGS_TTL_MS = 30_000;

async function getCatalogVoices(origin: string): Promise<ScorableVoice[]> {
  if (!listingsCache || Date.now() - listingsCache.at >= LISTINGS_TTL_MS) {
    listingsCache = {
      voices: await getMarketplaceCatalog({}, origin),
      at: Date.now(),
    };
  }
  return listingsCache.voices
    .filter((v) => v.status === "approved")
    .map((v) => ({
      id: v.id,
      title: v.metadata?.title,
      tone: v.voiceProfile?.tone,
      pitch: v.voiceProfile?.pitch,
      language: v.voiceProfile?.language,
      accent: v.voiceProfile?.accent,
      tags: v.voiceProfile?.tags,
      licenseType: v.licenseType,
    }));
}

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, MAX_FIELD_LENGTH)
    : undefined;
}

function sanitizeCatalog(input: unknown): ScorableVoice[] | null {
  if (!Array.isArray(input)) {
    return null;
  }
  return input
    .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    .map((v) => ({
      id: cleanString(v.id) ?? "",
      title: cleanString(v.title),
      tone: cleanString(v.tone),
      pitch: cleanString(v.pitch),
      language: cleanString(v.language),
      accent: cleanString(v.accent),
      tags: Array.isArray(v.tags)
        ? v.tags
            .map((t) => cleanString(t))
            .filter((t): t is string => !!t)
            .slice(0, 10)
        : undefined,
      licenseType: cleanString(v.licenseType),
    }))
    .filter((v) => v.id)
    .slice(0, MAX_VOICES_PER_CALL);
}

/**
 * POST /api/marketplace/voice-match-gpt
 *
 * The same voice-matching task handed to a general LLM (GPT-4o-mini) for
 * comparison with Jev — same catalog, same gateway, same contract. JSON mode
 * is the best-case structured output path, not a crippled prose prompt.
 * Returns the voice-match shape plus `rawOutput` so the UI can show the
 * parsing burden a general model leaves behind.
 *
 * Auth resolution: AI_GATEWAY_API_KEY (openai/gpt-4o-mini) first, then
 * OPENAI_API_KEY direct.
 *
 * Body: { brief: string, voices?: ScorableVoice[] }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const identifier = getIdentifier(req);
  const rateLimitCheck = await rateLimiters.standard.check(identifier);
  if (!rateLimitCheck.success) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded" },
      { status: 429, headers: getRateLimitHeaders(rateLimitCheck) }
    );
  }

  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!gatewayKey && !openaiKey) {
    return NextResponse.json(
      { success: false, error: "gpt_not_configured" },
      { status: 503 }
    );
  }

  let brief: string;
  let catalog: ScorableVoice[] | null = null;
  try {
    const body = await req.json();
    brief = typeof body?.brief === "string" ? body.brief.trim() : "";
    catalog = sanitizeCatalog(body?.voices);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (brief.length < MIN_BRIEF_LENGTH || brief.length > MAX_BRIEF_LENGTH) {
    return NextResponse.json(
      {
        success: false,
        error: `brief must be ${MIN_BRIEF_LENGTH}-${MAX_BRIEF_LENGTH} characters`,
      },
      { status: 400 }
    );
  }

  try {
    const voices = (
      catalog ??
      (await getCatalogVoices(new URL(req.url).origin))
    ).slice(0, MAX_VOICES_PER_CALL);

    if (voices.length === 0) {
      return NextResponse.json({
        success: true,
        data: { scores: {}, briefInsights: null, meta: { questionCount: 0 } },
      });
    }

    const catalogText = voices
      .map((v) =>
        [
          `id=${v.id}`,
          v.title ? `name="${v.title}"` : null,
          v.tone ? `tone=${v.tone}` : null,
          v.accent ? `accent=${v.accent}` : null,
          v.tags?.length ? `tags=${v.tags.join("|")}` : null,
        ]
          .filter(Boolean)
          .join(" ")
      )
      .join("\n");

    const system = `You are a voice-matching engine for a voice marketplace. Given a user brief and a voice catalog, score every voice's fit for the brief from 0.0 to 1.0, and classify the brief.

Respond with JSON only:
{"scores": {"<voice_id>": <0-1>, ...}, "emotion": "warm|energetic|authoritative|calm|friendly|dramatic", "use_case": "advertising|narration|assistant|character|podcast", "urgency": 0|1|2}

urgency legend: 0=relaxed/unhurried, 1=moderate, 2=urgent/high-energy. Score EVERY voice id.`;

    const started = Date.now();
    const res = await fetch(
      gatewayKey ? GATEWAY_URL : "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gatewayKey || openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: gatewayKey ? GATEWAY_MODEL : OPENAI_MODEL,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content: `Brief: "${brief}"\n\nCatalog:\n${catalogText}`,
            },
          ],
        }),
      }
    );
    const latencyMs = Date.now() - started;

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GPT ${res.status}: ${text.slice(0, 300)}`);
    }

    const payload = await res.json();
    const rawOutput: string = payload?.choices?.[0]?.message?.content ?? "";

    let parsed: any = {};
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      /* fall through with empty parsed */
    }

    const scores: Record<string, number> = {};
    for (const v of voices) {
      const s = parsed?.scores?.[v.id];
      if (typeof s === "number" && s >= 0 && s <= 1) {
        scores[v.id] = s;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        scores,
        briefInsights: {
          emotion:
            typeof parsed?.emotion === "string"
              ? { choice: parsed.emotion, confidence: null }
              : null,
          useCase:
            typeof parsed?.use_case === "string"
              ? { choice: parsed.use_case, confidence: null }
              : null,
          urgency:
            typeof parsed?.urgency === "number"
              ? {
                  score: parsed.urgency,
                  legend: { "0": "Relaxed", "1": "Moderate", "2": "Urgent" },
                  confidence: null,
                }
              : null,
        },
        meta: {
          latencyMs,
          questionCount: voices.length + 3,
          model:
            payload?.model ?? (gatewayKey ? GATEWAY_MODEL : OPENAI_MODEL),
          provider: gatewayKey ? "vercel-ai-gateway" : "openai",
          usage: payload?.usage
            ? {
                input_tokens: payload.usage.prompt_tokens,
                output_tokens: payload.usage.completion_tokens,
              }
            : null,
        },
        rawOutput: rawOutput.slice(0, 4000),
      },
    });
  } catch (error) {
    console.error("[voice-match-gpt] Error:", error);
    return NextResponse.json(
      { success: false, error: "GPT matching failed" },
      { status: 500 }
    );
  }
}
