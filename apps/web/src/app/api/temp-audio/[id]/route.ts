/**
 * Temporary audio serving endpoint
 * Serves audio files that are temporarily stored while IPFS upload is retried
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTempAudioStorage } from '@voisss/shared/services/temp-audio-storage';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        if (!id || typeof id !== 'string') {
            return NextResponse.json(
                { error: 'Invalid audio ID' },
                { status: 400 }
            );
        }

        const tempStorage = getTempAudioStorage();
        const audioData = await tempStorage.getAudioBuffer(id);

        if (!audioData) {
            return NextResponse.json(
                { error: 'Audio not found or expired' },
                { status: 404 }
            );
        }

        // Return audio with appropriate headers
        return new NextResponse(audioData.buffer, {
            status: 200,
            headers: {
                'Content-Type': audioData.mimeType,
                'Content-Length': audioData.buffer.length.toString(),
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
            },
        });

    } catch (error) {
        console.error('Temp audio serving error:', error);
        return NextResponse.json(
            { error: 'Failed to serve audio' },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';