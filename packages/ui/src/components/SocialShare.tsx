import React from "react";

// Check if we're in React Native environment
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

// Import cn for web use
import { cn } from '../utils/cn';

// For web, we'll define simple style objects instead of StyleSheet
type StyleObject = React.CSSProperties;

export interface ShareableRecording {
  id: string;
  title: string;
  ipfsHash?: string;
  ipfsUrl?: string;
  duration: number;
  createdAt: string;
}

export interface SocialShareProps {
  recording: ShareableRecording;
  onShare?: (platform: string, url: string) => void;
  className?: string;
  style?: React.CSSProperties | any; // Accept both web and RN style types
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const secsStr = secs < 10 ? `0${secs}` : `${secs}`;
  return `${mins}:${secsStr}`;
};

export const SocialShare: React.FC<SocialShareProps> = ({
  recording,
  onShare,
  className,
  style,
}) => {
  // Generate sharing URLs/links
  const shareUrl = recording.ipfsUrl || `https://voisss.netlify.app/recording/${recording.id}`;
  const shareText = `🎤 Check out my AI voice recording: "${recording.title}" (${formatDuration(recording.duration)})`;
  const fullShareText = `${shareText}\n\n${shareUrl}`;

  const sharePlatforms = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: '💬',
      color: '#25D366',
      action: () => shareToWhatsApp(fullShareText),
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: '✈️',
      color: '#0088CC',
      action: () => shareToTelegram(fullShareText),
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: '🐦',
      color: '#1DA1F2',
      action: () => shareToTwitter(shareText, shareUrl),
    },
    {
      id: 'farcaster',
      name: 'Farcaster',
      icon: '⚡',
      color: '#8B5CF6',
      action: () => shareToFarcaster(shareText, shareUrl),
    },
    {
      id: 'copy',
      name: 'Copy Link',
      icon: '🔗',
      color: '#6B7280',
      action: () => copyToClipboard(shareUrl),
    },
  ];

  const shareToWhatsApp = (text: string) => {
    if (isReactNative) {
      // React Native sharing - this will only be used in React Native environment
      // For the build to work, we'll only reference React Native modules when needed
      // Using dynamic import to avoid build-time resolution of react-native
      import('react-native').then(RN => {
        const { Linking, Alert } = RN;
        const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
        Linking.openURL(url).catch(() => {
          Alert.alert('Error', 'WhatsApp is not installed');
        });
      }).catch(e => {
        console.warn('React Native modules not available');
      });
    } else {
      // Web sharing
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
    onShare?.('whatsapp', shareUrl);
  };

  const shareToTelegram = (text: string) => {
    if (isReactNative) {
      import('react-native').then(RN => {
        const { Linking, Alert } = RN;
        const url = `tg://msg?text=${encodeURIComponent(text)}`;
        Linking.openURL(url).catch(() => {
          // Fallback to web if Telegram is not installed
          const webUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
          Linking.openURL(webUrl);
        });
      }).catch(e => {
        console.warn('React Native modules not available');
      });
    } else {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
    }
    onShare?.('telegram', shareUrl);
  };

  const shareToTwitter = (text: string, url: string) => {
    if (isReactNative) {
      import('react-native').then(RN => {
        const { Linking, Alert } = RN;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        Linking.openURL(twitterUrl);
      }).catch(e => {
        console.warn('React Native modules not available');
      });
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    }
    onShare?.('twitter', shareUrl);
  };

  const shareToFarcaster = (text: string, url: string) => {
    if (isReactNative) {
      import('react-native').then(RN => {
        const { Linking, Alert } = RN;
        // Farcaster deep link or web URL
        const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text + ' ' + url)}`;
        Linking.openURL(farcasterUrl);
      }).catch(e => {
        console.warn('React Native modules not available');
      });
    } else {
      window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    }
    onShare?.('farcaster', shareUrl);
  };

  const copyToClipboard = async (url: string) => {
    if (isReactNative) {
      import('react-native').then(RN => {
        const { Clipboard, Alert } = RN;
        Clipboard.setString(url);
        Alert.alert('Success', 'Link copied to clipboard!');
      }).catch(e => {
        console.warn('React Native modules not available');
      });
    } else {
      try {
        await navigator.clipboard.writeText(url);
        // Optionally show a toast notification
        alert('Link copied to clipboard!');
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied to clipboard!');
      }
    }
    onShare?.('copy', shareUrl);
  };

  // Always render the web component for build purposes
  // The React Native functionality is handled at runtime
  return (
    <div
      className={cn(
        "bg-gray-800 rounded-lg p-6 border border-gray-700",
        className
      )}
      style={style}
    >
      <h3 className="text-xl font-semibold text-white mb-2">
        🎉 Share Your Recording!
      </h3>
      <p className="text-gray-400 mb-4">
        Send your AI voice creation to friends and followers
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {sharePlatforms.map((platform) => (
          <button
            key={platform.id}
            onClick={platform.action}
            className="flex flex-col items-center p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
          >
            <div
              className="text-2xl mb-2"
              style={{ color: platform.color }}
            >
              {platform.icon}
            </div>
            <span
              className="text-sm font-medium text-center"
              style={{ color: platform.color }}
            >
              {platform.name}
            </span>
          </button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-gray-500 text-sm">
          "{recording.title}" • {formatDuration(recording.duration)}
        </p>
        <p className="text-gray-600 text-xs mt-1">
          {shareUrl}
        </p>
      </div>
    </div>
  );
};

// Web styles (for documentation/reuse purposes)
const styles: { [key: string]: StyleObject } = {
  webContainer: {
    margin: '16px',
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: '#374151',
    borderRadius: '12px',
    border: '1px solid #4B5563',
  },
  webTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: '4px',
    textAlign: 'center' as const,
  },
  webSubtitle: {
    fontSize: '14px',
    color: '#9CA3AF',
    marginBottom: '20px',
    textAlign: 'center',
  },
  webPlatforms: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  webPlatformButton: {
    alignItems: 'center',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid',
    minWidth: '80px',
  },
  webPlatformIcon: {
    fontSize: '20px',
    marginBottom: '4px',
  },
  webPlatformName: {
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center' as const,
  },
  webRecordingInfo: {
    fontSize: '12px',
    color: '#6B7280',
    textAlign: 'center',
  },
};
