"use client";

import { useState, useEffect } from "react";
import { VoiceCard } from "@/components/marketplace/VoiceCard";

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
        setVoices(data.data.voices);
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error);
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
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Voice Marketplace
          </h1>
          <p className="text-lg text-gray-600">
            License authentic human voices for your AI agents
          </p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tone
              </label>
              <select
                value={filters.tone}
                onChange={(e) => setFilters({ ...filters, tone: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Tones</option>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="energetic">Energetic</option>
                <option value="calm">Calm</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Type
              </label>
              <select
                value={filters.licenseType}
                onChange={(e) => setFilters({ ...filters, licenseType: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Types</option>
                <option value="non-exclusive">Non-Exclusive</option>
                <option value="exclusive">Exclusive</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Voice Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading voices...</p>
          </div>
        ) : voices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg mb-4">No voices available yet</p>
            <p className="text-gray-500 text-sm">
              Check back soon as we onboard voice contributors
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {voices.map((voice) => (
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
        <div className="bg-blue-600 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">
            Want to list your voice?
          </h2>
          <p className="text-blue-100 mb-4">
            Earn 70% revenue share from AI agents using your voice
          </p>
          <button className="bg-white text-blue-600 px-6 py-2 rounded font-medium hover:bg-blue-50">
            Become a Contributor
          </button>
        </div>
      </div>
    </div>
  );
}
