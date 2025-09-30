/**
 * Client-Side AI Service
 * 
 * Platform-agnostic AI service for mobile and web clients.
 * Works with backend API routes to keep API keys secure.
 * 
 * Usage:
 * - Web: Uses Next.js API routes
 * - Mobile: Can use same API routes or direct integration
 */

import { VoiceInfo, TransformOptions, DubbingOptions, DubbingResult } from '../../../types/audio';
import { LanguageInfo } from '../../../constants/languages';

export interface AIServiceConfig {
    apiBaseUrl: string; // e.g., 'https://voisss.netlify.app/api' or 'http://localhost:3000/api'
    platform: 'web' | 'mobile';
}

export interface AIServiceClient {
    // Voice Transformation
    listVoices(): Promise<VoiceInfo[]>;
    transformVoice(audioBlob: Blob, voiceId: string): Promise<Blob>;

    // Dubbing
    getSupportedLanguages(): Promise<LanguageInfo[]>;
    dubAudio(audioBlob: Blob, targetLanguage: string, sourceLanguage?: string): Promise<DubbingResult>;

    // Utility
    testConnection(): Promise<boolean>;
}

export class ClientAIService implements AIServiceClient {
    private config: AIServiceConfig;
    private voicesCache: VoiceInfo[] | undefined;
    private languagesCache: LanguageInfo[] | undefined;

    constructor(config: AIServiceConfig) {
        this.config = config;
    }

    async listVoices(): Promise<VoiceInfo[]> {
        if (this.voicesCache) return this.voicesCache;

        try {
            const res = await fetch(`${this.config.apiBaseUrl}/elevenlabs/list-voices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!res.ok) {
                throw new Error(`Failed to list voices: ${res.status}`);
            }

            const data = await res.json();
            this.voicesCache = data.voices || [];
            return this.voicesCache!;
        } catch (error) {
            console.error('Failed to list voices:', error);
            throw error;
        }
    }

    async transformVoice(audioBlob: Blob, voiceId: string): Promise<Blob> {
        try {
            const form = new FormData();
            form.append('audio', audioBlob, 'input.webm');
            form.append('voiceId', voiceId);

            const res = await fetch(`${this.config.apiBaseUrl}/elevenlabs/transform-voice`, {
                method: 'POST',
                body: form,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
            }

            const arrayBuffer = await res.arrayBuffer();
            return new Blob([arrayBuffer], { type: 'audio/mpeg' });
        } catch (error) {
            console.error('Voice transformation failed:', error);
            throw error;
        }
    }

    async getSupportedLanguages(): Promise<LanguageInfo[]> {
        if (this.languagesCache) return this.languagesCache;

        try {
            const res = await fetch(`${this.config.apiBaseUrl}/elevenlabs/dub-audio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'getLanguages' }),
            });

            if (!res.ok) {
                throw new Error(`Failed to get languages: ${res.status}`);
            }

            const data = await res.json();

            // Enhance languages with metadata
            const rawLanguages = data.languages || [];
            const enhancedLanguages: LanguageInfo[] = rawLanguages.map((lang: any) => {
                const flagMap: { [key: string]: string } = {
                    'en': '🇺🇸', 'hi': '🇮🇳', 'pt': '🇧🇷', 'zh': '🇨🇳', 'es': '🇪🇸',
                    'fr': '🇫🇷', 'de': '🇩🇪', 'ja': '🇯🇵', 'ar': '🇸🇦', 'ru': '🇷🇺',
                    'ko': '🇰🇷', 'id': '🇮🇩', 'it': '🇮🇹', 'nl': '🇳🇱', 'tr': '🇹🇷'
                };
                const popularCodes = ['es', 'fr', 'de', 'pt', 'hi', 'zh', 'ar', 'ru', 'ko', 'ja'];

                return {
                    ...lang,
                    flag: flagMap[lang.code] || '🌐',
                    isPopular: popularCodes.includes(lang.code),
                };
            });

            this.languagesCache = enhancedLanguages;
            return this.languagesCache!;
        } catch (error) {
            console.error('Failed to get supported languages:', error);
            throw error;
        }
    }

    async dubAudio(
        audioBlob: Blob,
        targetLanguage: string,
        sourceLanguage?: string
    ): Promise<DubbingResult> {
        try {
            const form = new FormData();
            form.append('audio', audioBlob, 'input.webm');
            form.append('targetLanguage', targetLanguage);

            if (sourceLanguage && sourceLanguage !== 'auto') {
                form.append('sourceLanguage', sourceLanguage);
            }

            const res = await fetch(`${this.config.apiBaseUrl}/elevenlabs/dub-audio`, {
                method: 'POST',
                body: form,
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || 'Dubbing failed');
            }

            const data = await res.json();
            const dubbedAudioBlob = new Blob(
                [Buffer.from(data.audio_base64, 'base64')],
                { type: data.content_type || 'audio/mpeg' }
            );

            return {
                dubbedAudio: dubbedAudioBlob,
                transcript: data.transcript || '',
                translatedTranscript: data.translated_transcript || '',
                detectedSpeakers: data.detected_speakers || 1,
                targetLanguage,
                processingTime: 0, // Not tracked in current implementation
            };
        } catch (error) {
            console.error('Dubbing failed:', error);
            throw error;
        }
    }

    async testConnection(): Promise<boolean> {
        try {
            // Try to list voices as a connection test
            await this.listVoices();
            return true;
        } catch (error) {
            console.error('AI service connection test failed:', error);
            return false;
        }
    }
}

/**
 * Factory function to create AI service client
 * 
 * @param config - Configuration for the AI service
 * @returns AIServiceClient instance
 * 
 * @example
 * // Web usage
 * const aiService = createAIServiceClient({
 *   apiBaseUrl: '/api',
 *   platform: 'web'
 * });
 * 
 * @example
 * // Mobile usage
 * const aiService = createAIServiceClient({
 *   apiBaseUrl: 'https://voisss.netlify.app/api',
 *   platform: 'mobile'
 * });
 */
export function createAIServiceClient(config: AIServiceConfig): AIServiceClient {
    return new ClientAIService(config);
}

/**
 * Default AI service for web platform
 */
export function createDefaultAIService(): AIServiceClient {
    return new ClientAIService({
        apiBaseUrl: '/api',
        platform: 'web',
    });
}