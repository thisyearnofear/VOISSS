import type { TimedSegment, TimedTranscript, TimedWord } from '../types/transcript';

export type ActiveWord = {
  segmentIndex: number;
  wordIndex: number;
};

function isWithin(ms: number, startMs: number, endMs: number) {
  return ms >= startMs && ms <= endMs;
}

/**
 * Finds the active segment index for a given time.
 * Returns -1 if time is outside transcript.
 */
export function findActiveSegmentIndex(transcript: TimedTranscript, timeMs: number): number {
  for (let i = 0; i < transcript.segments.length; i++) {
    const s = transcript.segments[i];
    if (isWithin(timeMs, s.startMs, s.endMs)) return i;
  }
  return -1;
}

/**
 * Finds the active word for karaoke highlight.
 * Falls back to segment-level if words are missing.
 */
export function findActiveWord(transcript: TimedTranscript, timeMs: number): ActiveWord | null {
  const segIdx = findActiveSegmentIndex(transcript, timeMs);
  if (segIdx < 0) return null;
  const seg = transcript.segments[segIdx];
  const words = seg.words;
  if (!words || words.length === 0) return { segmentIndex: segIdx, wordIndex: -1 };

  // Linear scan is OK for small lists; exporters can pre-index if needed.
  for (let wi = 0; wi < words.length; wi++) {
    const w = words[wi];
    if (isWithin(timeMs, w.startMs, w.endMs)) return { segmentIndex: segIdx, wordIndex: wi };
  }

  // If no exact word match, choose nearest preceding.
  let best = -1;
  for (let wi = 0; wi < words.length; wi++) {
    if (words[wi].startMs <= timeMs) best = wi;
  }
  return { segmentIndex: segIdx, wordIndex: best };
}

export type TranscriptLine = {
  text: string;
  wordRange?: { from: number; to: number };
};

export type TranscriptPage = {
  segmentId: string;
  startMs: number;
  endMs: number;
  lines: TranscriptLine[];
};

function splitWordsPreservePunctuation(text: string): string[] {
  // Keep it simple and deterministic; upstream word timing will remain source of truth.
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Deterministic line breaking for share cards.
 *
 * NOTE: For accuracy-first karaoke, layout should primarily follow the timed `words`.
 * This helper is intentionally small and predictable; it can be replaced later with
 * a more advanced layout engine without changing the data model.
 */
export function layoutSegmentIntoLines(params: {
  segment: TimedSegment;
  maxLines: number;
  maxCharsPerLine: number;
}): TranscriptLine[] {
  const { segment, maxLines, maxCharsPerLine } = params;

  const tokens = splitWordsPreservePunctuation(segment.text || segment.words?.map(w => w.word).join(' ') || '');
  if (tokens.length === 0) return [];

  const lines: TranscriptLine[] = [];
  let current: string[] = [];

  const pushLine = () => {
    if (current.length === 0) return;
    lines.push({ text: current.join(' ') });
    current = [];
  };

  for (const tok of tokens) {
    const tentative = (current.length ? current.join(' ') + ' ' : '') + tok;
    if (tentative.length > maxCharsPerLine && current.length > 0) {
      pushLine();
      current.push(tok);
      if (lines.length >= maxLines) break;
    } else {
      current.push(tok);
    }
  }

  if (lines.length < maxLines) pushLine();
  return lines;
}

export function buildTranscriptPages(params: {
  transcript: TimedTranscript;
  maxLines: number;
  maxCharsPerLine: number;
}): TranscriptPage[] {
  const { transcript, maxLines, maxCharsPerLine } = params;
  return transcript.segments.map(seg => ({
    segmentId: seg.id,
    startMs: seg.startMs,
    endMs: seg.endMs,
    lines: layoutSegmentIntoLines({ segment: seg, maxLines, maxCharsPerLine }),
  }));
}

/**
 * Creates a stable transcript id from content (useful for caching).
 * Not cryptographically secure; deterministic for our caching purposes.
 */
export function stableTranscriptId(input: { language: string; segments: Array<Pick<TimedSegment, 'startMs' | 'endMs' | 'text'>> }): string {
  const raw = JSON.stringify(input);
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return `tt_${hash.toString(16)}`;
}
