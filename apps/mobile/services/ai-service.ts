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
  type DubbingResult
} from '@voisss/shared/types/audio';

export interface AIVoiceStyle {
  id: string;
  name: string;
  description: string;
  voiceId: string;
  category: 'professional' | 'creative' | 'fun' | 'emotional';
  previewText: string;
  icon: string;
}

export interface AIEnhancementOption {
  id: string;
  name: string;
  description: string;
  type: 'style' | 'emotion' | 'effect' | 'language';
  values: string[];
}

export class MobileAIService {
  private elevenLabsProvider: ElevenLabsTransformProvider;
  private voiceStyles: AIVoiceStyle[];
  private enhancementOptions: AIEnhancementOption[];

  constructor() {
    this.elevenLabsProvider = new ElevenLabsTransformProvider();
    this.voiceStyles = this.getDefaultVoiceStyles();
    this.enhancementOptions = this.getDefaultEnhancementOptions();
  }

  // Voice Style Presets
  private getDefaultVoiceStyles(): AIVoiceStyle[] {
    return [
      {
        id: 'podcast-host',
        name: 'Podcast Host',
        description: 'Professional and engaging podcast voice',
        voiceId: 'podcast-host-voice-id', // Would be replaced with actual ElevenLabs voice ID
        category: 'professional',
        previewText: 'Welcome to today\'s episode where we explore...',
        icon: 'mic',
      },
      {
        id: 'storyteller',
        name: 'Storyteller',
        description: 'Warm and captivating storytelling voice',
        voiceId: 'storyteller-voice-id',
        category: 'creative',
        previewText: 'Once upon a time, in a land far away...',
        icon: 'book',
      },
      {
        id: 'news-anchor',
        name: 'News Anchor',
        description: 'Authoritative and clear news presentation',
        voiceId: 'news-anchor-voice-id',
        category: 'professional',
        previewText: 'Breaking news: Major developments in...',
        icon: 'newspaper',
      },
      {
        id: 'robot',
        name: 'Futuristic Robot',
        description: 'Synthetic voice with a sci-fi feel',
        voiceId: 'robot-voice-id',
        category: 'fun',
        previewText: 'Initiating voice protocol. All systems operational.',
        icon: 'robot',
      },
      {
        id: 'whisper',
        name: 'Mystery Whisper',
        description: 'Soft and intriguing whisper voice',
        voiceId: 'whisper-voice-id',
        category: 'emotional',
        previewText: 'Psst... I have a secret to tell you...',
        icon: 'volume-low',
      },
      {
        id: 'epic',
        name: 'Epic Narrator',
        description: 'Dramatic and powerful narration',
        voiceId: 'epic-voice-id',
        category: 'creative',
        previewText: 'In a world where anything is possible...',
        icon: 'megaphone',
      },
    ];
  }

  // Enhancement Options
  private getDefaultEnhancementOptions(): AIEnhancementOption[] {
    return [
      {
        id: 'emotion',
        name: 'Emotion',
        description: 'Adjust the emotional tone of your voice',
        type: 'emotion',
        values: ['happy', 'sad', 'angry', 'excited', 'calm', 'neutral'],
      },
      {
        id: 'speed',
        name: 'Speed',
        description: 'Control the speaking rate',
        type: 'effect',
        values: ['slow', 'normal', 'fast'],
      },
      {
        id: 'pitch',
        name: 'Pitch',
        description: 'Adjust voice pitch',
        type: 'effect',
        values: ['low', 'normal', 'high'],
      },
      {
        id: 'background',
        name: 'Background',
        description: 'Add background effects',
        type: 'effect',
        values: ['none', 'studio', 'outdoor', 'phone', 'radio'],
      },
      {
        id: 'language',
        name: 'Language',
        description: 'Translate and adjust for language',
        type: 'language',
        values: ['english', 'spanish', 'french', 'german', 'japanese', 'chinese'],
      },
    ];
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
  }> {
    try {
      // Get the selected voice style
      const voiceStyle = this.voiceStyles.find(s => s.id === voiceStyleId);
      if (!voiceStyle) {
        throw new Error('Voice style not found');
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
}

export const mobileAIService = new MobileAIService();
