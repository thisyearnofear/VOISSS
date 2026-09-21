import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  DEFAULT_SCRIPT,
  EMPTY_DRAFT,
  formatAudioTime,
  parseListeningDraft,
  pickInitialVoice,
  workspaceHref,
} from '@/lib/listening-room';
import { SignalRibbon } from '@/components/listening/SignalRibbon';
import { VoiceAuditionRow } from '@/components/listening/VoiceAuditionRow';
import { ListeningRoomProvider } from '@/contexts/ListeningRoomContext';
import type { MarketplaceVoice } from '@/lib/marketplace-indexer';

describe('parseListeningDraft', () => {
  it('returns defaults for null, malformed, and non-object input', () => {
    expect(parseListeningDraft(null)).toEqual(EMPTY_DRAFT);
    expect(parseListeningDraft('')).toEqual(EMPTY_DRAFT);
    expect(parseListeningDraft('{not json')).toEqual(EMPTY_DRAFT);
    expect(parseListeningDraft('"just a string"')).toEqual(EMPTY_DRAFT);
    expect(parseListeningDraft('42')).toEqual(EMPTY_DRAFT);
    expect(parseListeningDraft('[1,2,3]')).toEqual(EMPTY_DRAFT);
    expect(parseListeningDraft('null')).toEqual(EMPTY_DRAFT);
  });

  it('round-trips a valid draft', () => {
    const draft = {
      brief: 'calm narrator',
      script: 'Hello there',
      voiceId: 'voice-1',
      shortlist: ['a', 'b'],
    };
    expect(parseListeningDraft(JSON.stringify(draft))).toEqual(draft);
  });

  it('enforces field bounds and types', () => {
    const parsed = parseListeningDraft(
      JSON.stringify({
        brief: 'x'.repeat(600),
        script: 42,
        voiceId: 'v'.repeat(300),
        shortlist: 'nope',
      })
    );
    expect(parsed.brief).toHaveLength(500);
    expect(parsed.script).toBe(DEFAULT_SCRIPT);
    expect(parsed.voiceId).toHaveLength(200);
    expect(parsed.shortlist).toEqual([]);
  });

  it('preserves a deliberately cleared script', () => {
    expect(parseListeningDraft(JSON.stringify({ script: '' })).script).toBe('');
  });

  it('dedupes shortlist, caps at 3, and drops invalid ids', () => {
    const parsed = parseListeningDraft(
      JSON.stringify({
        shortlist: ['a', 'b', 'a', '', 'c', 'd', 'x'.repeat(201), 7],
      })
    );
    expect(parsed.shortlist).toEqual(['a', 'b', 'c']);
  });
});

describe('workspaceHref', () => {
  it('builds a bare path without params', () => {
    expect(workspaceHref('', '')).toBe('/generate');
    expect(workspaceHref('', '   ')).toBe('/generate');
  });

  it('escapes voice ids containing &/# and unicode briefs', () => {
    const href = workspaceHref('v&1#2', 'café narrator warm');
    expect(href.startsWith('/generate?')).toBe(true);
    const params = new URLSearchParams(href.slice('/generate?'.length));
    expect(params.get('voiceId')).toBe('v&1#2');
    expect(params.get('brief')).toBe('café narrator warm');
    expect(href).toContain(encodeURIComponent('v&1#2'));
  });
});

describe('formatAudioTime', () => {
  it('formats finite non-negative seconds', () => {
    expect(formatAudioTime(0)).toBe('0:00');
    expect(formatAudioTime(65)).toBe('1:05');
    expect(formatAudioTime(600)).toBe('10:00');
    expect(formatAudioTime(65.9)).toBe('1:05');
  });

  it('guards non-finite and negative input', () => {
    expect(formatAudioTime(NaN)).toBe('0:00');
    expect(formatAudioTime(Infinity)).toBe('0:00');
    expect(formatAudioTime(-3)).toBe('0:00');
  });
});

describe('pickInitialVoice', () => {
  const voices = [
    { id: 'a', contractVoiceId: 'ca' },
    { id: 'b', contractVoiceId: 'cb' },
  ];

  it('prefers an explicit requested id (id or contractVoiceId)', () => {
    expect(pickInitialVoice(voices, 'cb', 'a').voice?.id).toBe('b');
    expect(pickInitialVoice(voices, 'a', null).requestedInvalid).toBe(false);
  });

  it('flags an invalid requested id and returns no fallback voice', () => {
    const result = pickInitialVoice(voices, 'missing', 'a');
    expect(result.requestedInvalid).toBe(true);
    expect(result.voice).toBeNull();
  });

  it('falls back to the stored id, then the first voice', () => {
    expect(pickInitialVoice(voices, null, 'b').voice?.id).toBe('b');
    expect(pickInitialVoice(voices, '', 'missing').voice?.id).toBe('a');
    expect(pickInitialVoice([], null, null).voice).toBeNull();
  });
});

describe('SSR safety', () => {
  const voice = {
    id: 'v1',
    contractVoiceId: 'c1',
    sampleUrl: 'https://example.com/a.mp3',
    metadata: { title: 'Warm Narrator' },
    voiceProfile: { accent: 'US', language: 'en-US', tone: 'warm' },
  } as unknown as MarketplaceVoice;

  it('renders the ribbon and a provider-wrapped audition row without window/Audio', () => {
    expect(() =>
      renderToStaticMarkup(
        React.createElement(ListeningRoomProvider, null, [
          React.createElement(SignalRibbon, { key: 'r', playing: false }),
          React.createElement(VoiceAuditionRow, { key: 'v', voice }),
        ])
      )
    ).not.toThrow();
  });
});
