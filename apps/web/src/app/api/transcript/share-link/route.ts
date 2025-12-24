import { NextRequest, NextResponse } from 'next/server';
import { TimedTranscriptSchema } from '@voisss/shared/types/transcript';

export const runtime = 'nodejs';

type ShareLinkRequest = {
  transcript: unknown;
  templateId: string;
};

/**
 * Share link endpoint stub.
 *
 * In v1 this simply returns a deterministic URL that can later be backed by
 * persisted storage (db/ipfs). We keep the contract stable so the front-end
 * doesn't need rewrites.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ShareLinkRequest;
    const transcript = TimedTranscriptSchema.parse(body.transcript);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '';
    // For now we cannot persist, so we return a URL that can be used once we add persistence.
    // Keeping stable shape for future.
    const url = `${baseUrl}/studio?transcriptId=${encodeURIComponent(transcript.id)}&templateId=${encodeURIComponent(body.templateId)}`;

    return NextResponse.json({ ok: true, url });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create share link' }, { status: 500 });
  }
}
