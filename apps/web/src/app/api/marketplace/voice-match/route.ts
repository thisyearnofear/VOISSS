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

const TYPESAFE_API_URL =
  process.env.TYPESAFE_API_URL || "https://api.typesafe.ai/v1/systemone";
const TYPESAFE_MODEL = process.env.TYPESAFE_MODEL || "jev-latest";
const GATEWAY_MODEL = "typesafe-ai/jev";

// Fan-out is bounded so a large catalog can't blow up token spend per call.
const MAX_VOICES_PER_CALL = 40;
const MIN_BRIEF_LENGTH = 3;
const MAX_BRIEF_LENGTH = 1000;
const MAX_FIELD_LENGTH = 200;

const URGENCY_LEVELS = [
  "Relaxed, unhurried, evergreen",
  "Moderate, purposeful pace",
  "Urgent, high-energy, time-sensitive",
];

// Minimal shape a voice needs to be scored — chain listings are mapped into
// this, and callers may pass their own catalog directly (B2B roster matching).
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

// Listings change rarely; cache briefly so keystroke-level calls only pay for
// the Jev round-trip, not a fresh chain/indexer scan.
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

function describeVoice(v: ScorableVoice): string {
  const parts = [
    `"${v.title || `${v.tone || "Professional"} voice`}"`,
    `tone: ${v.tone || "unknown"}`,
    v.pitch ? `pitch: ${v.pitch}` : null,
    `language: ${v.language || "en-US"}`,
    v.accent ? `accent: ${v.accent}` : null,
    v.tags?.length ? `tags: ${v.tags.join(", ")}` : null,
    v.licenseType ? `license: ${v.licenseType}` : null,
  ];
  return parts.filter(Boolean).join("; ");
}

// TypeSafe REST uses "noul"; the AI SDK / AI Gateway path calls the same
// primitive "boolean" and returns `probability` instead of `noul`.
function buildQuestions(voices: ScorableVoice[], flavor: "noul" | "boolean") {
  const questions: Record<string, unknown> = {
    emotion: {
      type: "choice",
      instructions:
        "The emotional register the requester wants the voice to convey",
      criteria: {
        warm: "Warm, intimate, reassuring delivery",
        energetic: "Upbeat, high-energy, excited delivery",
        authoritative: "Confident, expert, commanding delivery",
        calm: "Soothing, unhurried, meditative delivery",
        friendly: "Casual, approachable, conversational delivery",
        dramatic: "Cinematic, intense, story-driven delivery",
      },
    },
    use_case: {
      type: "choice",
      instructions: "What the requester will use the voice for",
      criteria: {
        advertising: "Ads, promos, product marketing",
        narration: "Audiobooks, documentaries, long-form narration",
        assistant: "IVR, voice assistants, product UX",
        character: "Games, animation, character work",
        podcast: "Podcasts, social clips, creator content",
      },
    },
    urgency: {
      type: "score",
      instructions: "How urgent or high-energy the requested delivery sounds",
      criteria: URGENCY_LEVELS,
    },
  };

  voices.forEach((voice, i) => {
    questions[`fit_${i}`] = {
      type: flavor,
      instructions: `This voice is a good fit for the requester's brief — ${describeVoice(
        voice
      )}`,
    };
  });

  return questions;
}

interface NormalizedJevResult {
  answers: Record<string, unknown>;
  latencyMs: number;
  model?: string;
  usage?: { input_tokens?: number; output_tokens?: number };
}

// Free path: Vercel AI Gateway (promo pricing) via AI SDK experimental_evaluate.
async function evaluateViaGateway(
  brief: string,
  voices: ScorableVoice[]
): Promise<NormalizedJevResult> {
  const { experimental_evaluate: evaluate } = await import("ai");
  const questions = buildQuestions(voices, "boolean");

  const started = Date.now();
  const result = await evaluate({
    model: GATEWAY_MODEL,
    state: brief,
    questions: questions as never,
  });
  const latencyMs = Date.now() - started;

  const usage = result.usage
    ? {
        input_tokens: result.usage.inputTokens,
        output_tokens: result.usage.outputTokens,
      }
    : undefined;

  return {
    answers: result.answers as Record<string, any>,
    latencyMs,
    model: result.response?.modelId ?? GATEWAY_MODEL,
    usage,
  };
}

// Direct path: TypeSafe API key.
async function evaluateViaTypeSafe(
  brief: string,
  voices: ScorableVoice[],
  apiKey: string
): Promise<NormalizedJevResult> {
  const questions = buildQuestions(voices, "noul");

  const started = Date.now();
  const res = await fetch(TYPESAFE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      state: brief,
      model: TYPESAFE_MODEL,
      questions,
    }),
  });
  const latencyMs = Date.now() - started;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TypeSafe ${res.status}: ${text.slice(0, 300)}`);
  }

  const payload = await res.json();
  return {
    answers: payload?.answers ?? {},
    latencyMs,
    model: payload?.model ?? TYPESAFE_MODEL,
    usage: payload?.usage ?? undefined,
  };
}

// Noul (direct) answers read `.noul`; boolean (gateway) answers read
// `.probability`. Both are a 0-1 fit probability.
function readFit(answer: any): number | null {
  const v = answer?.noul ?? answer?.probability;
  return typeof v === "number" ? v : null;
}

function readChoice(answer: any) {
  return answer && typeof answer.choice === "string"
    ? { choice: answer.choice, confidence: answer.confidence ?? null }
    : null;
}

function readScore(answer: any) {
  return answer && typeof answer.score === "number"
    ? {
        score: answer.score,
        legend:
          answer.legend ??
          Object.fromEntries(URGENCY_LEVELS.map((l, i) => [String(i), l])),
        confidence: answer.confidence ?? null,
      }
    : null;
}

/**
 * POST /api/marketplace/voice-match
 *
 * Jev intent-matching layer: one System One call fans out a boolean fit-check
 * per listed voice plus Choice/Score questions about the brief itself.
 * Returns a per-voice fit probability (0-1) for live re-ranking.
 *
 * Auth resolution: AI_GATEWAY_API_KEY (free via Vercel AI Gateway) first,
 * then TYPESAFE_API_KEY for the direct TypeSafe API.
 *
 * Body: { brief: string, voices?: ScorableVoice[] }
 * `voices` is optional — supply a catalog to score your own roster; when
 * omitted, live marketplace listings are scored.
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
  const typeSafeKey = process.env.TYPESAFE_API_KEY;
  if (!gatewayKey && !typeSafeKey) {
    return NextResponse.json(
      { success: false, error: "jev_not_configured" },
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

    const result = gatewayKey
      ? await evaluateViaGateway(brief, voices)
      : await evaluateViaTypeSafe(brief, voices, typeSafeKey!);

    const answers = result.answers;

    const scores: Record<string, number> = {};
    voices.forEach((voice, i) => {
      const fit = readFit(answers[`fit_${i}`]);
      if (fit != null) {
        scores[voice.id] = fit;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        scores,
        briefInsights: {
          emotion: readChoice(answers.emotion),
          useCase: readChoice(answers.use_case),
          urgency: readScore(answers.urgency),
        },
        meta: {
          latencyMs: result.latencyMs,
          questionCount: voices.length + 3,
          model: result.model,
          provider: gatewayKey ? "vercel-ai-gateway" : "typesafe",
          usage: result.usage ?? null,
        },
      },
    });
  } catch (error) {
    console.error("[voice-match] Error:", error);
    return NextResponse.json(
      { success: false, error: "Voice matching failed" },
      { status: 500 }
    );
  }
}
