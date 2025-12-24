/**
 * Supported languages for mobile app
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
];

export const SUPPORTED_DUBBING_LANGUAGES = SUPPORTED_LANGUAGES.map(l => l.code);

export const AI_VOICE_STYLES = [
  { id: 'professional', name: 'Professional' },
  { id: 'casual', name: 'Casual' },
  { id: 'storyteller', name: 'Storyteller' },
  { id: 'energetic', name: 'Energetic' },
  { id: 'calm', name: 'Calm' },
];

export const AI_ENHANCEMENT_OPTIONS = [
  { id: 'clarity', name: 'Clarity' },
  { id: 'volume-normalize', name: 'Normalize Volume' },
  { id: 'remove-silence', name: 'Remove Silence' },
  { id: 'enhance-bass', name: 'Enhance Bass' },
  { id: 'reduce-noise', name: 'Reduce Noise' },
];
