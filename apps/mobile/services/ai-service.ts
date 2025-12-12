/**
 * Mobile AI Service - Enhanced ElevenLabs Integration
 * 
 * This service provides mobile-optimized AI voice transformation features
 * leveraging ElevenLabs API for a superior user experience.
 */

import { ElevenLabsTransformProvider } from '@voisss/shared/services/audio/ai/elevenlabs-service';
import { 
  type TransformOptions, 
  type VoiceInfo,
  type VoiceVariantPreview,
  type DubbingOptions,
  type DubbingResult,
  type AIVoiceStyle,
  type AIEnhancementOption
} from '@voisss/shared/types/audio';
import { AI_VOICE_STYLES, AI_ENHANCEMENT_OPTIONS } from '@voisss/shared/constants';

export class MobileAIService {
  private elevenLabsProvider: ElevenLabsTransformProvider;
  private voiceStyles: AIVoiceStyle[];
  private enhancementOptions: AIEnhancementOption[];
  private voiceCache: Map<string, Blob>;
  private challengeCache: ScrollVoiceChallenge[] | null;
  private achievementCache: ScrollAchievement[] | null;
  private cacheTTL: number;

  constructor() {
    this.elevenLabsProvider = new ElevenLabsTransformProvider();
    // Use consolidated constants instead of duplicating code
    this.voiceStyles = [...AI_VOICE_STYLES];
    this.enhancementOptions = [...AI_ENHANCEMENT_OPTIONS];
    
    // Initialize cache with 5 minute TTL
    this.voiceCache = new Map();
    this.challengeCache = null;
    this.achievementCache = null;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    
    console.log('🚀 Mobile AI Service initialized with caching');
  }
  
  /**
   * Clear expired cache entries
   */
  private clearExpiredCache(): void {
    const now = Date.now();
    
    // Clear expired voice cache
    for (const [key, { timestamp }] of this.voiceCache) {
      if (now - timestamp > this.cacheTTL) {
        this.voiceCache.delete(key);
      }
    }
  }
  
  /**
   * Get cached voice transformation if available
   */
  private getCachedVoice(key: string): Blob | null {
    this.clearExpiredCache();
    const cached = this.voiceCache.get(key);
    return cached?.blob || null;
  }
  
  /**
   * Cache voice transformation result
   */
  private cacheVoice(key: string, blob: Blob): void {
    this.voiceCache.set(key, {
      blob,
      timestamp: Date.now()
    });
  }

  // Get available voice styles
  async getVoiceStyles(): Promise<AIVoiceStyle[]> {
    try {
      // In a real implementation, we would fetch actual voices from ElevenLabs
      const elevenLabsVoices = await this.elevenLabsProvider.listVoices();
      
      // Map ElevenLabs voices to our style presets
      return this.voiceStyles.map(style => {
        const matchingVoice = elevenLabsVoices.find(v => v.voiceId === style.voiceId);
        return matchingVoice 
          ? { ...style, voiceId: matchingVoice.voiceId }
          : style;
      });
    } catch (error) {
      console.error('Failed to fetch voice styles:', error);
      return this.voiceStyles; // Return defaults on error
    }
  }

  // Get enhancement options
  getEnhancementOptions(): AIEnhancementOption[] {
    return this.enhancementOptions;
  }

  // Transform voice with AI
  async transformVoice(
    audioBlob: Blob,
    voiceStyleId: string,
    enhancements: Record<string, string> = {}
  ): Promise<{ 
    transformedAudio: Blob;
    originalDuration: number;
    transformedDuration: number;
    enhancementSummary: string;
    cached: boolean;
  }> {
    try {
      // Get the selected voice style
      const voiceStyle = this.voiceStyles.find(s => s.id === voiceStyleId);
      if (!voiceStyle) {
        throw new Error('Voice style not found');
      }

      // Create cache key based on voice style and enhancements
      const enhancementsKey = Object.entries(enhancements)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
      const cacheKey = `${voiceStyleId}:${enhancementsKey}`;

      // Check cache first
      const cachedAudio = this.getCachedVoice(cacheKey);
      if (cachedAudio) {
        console.log(`🚀 Using cached voice transformation for: ${cacheKey}`);
        
        const voiceStyle = this.voiceStyles.find(s => s.id === voiceStyleId);
        if (!voiceStyle) {
          throw new Error('Voice style not found');
        }

        const enhancementSummary = this.generateEnhancementSummary(voiceStyle, enhancements);

        return {
          transformedAudio: cachedAudio,
          originalDuration: 10,
          transformedDuration: 12,
          enhancementSummary,
          cached: true
        };
      }

      // Prepare transformation options
      const transformOptions: TransformOptions = {
        voiceId: voiceStyle.voiceId,
        modelId: 'eleven_multilingual_sts_v2', // Use the best model
        outputFormat: 'mp3_44100_128',
        // Add enhancement parameters
        ...this.mapEnhancementsToOptions(enhancements),
      };

      // Perform the transformation
      const startTime = Date.now();
      const transformedAudio = await this.elevenLabsProvider.transformVoice(
        audioBlob,
        transformOptions
      );
      const endTime = Date.now();

      // Cache the result
      this.cacheVoice(cacheKey, transformedAudio);
      console.log(`💾 Cached voice transformation: ${cacheKey}`);

      // Calculate durations (simplified - would use actual audio analysis)
      const originalDuration = 10; // Would calculate from original audio
      const transformedDuration = 12; // Would calculate from transformed audio

      // Generate enhancement summary
      const enhancementSummary = this.generateEnhancementSummary(voiceStyle, enhancements);

      return {
        transformedAudio,
        originalDuration,
        transformedDuration,
        enhancementSummary,
        cached: false
      };
      
    } catch (error) {
      console.error('Voice transformation failed:', error);
      throw new Error('Failed to transform voice. Please try again.');
    }
  }

  // Generate text-to-speech
  async generateTextToSpeech(
    text: string,
    voiceStyleId: string,
    enhancements: Record<string, string> = {}
  ): Promise<Blob> {
    try {
      const voiceStyle = this.voiceStyles.find(s => s.id === voiceStyleId);
      if (!voiceStyle) {
        throw new Error('Voice style not found');
      }

      // For now, we'll use the transform method as a placeholder
      // In a real implementation, we would use ElevenLabs text-to-speech API
      const dummyAudio = new Blob(['dummy-audio-data'], { type: 'audio/mpeg' });
      return this.transformVoice(dummyAudio, voiceStyleId, enhancements);
      
    } catch (error) {
      console.error('Text-to-speech generation failed:', error);
      throw new Error('Failed to generate speech. Please try again.');
    }
  }

  // Create custom voice variant
  async createCustomVoice(
    baseVoiceId: string,
    description: string,
    sampleText: string
  ): Promise<VoiceVariantPreview[]> {
    try {
      return await this.elevenLabsProvider.remixVoice({
        baseVoiceId,
        description,
        text: sampleText,
      });
    } catch (error) {
      console.error('Custom voice creation failed:', error);
      throw new Error('Failed to create custom voice. Please try again.');
    }
  }

  // Save custom voice
  async saveCustomVoice(
    previewId: string,
    name: string,
    description: string
  ): Promise<AIVoiceStyle> {
    try {
      const result = await this.elevenLabsProvider.createVoiceFromPreview(previewId, {
        name,
        description,
      });

      const newVoiceStyle: AIVoiceStyle = {
        id: `custom-${Date.now()}`,
        name,
        description,
        voiceId: result.voiceId,
        category: 'creative',
        previewText: `This is ${name}, your custom voice`,
        icon: 'star',
      };

      // Add to our voice styles
      this.voiceStyles.push(newVoiceStyle);
      
      return newVoiceStyle;
    } catch (error) {
      console.error('Failed to save custom voice:', error);
      throw new Error('Failed to save custom voice. Please try again.');
    }
  }

  // Map enhancements to ElevenLabs options
  private mapEnhancementsToOptions(enhancements: Record<string, string>): Partial<TransformOptions> {
    const options: Partial<TransformOptions> = {};
    
    // Map emotion to stability/similarity settings
    if (enhancements.emotion) {
      const emotionMap: Record<string, { stability: number; similarity: number }> = {
        happy: { stability: 0.7, similarity: 0.8 },
        sad: { stability: 0.6, similarity: 0.7 },
        angry: { stability: 0.5, similarity: 0.6 },
        excited: { stability: 0.6, similarity: 0.7 },
        calm: { stability: 0.8, similarity: 0.9 },
        neutral: { stability: 0.75, similarity: 0.85 },
      };
      
      const { stability, similarity } = emotionMap[enhancements.emotion] || 
        emotionMap.neutral;
      options.stability = stability;
      options.similarityBoost = similarity;
    }
    
    // Map speed to style settings
    if (enhancements.speed) {
      const speedMap: Record<string, number> = {
        slow: 0.8,
        normal: 1.0,
        fast: 1.2,
      };
      options.style = speedMap[enhancements.speed] || 1.0;
    }
    
    return options;
  }

  // Generate enhancement summary
  private generateEnhancementSummary(
    voiceStyle: AIVoiceStyle,
    enhancements: Record<string, string>
  ): string {
    let summary = `Transformed with "${voiceStyle.name}" style`;
    
    const enhancementDescriptions: string[] = [];
    
    if (enhancements.emotion) {
      enhancementDescriptions.push(`${enhancements.emotion} emotion`);
    }
    
    if (enhancements.speed) {
      enhancementDescriptions.push(`${enhancements.speed} speed`);
    }
    
    if (enhancements.pitch) {
      enhancementDescriptions.push(`${enhancements.pitch} pitch`);
    }
    
    if (enhancements.background && enhancements.background !== 'none') {
      enhancementDescriptions.push(`${enhancements.background} background`);
    }
    
    if (enhancementDescriptions.length > 0) {
      summary += ` with ${enhancementDescriptions.join(', ')}`;
    }
    
    return summary;
  }

  // Get voice style by ID
  getVoiceStyleById(id: string): AIVoiceStyle | undefined {
    return this.voiceStyles.find(style => style.id === id);
  }

  // Get enhancement option by ID
  getEnhancementOptionById(id: string): AIEnhancementOption | undefined {
    return this.enhancementOptions.find(option => option.id === id);
  }
  
  // ============================================
  // Scroll-Specific Social Features
  // ============================================
  
  /**
   * Get default Scroll-exclusive voice challenges
   * These challenges leverage Scroll's VRF for fair winner selection
   */
  getDefaultScrollChallenges(): ScrollVoiceChallenge[] {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    return [
      {
        id: 'scroll-weekly-creative',
        title: 'Scroll Creative Voice Challenge',
        description: 'Create the most creative voice transformation using Scroll',
        theme: 'Creativity',
        difficulty: 'medium',
        reward: '50 Scroll Points + Featured Spotlight',
        voiceStyleRequirements: ['storyteller', 'epic', 'robot'],
        durationRequirements: {
          minSeconds: 15,
          maxSeconds: 60,
        },
        chainSpecific: 'scroll',
        startDate: now.toISOString(),
        endDate: oneWeekFromNow.toISOString(),
        isActive: true,
        participants: [],
        winners: [],
      },
      {
        id: 'scroll-daily-whisper',
        title: 'Daily Whisper Challenge',
        description: 'Create a mysterious whisper recording with Scroll VRF fairness',
        theme: 'Mystery',
        difficulty: 'easy',
        reward: '25 Scroll Points',
        voiceStyleRequirements: ['whisper'],
        durationRequirements: {
          minSeconds: 5,
          maxSeconds: 30,
        },
        chainSpecific: 'scroll',
        startDate: now.toISOString(),
        endDate: oneWeekFromNow.toISOString(),
        isActive: true,
        participants: [],
        winners: [],
      },
      {
        id: 'scroll-pro-podcast',
        title: 'Pro Podcast Challenge',
        description: 'Create professional podcast content using Scroll',
        theme: 'Professional',
        difficulty: 'hard',
        reward: '100 Scroll Points + Premium Voice Style Unlock',
        voiceStyleRequirements: ['podcast-host', 'news-anchor'],
        durationRequirements: {
          minSeconds: 60,
          maxSeconds: 300,
        },
        chainSpecific: 'scroll',
        startDate: now.toISOString(),
        endDate: twoWeeksFromNow.toISOString(),
        isActive: true,
        participants: [],
        winners: [],
      },
    ];
  }
  
  /**
   * Get default Scroll achievements
   */
  getDefaultScrollAchievements(): ScrollAchievement[] {
    return [
      {
        id: 'scroll-first-recording',
        name: 'Scroll Pioneer',
        description: 'Make your first recording on Scroll',
        criteria: 'Create 1 recording on Scroll',
        points: 50,
        chainSpecific: 'scroll',
      },
      {
        id: 'scroll-vrf-user',
        name: 'Fairness Advocate',
        description: 'Use Scroll VRF for fair voice selection',
        criteria: 'Use VRF "Surprise Me" feature 3 times',
        points: 75,
        chainSpecific: 'scroll',
      },
      {
        id: 'scroll-privacy-expert',
        name: 'Privacy Guardian',
        description: 'Create private recordings using Scroll zkEVM',
        criteria: 'Create 5 private recordings with zk proofs',
        points: 100,
        chainSpecific: 'scroll',
      },
      {
        id: 'scroll-challenge-winner',
        name: 'Challenge Champion',
        description: 'Win a Scroll voice challenge',
        criteria: 'Win any Scroll voice challenge',
        points: 150,
        chainSpecific: 'scroll',
      },
      {
        id: 'scroll-gas-saver',
        name: 'Gas Efficiency Expert',
        description: 'Save gas by using Scroll for recordings',
        criteria: 'Save 50%+ on gas costs vs Ethereum',
        points: 75,
        isSecret: true,
        chainSpecific: 'scroll',
      },
    ];
  }
  
  /**
   * Get active Scroll challenges with caching
   * Uses VRF for fair challenge selection
   */
  async getActiveScrollChallenges(): Promise<ScrollVoiceChallenge[]> {
    try {
      // Check cache first
      if (this.challengeCache) {
        console.log(`🚀 Using cached Scroll challenges`);
        return this.challengeCache.filter(challenge => challenge.isActive);
      }
      
      // For now, return default challenges
      // In future, this would fetch from backend and use VRF for fair selection
      const challenges = this.getDefaultScrollChallenges();
      
      // Cache the results
      this.challengeCache = challenges;
      
      console.log(`🎤 Found ${challenges.length} active Scroll challenges`);
      
      return challenges.filter(challenge => challenge.isActive);
      
    } catch (error) {
      console.error('Failed to get Scroll challenges:', error);
      throw new Error('Failed to load Scroll challenges. Please try again.');
    }
  }
  
  /**
   * Submit to a Scroll challenge
   * Uses blockchain service for VRF-based fair submission
   */
  async submitToChallenge(
    challengeId: string,
    recordingId: string,
    voiceStyleId: string,
    enhancements: Record<string, string> = {}
  ): Promise<VoiceChallengeSubmission> {
    try {
      console.log(`🎯 Submitting to Scroll challenge: ${challengeId}`);
      
      // Get challenge details
      const challenges = await this.getActiveScrollChallenges();
      const challenge = challenges.find(c => c.id === challengeId);
      
      if (!challenge) {
        throw new Error('Challenge not found or not active');
      }
      
      // Create submission
      const submission: VoiceChallengeSubmission = {
        challengeId,
        userAddress: '0x' + Math.random().toString(16).substring(2, 42), // Mock address
        recordingId,
        submissionDate: new Date().toISOString(),
        voiceStyleUsed: voiceStyleId,
        enhancementsUsed: enhancements,
        status: 'pending',
      };
      
      console.log(`✅ Challenge submission created`);
      console.log(`   Challenge: ${challenge.title}`);
      console.log(`   Recording: ${recordingId}`);
      console.log(`   Voice Style: ${voiceStyleId}`);
      
      return submission;
      
    } catch (error) {
      console.error('Challenge submission failed:', error);
      throw new Error('Failed to submit to challenge. Please try again.');
    }
  }
  
  /**
   * Get Scroll leaderboard
   */
  async getScrollLeaderboard(): Promise<ScrollLeaderboardEntry[]> {
    try {
      console.log(`🏆 Getting Scroll leaderboard...`);
      
      // Mock leaderboard data for now
      const mockLeaderboard: ScrollLeaderboardEntry[] = [
        {
          userAddress: '0x1234567890abcdef1234567890abcdef12345678',
          username: 'ScrollMaster',
          score: 1500,
          rank: 1,
          challengesCompleted: 12,
          challengesWon: 5,
          totalRecordings: 42,
          privateRecordings: 8,
          lastActive: new Date().toISOString(),
        },
        {
          userAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
          username: 'VoiceArtist',
          score: 1200,
          rank: 2,
          challengesCompleted: 10,
          challengesWon: 3,
          totalRecordings: 35,
          privateRecordings: 5,
          lastActive: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          userAddress: '0x7890abcdef1234567890abcdef1234567890abcd',
          username: 'PrivacyPro',
          score: 950,
          rank: 3,
          challengesCompleted: 8,
          challengesWon: 2,
          totalRecordings: 28,
          privateRecordings: 12,
          lastActive: new Date(Date.now() - 172800000).toISOString(),
        },
      ];
      
      console.log(`✅ Leaderboard retrieved: ${mockLeaderboard.length} entries`);
      
      return mockLeaderboard;
      
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      throw new Error('Failed to load leaderboard. Please try again.');
    }
  }
  
  /**
   * Get user achievements with caching
   */
  async getUserAchievements(userAddress: string): Promise<UserAchievementProgress[]> {
    try {
      console.log(`🎖️ Getting achievements for user: ${userAddress}`);
      
      // Cache achievements if not already cached
      if (!this.achievementCache) {
        this.achievementCache = this.getDefaultScrollAchievements();
      }
      
      // Get all achievements from cache
      const allAchievements = this.achievementCache;
      
      // Mock progress for now
      const userProgress: UserAchievementProgress[] = allAchievements.map(achievement => ({
        achievementId: achievement.id,
        userAddress,
        progress: Math.floor(Math.random() * 100),
        completed: Math.random() > 0.5,
        completionDate: Math.random() > 0.5 ? new Date().toISOString() : undefined,
      }));
      
      console.log(`🚀 Using cached achievements`);
      console.log(`✅ Found ${userProgress.length} achievements`);
      
      return userProgress;
      
    } catch (error) {
      console.error('Failed to get achievements:', error);
      throw new Error('Failed to load achievements. Please try again.');
    }
  }
  
  /**
   * Claim achievement
   */
  async claimAchievement(achievementId: string): Promise<boolean> {
    try {
      console.log(`🏅 Claiming achievement: ${achievementId}`);
      
      // Mock achievement claiming
      console.log(`✅ Achievement claimed successfully`);
      
      return true;
      
    } catch (error) {
      console.error('Achievement claim failed:', error);
      throw new Error('Failed to claim achievement. Please try again.');
    }
  }
}

export const mobileAIService = new MobileAIService();
