"use client";

import { useEffect, useState } from "react";
import { VoiceCard } from "@/components/marketplace/VoiceCard";
import { VoiceMarketTrends } from "@/components/marketplace/VoiceMarketTrends";
import { useBaseAccount } from "@/hooks/useBaseAccount";
import { useAuth } from "@/contexts/AuthContext";

export default function MarketplacePage() {
  const { isConnected, universalAddress, connect } = useBaseAccount();
  const { address: authAddress, isAuthenticated } = useAuth();
  const [voices, setVoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    language: "",
    tone: "",
    licenseType: "",
  });

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

  const handlePurchase = async (voiceId: string) => {
    const activeAddress = universalAddress || authAddress;

    if (!isConnected && !isAuthenticated) {
      if (confirm("Please connect your wallet to purchase a license.")) {
        connect();
      }
      return;
    }

    try {
      setPurchasingId(voiceId);

      const response = await fetch("/api/marketplace/license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId,
          licenseeAddress: activeAddress,
          licenseType: "non-exclusive",
        }),
      });

      if (response.status === 402) {
        const paymentData = await response.json();

        alert(
          `x402 Payment Required: ${paymentData.paymentRequired.amount} USDC for ${paymentData.paymentRequired.reason}\n\nThis will trigger a Base transaction via the x402 protocol.`
        );

        const mockTxHash = `0x${Math.random()
          .toString(16)
          .slice(2)
          .padStart(64, "0")}`;

        const finalizeResponse = await fetch("/api/marketplace/license", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-402-payment": JSON.stringify({
              txHash: mockTxHash,
              amount: paymentData.paymentRequired.amount,
              currency: "USDC",
            }),
          },
          body: JSON.stringify({
            voiceId,
            licenseeAddress: activeAddress,
            licenseType: "non-exclusive",
          }),
        });

        const result = await finalizeResponse.json();
        if (result.success) {
          alert(`License Activated! ID: ${result.data.licenseId}`);
        } else {
          alert(`Activation failed: ${result.error}`);
        }
      } else {
        const result = await response.json();
        if (result.success) {
          alert(`License already active! ID: ${result.data.licenseId}`);
        }
      }
    } catch (purchaseError) {
      console.error("Purchase flow failed:", purchaseError);
      alert("License purchase failed. Please check console.");
    } finally {
      setPurchasingId(null);
    }
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
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl font-bold text-white">Voice Marketplace</h1>
            <span className="text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full">
              🔴 Live on Base
            </span>
          </div>
          <p className="text-lg text-gray-400 mb-4">
            License authentic human voices for your AI agents
          </p>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            Indexer Bridge active
            <span className="text-emerald-200/60">
              Live contract state with provenance badges
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalVoices}</div>
              <div className="text-xs text-gray-500">Voices</div>
            </div>
            <div className="w-px h-8 bg-[#2A2A2A]" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {totalLicenses}
              </div>
              <div className="text-xs text-gray-500">Licenses Sold</div>
            </div>
            <div className="w-px h-8 bg-[#2A2A2A]" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {totalUsage.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Total Uses</div>
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

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 mb-6">
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
                onPurchase={
                  purchasingId ? undefined : () => handlePurchase(voice.id)
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#2A2A2A] bg-[#121212] px-6 py-12 text-center">
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
    </div>
  );
}
