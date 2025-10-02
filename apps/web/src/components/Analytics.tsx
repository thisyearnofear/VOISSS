"use client";

import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: any) => void;
  }
}

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export const trackEvent = ({ action, category, label, value }: AnalyticsEvent) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
      page_path: url,
    });
  }
};

// Predefined tracking functions for common events
export const trackRecordingStart = () => {
  trackEvent({
    action: 'recording_start',
    category: 'engagement',
    label: 'voice_recording',
  });
};

export const trackRecordingComplete = (duration: number) => {
  trackEvent({
    action: 'recording_complete',
    category: 'engagement',
    label: 'voice_recording',
    value: Math.round(duration),
  });
};

export const trackVoiceTransformation = (voiceType: string) => {
  trackEvent({
    action: 'voice_transformation',
    category: 'feature_usage',
    label: voiceType,
  });
};

export const trackWalletConnection = (walletType: string) => {
  trackEvent({
    action: 'wallet_connect',
    category: 'conversion',
    label: walletType,
  });
};

export const trackMissionStart = (missionId: string) => {
  trackEvent({
    action: 'mission_start',
    category: 'socialfi',
    label: missionId,
  });
};

export const trackMissionComplete = (missionId: string, reward: number) => {
  trackEvent({
    action: 'mission_complete',
    category: 'socialfi',
    label: missionId,
    value: reward,
  });
};

export const trackIPFSUpload = () => {
  trackEvent({
    action: 'ipfs_upload',
    category: 'blockchain',
    label: 'file_storage',
  });
};

export const trackStarknetTransaction = (type: string) => {
  trackEvent({
    action: 'starknet_transaction',
    category: 'blockchain',
    label: type,
  });
};

export const trackFeatureClick = (feature: string) => {
  trackEvent({
    action: 'feature_click',
    category: 'navigation',
    label: feature,
  });
};

export const trackDownload = (fileType: string) => {
  trackEvent({
    action: 'download',
    category: 'engagement',
    label: fileType,
  });
};

// Component for tracking page views
export default function Analytics() {
  useEffect(() => {
    // Track initial page view
    trackPageView(window.location.pathname);
  }, []);

  return null;
}