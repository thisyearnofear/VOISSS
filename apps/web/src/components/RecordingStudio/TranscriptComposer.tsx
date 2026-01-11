'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VoisssKaraokeLine } from './voisss-karaoke';
import { TranscriptStyleControls, TranscriptStyle, TRANSCRIPT_THEMES, TRANSCRIPT_FONTS } from './TranscriptStyleControls';
import ErrorBoundary from '../ErrorBoundary';
import { buildTranscriptPages, findActiveWord, stableTranscriptId } from '@voisss/shared/utils/timed-transcript';
import {
  DEFAULT_VOISSS_TEMPLATES,
  TimedTranscriptSchema,
  type TimedTranscript,
  type TranscriptTemplate,
} from '@voisss/shared/types/transcript';
import { useAudioPlaybackTime } from '../../hooks/useAudioPlaybackTime';

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
  languageHint?: string;
}) {
  const {
    previewUrl,
    durationSeconds,
    audioBlob,
    initialTemplateId,
    autoFocus,
    languageHint = 'en'
  } = props;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  // Validate template ID with fallback chain
  const getDefaultTemplateId = (): string => {
    // First try explicitly passed template
    if (initialTemplateId && DEFAULT_VOISSS_TEMPLATES.some((t) => t.id === initialTemplateId)) {
      return initialTemplateId;
    }
    // Then try first template in list
    if (DEFAULT_VOISSS_TEMPLATES.length > 0 && DEFAULT_VOISSS_TEMPLATES[0]) {
      return DEFAULT_VOISSS_TEMPLATES[0].id;
    }
    // Last resort: hardcoded fallback (should never reach this)
    return 'voisss-pulse-portrait';
  };

  const [templateId, setTemplateId] = useState(getDefaultTemplateId());

  // Initialize style with defaults
  const [style, setStyle] = useState<TranscriptStyle>({
    fontFamily: 'Sans',
    theme: TRANSCRIPT_THEMES[0], // Default Voisss theme
    animation: 'cut',
    density: 'classic',
  });

  const [playbackRate, setPlaybackRate] = useState(1);

  // Sync offset in milliseconds: range scales with audio duration
  // Useful if transcription is consistently off (e.g., all words 100ms late)
  const [syncOffsetMs, setSyncOffsetMs] = useState(0);

  // Compute dynamic slider range based on duration (±5% or ±2000ms, whichever is smaller)
  const maxOffsetMs = Math.min(2000, Math.floor(durationSeconds * 1000 * 0.05));

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
  const [baselineTranscript, setBaselineTranscript] = useState<TimedTranscript | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [shareLink, setShareLink] = useState<string | null>(null);
  const [carouselSlides, setCarouselSlides] = useState<Array<{ filename: string; url: string }> | null>(null);

  // Export job tracking
  interface ExportJob {
    jobId: string;
    kind: 'mp3' | 'mp4';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    outputUrl?: string;
    error?: string;
    estimatedSeconds?: number;
    createdAt?: string;
  }
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [userId, setUserId] = useState<string>('anonymous');
  const [exportingKind, setExportingKind] = useState<'mp3' | 'mp4' | 'carousel' | null>(null);

  // Checkpoint system for saving/restoring state
  interface Checkpoint {
    id: string;
    label: string;
    timestamp: number;
    transcriptId: string | null;
    syncOffsetMs: number;
    rawText: string;
  }
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);

  // Cleanup Blob URLs for carousel slides to prevent memory leaks
  useEffect(() => {
    return () => {
      if (carouselSlides) {
        carouselSlides.forEach(s => URL.revokeObjectURL(s.url));
      }
    };
  }, [carouselSlides]);

  // Track if current transcript came from accurate source (not rough auto-generation)
  const [isAccurateTranscript, setIsAccurateTranscript] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Restore persisted state with validation
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        // Corrupted JSON, clear and start fresh
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      // Version check: only restore if schema is compatible
      const version = data?.__version ?? 1;
      if (version !== 1) {
        // Schema mismatch, clear to avoid stale data
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      // Validate stored template ID exists in current template list
      if (typeof data?.templateId === 'string') {
        const templateExists = DEFAULT_VOISSS_TEMPLATES.some((t) => t.id === data.templateId);
        if (templateExists) {
          setTemplateId(data.templateId);
        }
        // If stored template doesn't exist in current list, use default (already set in useState)
      }
      if (typeof data?.rawText === 'string') {
        setRawText(data.rawText);
      }
      if (typeof data?.importJson === 'string') {
        setImportJson(data.importJson);
      }

      // Validate transcript schema before restoring
      if (data?.timedTranscript) {
        const tt = TimedTranscriptSchema.safeParse(data.timedTranscript);
        if (tt.success) {
          setTimedTranscript(tt.data);
          // Mark as accurate if provider indicates it's not rough
          setIsAccurateTranscript(tt.data.provider !== 'rough');
        }
      }

      // Validate style shape (has required theme, fontFamily, animation)
      if (data?.style && data.style.theme && data.style.fontFamily && data.style.animation) {
        setStyle(data.style);
      }

      // Restore sync offset (optional, default to 0)
      if (typeof data?.syncOffsetMs === 'number') {
        setSyncOffsetMs(Math.max(-2000, Math.min(2000, data.syncOffsetMs)));
      }
    } catch {
      // Silently ignore any other errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedDurationSeconds = useMemo(() => {
    // If > 500, it's definitely milliseconds (500s is > 8 mins, which we don't support)
    return durationSeconds > 500 ? durationSeconds / 1000 : durationSeconds;
  }, [durationSeconds]);

  // Persist state with version (best-effort)
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          __version: 1,
          templateId,
          rawText,
          importJson,
          timedTranscript,
          style,
          syncOffsetMs,
        })
      );
    } catch (err) {
      // localStorage full or disabled; silently ignore
    }
  }, [templateId, rawText, importJson, timedTranscript, style, syncOffsetMs]);

  // Persistent User ID and Export Library
  useEffect(() => {
    let uid = localStorage.getItem('voisss:user_id');
    if (!uid) {
      uid = `u_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('voisss:user_id', uid);
    }
    setUserId(uid);

    // Fetch existing jobs for this user
    const fetchUserJobs = async () => {
      const backendUrl = process.env.NEXT_PUBLIC_VOISSS_PROCESSING_URL || 'https://voisss.famile.xyz';
      try {
        const res = await fetch(`${backendUrl}/api/export/user/${uid}`);
        if (res.ok) {
          const jobs = await res.json();
          // Filter out very old failed jobs or map to our state
          setExportJobs(jobs.map((j: any) => ({
            jobId: j.id,
            kind: j.kind,
            status: j.status,
            outputUrl: j.outputUrl,
            error: j.error_message,
            progress: j.status === 'completed' ? 100 : 0,
            createdAt: j.created_at
          })));

          // Start polling for any active jobs discovered in history
          jobs.forEach((j: any) => {
            if (j.status === 'pending' || j.status === 'processing') {
              pollExportStatus(j.id);
            }
          });
        }
      } catch (err) {
        console.error('Failed to fetch user jobs:', err);
      }
    };

    fetchUserJobs();
  }, []);

  // Auto-generate rough timing when text changes and no accurate transcript exists
  useEffect(() => {
    const trimmed = rawText.trim();
    if (!trimmed || normalizedDurationSeconds <= 0) return;

    // CRITICAL: Only auto-generate if we DON'T have an accurate transcript.
    // If user imported accurate JSON, never overwrite it with rough timing.
    // Even if rawText changes, preserve the accurate transcript.
    if (isAccurateTranscript) {
      return; // Don't auto-generate over accurate transcripts
    }

    // For rough transcripts: only regenerate if text meaningfully changed or duration is suspicious
    const lastEndMs = timedTranscript?.segments?.[timedTranscript.segments.length - 1]?.endMs || 0;
    const isSuspiciousDuration = lastEndMs > 100000 && normalizedDurationSeconds < 100; // e.g. stored 2000s when prop is 2s
    const textDifferent = timedTranscript?.text !== trimmed;

    if (!textDifferent && !isSuspiciousDuration) {
      return; // Text hasn't changed and duration isn't suspicious, no need to regenerate
    }

    // Debounce rough timing generation
    const timeoutId = setTimeout(() => {
      setError(null);
      try {
        const tt = createRoughTimedTranscript({
          text: rawText,
          durationSeconds: normalizedDurationSeconds
        });
        setTimedTranscript(tt);
        setIsAccurateTranscript(false);
      } catch (e: any) {
        setError(e?.message || 'Failed to create timed transcript');
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawText, normalizedDurationSeconds, isAccurateTranscript, timedTranscript]);

  // Use robust audio playback time tracking (timeupdate + RAF interpolation)
  const handleTimeChange = useCallback((timeMs: number) => {
    setCurrentTimeMs(timeMs);
  }, []);

  useAudioPlaybackTime(audioRef, handleTimeChange);

  // DERIVED: calibratedTranscript applies sync offset to base transcript
  // This is the source of truth for preview & export
  const calibratedTranscript = useMemo(() => {
    if (!timedTranscript) return null;
    return {
      ...timedTranscript,
      segments: timedTranscript.segments.map(seg => ({
        ...seg,
        startMs: Math.max(0, seg.startMs + syncOffsetMs),
        endMs: Math.max(0, seg.endMs + syncOffsetMs),
        words: seg.words?.map(w => ({
          ...w,
          startMs: Math.max(0, w.startMs + syncOffsetMs),
          endMs: Math.max(0, w.endMs + syncOffsetMs),
        })),
      })),
    };
  }, [timedTranscript, syncOffsetMs]);

  // LIVE JSON DISPLAY: Show calibrated transcript (with sync offset applied)
  // This updates in real-time as user adjusts the slider
  const displayedJson = useMemo(() => {
    if (!calibratedTranscript) return '';
    return JSON.stringify(calibratedTranscript, null, 2);
  }, [calibratedTranscript]);

  const pages = useMemo(() => {
    if (!calibratedTranscript || !template) return [];
    return buildTranscriptPages({
      transcript: calibratedTranscript,
      maxLines: template.layout.maxLines,
      maxCharsPerLine: template.layout.maxCharsPerLine,
    });
  }, [calibratedTranscript, template]);

  // Find active word using calibrated transcript (already has offset baked in)
  const active = useMemo(() => {
    if (!calibratedTranscript) return null;
    return findActiveWord(calibratedTranscript, currentTimeMs);
  }, [calibratedTranscript, currentTimeMs]);

  const activeSegment = useMemo(() => {
    if (!calibratedTranscript || !active) return null;
    return calibratedTranscript.segments[active.segmentIndex];
  }, [calibratedTranscript, active]);

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

  const applyRoughTiming = (language?: string) => {
    setError(null);
    try {
      const tt = createRoughTimedTranscript({
        text: rawText,
        durationSeconds: normalizedDurationSeconds,
        language: language || languageHint
      });
      setTimedTranscript(tt);
      setIsAccurateTranscript(false); // Rough timing is not accurate
    } catch (e: any) {
      setError(e?.message || 'Failed to create timed transcript');
    }
  };

  // Helper: Detect if imported transcript has offset applied by comparing first segment timing
  const detectOffsetFromImport = (imported: TimedTranscript, baseline: TimedTranscript | null): number => {
    if (!baseline || imported.segments.length === 0 || baseline.segments.length === 0) {
      return 0;
    }
    // Compare first segment start times to infer offset
    const detectedOffset = imported.segments[0].startMs - baseline.segments[0].startMs;
    // Only consider it valid if within ±2000ms
    return Math.abs(detectedOffset) <= 2000 ? detectedOffset : 0;
  };

  // Checkpoint helpers
  const saveCheckpoint = () => {
    const cp: Checkpoint = {
      id: Date.now().toString(),
      label: `Checkpoint ${checkpoints.length + 1}`,
      timestamp: Date.now(),
      transcriptId: timedTranscript?.id ?? null,
      syncOffsetMs,
      rawText,
    };
    setCheckpoints([cp, ...checkpoints.slice(0, 4)]);  // Keep last 5
    setError(`Saved checkpoint: ${cp.label}`);
  };

  const restoreCheckpoint = (cp: Checkpoint) => {
    setSyncOffsetMs(cp.syncOffsetMs);
    setRawText(cp.rawText);
    setError(`Restored ${cp.label}`);
  };

  const applyImportedJson = () => {
    setError(null);
    try {
      const parsed = JSON.parse(importJson);
      const tt = TimedTranscriptSchema.safeParse(parsed);

      if (!tt.success) {
        // Create a user-friendly summary of Zod errors
        const issues = tt.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
        setError(`Invalid transcript format: ${issues}`);
        return;
      }

      // Store as baseline (unshifted timing)
      setBaselineTranscript(tt.data);
      setTimedTranscript(tt.data);
      setRawText(tt.data.text || tt.data.segments.map(s => s.text).join(' '));
      // Mark as accurate ONLY if it came from an accurate provider (not rough or undefined)
      setIsAccurateTranscript(!!tt.data.provider && tt.data.provider !== 'rough');

      // Try to detect if this JSON was pre-calibrated (offset already applied)
      // If we have a previous transcript, compare to detect offset
      if (timedTranscript && timedTranscript.segments.length > 0) {
        const detectedOffset = detectOffsetFromImport(tt.data, timedTranscript);
        if (detectedOffset !== 0) {
          setSyncOffsetMs(detectedOffset);
          setError(`Imported JSON detected with ${detectedOffset > 0 ? '+' : ''}${detectedOffset}ms offset. Slider adjusted.`);
        }
      } else {
        setSyncOffsetMs(0); // New import, reset slider
      }
    } catch (e: any) {
      setError(e instanceof SyntaxError ? 'Invalid JSON syntax' : (e?.message || 'Invalid transcript JSON'));
    }
  };

  // Poll export job status (Top-level within component)
  const pollExportStatus = async (jobId: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_VOISSS_PROCESSING_URL || 'https://voisss.famile.xyz';
    const maxAttempts = 120; // 6 minutes (120 * 3s)
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setExportJobs(prev => prev.map(job =>
          job.jobId === jobId ? { ...job, status: 'failed', error: 'Timeout' } : job
        ));
        return;
      }

      try {
        const res = await fetch(`${backendUrl}/api/export/${jobId}/status`);
        if (!res.ok) throw new Error('Status check failed');

        const data = await res.json();

        setExportJobs(prev => prev.map(job =>
          job.jobId === jobId ? {
            ...job,
            status: data.status,
            outputUrl: data.outputUrl,
            error: data.error,
            progress: data.progress || (data.status === 'completed' ? 100 : job.progress || 0),
          } : job
        ));

        if (data.status === 'pending' || data.status === 'processing') {
          attempts++;
          setTimeout(poll, 3000); // Poll every 3 seconds (matched with our new faster backend)
        }
      } catch (error) {
        setExportJobs(prev => prev.map(job =>
          job.jobId === jobId ? { ...job, status: 'failed', error: 'Connection error' } : job
        ));
      }
    };

    poll();
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
          <h4 className="text-white font-semibold">Shareable Transcript</h4>
          <p className="text-xs text-gray-400 max-w-xl">
            <strong>Start here:</strong> Paste your transcript
          </p>
          <p className="text-xs text-gray-400 max-w-xl">
            <strong>Better results:</strong> Import a word-timed JSON file for accurate karaoke sync
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
            ) : !template ? (
              <div className="text-gray-400 text-sm">
                No template selected.
              </div>
            ) : !activePage ? (
              <div className="text-gray-400 text-sm">
                Press play to see karaoke highlighting.
              </div>
            ) : (
              <ErrorBoundary fallback={
                <div className="text-center p-8 bg-red-900/20 border border-red-500/30 rounded-xl">
                  <p className="text-red-200 text-sm mb-2">Rendering Error</p>
                  <p className="text-red-400/70 text-xs">The transcript format might be incompatible with this template.</p>
                </div>
              }>
                <div
                  style={{
                    fontFamily: style.fontFamily === 'Sans' ? 'sans-serif' : style.fontFamily === 'Serif' ? 'serif' : 'monospace',
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
                        syncOffsetMs={syncOffsetMs}
                        style={style}
                        fontSizePx={template.typography.fontSizePx}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">{activeSegment?.text}</div>
                    )}
                  </div>
                </div>
              </ErrorBoundary>
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

            <TranscriptStyleControls style={style} onChange={setStyle} />
          </div>

          {/* Sync & Confidence Controls */}
          {timedTranscript && (
            <div className="p-4 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sync Calibration</h4>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isAccurateTranscript
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>
                  {isAccurateTranscript ? 'Accurate' : 'Rough Timing'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <input
                      type="range"
                      min={-maxOffsetMs}
                      max={maxOffsetMs}
                      step="10"
                      value={syncOffsetMs}
                      onChange={(e) => setSyncOffsetMs(Math.max(-maxOffsetMs, Math.min(maxOffsetMs, Number(e.target.value))))}
                      className="w-full h-2 bg-gradient-to-r from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] rounded-lg appearance-none cursor-pointer accent-[#FF006B] shadow-lg"
                      style={{
                        background: `linear-gradient(to right, #1A1A1A 0%, #2A2A2A 50%, #1A1A1A 100%)`,
                        WebkitAppearance: 'slider-horizontal',
                      }}
                      title={`Sync offset: ${syncOffsetMs > 0 ? '+' : ''}${syncOffsetMs}ms (range: ±${maxOffsetMs}ms)`}
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                      <span>-{Math.floor(maxOffsetMs / 1000) || '0.5'}s</span>
                      <span className={syncOffsetMs === 0 ? 'text-gray-400' : 'text-[#FF006B] font-bold text-xs'}>
                        {syncOffsetMs > 0 ? '+' : ''}{syncOffsetMs}ms
                      </span>
                      <span>+{Math.floor(maxOffsetMs / 1000) || '0.5'}s</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSyncOffsetMs(0)}
                    className="px-2 py-1 text-[10px] font-bold bg-[#1A1A1A] border border-[#333] text-gray-400 rounded hover:bg-[#2A2A2A] hover:text-white transition-colors"
                  >
                    RESET
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  {!isAccurateTranscript && 'Rough timing estimates word positions. Adjust offset if highlights don\'t match speech.'}
                  {isAccurateTranscript && syncOffsetMs !== 0 && `Shifted by ${syncOffsetMs}ms. ${syncOffsetMs > 0 ? 'Highlights appear later' : 'Highlights appear earlier'}.`}
                  {isAccurateTranscript && syncOffsetMs === 0 && 'Accurate timing — highlights should sync perfectly.'}
                </p>

                {/* Checkpoint Panel */}
                <div className="flex gap-2 items-center mt-3">
                  <button
                    onClick={saveCheckpoint}
                    className="text-[10px] px-2 py-1 font-bold bg-[#1A1A1A] border border-[#333] text-gray-400 rounded hover:bg-[#2A2A2A] hover:text-white transition-colors"
                  >
                    💾 Save
                  </button>
                  {checkpoints.length > 0 && (
                    <div className="flex gap-1 overflow-x-auto flex-1">
                      {checkpoints.map((cp) => (
                        <button
                          key={cp.id}
                          onClick={() => restoreCheckpoint(cp)}
                          title={new Date(cp.timestamp).toLocaleTimeString()}
                          className="text-[10px] px-2 py-1 bg-[#0F0F0F] border border-[#2A2A2A] text-gray-300 rounded hover:bg-[#1A1A1A] hover:border-[#444] transition-colors whitespace-nowrap"
                        >
                          ↶ {cp.label.split(' ')[1]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
            <p className="text-xs text-gray-500 mb-2">
              <strong>Accuracy note:</strong> Rough timing uses duration to estimate word timing. For precise karaoke, import word-level timestamps.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={() => applyRoughTiming(languageHint)}
                className="voisss-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!rawText.trim() || normalizedDurationSeconds <= 0}
              >
                Create timed transcript
              </button>
              <button
                onClick={async () => {
                  setError(null);
                  if (normalizedDurationSeconds <= 0) return;
                  setError(null);

                  // Final safety check on total duration
                  if (normalizedDurationSeconds > 60.5) { // Allow slight buffer
                    setError(`Audio too long (${normalizedDurationSeconds.toFixed(1)}s). Maximum 60 seconds.`);
                    return;
                  }

                  setIsTranscribing(true);
                  try {
                    // Validate file size client-side (25 MB limit)
                    const maxSizeMB = 25;
                    const maxSizeBytes = maxSizeMB * 1024 * 1024;
                    if (audioBlob.size > maxSizeBytes) {
                      setError(`Audio file too large (${(audioBlob.size / 1024 / 1024).toFixed(1)}MB). Max 25MB.`);
                      return;
                    }

                    const form = new FormData();
                    form.append('audio', audioBlob, 'recording.webm');
                    if (languageHint) {
                      form.append('language', languageHint);
                    }
                    const res = await fetch('/api/transcript/transcribe', { method: 'POST', body: form });
                    const data = await res.json();
                    if (!res.ok) {
                      setError(data.error || 'Transcription failed');
                      return;
                    }
                    const tt = TimedTranscriptSchema.parse(data.transcript);
                    setTimedTranscript(tt);
                    setRawText(tt.text || tt.segments.map((s) => s.text).join(' '));
                    setIsAccurateTranscript(true);
                  } catch (e: any) {
                    setError(e?.message || 'Transcription failed');
                  } finally {
                    setIsTranscribing(false);
                  }
                }}
                disabled={isTranscribing || normalizedDurationSeconds <= 0}
                className={`px-4 py-2 rounded-lg border text-white text-sm hover:bg-[#3A3A3A] flex items-center gap-2 ${autoFocus
                  ? 'bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] border-transparent'
                  : 'bg-[#2A2A2A] border-[#3A3A3A]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isTranscribing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  'Transcribe audio (accurate)'
                )}
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
                  setIsAccurateTranscript(false);
                  setSyncOffsetMs(0);
                }}
                className="px-4 py-2 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-sm hover:bg-[#3A3A3A]"
              >
                Reset
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Import or View Calibrated JSON
              {syncOffsetMs !== 0 && <span className="text-[#00D9FF] ml-2">(current offset: {syncOffsetMs > 0 ? '+' : ''}{syncOffsetMs}ms)</span>}
            </label>
            <textarea
              value={importJson || displayedJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='{"id":"tt_abc123","language":"en","segments":[{"start":0,"end":1.2,"text":"transform"},{"start":1.3,"end":2.1,"text":"your"},{"start":2.2,"end":3.0,"text":"voice"}]}'
              className="voisss-form-textarea min-h-[140px] font-mono text-xs bg-[#0F0F0F] border border-[#2A2A2A] text-gray-300"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={applyImportedJson}
                disabled={!importJson.trim()}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white text-sm font-medium hover:from-[#6B4CE6] hover:to-[#8B7AFF] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import JSON
              </button>
              {calibratedTranscript && (
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(displayedJson);
                    setError('Copied calibrated JSON to clipboard');
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
                disabled={!calibratedTranscript}
                onClick={async () => {
                  if (!calibratedTranscript || !template) return;
                  setError(null);
                  const res = await fetch('/api/transcript/share-link', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ transcript: calibratedTranscript, templateId: template.id, style }),
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
                disabled={!calibratedTranscript}
                onClick={async () => {
                  if (!calibratedTranscript || !template) return;
                  setError(null);
                  try {
                    const res = await fetch('/api/transcript/export', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({
                        kind: 'mp3',
                        templateId: template.id,
                        transcript: calibratedTranscript,
                        audioBlob: Array.from(new Uint8Array(await audioBlob.arrayBuffer())),
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setError(data.error || 'Audio export failed');
                      return;
                    }
                    // Start tracking the job
                    const newJob: ExportJob = {
                      jobId: data.jobId,
                      kind: 'mp3',
                      status: 'pending',
                      estimatedSeconds: data.estimatedSeconds || 60,
                    };
                    setExportJobs(prev => [newJob, ...prev]);
                    setError(`Audio export started: ${data.jobId}`);

                    // Start polling for status
                    pollExportStatus(data.jobId);
                  } catch (e: any) {
                    setError(e?.message || 'Audio export failed');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-sm hover:bg-[#3A3A3A] disabled:opacity-50"
              >
                Export Audio (MP3)
              </button>
              <button
                disabled={!calibratedTranscript || exportingKind !== null}
                onClick={async () => {
                  if (!calibratedTranscript || !template) return;
                  setError(null);
                  setExportingKind('mp4');
                  try {
                    const res = await fetch('/api/transcript/export', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({
                        kind: 'mp4',
                        templateId: template.id,
                        transcript: calibratedTranscript,
                        style,
                        audioBlob: Array.from(new Uint8Array(await audioBlob.arrayBuffer())),
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setError(data.error || 'Video export failed');
                      setExportingKind(null);
                      return;
                    }
                    // Start tracking the job
                    const newJob: ExportJob = {
                      jobId: data.jobId,
                      kind: 'mp4',
                      status: 'pending',
                      estimatedSeconds: data.estimatedSeconds || 300,
                    };
                    setExportJobs(prev => [newJob, ...prev]);
                    setError(null);
                    setExportingKind(null);

                    // Start polling for status
                    pollExportStatus(data.jobId);
                  } catch (e: any) {
                    setError(e?.message || 'Video export failed');
                    setExportingKind(null);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-all ${exportingKind === 'mp4'
                  ? 'bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] opacity-60 cursor-wait'
                  : 'bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] hover:from-[#6B4CE6] hover:to-[#8B7AFF]'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {exportingKind === 'mp4' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  'Export Video (MP4)'
                )}
              </button>
              <button
                disabled={!calibratedTranscript || exportingKind !== null}
                onClick={async () => {
                  if (!calibratedTranscript || !template) return;
                  setError(null);
                  setExportingKind('carousel');
                  try {
                    const res = await fetch('/api/transcript/export', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ kind: 'carousel', templateId: template.id, transcript: calibratedTranscript, style }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setError(data.error || 'Carousel export failed');
                      setExportingKind(null);
                      return;
                    }
                    if (data.slides && Array.isArray(data.slides)) {
                      // Revoke old URLs before setting new ones
                      if (carouselSlides) carouselSlides.forEach(s => URL.revokeObjectURL(s.url));

                      const slidesWithUrls = data.slides.map((s: { filename: string; svg: string }) => ({
                        filename: s.filename,
                        url: URL.createObjectURL(new Blob([s.svg], { type: 'image/svg+xml' }))
                      }));
                      setCarouselSlides(slidesWithUrls);
                    }
                    setError(null);
                    setExportingKind(null);
                  } catch (e: any) {
                    setError(e?.message || 'Carousel export failed');
                    setExportingKind(null);
                  }
                }}
                className={`px-4 py-2 rounded-lg border text-white text-sm transition-all ${exportingKind === 'carousel'
                  ? 'bg-[#2A2A2A] border-[#3A3A3A] opacity-60 cursor-wait'
                  : 'bg-[#2A2A2A] border-[#3A3A3A] hover:bg-[#3A3A3A]'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {exportingKind === 'carousel' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  'Export carousel'
                )}
              </button>
            </div>

            {/* Active Jobs Tracker */}
            {exportJobs.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-[#111111] border border-[#2A2A2A] space-y-2">
                <div className="text-xs text-gray-400 font-medium">Active Exports</div>
                {exportJobs.map((job) => (
                  <div key={job.jobId} className="flex items-center justify-between gap-3 bg-[#1A1A1A] p-2 rounded-lg border border-[#2A2A2A]">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white font-medium truncate uppercase">{job.kind}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold
                          ${job.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            job.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                              'bg-blue-500/20 text-blue-400 animate-pulse'}`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{job.jobId}</div>
                    </div>

                    <div>
                      {job.status === 'completed' && job.outputUrl ? (
                        <a
                          href={job.outputUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-500 text-white text-xs font-bold rounded hover:opacity-90 transition-opacity"
                        >
                          Download
                        </a>
                      ) : job.status === 'failed' ? (
                        <span className="text-[10px] text-red-500">{job.error || 'Failed'}</span>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-500 ease-out"
                              style={{ width: `${job.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-[8px] text-blue-400 font-mono">
                            {job.progress ? `${job.progress}%` : 'init...'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {carouselSlides && carouselSlides.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-[#111111] border border-[#2A2A2A]">
                <div className="text-xs text-gray-400 mb-2">Carousel slides (SVG)</div>
                <div className="flex flex-col gap-2">
                  {carouselSlides.map((s) => (
                    <div key={s.filename} className="flex items-center justify-between gap-2">
                      <div className="text-xs text-gray-300 truncate">{s.filename}</div>
                      <a
                        className="px-3 py-2 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-xs hover:bg-[#3A3A3A]"
                        href={s.url}
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
  syncOffsetMs: number;
  style: TranscriptStyle;
  fontSizePx: number;
  containerHeight?: number; // Optional height override
}) {
  const { lines, segmentWords, activeWordIndex, currentTimeMs, style, fontSizePx, containerHeight = 240 } = props;

  const lineData = useMemo(() => {
    let cursor = 0;
    return lines.map((line) => {
      const tokenCount = line.trim().length ? line.trim().split(/\s+/).length : 0;
      const words = segmentWords.slice(cursor, cursor + tokenCount);
      const startCursor = cursor;
      cursor += tokenCount;
      return { words, startCursor };
    });
  }, [lines, segmentWords]);

  const activeLineIndex = useMemo(() => {
    return lineData.findIndex((data) => {
      const { words, startCursor } = data;
      const localActive = activeWordIndex - startCursor;
      return localActive >= 0 && localActive < words.length;
    });
  }, [lineData, activeWordIndex]);

  const estLineHeight = Math.round(fontSizePx * 1.3) + 16;
  const totalContentHeight = lineData.length * estLineHeight;

  // Smart centering logic:
  // 1. If content fits entirely in view, center the whole block and don't scroll.
  // 2. If it overflows, center the active line (the "treadmill" effect).
  // 3. If idle (no active word), center the whole block.

  const shouldScroll = totalContentHeight > containerHeight;

  let translateY = (containerHeight - totalContentHeight) / 2;

  if (shouldScroll && activeLineIndex >= 0) {
    translateY = (containerHeight / 2) - (activeLineIndex * estLineHeight) - (estLineHeight / 2);
  }

  return (
    <div className="w-full relative overflow-hidden" style={{ height: containerHeight }}>
      <div
        className="transition-transform duration-700 ease-out flex flex-col items-center"
        style={{
          transform: `translateY(${translateY}px)`,
          transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)'
        }}
      >
        {lineData.map((data, li) => {
          const { words, startCursor } = data;
          const localActive = activeWordIndex - startCursor;
          const isActiveLine = li === activeLineIndex;

          const activeWord = localActive >= 0 && localActive < words.length ? words[localActive] : undefined;
          const durationMs = activeWord ? Math.max(1, activeWord.endMs - activeWord.startMs) : 1;
          const activeFill = activeWord ? clamp01((currentTimeMs - activeWord.startMs) / durationMs) : null;

          return (
            <div
              key={li}
              style={{
                height: estLineHeight,
                fontSize: Math.round(fontSizePx * 0.92),
                opacity: activeLineIndex === -1 || isActiveLine ? 1 : 0.4,
                scale: isActiveLine ? '1.08' : '1',
                filter: isActiveLine ? 'blur(0px)' : 'blur(0.5px)',
                transition: 'opacity 0.6s ease, scale 0.6s ease, filter 0.6s ease',
              }}
              className="flex items-center justify-center w-full origin-center"
            >
              <VoisssKaraokeLine
                words={words as any}
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
    </div>
  );
}
