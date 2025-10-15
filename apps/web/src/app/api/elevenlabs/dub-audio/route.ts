import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for long-running dubbing operations

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
        
        // Use backend service instead of direct ElevenLabs call to avoid Netlify timeouts
        const backendUrl = process.env.NEXT_PUBLIC_VOISSS_API || process.env.VOISSS_API;
        if (!backendUrl) {
            return new Response(JSON.stringify({ error: 'Backend service not configured' }), { status: 500 });
        }

        // Forward request to our backend service which handles the async dubbing
        const backendFormData = new FormData();
        backendFormData.append('audio', file);
        backendFormData.append('targetLanguage', targetLanguage);
        if (sourceLanguage) backendFormData.append('sourceLanguage', sourceLanguage);
        if (preserveBackgroundAudio !== undefined) backendFormData.append('preserveBackgroundAudio', String(preserveBackgroundAudio));

        console.log('Forwarding to backend:', backendUrl);
        const backendResponse = await fetch(`${backendUrl}/api/dubbing/complete`, {
            method: 'POST',
            body: backendFormData,
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.error('Backend dubbing error:', errorText);
            throw new Error(`Backend dubbing failed: ${backendResponse.status} - ${errorText}`);
        }

        const result = await backendResponse.json();
        console.log('Backend dubbing completed:', { audioSize: result.audio_base64?.length });

        // Backend already returns the data in the correct format
        return new Response(JSON.stringify({
            audio_base64: result.audio_base64,
            transcript: result.transcript,
            translated_transcript: result.translated_transcript,
            detected_speakers: result.detected_speakers,
            target_language: result.target_language,
            processing_time: result.processing_time,
            content_type: result.content_type || 'audio/mpeg'
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