// Shared UI components for VOISSS platform - Web Compatible
export * from './components/Button';
export * from './components/RecordingCard';
export * from './components/AudioPlayer';
export * from './components/WaveformVisualization';

// Import Web specific SocialShare and its types
export { SocialShare } from './components/SocialShare.web';
export type {
    SocialShareProps,
    ShareableRecording
} from './components/SocialShare.web';

export { BaseModal } from './components/BaseModal.web';
export type { BaseModalProps } from './components/BaseModal.web';

// Engagement components
export { NotificationBell } from './components/NotificationBell';
export type { NotificationItem, NotificationBellProps } from './components/NotificationBell';
export { StreakDisplay } from './components/StreakDisplay';
export type { StreakDisplayProps } from './components/StreakDisplay';

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
  breakpoints,
  animations,
} from './theme/index';
export type { Theme } from './theme/index';
