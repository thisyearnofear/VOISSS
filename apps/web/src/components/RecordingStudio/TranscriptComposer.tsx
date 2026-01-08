'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { VoisssKaraokeLine } from './voisss-karaoke';
import { TranscriptStyleControls, TranscriptStyle, TRANSCRIPT_THEMES, TRANSCRIPT_FONTS } from './TranscriptStyleControls';
import { buildTranscriptPages, findActiveWord, stableTranscriptId } from '@voisss/shared/utils/timed-transcript';
import {
  DEFAULT_VOISSS_TEMPLATES,
  TimedTranscriptSchema,
  type TimedTranscript,
  type TranscriptTemplate,
} from '@voisss/shared/types/transcript';

function ms(seconds: number) {
  return Math.max(0, Math.round(seconds * 1000));
}

function createRoughTimedTranscript(params: {
  text: string;
  durationSeconds: number;
  language?: string;
}): TimedTranscript {
  const { text, durationSeconds, language = 'en' } = params;
  const cleaned = text.trim();
  const sentences = cleaned.length
    ? cleaned
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean)
    : [];

  const segCount = Math.max(1, sentences.length);
  const durationMs = ms(durationSeconds);
  const segMs = Math.max(1, Math.floor(durationMs / segCount));

  const segments = Array.from({ length: segCount }).map((_, i) => {
    const startMs = i * segMs;
    const endMs = i === segCount - 1 ? durationMs : (i + 1) * segMs - 1;
    const segText = sentences[i] ?? cleaned;

    const words = segText
      .split(/\s+/)
      .map(w => w.trim())
      .filter(Boolean);

    const wordCount = Math.max(1, words.length);
    const wordMs = Math.max(1, Math.floor((endMs - startMs + 1) / wordCount));

    return {
      id: `seg_${i}`,
      startMs,
      endMs,
      text: segText,
      words: words.map((word, wi) => {
        const wStart = startMs + wi * wordMs;
        const wEnd = wi === wordCount - 1 ? endMs : startMs + (wi + 1) * wordMs - 1;
        return { word, startMs: wStart, endMs: wEnd, confidence: 0.2 };
      }),
    };
  });

  const id = stableTranscriptId({
    language,
    segments: segments.map((s) => ({ startMs: s.startMs, endMs: s.endMs, text: s.text })),
  });

  return TimedTranscriptSchema.parse({
    id,
    language,
    text: cleaned,
    segments,
    provider: 'rough',
    createdAt: new Date().toISOString(),
  });
}

function formatTemplateLabel(t: TranscriptTemplate) {
  const aspect = t.aspect === 'portrait' ? '9:16' : t.aspect === 'square' ? '1:1' : '16:9';
  return `${t.name} (${aspect})`;
}

export default function TranscriptComposer(props: {
  previewUrl: string;
  durationSeconds: number;
  audioBlob: Blob;
  initialTemplateId?: string;
  autoFocus?: boolean;
}) {
  const { previewUrl, durationSeconds, audioBlob, initialTemplateId, autoFocus } = props;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  const [templateId, setTemplateId] = useState(
    initialTemplateId && DEFAULT_VOISSS_TEMPLATES.some((t) => t.id === initialTemplateId)
      ? initialTemplateId
      : (DEFAULT_VOISSS_TEMPLATES[0]?.id ?? 'voisss-pulse-portrait')
  );

  // Initialize style with defaults
  const [style, setStyle] = useState<TranscriptStyle>({
    fontFamily: 'Inter',
    theme: TRANSCRIPT_THEMES[0], // Default Voisss theme
    animation: 'cut',
  });

  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const template = useMemo(() => {
    return DEFAULT_VOISSS_TEMPLATES.find((t: TranscriptTemplate) => t.id === templateId) ?? DEFAULT_VOISSS_TEMPLATES[0];
  }, [templateId]);

  const STORAGE_KEY = 'voisss:transcript_composer:v1';

  const [rawText, setRawText] = useState('');
  const [timedTranscript, setTimedTranscript] = useState<TimedTranscript | null>(null);
  const [importJson, setImportJson] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [shareLink, setShareLink] = useState<string | null>(null);
  const [carouselSlides, setCarouselSlides] = useState<Array<{ filename: string; svg: string }> | null>(null);

  // Restore persisted state (best-effort)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      if (typeof data?.templateId === 'string' && DEFAULT_VOISSS_TEMPLATES.some((t) => t.id === data.templateId)) {
        setTemplateId(data.templateId);
      }
      if (typeof data?.rawText === 'string') {
        setRawText(data.rawText);
      }
      if (typeof data?.importJson === 'string') {
        setImportJson(data.importJson);
      }
      if (data?.timedTranscript) {
        const tt = TimedTranscriptSchema.safeParse(data.timedTranscript);
        if (tt.success) setTimedTranscript(tt.data);
      }
      if (data?.style) {
        setStyle(data.style);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist state (best-effort)
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          templateId,
          rawText,
          importJson,
          timedTranscript,
          style,
        })
      );
    } catch {
      // ignore
    }
  }, [templateId, rawText, importJson, timedTranscript, style]);

  // Auto-generate rough timing when text changes and no transcript exists (or it's rough)
  useEffect(() => {
    const trimmed = rawText.trim();
    if (!trimmed || durationSeconds <= 0) return;

    // Only auto-generate if we have NO transcript, OR it's a rough one and the text is different.
    // This avoids overwriting accurate transcriptions while typing.
    const isRough = !timedTranscript || timedTranscript.provider === 'rough';
    const textDifferent = timedTranscript?.text !== trimmed;

    if (isRough && textDifferent) {
      const timeoutId = setTimeout(() => {
        applyRoughTiming();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawText, durationSeconds]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let rafId: number;
    const updateTime = () => {
      setCurrentTimeMs(ms(audio.currentTime));
      if (!audio.paused) {
        rafId = requestAnimationFrame(updateTime);
      }
    };

    const onPlay = () => {
      rafId = requestAnimationFrame(updateTime);
    };

    const onPause = () => {
      cancelAnimationFrame(rafId);
      updateTime(); // One last update to ensure sync
    };

    // Keep timeupdate as a fallback and for seeking
    const onTimeUpdate = () => setCurrentTimeMs(ms(audio.currentTime));

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('seeking', onTimeUpdate);

    return () => {
      cancelAnimationFrame(rafId);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('seeking', onTimeUpdate);
    };
  }, []);

  const pages = useMemo(() => {
    if (!timedTranscript || !template) return [];
    return buildTranscriptPages({
      transcript: timedTranscript,
      maxLines: template.layout.maxLines,
      maxCharsPerLine: template.layout.maxCharsPerLine,
    });
  }, [timedTranscript, template]);

  const active = useMemo(() => {
    if (!timedTranscript) return null;
    return findActiveWord(timedTranscript, currentTimeMs);
  }, [timedTranscript, currentTimeMs]);

  const activeSegment = useMemo(() => {
    if (!timedTranscript || !active) return null;
    return timedTranscript.segments[active.segmentIndex];
  }, [timedTranscript, active]);

  const [transitionKey, setTransitionKey] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // When segment changes, trigger a short transition hint.
  useEffect(() => {
    if (!activeSegment?.id) return;

    // Use a very short transition to keep it responsive
    setIsTransitioning(true);
    const t1 = window.setTimeout(() => {
      setTransitionKey((k) => k + 1);
      setIsTransitioning(false);
    }, 60); // Half the previous duration for snappier feel
    return () => window.clearTimeout(t1);
  }, [activeSegment?.id]);

  const activePage = useMemo(() => {
    if (!activeSegment) return null;
    return pages.find((p) => p.segmentId === activeSegment.id) ?? null;
  }, [pages, activeSegment]);

  const applyRoughTiming = () => {
    setError(null);
    try {
      const tt = createRoughTimedTranscript({ text: rawText, durationSeconds });
      setTimedTranscript(tt);
    } catch (e: any) {
      setError(e?.message || 'Failed to create timed transcript');
    }
  };

  const applyImportedJson = () => {
    setError(null);
    try {
      const parsed = JSON.parse(importJson);
      const tt = TimedTranscriptSchema.parse(parsed);
      setTimedTranscript(tt);
      setRawText(tt.text || tt.segments.map(s => s.text).join(' '));
    } catch (e: any) {
      setError(e?.message || 'Invalid transcript JSON');
    }
  };

  const previewStyle: React.CSSProperties = template
    ? {
      padding: template.layout.paddingPx,
      borderRadius: 16,
      minHeight: 340,
      background: style.theme.background,
      border: style.theme.id === 'blue-white' || style.theme.id === 'paper'
        ? '1px solid rgba(0,0,0,0.1)'
        : '1px solid rgba(255,255,255,0.06)',
    }
    : {};

  return (
    <div
      data-transcript-composer
      className="mt-6 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4 space-y-4"
      ref={(el) => {
        if (!el) return;
        if (autoFocus) {
          // Defer to ensure layout is stable
          setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
        }
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-white font-semibold">Shareable Transcript (VOISSS)</h4>
          <p className="text-xs text-gray-400 max-w-xl">
            Paste a transcript, then preview word-synced kinetic text. For best accuracy, import a word-timed JSON transcript.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Template</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="bg-[#2A2A2A] border border-[#3A3A3A] text-white rounded-lg px-3 py-2 text-sm"
          >
            {DEFAULT_VOISSS_TEMPLATES.map((t: TranscriptTemplate) => (
              <option key={t.id} value={t.id}>{formatTemplateLabel(t)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Preview */}
        <div className="space-y-3">
          <div style={previewStyle} className={template?.background.type === 'gradient' ? 'voisss-animated-gradient' : undefined}>
            {!timedTranscript ? (
              <div className="text-gray-400 text-sm">
                Add a transcript to preview.
              </div>
            ) : !activePage ? (
              <div className="text-gray-400 text-sm">
                Press play to see karaoke highlighting.
              </div>
            ) : (
              <div
                style={{
                  fontFamily: style.fontFamily === 'Anton' ? 'Impact, sans-serif' : style.fontFamily,
                  fontSize: template.typography.fontSizePx,
                  fontWeight: template.typography.fontWeight as any,
                  lineHeight: template.typography.lineHeight,
                  color: style.theme.textInactive,
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 240,
                  transition: 'opacity 200ms ease, transform 200ms ease',
                  opacity: isTransitioning ? 0 : 1,
                  transform: isTransitioning ? 'scale(0.98)' : 'scale(1)',
                }}
              >
                <div key={transitionKey} className="w-full">
                  {activeSegment?.words && activeSegment.words.length > 0 ? (
                    <VoisssKaraokePreview
                      lines={activePage?.lines?.map((l) => l.text) ?? []}
                      segmentWords={activeSegment.words}
                      activeWordIndex={active?.wordIndex ?? -1}
                      currentTimeMs={currentTimeMs}
                      style={style}
                      fontSizePx={template.typography.fontSizePx}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">{activeSegment?.text}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl">
            <audio ref={audioRef} controls src={previewUrl} className="flex-1 h-9" />
            <button
              onClick={() => {
                const rates = [0.75, 1, 1.25, 1.5, 2];
                const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
                setPlaybackRate(next);
              }}
              className="h-9 px-3 rounded-lg bg-[#1A1A1A] border border-[#333] text-xs font-mono text-gray-300 hover:bg-[#2A2A2A] hover:border-gray-500 hover:text-white transition-colors min-w-[50px]"
              title="Playback Speed"
            >
              {playbackRate}x
            </button>
          </div>

          {/* Style Controls */}
          <div className="p-4 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl">
            <h4 className="text-sm font-semibold text-white mb-2">Customize Style</h4>
            <TranscriptStyleControls style={style} onChange={setStyle} />
          </div>

          {error && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-900/20 text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Right: Edit / Import */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Transcript text</label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste transcript here..."
              className="voisss-form-textarea min-h-[140px]"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <button onClick={applyRoughTiming} className="voisss-btn-primary">
                Create timed transcript
              </button>
              <button
                onClick={async () => {
                  setError(null);
                  try {
                    const form = new FormData();
                    form.append('audio', audioBlob, 'recording.webm');
                    const res = await fetch('/api/transcript/transcribe', { method: 'POST', body: form });
                    const data = await res.json();
                    if (!res.ok) {
                      setError(data.error || 'Transcription failed');
                      return;
                    }
                    const tt = TimedTranscriptSchema.parse(data.transcript);
                    setTimedTranscript(tt);
                    setRawText(tt.text || tt.segments.map((s) => s.text).join(' '));
                  } catch (e: any) {
                    setError(e?.message || 'Transcription failed');
                  }
                }}
                className={`px-4 py-2 rounded-lg border text-white text-sm hover:bg-[#3A3A3A] ${autoFocus
                    ? 'bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] border-transparent'
                    : 'bg-[#2A2A2A] border-[#3A3A3A]'
                  }`}
              >
                Transcribe audio (accurate)
              </button>
              {autoFocus && (
                <div className="w-full text-xs text-[#C4B5FD] mt-1">
                  Tip: For best karaoke timing, start with accurate transcription before editing.
                </div>
              )}
              <button
                onClick={() => {
                  setRawText('');
                  setTimedTranscript(null);
                  setImportJson('');
                  setError(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-sm hover:bg-[#3A3A3A]"
              >
                Reset
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Accuracy note: the “Create timed transcript” button generates rough timing from duration. For accuracy-first karaoke, import word-level timestamps.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Import timed transcript JSON</label>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='{"id":"tt_...","language":"en","segments":[...]}'
              className="voisss-form-textarea min-h-[140px] font-mono text-xs"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={applyImportedJson}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white text-sm font-medium hover:from-[#6B4CE6] hover:to-[#8B7AFF]"
              >
                Import JSON
              </button>
              {timedTranscript && (
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(JSON.stringify(timedTranscript, null, 2));
                    setError('Copied timed transcript JSON to clipboard');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-sm hover:bg-[#3A3A3A]"
                >
                  Copy JSON
                </button>
              )}
            </div>
          </div>

          <div className="p-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl">
            <div className="text-sm text-white font-medium mb-2">Export</div>
            <div className="text-xs text-gray-400 mb-3">
              These actions are wired to lightweight API stubs now, so we can ship UI without bundling heavy video tooling.
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                disabled={!timedTranscript}
                onClick={async () => {
                  if (!timedTranscript || !template) return;
                  setError(null);
                  const res = await fetch('/api/transcript/share-link', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ transcript: timedTranscript, templateId: template.id, style }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setError(data.error || 'Failed to create share link');
                    return;
                  }
                  setShareLink(data.url);
                  await navigator.clipboard.writeText(data.url);
                  setError('Copied share link to clipboard');
                }}
                className="px-4 py-2 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-sm hover:bg-[#3A3A3A] disabled:opacity-50"
              >
                Copy share link
              </button>

              {shareLink && (
                <div className="w-full mt-3 p-3 rounded-xl bg-[#111111] border border-[#2A2A2A]">
                  <div className="text-xs text-gray-400 mb-1">Share link</div>
                  <div className="flex items-center gap-2">
                    <input
                      value={shareLink}
                      readOnly
                      className="flex-1 bg-[#0B0B0B] border border-[#2A2A2A] text-gray-200 text-xs rounded-lg px-3 py-2"
                    />
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(shareLink);
                        setError('Copied share link to clipboard');
                      }}
                      className="px-3 py-2 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-xs hover:bg-[#3A3A3A]"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
              <button
                disabled={!timedTranscript}
                onClick={async () => {
                  if (!timedTranscript || !template) return;
                  setError(null);
                  const res = await fetch('/api/transcript/export', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ kind: 'mp4', templateId: template.id, transcript: timedTranscript, style }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setError(data.error || 'MP4 export failed');
                    return;
                  }
                  setError(`MP4 export queued: ${data.jobId}`);
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white text-sm font-medium hover:from-[#6B4CE6] hover:to-[#8B7AFF] disabled:opacity-50"
              >
                Export MP4
              </button>
              <button
                disabled={!timedTranscript}
                onClick={async () => {
                  if (!timedTranscript || !template) return;
                  setError(null);
                  const res = await fetch('/api/transcript/export', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ kind: 'carousel', templateId: template.id, transcript: timedTranscript, style }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setError(data.error || 'Carousel export failed');
                    return;
                  }
                  if (data.slides && Array.isArray(data.slides)) {
                    setCarouselSlides(data.slides);
                  }
                  setError(`Carousel export ${data.status || 'queued'}: ${data.jobId}`);
                }}
                className="px-4 py-2 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-sm hover:bg-[#3A3A3A] disabled:opacity-50"
              >
                Export carousel
              </button>
            </div>

            {carouselSlides && carouselSlides.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-[#111111] border border-[#2A2A2A]">
                <div className="text-xs text-gray-400 mb-2">Carousel slides (SVG)</div>
                <div className="flex flex-col gap-2">
                  {carouselSlides.map((s) => (
                    <div key={s.filename} className="flex items-center justify-between gap-2">
                      <div className="text-xs text-gray-300 truncate">{s.filename}</div>
                      <a
                        className="px-3 py-2 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-xs hover:bg-[#3A3A3A]"
                        href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(s.svg)}`}
                        download={s.filename}
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function VoisssKaraokePreview(props: {
  lines: string[];
  segmentWords: Array<{ word: string; startMs: number; endMs: number }>;
  activeWordIndex: number;
  currentTimeMs: number;
  style: TranscriptStyle;
  fontSizePx: number;
}) {
  const { lines, segmentWords, activeWordIndex, currentTimeMs, style, fontSizePx } = props;

  // Simple deterministic split: map line words from the segment words.
  // This keeps preview line breaks stable (from shared layout) while using timing from `segmentWords`.
  let cursor = 0;

  return (
    <div className="space-y-4">
      {lines.map((line, li) => {
        const tokenCount = line.trim().length ? line.trim().split(/\s+/).length : 0;
        const lineWords = segmentWords.slice(cursor, cursor + tokenCount);
        const localActive = activeWordIndex - cursor;

        const activeWord = localActive >= 0 ? lineWords[localActive] : undefined;
        const durationMs = activeWord ? Math.max(1, activeWord.endMs - activeWord.startMs) : 1;
        const activeFill = activeWord ? clamp01((currentTimeMs - activeWord.startMs) / durationMs) : null;

        cursor += tokenCount;

        return (
          <div key={li} style={{ fontSize: Math.round(fontSizePx * 0.92) }}>
            <VoisssKaraokeLine
              words={lineWords as any}
              activeWordIndex={localActive}
              activeFill={activeFill}
              highlightColor={style.theme.textActive}
              mutedColor={style.theme.textInactive}
              pastColor={style.theme.textPast}
              animation={style.animation}
            />
          </div>
        );
      })}
    </div>
  );
}
