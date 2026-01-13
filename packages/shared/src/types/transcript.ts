import { z } from 'zod';

/**
 * Canonical timed transcript model shared across web/mobile/backend.
 *
 * Core goals:
 * - Single source of truth (DRY)
 * - Accurate karaoke highlighting (word-level timestamps)
 * - Stable identifiers for caching and export determinism
 */

export const TimedWordSchema = z.object({
  word: z.string().min(1),
  /** word start in milliseconds */
  startMs: z.number().int().nonnegative(),
  /** word end in milliseconds */
  endMs: z.number().int().nonnegative(),
  /** 0..1 */
  confidence: z.number().min(0).max(1).optional(),
});

export type TimedWord = z.infer<typeof TimedWordSchema>;

export const TimedSegmentSchema = z.object({
  /** stable id (used for editing + export caching). */
  id: z.string().min(1),
  /** segment start in milliseconds */
  startMs: z.number().int().nonnegative(),
  /** segment end in milliseconds */
  endMs: z.number().int().nonnegative(),
  text: z.string().default(''),
  /** optional word-level alignment */
  words: z.array(TimedWordSchema).optional(),
});

export type TimedSegment = z.infer<typeof TimedSegmentSchema>;

export const TimedTranscriptSchema = z.object({
  /** stable id for caching; changes when transcript meaningfully changes */
  id: z.string().min(1),
  language: z.string().min(2).default('en'),
  /** full transcript text (may be derived) */
  text: z.string().default(''),
  segments: z.array(TimedSegmentSchema),
  /** metadata from upstream transcription provider */
  provider: z.string().optional(),
  createdAt: z.string().datetime().optional(),
});

export type TimedTranscript = z.infer<typeof TimedTranscriptSchema>;

export type TranscriptHighlightMode = 'word' | 'segment';

export interface TranscriptTemplate {
  id: string;
  name: string;
  /** e.g. 9:16, 1:1, 16:9 */
  aspect: 'portrait' | 'square' | 'landscape';
  highlightMode: TranscriptHighlightMode;
  /** design tokens */
  background: {
    type: 'solid' | 'gradient';
    colors: string[];
  };
  typography: {
    fontFamily: string;
    fontSizePx: number;
    fontWeight: number;
    lineHeight: number;
    textColor: string;
    highlightColor: string;
    mutedColor: string;
  };
  layout: {
    maxLines: number;
    maxCharsPerLine: number;
    paddingPx: number;
  };
  /** Branding configuration */
  branding?: {
    requiredTier: 'none' | 'basic' | 'pro' | 'premium';
    requiresBurn: boolean;
    burnCost?: bigint;
    watermark: {
      position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'none';
      opacity: number;
      voisssBrandingSize: 'none' | 'minimal' | 'standard' | 'prominent';
      userAttributionSize: 'small' | 'medium' | 'large';
    };
  };
}

export const DEFAULT_VOISSS_TEMPLATES: TranscriptTemplate[] = [
  {
    id: 'voisss-pulse-portrait',
    name: 'Mobile',
    aspect: 'portrait',
    highlightMode: 'word',
    background: {
      type: 'gradient',
      colors: ['#0A0A0A', '#17112A', '#0A0A0A'],
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSizePx: 42,
      fontWeight: 700,
      lineHeight: 1.15,
      textColor: '#FFFFFF',
      highlightColor: '#7C5DFA',
      mutedColor: '#A1A1AA',
    },
    layout: {
      maxLines: 4,
      maxCharsPerLine: 18,
      paddingPx: 64,
    },
    branding: {
      requiredTier: 'none',
      requiresBurn: false,
      watermark: {
        position: 'bottom-right',
        opacity: 0.8,
        voisssBrandingSize: 'prominent',
        userAttributionSize: 'small',
      },
    },
  },
  {
    id: 'voisss-pulse-square',
    name: 'Square',
    aspect: 'square',
    highlightMode: 'word',
    background: {
      type: 'gradient',
      colors: ['#0A0A0A', '#1A1A1A', '#0A0A0A'],
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSizePx: 36,
      fontWeight: 700,
      lineHeight: 1.15,
      textColor: '#FFFFFF',
      highlightColor: '#7C5DFA',
      mutedColor: '#A1A1AA',
    },
    layout: {
      maxLines: 4,
      maxCharsPerLine: 20,
      paddingPx: 56,
    },
    branding: {
      requiredTier: 'none',
      requiresBurn: false,
      watermark: {
        position: 'bottom-right',
        opacity: 0.8,
        voisssBrandingSize: 'prominent',
        userAttributionSize: 'small',
      },
    },
  },
  {
    id: 'voisss-pulse-landscape',
    name: 'Desktop',
    aspect: 'landscape',
    highlightMode: 'word',
    background: {
      type: 'gradient',
      colors: ['#0A0A0A', '#0B1220', '#0A0A0A'],
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSizePx: 40,
      fontWeight: 700,
      lineHeight: 1.12,
      textColor: '#FFFFFF',
      highlightColor: '#7C5DFA',
      mutedColor: '#A1A1AA',
    },
    layout: {
      maxLines: 3,
      maxCharsPerLine: 28,
      paddingPx: 56,
    },
    branding: {
      requiredTier: 'none',
      requiresBurn: false,
      watermark: {
        position: 'bottom-right',
        opacity: 0.8,
        voisssBrandingSize: 'prominent',
        userAttributionSize: 'small',
      },
    },
  },
  // Pro tier templates
  {
    id: 'voisss-co-branded-portrait',
    name: 'Co-Branded Mobile',
    aspect: 'portrait',
    highlightMode: 'word',
    background: {
      type: 'gradient',
      colors: ['#0A0A0A', '#17112A', '#0A0A0A'],
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSizePx: 42,
      fontWeight: 700,
      lineHeight: 1.15,
      textColor: '#FFFFFF',
      highlightColor: '#7C5DFA',
      mutedColor: '#A1A1AA',
    },
    layout: {
      maxLines: 4,
      maxCharsPerLine: 18,
      paddingPx: 64,
    },
    branding: {
      requiredTier: 'pro',
      requiresBurn: false,
      watermark: {
        position: 'bottom-left',
        opacity: 0.6,
        voisssBrandingSize: 'standard',
        userAttributionSize: 'medium',
      },
    },
  },
  // Premium tier templates
  {
    id: 'voisss-white-label-portrait',
    name: 'White Label Mobile',
    aspect: 'portrait',
    highlightMode: 'word',
    background: {
      type: 'gradient',
      colors: ['#0A0A0A', '#17112A', '#0A0A0A'],
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSizePx: 42,
      fontWeight: 700,
      lineHeight: 1.15,
      textColor: '#FFFFFF',
      highlightColor: '#7C5DFA',
      mutedColor: '#A1A1AA',
    },
    layout: {
      maxLines: 4,
      maxCharsPerLine: 18,
      paddingPx: 64,
    },
    branding: {
      requiredTier: 'premium',
      requiresBurn: true,
      burnCost: BigInt('10000') * BigInt(10) ** BigInt(18), // 10k $VOISSS
      watermark: {
        position: 'none',
        opacity: 0,
        voisssBrandingSize: 'minimal',
        userAttributionSize: 'large',
      },
    },
  },
];
