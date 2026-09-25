import rubric from "./rubric.v1.json";

/**
 * Heuristic fallback — local rubric replay with keyword heuristics.
 *
 * Mirrors the server rubric pass (target-distance) but infers voice
 * dimension levels and brief archetype/emotion/urgency from text signals.
 * No network, <1ms, deterministic, same shape as Jev response so the
 * loom never dead-ends. Provider is explicitly "heuristic" so UI can
 * label the fallback and offer a Jev retry.
 */

export type DimKey = keyof typeof rubric.dimensions;
export type ArchetypeKey = keyof typeof rubric.archetypes;

export const DIMENSIONS = Object.keys(rubric.dimensions) as DimKey[];

const ARCHETYPE_HINTS: [ArchetypeKey, RegExp][] = [
  ["meditation", /sleep|calm|meditat|relax|soothe|wellness|unhurried|asmr|gentle|slow|tranquil|serene/i],
  ["advertising", /\bads?\b|promo|drop|launch|spot\b|commercial|urgent|hype|sell|trailer|teaser/i],
  ["narration", /audiobook|narrat|documentar|stor(y|ies)|chapter|longform|book|explain|guide/i],
  ["assistant", /assistant|ivr|onboard|app\b|product|ux\b|concierge|brand voice|helpful|support/i],
  ["character", /game|character|npc|animation|villain|hero\b|creature|cartoon|roleplay|persona/i],
  ["podcast", /podcast|host|interview|conversation|show\b|co-?host|chat|episode|creator/i],
];

const EMOTION_HINTS: [string, RegExp][] = [
  ["warm", /warm|cozy|reassuring|tender|soft|gentle|kind|caring|comfort/i],
  ["energetic", /energetic|excited|upbeat|vibrant|dynamic|enthusiastic|hype|high energy/i],
  ["authoritative", /authoritative|confident|commanding|expert|credible|powerful|strong|gravitas/i],
  ["calm", /calm|soothing|relaxed|tranquil|serene|unhurried|peaceful|still/i],
  ["friendly", /friendly|casual|approachable|conversational|chatty|neighbor|relatable/i],
  ["dramatic", /dramatic|cinematic|intense|story|epic|theatrical|intimate|breathy/i],
];

const DIM_KEYWORDS: Record<DimKey, { high: string[]; low: string[] }> = {
  arousal: {
    high: ["energetic", "excited", "dynamic", "powerful", "intense", "upbeat", "vibrant", "dramatic", "enthusiastic", "high energy", "urgent", "hype"],
    low: ["calm", "soothing", "gentle", "relaxed", "soft", "unhurried", "tranquil", "mellow", "serene", "whisper", "still"],
  },
  pace: {
    high: ["fast", "brisk", "quick", "rapid", "urgent", "driving", "upbeat", "energetic"],
    low: ["slow", "unhurried", "measured", "deliberate", "calm", "soothing", "relaxed", "gentle", "drawn"],
  },
  expressiveness: {
    high: ["expressive", "animated", "dramatic", "varied", "dynamic", "theatrical", "intoned", "lively"],
    low: ["flat", "monotone", "neutral", "restrained", "subtle", "even", "measured"],
  },
  warmth: {
    high: ["warm", "friendly", "inviting", "comforting", "reassuring", "approachable", "kind", "tender", "cozy"],
    low: ["cold", "distant", "neutral", "detached", "formal", "cool"],
  },
  authority: {
    high: ["authoritative", "commanding", "confident", "powerful", "strong", "gravitas", "credible", "expert", "assertive"],
    low: ["soft", "gentle", "understated", "tentative", "humble", "light"],
  },
  intimacy: {
    high: ["intimate", "soft", "whisper", "close", "breathy", "personal", "gentle", "quiet", "near"],
    low: ["broadcast", "projected", "loud", "distant", "announcer", "booming"],
  },
};

export interface ScorableVoiceInput {
  id: string;
  title?: string;
  tone?: string;
  pitch?: string;
  language?: string;
  accent?: string;
  tags?: string[];
  licenseType?: string;
}

export interface HeuristicResult {
  scores: Record<string, number>;
  holisticScores: Record<string, number>;
  archetype: ArchetypeKey;
  dimensionLevels: Record<string, Record<string, number>>;
  reasons: Record<string, string[]>;
  briefInsights: {
    emotion: { choice: string; confidence: number | null } | null;
    useCase: { choice: string; confidence: number | null } | null;
    urgency: { score: number; legend: Record<string, string>; confidence: number | null } | null;
  } | null;
  meta: {
    rubric: string;
    latencyMs: number;
    questionCount: number;
    model: string;
    provider: "heuristic";
    usage: null;
    fallback: true;
    jevError?: string;
  };
}

function detectArchetype(brief: string): ArchetypeKey {
  const text = brief.trim();
  if (!text) return rubric.fallback_archetype as ArchetypeKey;
  let best: ArchetypeKey = rubric.fallback_archetype as ArchetypeKey;
  let bestHits = 0;
  for (const [key, re] of ARCHETYPE_HINTS) {
    const hits = (text.match(new RegExp(re.source, "gi")) ?? []).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = key;
    }
  }
  return best;
}

function detectEmotion(brief: string): { choice: string; confidence: number | null } | null {
  const text = brief.trim().toLowerCase();
  if (!text) return null;
  let best: string | null = null;
  let bestHits = 0;
  let total = 0;
  for (const [choice, re] of EMOTION_HINTS) {
    const hits = (brief.match(new RegExp(re.source, "gi")) ?? []).length;
    total += hits;
    if (hits > bestHits) {
      bestHits = hits;
      best = choice;
    }
  }
  if (!best || bestHits === 0) return null;
  const confidence = total > 0 ? Math.min(0.92, 0.45 + bestHits * 0.18) : null;
  return { choice: best, confidence: confidence != null ? Math.round(confidence * 100) / 100 : null };
}

function detectUseCase(brief: string, archetype: ArchetypeKey): { choice: string; confidence: number | null } | null {
  // map archetype back to use_case choice (wellness → meditation)
  const reverse: Record<string, string> = {
    advertising: "advertising",
    narration: "narration",
    assistant: "assistant",
    character: "character",
    podcast: "podcast",
    meditation: "wellness",
  };
  const choice = reverse[archetype] ?? archetype;
  const hits = (brief.match(new RegExp((ARCHETYPE_HINTS.find(([k]) => k === archetype)?.[1].source ?? ""), "gi")) ?? []).length;
  const confidence = hits > 0 ? Math.min(0.88, 0.5 + hits * 0.15) : 0.48;
  return { choice, confidence: Math.round(confidence * 100) / 100 };
}

function detectUrgency(brief: string): { score: number; legend: Record<string, string>; confidence: number | null } | null {
  const text = brief.toLowerCase();
  if (!text.trim()) return null;
  const calmWords = ["calm", "unhurried", "evergreen", "slow", "gentle", "meditation", "sleep", "soothing", "relaxed", "tranquil", "serene"];
  const urgentWords = ["urgent", "high-energy", "high energy", "fast", "quickly", "asap", "time-sensitive", "hype", "launch", "promo", "rush", "rapid"];
  let calmHits = 0;
  let urgentHits = 0;
  for (const w of calmWords) if (text.includes(w)) calmHits++;
  for (const w of urgentWords) if (text.includes(w)) urgentHits++;
  const raw = urgentHits - calmHits;
  let score: number;
  if (raw >= 2) score = 2;
  else if (raw <= -1) score = 0;
  else score = 1;
  // add jitter from brief length — short urgent briefs bias high
  const confidence = Math.min(0.85, 0.45 + Math.abs(raw) * 0.12 + (urgentHits + calmHits > 0 ? 0.1 : 0));
  return {
    score,
    legend: { "0": "Relaxed, unhurried, evergreen", "1": "Moderate, purposeful pace", "2": "Urgent, high-energy, time-sensitive" },
    confidence: Math.round(confidence * 100) / 100,
  };
}

function hash01(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function voiceToLevels(voice: ScorableVoiceInput): Record<DimKey, number> {
  const hay = `${voice.title ?? ""} ${voice.tone ?? ""} ${voice.pitch ?? ""} ${voice.accent ?? ""} ${(voice.tags ?? []).join(" ")}`.toLowerCase();
  const levels: Record<string, number> = {};
  const jitter = hash01(voice.id);
  for (const dim of DIMENSIONS) {
    const kw = DIM_KEYWORDS[dim as DimKey];
    let score = 0.5;
    let highHits = 0;
    let lowHits = 0;
    for (const w of kw.high) if (hay.includes(w)) highHits++;
    for (const w of kw.low) if (hay.includes(w)) lowHits++;
    if (highHits || lowHits) {
      score += highHits * 0.14 - lowHits * 0.14;
      // boost if tone directly matches archetype-ish words
      if (hay.includes(dim) && voice.tone) score += 0.06;
    } else {
      // deterministic spread when no signal — hash-seeded so catalog isn't flat
      const spread = (hash01(`${voice.id}:${dim}`) - 0.5) * 0.28;
      score += spread;
      // small per-voice bias keeps repeated renders stable
      score += (jitter - 0.5) * 0.08;
    }
    // pitch nudges authority slightly
    if (dim === "authority" && voice.pitch) {
      if (/low|deep|baritone|bass/i.test(voice.pitch)) score += 0.08;
      if (/high|light|bright/i.test(voice.pitch)) score -= 0.07;
    }
    if (dim === "warmth" && /warm|friendly/i.test(hay)) score += 0.07;
    if (dim === "intimacy" && /whisper|soft|intimate/i.test(hay)) score += 0.1;
    if (dim === "arousal" && /calm|soothing/i.test(hay)) score -= 0.08;
    levels[dim] = Math.min(0.95, Math.max(0.05, Math.round(score * 100) / 100));
  }
  return levels as Record<DimKey, number>;
}

export function heuristicMatch(
  brief: string,
  voices: ScorableVoiceInput[],
  opts?: { jevError?: string; latencyMs?: number }
): HeuristicResult {
  const started = performance.now();
  const archetype = detectArchetype(brief);
  const def = (rubric.archetypes as Record<string, { targets: Record<string, number>; weights: Record<string, number> }>)[archetype];
  const scores: Record<string, number> = {};
  const dimensionLevels: Record<string, Record<string, number>> = {};
  const reasons: Record<string, string[]> = {};

  for (const voice of voices) {
    const levels = voiceToLevels(voice);
    dimensionLevels[voice.id] = levels;
    let weightedDistance = 0;
    let totalWeight = 0;
    const matched: { closeness: number; weight: number; label: string }[] = [];
    for (const dim of DIMENSIONS) {
      const level = levels[dim as DimKey];
      const weight = def.weights[dim as string] ?? 0;
      const target = def.targets[dim as string] ?? 0.5;
      if (weight <= 0) continue;
      const closeness = 1 - Math.abs(level - target);
      weightedDistance += weight * Math.abs(level - target);
      totalWeight += weight;
      if (closeness >= 0.7) {
        const side = level < 0.4 ? "low" : level > 0.6 ? "high" : null;
        const label = side ? (rubric.reason_labels as Record<string, Record<string, string>>)[dim]?.[side] : undefined;
        if (label) matched.push({ closeness, weight, label });
      }
    }
    scores[voice.id] = totalWeight > 0 ? Math.round((1 - weightedDistance / totalWeight) * 1000) / 1000 : 0;
    reasons[voice.id] = matched.sort((a, b) => b.weight * b.closeness - a.weight * a.closeness).slice(0, 3).map((m) => m.label);
  }

  const elapsed = opts?.latencyMs ?? Math.max(0.4, performance.now() - started);

  return {
    scores,
    holisticScores: { ...scores },
    archetype,
    dimensionLevels,
    reasons,
    briefInsights: {
      emotion: detectEmotion(brief),
      useCase: detectUseCase(brief, archetype),
      urgency: detectUrgency(brief),
    },
    meta: {
      rubric: rubric.version,
      latencyMs: Math.round(elapsed * 10) / 10,
      questionCount: voices.length * (1 + DIMENSIONS.length) + 3,
      model: `rubric-v${rubric.version}-heuristic`,
      provider: "heuristic",
      usage: null,
      fallback: true,
      jevError: opts?.jevError,
    },
  };
}

export const ARCHETYPE_SETTLEMENT_HINT: Record<ArchetypeKey, string> = {
  meditation: "meditation · hold favors calm: longer 12-mo license reads well here · per-use hold +1.2s",
  advertising: "advertising · burst: 3-mo license + recall · per-use favors speed over hold",
  narration: "narration · chapter license · per-use favors consistency over flourish",
  assistant: "assistant · seat license · per-use favors <200ms latency over warmth",
  character: "character · session license · per-use favors expressive range",
  podcast: "podcast · episode license · per-use favors relatability + retention",
};

export function getSettlementHint(archetype: string | undefined): string | null {
  if (!archetype) return null;
  return (ARCHETYPE_SETTLEMENT_HINT as Record<string, string>)[archetype] ?? null;
}
