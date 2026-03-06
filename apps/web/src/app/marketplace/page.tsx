"use client";

import { useState, useEffect } from "react";
import { VoiceCard } from "@/components/marketplace/VoiceCard";

const DEMO_VOICES = [
  {
    id: "voice_demo_001",
    contributorAddress: "0x7a3B...4f2E",
    price: "49000000",
    licenseType: "non-exclusive" as const,
    voiceProfile: { tone: "Professional", pitch: "medium", language: "en-US", accent: "American Neutral", tags: ["corporate", "narration", "clear"] },
    stats: { views: 2847, purchases: 34, usageCount: 12500 },
    sampleUrl: "#demo"
  },
  {
    id: "voice_demo_002",
    contributorAddress: "0x3cD1...8a9B",
    price: "79000000",
    licenseType: "non-exclusive" as const,
    voiceProfile: { tone: "Warm", pitch: "low", language: "en-US", accent: "Southern US", tags: ["storytelling", "podcast", "soothing"] },
    stats: { views: 1923, purchases: 21, usageCount: 8400 },
    sampleUrl: "#demo"
  },
  {
    id: "voice_demo_003",
    contributorAddress: "0xB2e5...1cF3",
    price: "149000000",
    licenseType: "exclusive" as const,
    voiceProfile: { tone: "Energetic", pitch: "high", language: "en-US", accent: "California", tags: ["marketing", "upbeat", "youthful"] },
    stats: { views: 3412, purchases: 8, usageCount: 3200 },
    sampleUrl: "#demo"
  },
  {
    id: "voice_demo_004",
    contributorAddress: "0x9fA8...6dE2",
    price: "59000000",
    licenseType: "non-exclusive" as const,
    voiceProfile: { tone: "Calm", pitch: "medium", language: "en-GB", accent: "British RP", tags: ["meditation", "education", "trustworthy"] },
    stats: { views: 4156, purchases: 47, usageCount: 19800 },
    sampleUrl: "#demo"
  },
  {
    id: "voice_demo_005",
    contributorAddress: "0x1bC4...5aD7",
    price: "99000000",
    licenseType: "non-exclusive" as const,
    voiceProfile: { tone: "Authoritative", pitch: "low", language: "en-US", accent: "Midwest", tags: ["news", "documentary", "commanding"] },
    stats: { views: 2234, purchases: 19, usageCount: 7600 },
    sampleUrl: "#demo"
  },
  {
    id: "voice_demo_006",
    contributorAddress: "0xE7f2...3bA1",
    price: "69000000",
    licenseType: "non-exclusive" as const,
    voiceProfile: { tone: "Friendly", pitch: "medium", language: "es-ES", accent: "Castilian Spanish", tags: ["customer-service", "approachable", "multilingual"] },
    stats: { views: 1567, purchases: 12, usageCount: 4800 },
    sampleUrl: "#demo"
  },
  {
    id: "voice_demo_007",
    contributorAddress: "0x4Da9...7eC5",
    price: "199000000",
    licenseType: "exclusive" as const,
    voiceProfile: { tone: "Sophisticated", pitch: "medium", language: "fr-FR", accent: "Parisian French", tags: ["luxury", "elegant", "premium"] },
    stats: { views: 892, purchases: 3, usageCount: 1200 },
    sampleUrl: "#demo"
  },
  {
    id: "voice_demo_008",
    contributorAddress: "0x6Ac3...9fB8",
    price: "39000000",
    licenseType: "non-exclusive" as const,
    voiceProfile: { tone: "Conversational", pitch: "high", language: "en-US", accent: "Pacific Northwest", tags: ["chatbot", "casual", "relatable"] },
    stats: { views: 5621, purchases: 63, usageCount: 28400 },
    sampleUrl: "#demo"
  },
];

export default function MarketplacePage() {
  const [voices, setVoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    language: '',
    tone: '',
    licenseType: ''
  });
  
  useEffect(() => {
    fetchVoices();
  }, [filters]);
  
  const fetchVoices = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.language) params.append('language', filters.language);
      if (filters.tone) params.append('tone', filters.tone);
      if (filters.licenseType) params.append('licenseType', filters.licenseType);
      
      const response = await fetch(`/api/marketplace/voices?${params}`);
      const data = await response.json();
      
      if (data.success) {
        const apiVoices = data.data.voices || [];
        if (apiVoices.length <= 1) {
          const apiIds = new Set(apiVoices.map((v: any) => v.id));
          const merged = [
            ...apiVoices,
            ...DEMO_VOICES.filter((d) => !apiIds.has(d.id)),
          ];
          setVoices(merged);
        } else {
          setVoices(apiVoices);
        }
      } else {
        setVoices(DEMO_VOICES);
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      setVoices(DEMO_VOICES);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePurchase = async (voiceId: string) => {
    // TODO: Implement purchase flow
    // 1. Connect wallet
    // 2. Show purchase modal
    // 3. Submit license request
    alert(`Purchase flow for ${voiceId} - Coming soon!`);
  };

  const totalVoices = voices.length;
  const totalLicenses = voices.reduce((sum, v) => sum + (v.stats?.purchases || 0), 0);
  const totalUsage = voices.reduce((sum, v) => sum + (v.stats?.usageCount || 0), 0);

  const filteredVoices = voices.filter((voice) => {
    if (filters.language && voice.voiceProfile?.language !== filters.language) return false;
    if (filters.tone && voice.voiceProfile?.tone?.toLowerCase() !== filters.tone.toLowerCase()) return false;
    if (filters.licenseType && voice.licenseType !== filters.licenseType) return false;
    return true;
  });
  
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl font-bold text-white">
              Voice Marketplace
            </h1>
            <span className="text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full">
              🔴 Live on Base
            </span>
          </div>
          <p className="text-lg text-gray-400 mb-6">
            License authentic human voices for your AI agents
          </p>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalVoices}</div>
              <div className="text-xs text-gray-500">Voices</div>
            </div>
            <div className="w-px h-8 bg-[#2A2A2A]" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalLicenses}</div>
              <div className="text-xs text-gray-500">Licenses Sold</div>
            </div>
            <div className="w-px h-8 bg-[#2A2A2A]" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalUsage.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Total Uses</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Language
              </label>
              <select
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#3A3A3A]"
              >
                <option value="">All Languages</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Tone
              </label>
              <select
                value={filters.tone}
                onChange={(e) => setFilters({ ...filters, tone: e.target.value })}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#3A3A3A]"
              >
                <option value="">All Tones</option>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="energetic">Energetic</option>
                <option value="calm">Calm</option>
                <option value="warm">Warm</option>
                <option value="authoritative">Authoritative</option>
                <option value="conversational">Conversational</option>
                <option value="sophisticated">Sophisticated</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                License Type
              </label>
              <select
                value={filters.licenseType}
                onChange={(e) => setFilters({ ...filters, licenseType: e.target.value })}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#3A3A3A]"
              >
                <option value="">All Types</option>
                <option value="non-exclusive">Non-Exclusive</option>
                <option value="exclusive">Exclusive</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-500">
                Showing <span className="text-white font-medium">{filteredVoices.length}</span> of {totalVoices} voices
              </div>
            </div>
          </div>
        </div>
        
        {/* Voice Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-2 text-gray-500">Loading voices...</p>
          </div>
        ) : filteredVoices.length === 0 ? (
          <div className="text-center py-12 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
            <p className="text-gray-400 text-lg mb-4">No voices match your filters</p>
            <p className="text-gray-600 text-sm">
              Try adjusting your filters to see more results
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVoices.map((voice) => (
              <VoiceCard
                key={voice.id}
                voice={voice}
                onPurchase={handlePurchase}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#2A2A2A] rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Monetize Your Voice
          </h2>
          <p className="text-gray-400 mb-4">
            Earn 70% revenue share from AI agents licensing your voice. You own your identity — always.
          </p>
          <button className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            Become a Contributor
          </button>
        </div>
      </div>
    </div>
  );
}
