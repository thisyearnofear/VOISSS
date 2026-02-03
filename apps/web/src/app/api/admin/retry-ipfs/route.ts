/**
 * Admin endpoint to retry failed IPFS uploads
 * This can be called by a cron job or webhook to process temporary audio files
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTempAudioStorage } from '@voisss/shared/services/temp-audio-storage';
import { createRobustIPFSService } from '@voisss/shared/services/ipfs-service';

export async function POST(request: NextRequest) {
    try {
        // Basic auth check (you might want to add proper authentication)
        const authHeader = request.headers.get('authorization');
        const expectedAuth = process.env.ADMIN_API_KEY;

        if (!expectedAuth || authHeader !== `Bearer ${expectedAuth}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const tempStorage = getTempAudioStorage();
        const recordsToRetry = await tempStorage.getRecordsForRetry();

        if (recordsToRetry.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No records need retry',
                processed: 0,
            });
        }

        console.log(`🔄 Starting IPFS retry for ${recordsToRetry.length} records`);

        const robustIpfsService = createRobustIPFSService();
        const fallbackProviders = (robustIpfsService as any).getFallbackProviders?.() || [];

        let successCount = 0;
        let failureCount = 0;
        const results = [];

        for (const record of recordsToRetry) {
            try {
                console.log(`🔄 Retrying IPFS upload for ${record.id} (attempt ${record.retryCount + 1})`);

                // Mark for retry (increments retry count)
                await tempStorage.markForRetry(record.id);

                // Attempt IPFS upload
                const uploadResult = await robustIpfsService.uploadAudio(
                    record.audioBuffer,
                    {
                        filename: record.metadata.filename,
                        mimeType: record.metadata.mimeType,
                        duration: record.metadata.duration,
                    },
                    {
                        maxRetries: 2, // Fewer retries in background job
                        retryDelay: 500,
                        fallbackProviders,
                    }
                );

                console.log(`✅ IPFS retry successful for ${record.id}: ${uploadResult.hash}`);

                // Remove from temporary storage
                await tempStorage.remove(record.id);

                successCount++;
                results.push({
                    id: record.id,
                    status: 'success',
                    ipfsHash: uploadResult.hash,
                    url: uploadResult.url,
                });

                // TODO: Update database with new IPFS hash if you have one
                // This would replace the temporary URL with the permanent IPFS URL

            } catch (error) {
                console.warn(`❌ IPFS retry failed for ${record.id}:`, error);

                failureCount++;
                results.push({
                    id: record.id,
                    status: 'failed',
                    error: error instanceof Error ? error.message : String(error),
                    retryCount: record.retryCount,
                });
            }
        }

        console.log(`🏁 IPFS retry completed: ${successCount} success, ${failureCount} failed`);

        return NextResponse.json({
            success: true,
            message: `Processed ${recordsToRetry.length} records`,
            processed: recordsToRetry.length,
            successCount,
            failureCount,
            results,
        });

    } catch (error) {
        console.error('IPFS retry job error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to process IPFS retries',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';