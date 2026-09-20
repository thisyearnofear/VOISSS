import rubric from "./matching/rubric.v1.json";

/**
 * Archetype → generation style.
 *
 * The matching rubric already computes a target acoustic profile per archetype
 * (arousal / pace / expressiveness / warmth / authority / intimacy, 0..1).
 * This module maps those targets onto ElevenLabs generation parameters so a
 * brief doesn't just select the right voice — it performs in the right style.
 */

export const ALLOWED_MODELS = [
  "eleven_v3",
  "eleven_v3_conversational",
  "eleven_multilingual_v2",
  "eleven_flash_v2_5",
  "eleven_turbo_v2_5",
] as const;

export const DEFAULT_MODEL = "eleven_v3";
export const FREE_MODEL = "eleven_flash_v2_5"; // 50% cheaper/char, ~75ms
export const FALLBACK_MODEL = "eleven_multilingual_v2";
const V3_CHAR_LIMIT = 5000;

export function resolveModel(opts: {
  requested?: string;
  isFree?: boolean;
  textLength?: number;
}): string {
  const { requested, isFree, textLength = 0 } = opts;
  if (requested && (ALLOWED_MODELS as readonly string[]).includes(requested)) {
    // v3 caps at 5k chars — long-form falls back to flash's 40k window
    if (requested === "eleven_v3" && textLength > V3_CHAR_LIMIT) {
      return "eleven_flash_v2_5";
    }
    return requested;
  }
  if (isFree) return FREE_MODEL;
  if (textLength > V3_CHAR_LIMIT) return "eleven_flash_v2_5";
  return DEFAULT_MODEL;
}

export type VoiceSettings = {
  stability: number;
  similarity_boost?: number;
  style?: number;
  speed?: number;
};

type ArchetypeTargets = Record<string, number>;

function archetypeTargets(archetype: string | undefined): ArchetypeTargets | null {
  if (!archetype) return null;
  const archetypes = rubric.archetypes as Record<string, { targets: ArchetypeTargets }>;
  return archetypes[archetype]?.targets ?? null;
}

/**
 * Map an archetype's target profile onto ElevenLabs voice_settings.
 * Explicit caller overrides always win.
 */
export function styleForArchetype(
  archetype: string | undefined,
  overrides?: { stability?: number; similarity_boost?: number }
): VoiceSettings {
  const targets = archetypeTargets(archetype);
  const expressiveness = targets?.expressiveness ?? 0.5;
  const pace = targets?.pace ?? 0.5;
  return {
    // expressive archetypes want lower stability; measured ones want higher
    stability:
      overrides?.stability ??
      Math.min(0.85, Math.max(0.25, 0.85 - expressiveness * 0.55)),
    similarity_boost: overrides?.similarity_boost ?? 0.75,
    style: Math.round(expressiveness * 0.5 * 100) / 100,
    speed: Math.round((0.8 + pace * 0.35) * 100) / 100, // pace 0 → 0.8, pace 1 → 1.15
  };
}

export type GenerationOptions = {
  model?: string;
  archetype?: string;
  stability?: number;
  similarity_boost?: number;
};

/**
 * Prune settings a given model doesn't honor. v3 supports only stability
 * (Creative/Natural/Robust bands) and speed; similarity_boost/style are
 * ignored there but meaningful on v2.x models.
 */
export function settingsForModel(model: string, s: VoiceSettings): VoiceSettings {
  const speed = Math.min(1.2, Math.max(0.7, s.speed ?? 1));
  if (model.startsWith("eleven_v3")) {
    return { stability: s.stability, speed };
  }
  return { ...s, speed };
}

/** One ElevenLabs TTS call. Returns the raw response so callers can retry. */
export async function synthesizeVoice(
  apiKey: string,
  voiceId: string,
  text: string,
  model: string,
  settings: VoiceSettings
): Promise<Response> {
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: settings,
    }),
  });
}
