"use client";

import { useState } from "react";

interface VoiceCardProps {
  voice: {
    id: string;
    contributorAddress: string;
    price: string; // USDC wei
    licenseType: 'exclusive' | 'non-exclusive';
    voiceProfile: {
      tone?: string;
      pitch?: string;
      language?: string;
      accent?: string;
      tags?: string[];
    };
    stats: {
      views: number;
      purchases: number;
      usageCount: number;
    };
    sampleUrl?: string;
  };
  onPurchase?: (voiceId: string) => void;
}

export function VoiceCard({ voice, onPurchase }: VoiceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Format price from wei to USDC
  const priceUSDC = (parseInt(voice.price) / 1_000_000).toFixed(2);
  
  const handlePlaySample = () => {
    if (!voice.sampleUrl) return;
    
    // TODO: Implement audio playback
    setIsPlaying(!isPlaying);
  };
  
  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase(voice.id);
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      {/* Voice Profile */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">
            {voice.voiceProfile.tone || 'Professional'} Voice
          </h3>
          <span className={`text-xs px-2 py-1 rounded ${
            voice.licenseType === 'exclusive' 
              ? 'bg-purple-100 text-purple-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {voice.licenseType}
          </span>
        </div>
        
        <div className="text-sm text-gray-600 space-y-1">
          {voice.voiceProfile.language && (
            <div>Language: {voice.voiceProfile.language}</div>
          )}
          {voice.voiceProfile.accent && (
            <div>Accent: {voice.voiceProfile.accent}</div>
          )}
          {voice.voiceProfile.pitch && (
            <div>Pitch: {voice.voiceProfile.pitch}</div>
          )}
        </div>
        
        {/* Tags */}
        {voice.voiceProfile.tags && voice.voiceProfile.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {voice.voiceProfile.tags.map((tag, idx) => (
              <span 
                key={idx}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
        <div>{voice.stats.views} views</div>
        <div>{voice.stats.purchases} sales</div>
        <div>{voice.stats.usageCount.toLocaleString()} uses</div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-gray-900">
          ${priceUSDC}
          <span className="text-sm font-normal text-gray-500">/mo</span>
        </div>
        
        <div className="flex gap-2">
          {voice.sampleUrl && (
            <button
              onClick={handlePlaySample}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              {isPlaying ? '⏸ Pause' : '▶ Preview'}
            </button>
          )}
          
          <button
            onClick={handlePurchase}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            License
          </button>
        </div>
      </div>
      
      {/* Contributor */}
      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
        By {voice.contributorAddress.slice(0, 6)}...{voice.contributorAddress.slice(-4)}
      </div>
    </div>
  );
}
