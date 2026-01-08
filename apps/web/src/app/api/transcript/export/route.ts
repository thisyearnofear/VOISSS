import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_VOISSS_TEMPLATES,
  TimedTranscriptSchema,
  type TranscriptTemplate,
} from '@voisss/shared/types/transcript';
import { cacheGet, cacheSet } from './cache';
import { renderCarouselSlidesAsSvg, renderMp4StoryboardManifest } from './svg-render';

export const runtime = 'nodejs';

type ExportKind = 'mp3' | 'mp4' | 'carousel';

type ExportRequest = {
  kind: ExportKind;
  templateId: string;
  transcript: unknown;
  /** optional input audio blob as Uint8Array */
  audioBlob?: number[];
  style?: any;
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

    if (body.kind === 'mp3' || body.kind === 'mp4') {
      // Both audio and video exports require audio blob
      if (!body.audioBlob || !Array.isArray(body.audioBlob)) {
        return NextResponse.json({ error: 'Audio blob required for export' }, { status: 400 });
      }

      // For MP4, also generate and include the manifest
      let payload: any = {
        jobId,
        status: 'queued',
        kind: body.kind,
        templateId: template.id,
        transcriptId: transcript.id,
        audioBlob: body.audioBlob,
      };

      if (body.kind === 'mp4') {
        const manifest = renderMp4StoryboardManifest({ transcript, template });
        payload.manifest = manifest;
        payload.template = template; // Include full template for backend rendering
      }

      return NextResponse.json({ ok: true, ...payload });
    }

    return NextResponse.json({ error: 'Unknown export kind' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Export failed' }, { status: 500 });
  }
}
