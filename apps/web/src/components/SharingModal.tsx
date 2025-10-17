'use client';

import React, { useState } from 'react';

interface SharingModalProps {
  recording: {
    id: string;
    title: string;
    duration: number;
    transactionHash?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function SharingModal({ recording, isOpen, onClose }: SharingModalProps) {
  const [shareType, setShareType] = useState<'public' | 'private' | 'temporary'>('public');
  const [expirationDays, setExpirationDays] = useState(7);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const generateShareLink = async () => {
    setIsGenerating(true);
    try {
      // In a real implementation, this would:
      // 1. Create a share token on Base
      // 2. Set permissions and expiration
      // 3. Generate a shareable link
      
      const mockShareId = Math.random().toString(36).substring(2, 15);
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/share/${mockShareId}`;
      
      setShareLink(link);
    } catch (error) {
      console.error('Failed to generate share link:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show success feedback
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const shareToSocial = (platform: string) => {
    const text = `Check out my voice recording: "${recording.title}" on VOISSS - Decentralized Voice Platform`;
    const url = shareLink || window.location.href;
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
    };

    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="voisss-card max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Share Recording</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-white mb-2">{recording.title}</h4>
          <p className="text-sm text-gray-400">
            Duration: {Math.floor(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, '0')}
          </p>
          {recording.transactionHash && (
            <p className="text-xs text-green-400 font-mono mt-1">
              On-chain: {recording.transactionHash.substring(0, 10)}...
            </p>
          )}
        </div>

        {/* Share Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-3">
            Sharing Type
          </label>
          <div className="space-y-2">
            {[
              { value: 'public', label: 'Public', desc: 'Anyone with the link can access' },
              { value: 'private', label: 'Private', desc: 'Only specific addresses can access' },
              { value: 'temporary', label: 'Temporary', desc: 'Link expires after set time' },
            ].map((option) => (
              <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="shareType"
                  value={option.value}
                  checked={shareType === option.value}
                  onChange={(e) => setShareType(e.target.value as any)}
                  className="mt-1"
                />
                <div>
                  <div className="text-white font-medium">{option.label}</div>
                  <div className="text-sm text-gray-400">{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Expiration Settings */}
        {shareType === 'temporary' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Expires in
            </label>
            <select
              value={expirationDays}
              onChange={(e) => setExpirationDays(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        )}

        {/* Generate Share Link */}
        {!shareLink && (
          <button
            onClick={generateShareLink}
            disabled={isGenerating}
            className="w-full voisss-btn-primary mb-4 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Share Link'}
          </button>
        )}

        {/* Share Link Display */}
        {shareLink && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Share Link
            </label>
            <div className="flex">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 bg-gray-800 border border-gray-600 rounded-l-lg px-3 py-2 text-white text-sm"
              />
              <button
                onClick={() => copyToClipboard(shareLink)}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-r-lg text-white text-sm"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Social Sharing */}
        {shareLink && (
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Share on Social Media
            </label>
            <div className="flex space-x-3">
              <button
                onClick={() => shareToSocial('twitter')}
                className="flex-1 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white text-sm"
              >
                Twitter
              </button>
              <button
                onClick={() => shareToSocial('telegram')}
                className="flex-1 bg-blue-400 hover:bg-blue-500 px-4 py-2 rounded-lg text-white text-sm"
              >
                Telegram
              </button>
              <button
                onClick={() => shareToSocial('whatsapp')}
                className="flex-1 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-white text-sm"
              >
                WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
