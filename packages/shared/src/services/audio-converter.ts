/**
 * Audio format conversion and optimization service
 * Handles cross-platform audio format standardization
 */

export interface AudioConversionOptions {
  targetFormat: 'mp3' | 'wav' | 'ogg' | 'webm' | 'm4a';
  bitRate?: number; // kbps
  sampleRate?: number; // Hz
  channels?: number; // 1 = mono, 2 = stereo
  quality?: 'low' | 'medium' | 'high' | 'lossless';
}

export interface ConversionResult {
  blob: Blob;
  mimeType: string;
  size: number;
  duration: number;
  format: string;
}

export interface AudioInfo {
  duration: number;
  sampleRate: number;
  channels: number;
  bitRate: number;
  format: string;
  size: number;
}

export class AudioConverter {
  private audioContext: AudioContext | null = null;

  constructor() {
    // Initialize AudioContext if available
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Convert audio to optimal format for IPFS storage
   */
  async convertForStorage(
    audioBlob: Blob,
    options: Partial<AudioConversionOptions> = {}
  ): Promise<ConversionResult> {
    const defaultOptions: AudioConversionOptions = {
      targetFormat: 'mp3',
      bitRate: 128,
      sampleRate: 44100,
      channels: 2,
      quality: 'medium',
      ...options,
    };

    try {
      // For now, skip complex conversion and just optimize the existing audio
      // This avoids the MediaRecorder captureStream() issues
      return await this.analyzeAndOptimize(audioBlob, defaultOptions);
    } catch (error) {
      console.error('Audio conversion failed:', error);
      throw new Error(`Audio conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert audio using Web Audio API
   */
  private async convertWithWebAudio(
    audioBlob: Blob,
    options: AudioConversionOptions
  ): Promise<ConversionResult> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    // Decode audio data
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // Resample if needed
    const resampledBuffer = await this.resampleAudio(audioBuffer, options.sampleRate!);

    // Convert to target format
    const convertedBlob = await this.encodeAudio(resampledBuffer, options);

    return {
      blob: convertedBlob,
      mimeType: this.getMimeType(options.targetFormat),
      size: convertedBlob.size,
      duration: resampledBuffer.duration,
      format: options.targetFormat,
    };
  }

  /**
   * Resample audio to target sample rate
   */
  private async resampleAudio(
    audioBuffer: AudioBuffer,
    targetSampleRate: number
  ): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    if (audioBuffer.sampleRate === targetSampleRate) {
      return audioBuffer;
    }

    // Create offline context for resampling
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      (audioBuffer.duration * targetSampleRate),
      targetSampleRate
    );

    // Create buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();

    // Render resampled audio
    return await offlineContext.startRendering();
  }

  /**
   * Encode audio buffer to target format
   */
  private async encodeAudio(
    audioBuffer: AudioBuffer,
    options: AudioConversionOptions
  ): Promise<Blob> {
    // For now, we'll convert to WAV and let the browser handle it
    // In a production app, you'd use a library like lamejs for MP3 encoding
    const wavBlob = this.audioBufferToWav(audioBuffer);

    // If target is WAV, return directly
    if (options.targetFormat === 'wav') {
      return wavBlob;
    }

    // For other formats, we'll use MediaRecorder if available
    if (typeof MediaRecorder !== 'undefined') {
      return await this.convertWithMediaRecorder(wavBlob, options);
    }

    // Fallback: return WAV
    console.warn(`Cannot convert to ${options.targetFormat}, returning WAV`);
    return wavBlob;
  }

  /**
   * Convert using MediaRecorder (limited format support)
   */
  private async convertWithMediaRecorder(
    audioBlob: Blob,
    options: AudioConversionOptions
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // Create audio element to play the source
      const audio = new Audio(URL.createObjectURL(audioBlob));

      // Create MediaStream from audio
      const stream = (audio as any).captureStream ? (audio as any).captureStream() : null;

      if (!stream) {
        reject(new Error('Cannot create MediaStream from audio'));
        return;
      }

      const mimeType = this.getMediaRecorderMimeType(options.targetFormat);

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        reject(new Error(`Format ${options.targetFormat} not supported`));
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const convertedBlob = new Blob(chunks, { type: mimeType });
        resolve(convertedBlob);
      };

      mediaRecorder.onerror = (event) => {
        reject(new Error('MediaRecorder error'));
      };

      // Start recording
      audio.play();
      mediaRecorder.start();

      // Stop when audio ends
      audio.onended = () => {
        mediaRecorder.stop();
      };
    });
  }

  /**
   * Convert AudioBuffer to WAV blob
   */
  private audioBufferToWav(audioBuffer: AudioBuffer): Blob {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numberOfChannels * 2;

    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    // Convert audio data
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        const intSample = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Analyze audio and optimize without conversion
   */
  private async analyzeAndOptimize(
    audioBlob: Blob,
    options: AudioConversionOptions
  ): Promise<ConversionResult> {
    // Get basic info
    const duration = await this.getAudioDuration(audioBlob);

    // If the blob is already in a good format and size, return as-is
    if (audioBlob.size < 10 * 1024 * 1024) { // Less than 10MB
      return {
        blob: audioBlob,
        mimeType: audioBlob.type || this.getMimeType(options.targetFormat),
        size: audioBlob.size,
        duration,
        format: this.getFormatFromMimeType(audioBlob.type) || options.targetFormat,
      };
    }

    // For large files, we might want to compress
    // This is a placeholder - in production, use a proper audio compression library
    return {
      blob: audioBlob,
      mimeType: audioBlob.type || this.getMimeType(options.targetFormat),
      size: audioBlob.size,
      duration,
      format: this.getFormatFromMimeType(audioBlob.type) || options.targetFormat,
    };
  }

  /**
   * Get audio duration from blob
   */
  private async getAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.onerror = () => {
        resolve(0); // Fallback
      };
      audio.src = URL.createObjectURL(audioBlob);
    });
  }

  /**
   * Get MIME type for format
   */
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      webm: 'audio/webm',
      m4a: 'audio/mp4',
    };
    return mimeTypes[format] || 'audio/mpeg';
  }

  /**
   * Get MediaRecorder MIME type
   */
  private getMediaRecorderMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      webm: 'audio/webm;codecs=opus',
      ogg: 'audio/ogg;codecs=opus',
      mp4: 'audio/mp4',
      m4a: 'audio/mp4',
    };
    return mimeTypes[format] || 'audio/webm;codecs=opus';
  }

  /**
   * Get format from MIME type
   */
  private getFormatFromMimeType(mimeType: string): string | null {
    if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'mp3';
    if (mimeType.includes('wav')) return 'wav';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
    return null;
  }

  /**
   * Get optimal settings for different quality levels
   */
  static getQualitySettings(quality: 'low' | 'medium' | 'high' | 'lossless'): AudioConversionOptions {
    const settings: Record<string, AudioConversionOptions> = {
      low: {
        targetFormat: 'mp3',
        bitRate: 64,
        sampleRate: 22050,
        channels: 1,
        quality: 'low',
      },
      medium: {
        targetFormat: 'mp3',
        bitRate: 128,
        sampleRate: 44100,
        channels: 2,
        quality: 'medium',
      },
      high: {
        targetFormat: 'mp3',
        bitRate: 256,
        sampleRate: 44100,
        channels: 2,
        quality: 'high',
      },
      lossless: {
        targetFormat: 'wav',
        bitRate: 1411, // CD quality
        sampleRate: 44100,
        channels: 2,
        quality: 'lossless',
      },
    };

    return settings[quality];
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
