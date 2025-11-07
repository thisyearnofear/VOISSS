// Shared UI components for VOISSS platform - Web Compatible
export * from './components/Button';
export * from './components/RecordingCard';
export * from './components/SocialShare';
export * from './components/WalletConnector';
export * from './components/AudioPlayer';
export * from './components/WaveformVisualization';
import { colors } from './theme/colors';
import { theme, globalStyles, buttonStyles } from './theme/theme';
import type { Theme } from './theme/theme';
import type { Variant } from './types';
export { colors, theme, globalStyles, buttonStyles };
export type { Theme, Variant };
export * from './utils/cn';

// Re-export types from components
import type { SocialShareProps } from './components/SocialShare';
export type { SocialShareProps };
