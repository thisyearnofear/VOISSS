import React from "react";
import { cn } from '../utils/cn';

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
  className?: string;
  onShare?: (platform: string, url: string) => void;
}

export function SocialShare({ recording, className, onShare }: SocialShareProps) {
  const shareUrl = recording.ipfsUrl || `${window.location.origin}/recording/${recording.id}`;
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
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    onShare?.('whatsapp', shareUrl);
  };

  const shareToTelegram = (text: string) => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
    onShare?.('telegram', shareUrl);
  };

  const shareToTwitter = (text: string, url: string) => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    onShare?.('twitter', shareUrl);
  };

  const shareToFarcaster = (text: string, url: string) => {
    window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    onShare?.('farcaster', shareUrl);
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
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
    onShare?.('copy', shareUrl);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {platforms.map((platform) => (
        <button
          key={platform.name}
          onClick={platform.action}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
            "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900",
            "border border-gray-300 hover:border-gray-400"
          )}
          style={{
            borderColor: platform.color + '30',
            backgroundColor: platform.color + '10'
          }}
        >
          <span>{platform.icon}</span>
          <span className="text-sm font-medium">{platform.label}</span>
        </button>
      ))}
    </div>
  );
}

export default SocialShare;