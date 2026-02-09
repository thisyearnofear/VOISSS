import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert, Clipboard } from 'react-native';

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
  style?: any;
  onShare?: (platform: string, url: string) => void;
}

export function SocialShare({ recording, style, onShare }: SocialShareProps) {
  const shareUrl = recording.ipfsUrl || `https://voisss.netlify.app/recording/${recording.id}`;
  const shareText = `Check out this voice recording: "${recording.title}"`;

  const platforms = [
    {
      name: 'whatsapp',
      label: 'WhatsApp',
      icon: '📱',
      color: '#25D366',
      action: () => shareToWhatsApp(shareText),
    },
    {
      name: 'telegram',
      label: 'Telegram',
      icon: '✈️',
      color: '#0088cc',
      action: () => shareToTelegram(shareText),
    },
    {
      name: 'twitter',
      label: 'Twitter',
      icon: '🐦',
      color: '#1DA1F2',
      action: () => shareToTwitter(shareText, shareUrl),
    },
    {
      name: 'farcaster',
      label: 'Farcaster',
      icon: '🟣',
      color: '#855DCD',
      action: () => shareToFarcaster(shareText, shareUrl),
    },
    {
      name: 'copy',
      label: 'Copy Link',
      icon: '📋',
      color: '#6B7280',
      action: () => copyToClipboard(shareUrl),
    },
  ];

  const shareToWhatsApp = (text: string) => {
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed');
    });
    onShare?.('whatsapp', shareUrl);
  };

  const shareToTelegram = (text: string) => {
    const url = `tg://msg?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      // Fallback to web if Telegram is not installed
      const webUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
      Linking.openURL(webUrl);
    });
    onShare?.('telegram', shareUrl);
  };

  const shareToTwitter = (text: string, url: string) => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    Linking.openURL(twitterUrl);
    onShare?.('twitter', shareUrl);
  };

  const shareToFarcaster = (text: string, url: string) => {
    const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text + ' ' + url)}`;
    Linking.openURL(farcasterUrl);
    onShare?.('farcaster', shareUrl);
  };

  const copyToClipboard = (url: string) => {
    Clipboard.setString(url);
    Alert.alert('Success', 'Link copied to clipboard!');
    onShare?.('copy', shareUrl);
  };

  return (
    <View style={[styles.container, style]}>
      {platforms.map((platform) => (
        <TouchableOpacity
          key={platform.name}
          onPress={platform.action}
          style={[
            styles.platformButton,
            { borderColor: platform.color + '30', backgroundColor: platform.color + '10' }
          ]}
        >
          <Text style={styles.icon}>{platform.icon}</Text>
          <Text style={styles.label}>{platform.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});

export default SocialShare;