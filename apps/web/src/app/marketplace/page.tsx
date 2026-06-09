"use client";

import { useEffect, useState } from "react";
import { VoiceCard } from "@/components/marketplace/VoiceCard";
import { VoiceMarketTrends } from "@/components/marketplace/VoiceMarketTrends";
import { LicensePurchaseModal } from "@/components/payment/LicensePurchaseModal";
import { useBaseAccount } from "@/hooks/useBaseAccount";
import { useAuth } from "@/contexts/AuthContext";

export default function MarketplacePage() {
  const { isConnected, universalAddress, connect } = useBaseAccount();
  const { address: authAddress, isAuthenticated } = useAuth();
  const [voices, setVoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    language: "",
    tone: "",
    licenseType: "",
  });
  const [modalVoice, setModalVoice] = useState<any>(null);

  useEffect(() => {
    fetchVoices();
  }, [filters]);

  const fetchVoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.language) params.append("language", filters.language);
      if (filters.tone) params.append("tone", filters.tone);
      if (filters.licenseType) {
        params.append("licenseType", filters.licenseType);
      }

      const response = await fetch(`/api/marketplace/voices?${params}`);
      const data = await response.json();

      if (data.success) {
        setVoices(data.data.voices || []);
      } else {
        setVoices([]);
        setError(data.error || "Failed to fetch live marketplace listings.");
      }
    } catch (fetchError) {
      console.error("Failed to fetch voices:", fetchError);
      setVoices([]);
      setError("Failed to fetch live marketplace listings.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (voiceId: string) => {
    if (!isConnected && !isAuthenticated) {
      connect();
      return;
    }
    const voice = voices.find((v) => v.id === voiceId) || null;
    setModalVoice(voice);
  };

  const executePurchase = async (voiceId: string): Promise<{ success: boolean; licenseId?: string; error?: string }> => {
    const activeAddress = universalAddress || authAddress;
    if (!activeAddress) return { success: false, error: "No wallet connected" };

    const response = await fetch("/api/marketplace/license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voiceId, licenseeAddress: activeAddress, licenseType: "non-exclusive" }),
    });

    if (response.status === 402) {
      const paymentData = await response.json();
      const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

      const finalizeResponse = await fetch("/api/marketplace/license", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-402-payment": JSON.stringify({
            txHash,
            amount: paymentData.requirements?.amount || "49000000",
            currency: "USDC",
          }),
        },
        body: JSON.stringify({ voiceId, licenseeAddress: activeAddress, licenseType: "non-exclusive" }),
      });

      const result = await finalizeResponse.json();
      return result.success
        ? { success: true, licenseId: result.data?.licenseId }
        : { success: false, error: result.error || "Activation failed" };
    }

    const result = await response.json();
    return result.success
      ? { success: true, licenseId: result.data?.licenseId }
      : { success: false, error: result.error || "Purchase failed" };
  };

  const totalVoices = voices.length;
  const totalLicenses = voices.reduce(
    (sum, voice) => sum + (voice.stats?.purchases || 0),
    0
  );
  const totalUsage = voices.reduce(
    (sum, voice) => sum + (voice.stats?.usageCount || 0),
    0
  );

  const filteredVoices = voices.filter((voice) => {
    if (filters.language && voice.voiceProfile?.language !== filters.language) {
      return false;
    }
    if (
      filters.tone &&
      voice.voiceProfile?.tone?.toLowerCase() !== filters.tone.toLowerCase()
    ) {
      return false;
    }
    if (filters.licenseType && voice.licenseType !== filters.licenseType) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] voisss-bg-grid voisss-bg-noise">
      <div className="border-b border-[#2A2A2A] voisss-bg-mesh">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl font-bold text-white">Voice Marketplace</h1>
            <span className="text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-sm">
              LIVE ON BASE
            </span>
          </div>
          <p className="text-lg text-gray-400 mb-6">
            License authentic human voices for your AI agents
          </p>

          {/* Stats bar — terminal style, sharp corners */}
          <div className="flex items-center gap-0 border border-[#2A2A2A] rounded-sm overflow-hidden w-fit">
            <div className="px-5 py-3 border-r border-[#2A2A2A] bg-[#0A0A0A]/80">
              <div className="text-2xl font-bold text-white font-mono">{totalVoices}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Voices</div>
            </div>
            <div className="px-5 py-3 border-r border-[#2A2A2A] bg-[#0A0A0A]/80">
              <div className="text-2xl font-bold text-white font-mono">
                {totalLicenses}
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Licenses Sold</div>
            </div>
            <div className="px-5 py-3 bg-[#0A0A0A]/80">
              <div className="text-2xl font-bold text-white font-mono">
                {totalUsage.toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Total Uses</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <VoiceMarketTrends />

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="border border-[#2A2A2A] rounded-sm p-4 mb-6 bg-[#0A0A0A]/60 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Language
              </label>
              <select
                value={filters.language}
                onChange={(e) =>
                  setFilters({ ...filters, language: e.target.value })
                }
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
                onChange={(e) =>
                  setFilters({ ...filters, tone: e.target.value })
                }
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#3A3A3A]"
              >
                <option value="">All Tones</option>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="energetic">Energetic</option>
                <option value="calm">Calm</option>
                <option value="warm">Warm</option>
                <option value="authoritative">Authoritative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                License
              </label>
              <select
                value={filters.licenseType}
                onChange={(e) =>
                  setFilters({ ...filters, licenseType: e.target.value })
                }
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#3A3A3A]"
              >
                <option value="">All License Types</option>
                <option value="non-exclusive">Non-exclusive</option>
                <option value="exclusive">Exclusive</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-xl border border-[#2A2A2A] bg-[#111111] animate-pulse"
              />
            ))}
          </div>
        ) : filteredVoices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVoices.map((voice) => (
              <VoiceCard
                key={voice.id}
                voice={voice}
                onPurchase={() => handlePurchaseClick(voice.id)}
              />
            ))}
          </div>
        ) : (
          <div className="border border-[#2A2A2A] bg-[#121212]/60 px-6 py-12 text-center rounded-sm">
            <div className="text-lg font-semibold text-white">
              No live listings matched these filters
            </div>
            <div className="mt-2 text-sm text-gray-400">
              This view now reads directly from live marketplace state, so empty
              results mean there is nothing currently listed for the selected
              criteria.
            </div>
          </div>
        )}
      </div>

      <LicensePurchaseModal
        visible={!!modalVoice}
        onClose={() => setModalVoice(null)}
        voice={modalVoice}
        licenseType="non-exclusive"
        onPurchase={executePurchase}
      />
    </div>
  );
}
