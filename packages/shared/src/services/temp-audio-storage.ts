/**
 * Temporary audio storage service for handling IPFS upload failures
 * Stores audio files temporarily and provides async retry mechanisms
 */

import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

export interface TempAudioRecord {
    id: string;
    audioBuffer: Buffer;
    metadata: {
        filename: string;
        mimeType: string;
        duration: number;
        recordingId: string;
        agentAddress: string;
        contentHash: string;
    };
    createdAt: number;
    retryCount: number;
    lastRetryAt?: number;
}

export class TempAudioStorage {
    private tempDir: string;
    private maxRetries: number;
    private retryInterval: number;
    private cleanupInterval: number;
    private maxAge: number;
    private opportunisticRetryChance: number;

    constructor(options: {
        tempDir?: string;
        maxRetries?: number;
        retryInterval?: number; // ms
        cleanupInterval?: number; // ms
        maxAge?: number; // ms
        opportunisticRetryChance?: number; // 0-1, chance to trigger retry on each operation
    } = {}) {
        this.tempDir = options.tempDir || join(process.cwd(), '.temp-audio');
        this.maxRetries = options.maxRetries || 5;
        this.retryInterval = options.retryInterval || 30000; // 30 seconds
        this.cleanupInterval = options.cleanupInterval || 300000; // 5 minutes
        this.maxAge = options.maxAge || 3600000; // 1 hour
        this.opportunisticRetryChance = options.opportunisticRetryChance || 0.1; // 10% chance

        this.ensureTempDir();
        this.startCleanupTimer();
    }

    /**
     * Store audio temporarily when IPFS upload fails
     */
    async storeTemporarily(
        audioBuffer: Buffer,
        metadata: TempAudioRecord['metadata']
    ): Promise<string> {
        const id = this.generateId(metadata.contentHash, metadata.agentAddress);

        const record: TempAudioRecord = {
            id,
            audioBuffer,
            metadata,
            createdAt: Date.now(),
            retryCount: 0,
        };

        const filePath = this.getFilePath(id);
        await writeFile(filePath, JSON.stringify({
            ...record,
            audioBuffer: audioBuffer.toString('base64'), // Store as base64 in JSON
        }));

        console.log(`📁 Stored audio temporarily: ${id}`);

        // Opportunistically try to retry other pending uploads
        this.maybeRetryPendingUploads();

        return id;
    }

    /**
     * Opportunistically retry pending uploads (called during normal operations)
     */
    private maybeRetryPendingUploads(): void {
        // Only retry sometimes to avoid overwhelming the system
        if (Math.random() > this.opportunisticRetryChance) return;

        // Run in background, don't await
        this.retryPendingUploads().catch(error => {
            console.warn('Opportunistic retry failed:', error);
        });
    }

    /**
     * Retry pending uploads in background
     */
    private async retryPendingUploads(): Promise<void> {
        try {
            const recordsToRetry = await this.getRecordsForRetry();
            if (recordsToRetry.length === 0) return;

            console.log(`🔄 Opportunistic retry: processing ${recordsToRetry.length} pending uploads`);

            // Import IPFS service dynamically to avoid circular dependencies
            const { createRobustIPFSService } = await import('./ipfs-service');
            const robustIpfsService = createRobustIPFSService();
            const fallbackProviders = (robustIpfsService as any).getFallbackProviders?.() || [];

            // Process up to 3 records at a time to avoid overwhelming
            const recordsToProcess = recordsToRetry.slice(0, 3);

            for (const record of recordsToProcess) {
                try {
                    console.log(`🔄 Opportunistic retry for ${record.id} (attempt ${record.retryCount + 1})`);

                    // Mark for retry (increments retry count)
                    await this.markForRetry(record.id);

                    // Attempt IPFS upload
                    const uploadResult = await robustIpfsService.uploadAudio(
                        record.audioBuffer,
                        {
                            filename: record.metadata.filename,
                            mimeType: record.metadata.mimeType,
                            duration: record.metadata.duration,
                        },
                        {
                            maxRetries: 1, // Single retry in opportunistic mode
                            retryDelay: 500,
                            fallbackProviders,
                        }
                    );

                    console.log(`✅ Opportunistic retry successful for ${record.id}: ${uploadResult.hash}`);

                    // Remove from temporary storage
                    await this.remove(record.id);

                } catch (error) {
                    console.warn(`❌ Opportunistic retry failed for ${record.id}:`, error);
                    // Continue with other records
                }
            }

        } catch (error) {
            console.warn('Opportunistic retry process failed:', error);
        }
    }

    /**
     * Get temporary audio record
     */
    async getRecord(id: string): Promise<TempAudioRecord | null> {
        try {
            const filePath = this.getFilePath(id);
            const data = await readFile(filePath, 'utf-8');
            const parsed = JSON.parse(data);

            return {
                ...parsed,
                audioBuffer: Buffer.from(parsed.audioBuffer, 'base64'),
            };
        } catch (error) {
            console.warn(`Failed to get temp record ${id}:`, error);
            return null;
        }
    }

    /**
     * Generate a temporary URL for the audio (serves from temp storage)
     */
    generateTempUrl(id: string, baseUrl: string): string {
        return `${baseUrl}/api/temp-audio/${id}`;
    }

    /**
     * Get audio buffer for serving
     */
    async getAudioBuffer(id: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
        const record = await this.getRecord(id);
        if (!record) return null;

        // Opportunistically try to retry other pending uploads when serving audio
        this.maybeRetryPendingUploads();

        return {
            buffer: record.audioBuffer,
            mimeType: record.metadata.mimeType,
        };
    }

    /**
     * Mark record for retry
     */
    async markForRetry(id: string): Promise<void> {
        const record = await this.getRecord(id);
        if (!record) return;

        record.retryCount++;
        record.lastRetryAt = Date.now();

        const filePath = this.getFilePath(id);
        await writeFile(filePath, JSON.stringify({
            ...record,
            audioBuffer: record.audioBuffer.toString('base64'),
        }));
    }

    /**
     * Remove temporary record (after successful IPFS upload)
     */
    async remove(id: string): Promise<void> {
        try {
            const filePath = this.getFilePath(id);
            await unlink(filePath);
            console.log(`🗑️ Removed temp audio: ${id}`);
        } catch (error) {
            console.warn(`Failed to remove temp record ${id}:`, error);
        }
    }

    /**
     * Get all records that need retry
     */
    async getRecordsForRetry(): Promise<TempAudioRecord[]> {
        try {
            const { readdir } = await import('fs/promises');
            const files = await readdir(this.tempDir).catch(() => []);
            const records: TempAudioRecord[] = [];

            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                try {
                    const record = await this.getRecord(file.replace('.json', ''));
                    if (!record) continue;

                    const shouldRetry =
                        record.retryCount < this.maxRetries &&
                        (!record.lastRetryAt || Date.now() - record.lastRetryAt > this.retryInterval);

                    if (shouldRetry) {
                        records.push(record);
                    }
                } catch (error) {
                    console.warn(`Failed to process temp file ${file}:`, error);
                }
            }

            return records;
        } catch (error) {
            console.warn('Failed to get records for retry:', error);
            return [];
        }
    }

    /**
     * Clean up old temporary files
     */
    async cleanup(): Promise<void> {
        try {
            const { readdir } = await import('fs/promises');
            const files = await readdir(this.tempDir).catch(() => []);
            let cleanedCount = 0;

            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                try {
                    const record = await this.getRecord(file.replace('.json', ''));
                    if (!record) continue;

                    const isExpired = Date.now() - record.createdAt > this.maxAge;
                    const maxRetriesReached = record.retryCount >= this.maxRetries;

                    if (isExpired || maxRetriesReached) {
                        await this.remove(record.id);
                        cleanedCount++;
                    }
                } catch (error) {
                    console.warn(`Failed to process temp file ${file} during cleanup:`, error);
                }
            }

            if (cleanedCount > 0) {
                console.log(`🧹 Cleaned up ${cleanedCount} temporary audio files`);
            }
        } catch (error) {
            console.warn('Failed to cleanup temp files:', error);
        }
    }

    private generateId(contentHash: string, agentAddress: string): string {
        const data = `${contentHash}:${agentAddress}:${Date.now()}`;
        return createHash('sha256').update(data).digest('hex').substring(0, 16);
    }

    private getFilePath(id: string): string {
        return join(this.tempDir, `${id}.json`);
    }

    private async ensureTempDir(): Promise<void> {
        if (!existsSync(this.tempDir)) {
            await mkdir(this.tempDir, { recursive: true });
            console.log(`📁 Created temp audio directory: ${this.tempDir}`);
        }
    }

    private startCleanupTimer(): void {
        setInterval(() => {
            this.cleanup().catch(error => {
                console.warn('Cleanup timer error:', error);
            });
        }, this.cleanupInterval);
    }
}

// Singleton instance
let tempAudioStorage: TempAudioStorage | null = null;

export function getTempAudioStorage(): TempAudioStorage {
    if (!tempAudioStorage) {
        // Get retry chance from environment (default 10%)
        const retryChance = parseFloat(process.env.OPPORTUNISTIC_RETRY_CHANCE || '0.1');

        tempAudioStorage = new TempAudioStorage({
            opportunisticRetryChance: retryChance,
        });
    }
    return tempAudioStorage;
}