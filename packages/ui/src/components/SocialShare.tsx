import React from "react";

// Platform detection
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

// Conditional imports for cross-platform compatibility
let cn: any;
let StyleSheet: any;
let View: any;
let Text: any;
let TouchableOpacity: any;
let Alert: any;

if (isReactNative) {
  // React Native imports
  const RN = require('react-native');
  StyleSheet = RN.StyleSheet;
  View = RN.View;
  Text = RN.Text;
  TouchableOpacity = RN.TouchableOpacity;
  Alert = RN.Alert;
} else {
  // Web imports
  cn = require("../utils/cn").cn;
}

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
  style?: any;
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
      // React Native sharing
      const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
      // TODO: Use Linking.openURL or a sharing library
      Alert.alert('WhatsApp Share', `Share URL: ${url}`);
    } else {
      // Web sharing
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
    onShare?.('whatsapp', shareUrl);
  };

  const shareToTelegram = (text: string) => {
    if (isReactNative) {
      const url = `tg://msg?text=${encodeURIComponent(text)}`;
      Alert.alert('Telegram Share', `Share URL: ${url}`);
    } else {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
    }
    onShare?.('telegram', shareUrl);
  };

  const shareToTwitter = (text: string, url: string) => {
    if (isReactNative) {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      Alert.alert('Twitter Share', `Share URL: ${twitterUrl}`);
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    }
    onShare?.('twitter', shareUrl);
  };

  const shareToFarcaster = (text: string, url: string) => {
    if (isReactNative) {
      // Farcaster deep link or web URL
      const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text + ' ' + url)}`;
      Alert.alert('Farcaster Share', `Share URL: ${farcasterUrl}`);
    } else {
      window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    }
    onShare?.('farcaster', shareUrl);
  };

  const copyToClipboard = async (url: string) => {
    if (isReactNative) {
      // TODO: Use Clipboard.setString from expo-clipboard
      Alert.alert('Link Copied', `Copied to clipboard: ${url}`);
    } else {
      try {
        await navigator.clipboard.writeText(url);
        // TODO: Show toast notification
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

  if (isReactNative) {
    // React Native rendering
    return (
      <View style={[styles.rnContainer, style]}>
        <Text style={styles.rnTitle}>Share Your Recording 🎉</Text>
        <Text style={styles.rnSubtitle}>
          Send your AI voice creation to friends!
        </Text>

        <View style={styles.rnPlatforms}>
          {sharePlatforms.map((platform) => (
            <TouchableOpacity
              key={platform.id}
              style={[styles.rnPlatformButton, { borderColor: platform.color }]}
              onPress={platform.action}
            >
              <Text style={styles.rnPlatformIcon}>{platform.icon}</Text>
              <Text style={[styles.rnPlatformName, { color: platform.color }]}>
                {platform.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.rnRecordingInfo}>
          "{recording.title}" • {formatDuration(recording.duration)}
        </Text>
      </View>
    );
  }

  // Web rendering
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

// React Native styles
const styles = StyleSheet.create({
  rnContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#374151',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  rnTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  rnSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
    textAlign: 'center',
  },
  rnPlatforms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  rnPlatformButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
  },
  rnPlatformIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  rnPlatformName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  rnRecordingInfo: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
