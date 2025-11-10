// React Native specific exports for VOISSS UI package
export * from './components/Button';
export * from './components/RecordingCard';
export * from './components/WalletConnector';
export * from './components/AudioPlayer';
export * from './components/WaveformVisualization';

// Import React Native specific SocialShare
export { SocialShare } from './components/SocialShare.native';
export type { SocialShareProps, ShareableRecording } from './components/SocialShare.native';

import { colors } from './theme/colors';
import { theme, globalStyles, buttonStyles } from './theme/theme';
import type { Theme } from './theme/theme';
import type { Variant } from './types';
export { colors, theme, globalStyles, buttonStyles };
export type { Theme, Variant };