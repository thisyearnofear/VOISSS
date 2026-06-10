// React Native specific exports for VOISSS UI package
export * from './components/Button';
export * from './components/BaseModal';
export * from './components/RecordingCard';
export * from './components/WalletConnector';
export * from './components/AudioPlayer';
export * from './components/WaveformVisualization';

// Import React Native specific SocialShare
export { SocialShare } from './components/SocialShare.native';
export type { SocialShareProps, ShareableRecording } from './components/SocialShare.native';

// Canonical design tokens — single source of truth
export {
  colors,
  theme,
  globalStyles,
  buttonStyles,
  spacing,
  borderRadius,
  typography,
  shadows,
} from './theme/index';
export type { Theme } from './theme/index';
export type { Variant } from './types';