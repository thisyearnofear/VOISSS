import { NextRequest } from 'next/server';
import { ElevenLabsTransformProvider } from '@voisss/shared';

export const runtime = 'nodejs';

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
        const provider = new ElevenLabsTransformProvider();
        console.log('Calling dubAudio with targetLanguage:', targetLanguage, 'sourceLanguage:', sourceLanguage, 'preserveBackgroundAudio:', preserveBackgroundAudio);
        const result = await provider.dubAudio(file, {
            targetLanguage,
            sourceLanguage: sourceLanguage || undefined,
            preserveBackgroundAudio,
            voiceId: '' // Not used in dubbing
        });
        console.log('dubAudio result received. Result type:', typeof result, 'dubbedAudio type:', result?.dubbedAudio?.type);

        // Return as JSON with audio as base64
        const audioBuffer = await result.dubbedAudio.arrayBuffer();
        console.log('Audio buffer size:', audioBuffer.byteLength);
        const audioBase64 = Buffer.from(audioBuffer).toString('base64');

        return new Response(JSON.stringify({
            audio_base64: audioBase64,
            transcript: result.transcript,
            translated_transcript: result.translatedTranscript,
            detected_speakers: result.detectedSpeakers,
            target_language: result.targetLanguage,
            processing_time: result.processingTime,
            content_type: result.dubbedAudio.type || 'audio/mpeg'
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