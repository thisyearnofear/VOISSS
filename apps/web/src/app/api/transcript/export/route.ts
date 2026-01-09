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

      // Prepare manifest for MP4
      let manifest = null;
      if (body.kind === 'mp4') {
        manifest = renderMp4StoryboardManifest({ transcript, template });
      }

      // Call the actual backend export worker service
      const backendUrl = process.env.VOISSS_PROCESSING_URL || 'http://localhost:5577';
      const formData = new FormData();

      // Create audio blob for backend
      const audioFile = new Blob([new Uint8Array(body.audioBlob)], { type: 'audio/webm' });
      formData.append('audio', audioFile, 'recording.webm');
      formData.append('kind', body.kind);
      formData.append('transcriptId', transcript.id);

      if (manifest) {
        formData.append('manifest', JSON.stringify(manifest));
        formData.append('template', JSON.stringify(template));
      }

      try {
        const backendRes = await fetch(`${backendUrl}/api/export/request`, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!backendRes.ok) {
          const errorData = await backendRes.json().catch(() => ({ error: 'Backend service error' }));
          return NextResponse.json({ error: errorData.error || 'Export service failed' }, { status: backendRes.status });
        }

        const backendData = await backendRes.json();
        return NextResponse.json({ ok: true, ...backendData });
      } catch (backendError: any) {
        console.error('Backend export service error:', backendError);
        return NextResponse.json({
          error: 'Failed to connect to export service',
          details: backendError.message
        }, { status: 503 });
      }
    }

    return NextResponse.json({ error: 'Unknown export kind' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Export failed' }, { status: 500 });
  }
}
