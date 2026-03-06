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
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 hover:border-[#3A3A3A] transition-colors">
      {/* Voice Profile */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg text-white">
            {voice.voiceProfile.tone || 'Professional'} Voice
          </h3>
          <span className={`text-xs px-2 py-1 rounded ${
            voice.licenseType === 'exclusive' 
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {voice.licenseType}
          </span>
        </div>
        
        <div className="text-sm text-gray-400 space-y-1">
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
                className="text-xs bg-[#2A2A2A] text-gray-300 px-2 py-0.5 rounded"
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
        <div className="text-2xl font-bold text-white">
          ${priceUSDC}
          <span className="text-sm font-normal text-gray-500">/mo</span>
        </div>
        
        <div className="flex gap-2">
          {voice.sampleUrl && (
            <button
              onClick={handlePlaySample}
              className="px-3 py-1.5 text-sm border border-[#2A2A2A] text-gray-300 rounded-lg hover:bg-[#2A2A2A] transition-colors"
            >
              {isPlaying ? '⏸ Pause' : '▶ Preview'}
            </button>
          )}
          
          <button
            onClick={handlePurchase}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            License
          </button>
        </div>
      </div>
      
      {/* Contributor */}
      <div className="mt-3 pt-3 border-t border-[#2A2A2A] text-xs text-gray-500">
        By {voice.contributorAddress.slice(0, 6)}...{voice.contributorAddress.slice(-4)}
      </div>
    </div>
  );
}
