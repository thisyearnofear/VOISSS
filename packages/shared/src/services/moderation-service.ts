import { MissionResponse, QualityCriteria } from '../types/socialfi';

export interface ModerationResult {
  passed: boolean;
  audioQualityScore: number; // 0-100
  hasViolations: boolean;
  violations: string[];
  isTranscribed: boolean;
  confidence: number; // 0-1, confidence in the assessment
  suggestion: 'approve' | 'reject' | 'review'; // review = human review needed
}

export interface ModerationService {
  // Evaluate response against quality criteria
  evaluateQuality(response: MissionResponse, criteria?: QualityCriteria): Promise<ModerationResult>;
  
  // Detect content violations (profanity, PII, hate speech, etc)
  detectViolations(response: MissionResponse): Promise<{ violations: string[]; confidence: number }>;
  
  // Validate transcription quality
  validateTranscription(transcription: string, audioLength: number): Promise<{ isValid: boolean; wordCount: number; estimatedAccuracy: number }>;
  
  // Audio quality analysis
  analyzeAudioQuality(audioMetadata: { duration: number; bitrate: number; sampleRate: number; format: string }): Promise<number>;
}

/**
 * Default AI Moderation Service
 * Implements basic rule-based moderation that can be easily swapped out for ML models
 */
export class DefaultModerationService implements ModerationService {
  
  async evaluateQuality(response: MissionResponse, criteria?: QualityCriteria): Promise<ModerationResult> {
    const violations = await this.detectViolations(response);
    const audioScore = response.qualityScore || 50; // Placeholder - would be computed from audio analysis
    
    // Check transcription if required
    const hasTranscription = !!response.transcription;
    if (criteria?.transcriptionRequired && !hasTranscription) {
      violations.violations.push('Transcription required but not provided');
    }

    // Validate audio quality against criteria
    let meetsAudioThreshold = true;
    if (criteria?.audioMinScore && audioScore < criteria.audioMinScore) {
      violations.violations.push(`Audio quality ${audioScore} below minimum ${criteria.audioMinScore}`);
      meetsAudioThreshold = false;
    }

    const passed = violations.violations.length === 0 && meetsAudioThreshold;
    
    // Determine suggestion based on violations
    let suggestion: 'approve' | 'reject' | 'review' = 'approve';
    if (violations.violations.length > 0) {
      // Major violations = reject
      const majorViolations = violations.violations.filter(v => 
        v.includes('profanity') || v.includes('hate') || v.includes('PII')
      );
      if (majorViolations.length > 0) {
        suggestion = 'reject';
      } else {
        suggestion = 'review'; // Minor issues, escalate to human
      }
    }

    return {
      passed,
      audioQualityScore: audioScore,
      hasViolations: violations.violations.length > 0,
      violations: violations.violations,
      isTranscribed: hasTranscription,
      confidence: violations.confidence,
      suggestion,
    };
  }

  async detectViolations(response: MissionResponse): Promise<{ violations: string[]; confidence: number }> {
    const violations: string[] = [];
    
    // Get text to analyze (transcription or metadata)
    const textToAnalyze = response.transcription || '';
    
    if (!textToAnalyze) {
      return { violations, confidence: 0.3 }; // Low confidence without text
    }

    // Simple keyword-based content detection (would be replaced with ML model)
    const profanityKeywords = ['badword1', 'badword2']; // Placeholder
    const hateKeywords = ['hatefulkeyword1']; // Placeholder
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{16}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    ];

    // Check for profanity
    const hasProfanity = profanityKeywords.some(kw => textToAnalyze.toLowerCase().includes(kw));
    if (hasProfanity) {
      violations.push('Profanity detected');
    }

    // Check for hate speech
    const hasHateSpeech = hateKeywords.some(kw => textToAnalyze.toLowerCase().includes(kw));
    if (hasHateSpeech) {
      violations.push('Hate speech detected');
    }

    // Check for PII
    const hasPII = piiPatterns.some(pattern => pattern.test(textToAnalyze));
    if (hasPII) {
      violations.push('Personally identifiable information detected');
    }

    // Consent check
    if (!response.participantConsent) {
      violations.push('Missing participant consent');
    }

    // Calculate confidence based on analysis depth
    let confidence = 0.7; // Base confidence
    if (response.transcription) {
      confidence += 0.2; // Higher confidence with transcription
    }
    if (response.qualityScore) {
      confidence += 0.1; // A bit more with quality score
    }
    confidence = Math.min(confidence, 0.99);

    return { violations, confidence };
  }

  async validateTranscription(transcription: string, audioLength: number): Promise<{ isValid: boolean; wordCount: number; estimatedAccuracy: number }> {
    const words = transcription.trim().split(/\s+/).length;
    
    // Basic heuristic: ~130 words per minute of speech
    const expectedWords = Math.floor((audioLength / 60) * 130);
    const wordCountDeviation = Math.abs(words - expectedWords) / expectedWords;
    
    // If deviation is > 50%, might be truncated or duplicate transcription
    const isValid = wordCountDeviation < 0.5;
    
    // Estimate accuracy (placeholder - would use actual model confidence scores)
    const estimatedAccuracy = Math.max(0.7, 1 - wordCountDeviation);

    return {
      isValid,
      wordCount: words,
      estimatedAccuracy: Math.min(estimatedAccuracy, 0.99),
    };
  }

  async analyzeAudioQuality(audioMetadata: { duration: number; bitrate: number; sampleRate: number; format: string }): Promise<number> {
    // Simple scoring based on audio specs
    let score = 50;

    // Bitrate quality (128kbps+ is good)
    if (audioMetadata.bitrate >= 128) score += 20;
    else if (audioMetadata.bitrate >= 64) score += 10;

    // Sample rate quality (44.1kHz+ is good)
    if (audioMetadata.sampleRate >= 44100) score += 15;
    else if (audioMetadata.sampleRate >= 22050) score += 8;

    // Duration (too short is suspicious)
    if (audioMetadata.duration >= 30) score += 10;
    else if (audioMetadata.duration < 10) score -= 15;

    // Format quality
    if (['mp3', 'aac', 'flac', 'm4a', 'wav'].includes(audioMetadata.format)) score += 5;

    return Math.min(Math.max(score, 0), 100);
  }
}

export function createModerationService(): ModerationService {
  return new DefaultModerationService();
}
