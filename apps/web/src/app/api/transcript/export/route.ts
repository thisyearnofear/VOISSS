import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_VOISSS_TEMPLATES,
  TimedTranscriptSchema,
  type TranscriptTemplate,
} from '@voisss/shared/types/transcript';
import { getTierForBalance, applyUserBranding } from '@voisss/shared';
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
  /** User branding options */
  userAddress?: string;
  fid?: number;
  brandingTemplateId?: string;
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
      // Apply user branding if user info provided
      let brandedTemplate = template;

      if (body.userAddress) {
        try {
          // Get user token balance
          const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/token-balance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: body.userAddress,
              tokenAddress: process.env.NEXT_PUBLIC_VOISSS_TOKEN_ADDRESS,
              chainId: parseInt(process.env.NEXT_PUBLIC_BASE_CHAIN_ID || '84532')
            }),
          });

          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            const balance = BigInt(balanceData.balance || '0');
            const tier = getTierForBalance(balance);

            // Check PapaJams token
            const papaJamsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tokens/check-papajams`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address: body.userAddress }),
            });

            let hasPapaJamsToken = false;
            if (papaJamsResponse.ok) {
              const papaJamsData = await papaJamsResponse.json();
              hasPapaJamsToken = papaJamsData.hasPapaJamsToken || false;
            }

            // Apply user branding to template
            brandedTemplate = applyUserBranding(template, {
              tier,
              hasPapaJamsToken,
              username: body.fid ? `fid:${body.fid}` : undefined,
            });
          }
        } catch (brandingError) {
          console.error('Branding failed, using default:', brandingError);
        }
      }

      const slides = renderCarouselSlidesAsSvg({ transcript, template: brandedTemplate });
      const payload = {
        jobId,
        status: 'complete',
        kind: body.kind,
        templateId: template.id,
        transcriptId: transcript.id,
        format: 'svg',
        slides,
        branding: body.userAddress ? {
          userAddress: body.userAddress,
          fid: body.fid,
          templateId: body.brandingTemplateId,
        } : null,
      };
      cacheSet(cacheKey, payload);
      return NextResponse.json({ ok: true, ...payload });
    }
    format: 'svg',
      slides,
      branding: body.userAddress ? {
        userAddress: body.userAddress,
        fid: body.fid,
        templateId: body.brandingTemplateId,
      } : null,
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
  // In production: https://voisss.famile.xyz
  // In development: http://localhost:5577
  const backendUrl = process.env.VOISSS_PROCESSING_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://voisss.famile.xyz'
      : 'http://localhost:5577');

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

  if (body.style) {
    formData.append('style', JSON.stringify(body.style));
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
