export interface ListeningDraft {
  brief: string;
  script: string;
  voiceId: string;
  shortlist: string[];
}

export const LISTENING_DRAFT_KEY = "voisss_listening_room_v1";

export const DEFAULT_SCRIPT =
  "Take a moment. Settle in. There is a story here, and it starts with a voice.";

export const EMPTY_DRAFT: ListeningDraft = {
  brief: "",
  script: DEFAULT_SCRIPT,
  voiceId: "",
  shortlist: [],
};

const MAX_TEXT = 500;
const MAX_ID = 200;
const MAX_SHORTLIST = 3;

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

export function parseListeningDraft(raw: string | null): ListeningDraft {
  if (!raw) return { ...EMPTY_DRAFT };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ...EMPTY_DRAFT };
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ...EMPTY_DRAFT };
  }
  const record = value as Record<string, unknown>;
  const shortlist: string[] = [];
  if (Array.isArray(record.shortlist)) {
    for (const entry of record.shortlist) {
      if (typeof entry !== "string" || entry.length === 0 || entry.length > MAX_ID) {
        continue;
      }
      if (!shortlist.includes(entry)) shortlist.push(entry);
      if (shortlist.length >= MAX_SHORTLIST) break;
    }
  }
  return {
    brief: cleanText(record.brief, MAX_TEXT),
    script:
      typeof record.script === "string"
        ? record.script.slice(0, MAX_TEXT)
        : DEFAULT_SCRIPT,
    voiceId: cleanText(record.voiceId, MAX_ID),
    shortlist,
  };
}

export function workspaceHref(voiceId: string, brief: string): string {
  const params = new URLSearchParams();
  if (voiceId) params.set("voiceId", voiceId);
  if (brief.trim()) params.set("brief", brief.trim());
  return `/generate${params.size ? `?${params.toString()}` : ""}`;
}

export function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export interface VoiceLike {
  id: string;
  contractVoiceId?: string;
}

export function findVoiceById<T extends VoiceLike>(
  voices: T[],
  requestedId: string
): T | undefined {
  if (!requestedId) return undefined;
  return voices.find(
    (v) => v.id === requestedId || v.contractVoiceId === requestedId
  );
}

export interface InitialVoiceSelection<T> {
  voice: T | null;
  requestedInvalid: boolean;
}

export function pickInitialVoice<T extends VoiceLike>(
  voices: T[],
  requestedId: string | null | undefined,
  fallbackId: string | null | undefined
): InitialVoiceSelection<T> {
  const requested = (requestedId || "").trim();
  if (requested) {
    const match = findVoiceById(voices, requested);
    return match
      ? { voice: match, requestedInvalid: false }
      : { voice: null, requestedInvalid: true };
  }
  const stored = (fallbackId || "").trim();
  if (stored) {
    const match = findVoiceById(voices, stored);
    if (match) return { voice: match, requestedInvalid: false };
  }
  return { voice: voices[0] ?? null, requestedInvalid: false };
}
