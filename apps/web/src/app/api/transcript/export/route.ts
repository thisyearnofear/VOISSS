import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_VOISSS_TEMPLATES,
  TimedTranscriptSchema,
  type TranscriptTemplate,
} from '@voisss/shared/types/transcript';
import { cacheGet, cacheSet } from './cache';
import { renderCarouselSlidesAsSvg, renderMp4StoryboardManifest } from './svg-render';

export const runtime = 'nodejs';

type ExportKind = 'mp4' | 'carousel';

type ExportRequest = {
  kind: ExportKind;
  templateId: string;
  transcript: unknown;
  /** optional input audio URL (future server encoder) */
  audioUrl?: string;
};

function getTemplate(templateId: string): TranscriptTemplate | null {
  return DEFAULT_VOISSS_TEMPLATES.find((t) => t.id === templateId) ?? null;
}

/**
 * Export endpoint (minimal, non-bloated).
 *
 * - Carousel: returns SVG slide assets (server-rendered) suitable for download/sharing.
 * - MP4: returns a storyboard manifest (future worker can encode frames -> MP4).
 *
 * This keeps dependencies lean and preserves a stable API contract for later upgrades.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExportRequest;

    if (!body.kind || !body.templateId || !body.transcript) {
      return NextResponse.json({ error: 'Missing kind/templateId/transcript' }, { status: 400 });
    }

    const template = getTemplate(body.templateId);
    if (!template) {
      return NextResponse.json({ error: 'Unknown templateId' }, { status: 400 });
    }

    const transcript = TimedTranscriptSchema.parse(body.transcript);
    const cacheKey = `export:${body.kind}:${template.id}:${transcript.id}`;

    const cached = cacheGet<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ ok: true, ...cached, cached: true });
    }

    const jobId = `export_${body.kind}_${Date.now()}`;

    if (body.kind === 'carousel') {
      const slides = renderCarouselSlidesAsSvg({ transcript, template });
      const payload = {
        jobId,
        status: 'complete',
        kind: body.kind,
        templateId: template.id,
        transcriptId: transcript.id,
        format: 'svg',
        slides,
      };
      cacheSet(cacheKey, payload);
      return NextResponse.json({ ok: true, ...payload });
    }

    // MP4: provide an encoder-ready manifest (no heavy video deps here).
    const manifest = renderMp4StoryboardManifest({ transcript, template });
    const payload = {
      jobId,
      status: 'complete',
      kind: body.kind,
      templateId: template.id,
      transcriptId: transcript.id,
      format: 'manifest',
      manifest,
      note:
        'MP4 encoding is not bundled in the web server build. This manifest is designed to be consumed by a separate worker that renders frames and encodes MP4.',
    };
    cacheSet(cacheKey, payload);
    return NextResponse.json({ ok: true, ...payload });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Export failed' }, { status: 500 });
  }
}
