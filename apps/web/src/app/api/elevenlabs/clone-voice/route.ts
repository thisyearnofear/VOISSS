import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { rateLimiters, getIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';
const DEFAULT_IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

// Reference-audio constraints (tuned for ElevenLabs Instant Voice Cloning).
const MAX_SAMPLES = 25;
const MAX_SAMPLE_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB total upload

/**
 * Validates the text fields of a voice-clone request.
 * Audio sample files are validated separately below.
 */
const CloneRequestSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  description: z.string().trim().max(500).optional(),
  // Accept the string "true" from multipart form data or a real boolean.
  consent: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((v) => v === true || v === 'true')
    .refine((v) => v === true, {
      message: 'Contributor consent is required to clone a voice',
    }),
  labels: z.record(z.string()).optional(),
});

async function archiveReferenceSampleToIPFS(
  file: File,
  index: number,
  userAddress: string,
  voiceName: string
) {
  const apiKey =
    process.env.PINATA_API_KEY || process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const apiSecret =
    process.env.PINATA_API_SECRET || process.env.NEXT_PUBLIC_PINATA_API_SECRET;
  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || DEFAULT_IPFS_GATEWAY;

  if (!apiKey || !apiSecret) {
    throw new Error('IPFS archival is not configured');
  }

  const ext = file.type.includes('webm')
    ? 'webm'
    : file.type.includes('ogg')
      ? 'ogg'
      : file.type.includes('wav')
        ? 'wav'
        : file.type.includes('mpeg')
          ? 'mp3'
          : file.type.includes('mp4')
            ? 'm4a'
            : 'audio';
  const filename = file.name || `voice-clone-sample-${index + 1}.${ext}`;
  const archiveForm = new FormData();

  archiveForm.append('file', file, filename);
  archiveForm.append(
    'pinataMetadata',
    JSON.stringify({
      name: `voisss-clone-reference-${voiceName}-${index + 1}`,
      keyvalues: {
        purpose: 'voice-clone-reference',
        contributor: userAddress,
        voiceName,
        source: 'voisss-studio',
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size.toString(),
        archivedAt: new Date().toISOString(),
      },
    })
  );

  const response = await fetch(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    {
      method: 'POST',
      headers: {
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
      },
      body: archiveForm,
    }
  );

  if (!response.ok) {
    const error = await response.text().catch(() => '');
    throw new Error(`IPFS archival failed: ${error || response.statusText}`);
  }

  const result = await response.json();
  return {
    hash: result.IpfsHash as string,
    url: `${gateway}${result.IpfsHash}`,
    size: result.PinSize as number | undefined,
    filename,
  };
}

/**
 * POST /api/elevenlabs/clone-voice
 *
 * Clones a contributor's voice from one or more reference audio samples via
 * ElevenLabs Instant Voice Cloning. Returns the provider voiceId, which the
 * marketplace can then bind to a contributor (provenance) and license to agents.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Auth — only signed-in contributors may clone a voice.
    const user = requireAuth(req);

    // 2. Rate limit (shares the strict ElevenLabs quota bucket).
    const identifier = getIdentifier(req);
    const rateLimitResult = await rateLimiters.voiceGeneration.check(identifier);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // 3. Parse multipart payload.
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, error: 'Expected multipart/form-data' },
        { status: 400 }
      );
    }
    const form = await req.formData();

    // 4. Validate text fields.
    let labels: Record<string, string> | undefined;
    const rawLabels = form.get('labels');
    if (rawLabels) {
      try {
        labels = JSON.parse(String(rawLabels));
      } catch {
        return NextResponse.json(
          { success: false, error: 'labels must be valid JSON' },
          { status: 400 }
        );
      }
    }
    const parsed = CloneRequestSchema.safeParse({
      name: form.get('name'),
      description: form.get('description') ?? undefined,
      consent: form.get('consent'),
      labels,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    // 5. Validate audio sample files.
    const files = form.getAll('samples').filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one audio sample is required' },
        { status: 400 }
      );
    }
    if (files.length > MAX_SAMPLES) {
      return NextResponse.json(
        { success: false, error: `Too many samples (max ${MAX_SAMPLES})` },
        { status: 400 }
      );
    }
    let total = 0;
    for (const f of files) {
      if (!f.type.startsWith('audio/')) {
        return NextResponse.json(
          { success: false, error: `Invalid file type: ${f.type || 'unknown'}` },
          { status: 400 }
        );
      }
      if (f.size > MAX_SAMPLE_BYTES) {
        return NextResponse.json(
          { success: false, error: `Sample "${f.name}" exceeds 10 MB` },
          { status: 413 }
        );
      }
      total += f.size;
    }
    if (total > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Total upload exceeds 50 MB' },
        { status: 413 }
      );
    }

    // 6. Archive reference samples before cloning. Provenance is part of the product,
    // so cloning fails if the source audio cannot be pinned.
    let archivedSamples: Awaited<
      ReturnType<typeof archiveReferenceSampleToIPFS>
    >[];
    try {
      archivedSamples = await Promise.all(
        files.map((file, index) =>
          archiveReferenceSampleToIPFS(
            file,
            index,
            user.address,
            parsed.data.name
          )
        )
      );
    } catch (archiveError) {
      console.error('clone-voice IPFS archival error:', archiveError);
      return NextResponse.json(
        { success: false, error: 'Failed to archive reference samples to IPFS' },
        { status: 502 }
      );
    }

    // 7. Clone via ElevenLabs IVC. Tag with the contributor address and archived CIDs.
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Voice cloning is not configured' },
        { status: 501 }
      );
    }

    const cloneForm = new FormData();
    cloneForm.append('name', parsed.data.name);
    if (parsed.data.description) {
      cloneForm.append('description', parsed.data.description);
    }
    cloneForm.append(
      'labels',
      JSON.stringify({
        ...parsed.data.labels,
        contributor: user.address,
        source: 'voisss-studio',
        referenceIpfsHashes: archivedSamples
          .map((sample) => sample.hash)
          .join(','),
      })
    );
    files.forEach((file, i) => {
      const ext = file.type.includes('webm') ? 'webm' :
                  file.type.includes('ogg') ? 'ogg' :
                  file.type.includes('wav') ? 'wav' : 'mp3';
      cloneForm.append('files', file, file.name || `sample_${i}.${ext}`);
    });

    const elRes = await fetch(`${ELEVENLABS_API}/voices/add`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: cloneForm,
    });

    if (!elRes.ok) {
      const text = await elRes.text().catch(() => '');
      let status = 500;
      let userMessage = 'Failed to clone voice. Please try again.';
      if (text.includes('can_not_use_instant_voice_cloning') || text.includes('voice_add_edit_disabled')) {
        status = 402;
        userMessage = 'Voice cloning requires an upgraded ElevenLabs plan.';
      } else if (text.includes('voice_limit_reached')) {
        status = 409;
        userMessage = 'Voice library is full. Remove an existing voice and try again.';
      } else if (elRes.status === 401) {
        status = 401;
        userMessage = 'Invalid ElevenLabs API key configuration.';
      }
      console.error('clone-voice ElevenLabs error:', { status: elRes.status, body: text });
      return NextResponse.json(
        process.env.NODE_ENV === 'development'
          ? { success: false, error: userMessage, originalError: text }
          : { success: false, error: userMessage },
        { status }
      );
    }

    const data = await elRes.json();
    return NextResponse.json(
      {
        success: true,
        data: {
          voiceId: data.voice_id,
          requiresVerification: Boolean(data.requires_verification),
          contributor: user.address,
          referenceSamples: archivedSamples,
        },
      },
      { status: 201, headers: getRateLimitHeaders(rateLimitResult) }
    );
  } catch (err: any) {
    if (
      err?.message === 'No authentication token' ||
      err?.message === 'Invalid or expired session'
    ) {
      return NextResponse.json(
        { success: false, error: 'Please sign in to clone a voice' },
        { status: 401 }
      );
    }
    console.error('clone-voice error:', { message: err?.message, stack: err?.stack });
    return NextResponse.json(
      { success: false, error: 'Failed to clone voice. Please try again.' },
      { status: 500 }
    );
  }
}
