import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds - enough for polling approach

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';

        // Handle dubbing request
        if (!contentType.includes('multipart/form-data')) {
            return new Response(JSON.stringify({ error: 'Expected multipart/form-data' }), { status: 400 });
        }

        const form = await req.formData();
        const file = form.get('audio');
        const targetLanguage = String(form.get('targetLanguage') || '');
        const sourceLanguage = String(form.get('sourceLanguage') || '');
        const preserveBackgroundAudio = form.get('preserveBackgroundAudio') === 'true';

        console.log('FormData received. File type:', typeof file, 'File instanceof Blob:', file instanceof Blob, 'Target language:', targetLanguage);
        
        if (!(file instanceof Blob)) {
            return new Response(JSON.stringify({ error: 'Missing audio file' }), { status: 400 });
        }
        if (!targetLanguage) {
            return new Response(JSON.stringify({ error: 'Target language is required' }), { status: 400 });
        }

        console.log('File size:', file.size, 'File type:', file.type);
        
        // Use backend service with polling approach to avoid Netlify timeouts
        const backendUrl = process.env.NEXT_PUBLIC_VOISSS_API || process.env.VOISSS_API;
        if (!backendUrl) {
            return new Response(JSON.stringify({ error: 'Backend service not configured' }), { status: 500 });
        }

        // Step 1: Start the dubbing job
        const backendFormData = new FormData();
        backendFormData.append('audio', file);
        backendFormData.append('targetLanguage', targetLanguage);
        if (sourceLanguage) backendFormData.append('sourceLanguage', sourceLanguage);
        if (preserveBackgroundAudio !== undefined) backendFormData.append('preserveBackgroundAudio', String(preserveBackgroundAudio));

        console.log('Starting dubbing job at backend:', backendUrl);
        const startResponse = await fetch(`${backendUrl}/api/dubbing/start`, {
            method: 'POST',
            body: backendFormData,
        });

        if (!startResponse.ok) {
            const errorText = await startResponse.text();
            console.error('Backend dubbing start error:', errorText);
            throw new Error(`Failed to start dubbing: ${startResponse.status} - ${errorText}`);
        }

        const startData = await startResponse.json();
        const dubbingId = startData.dubbing_id;
        console.log('Dubbing job started:', { dubbingId, targetLanguage });

        // Step 2: Poll for completion (with timeout protection)
        const pollStart = Date.now();
        const maxWaitMs = 50_000; // 50 seconds (within Netlify's limit)
        const pollIntervalMs = 2000; // 2 seconds
        let status = 'dubbing';
        let pollCount = 0;

        while (status !== 'dubbed') {
            const elapsed = Date.now() - pollStart;
            
            if (elapsed > maxWaitMs) {
                console.log('Polling timeout, returning partial status');
                return new Response(JSON.stringify({
                    error: 'Dubbing in progress',
                    message: 'Dubbing is taking longer than expected. Please try again in a moment.',
                    dubbingId,
                    status: 'timeout'
                }), { status: 202 }); // 202 Accepted - processing
            }

            await new Promise(r => setTimeout(r, pollIntervalMs));
            
            const statusResponse = await fetch(`${backendUrl}/api/dubbing/${dubbingId}/status`, {
                method: 'GET',
            });

            if (!statusResponse.ok) {
                console.error('Status check failed:', statusResponse.status);
                continue; // Retry status check
            }

            const statusData = await statusResponse.json();
            status = statusData.status;
            pollCount++;

            if (status === 'failed') {
                throw new Error(`Dubbing job failed: ${statusData.error || 'Unknown error'}`);
            }

            console.log(`Polling dubbing status: ${status} (${pollCount} checks, ${Math.round(elapsed / 1000)}s elapsed)`);
        }

        // Step 3: Get the final audio
        console.log('Dubbing complete, fetching audio...');
        const audioResponse = await fetch(`${backendUrl}/api/dubbing/${dubbingId}/audio/${targetLanguage}`, {
            method: 'GET',
        });

        if (!audioResponse.ok) {
            const errorText = await audioResponse.text();
            console.error('Failed to fetch dubbed audio:', errorText);
            throw new Error(`Failed to fetch audio: ${audioResponse.status} - ${errorText}`);
        }

        // Get audio as buffer and convert to base64
        const audioBuffer = await audioResponse.arrayBuffer();
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');

        console.log('Dubbing completed successfully:', {
            dubbingId,
            targetLanguage,
            audioSize: audioBuffer.byteLength,
            processingTime: Date.now() - pollStart
        });

        // Return in the same format as before
        return new Response(JSON.stringify({
            audio_base64: audioBase64,
            target_language: targetLanguage,
            processing_time: Date.now() - pollStart,
            content_type: 'audio/mpeg',
            dubbingId
        }), {
            status: 200,
            headers: {
                'content-type': 'application/json',
                'cache-control': 'no-store',
            },
        });
    } catch (err: any) {
        console.error('dub-audio error:', {
            message: err?.message,
            stack: err?.stack,
            name: err?.name,
            cause: err?.cause,
            fullError: err,
            type: typeof err
        });

        // Map specific ElevenLabs API errors to appropriate HTTP statuses
        const errorMessage = err?.message || 'Internal error';
        let status = 500;
        let userFriendlyMessage = errorMessage;

        // Extract HTTP status code if present in error message (e.g., "Dubbing failed: 400 Bad Request")
        const statusMatch = errorMessage.match(/\b(400|401|402|403|404|429|500|502|503|504)\b/);
        if (statusMatch) {
            status = Number(statusMatch[1]);
        }

        if (errorMessage.includes('quota')) {
            status = 429;
            userFriendlyMessage = 'ElevenLabs API quota exceeded. Please wait or upgrade your plan.';
        } else if (errorMessage.includes('missing the permission speech_to_speech')) {
            status = 402; // Payment required
            userFriendlyMessage = 'Speech-to-Speech feature requires an upgraded ElevenLabs plan.';
        } else if (errorMessage.includes('invalid_workspace_type') || errorMessage.includes('LEGACY_WORKSPACE')) {
            status = 402; // Payment required
            userFriendlyMessage = 'ElevenLabs workspace upgrade required. Your API key is on a legacy workspace that doesn\'t support dubbing. Please upgrade your ElevenLabs workspace.';
        } else if (errorMessage.includes('unsupported language')) {
            status = 400;
            userFriendlyMessage = 'The selected language is not supported for dubbing.';
        } else if (errorMessage.includes('no_source_provided')) {
            status = 400;
            userFriendlyMessage = 'Audio file was not provided. Please try again.';
        } else if (errorMessage.includes('401')) {
            status = 401;
            userFriendlyMessage = 'Invalid ElevenLabs API key. Please check your API key configuration.';
        } else if (errorMessage.includes('unsupported_content_type')) {
            status = 400;
            userFriendlyMessage = `Unsupported content type. Details: ${errorMessage}`;
        }

        const errorDetails = process.env.NODE_ENV === 'development' ? {
            error: userFriendlyMessage,
            originalError: errorMessage,
            stack: err?.stack,
            type: err?.name,
            rawError: typeof err === 'object' ? JSON.stringify(err) : String(err)
        } : { error: userFriendlyMessage };

        return new Response(JSON.stringify(errorDetails), { status });
    }
}