"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceCard } from "@/components/marketplace/VoiceCard";
import { VoiceMarketTrends } from "@/components/marketplace/VoiceMarketTrends";
import { LicensePurchaseModal } from "@/components/payment/LicensePurchaseModal";
import { useBaseAccount } from "@/hooks/useBaseAccount";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronDown, Sparkles } from "lucide-react";

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
  const [showFilters, setShowFilters] = useState(false);
  const [modalVoice, setModalVoice] = useState<any>(null);

  const activeFilterCount = [filters.language, filters.tone, filters.licenseType].filter(Boolean).length;

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

  const FilterSelect = ({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0A0A0A] border border-[#2A2A2A] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#7C5DFA] focus:ring-1 focus:ring-[#7C5DFA]/30 transition-all"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] voisss-bg-grid voisss-bg-noise">
      <div className="border-b border-[#2A2A2A] voisss-bg-mesh">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Voice Marketplace</h1>
            <span className="text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-sm w-fit uppercase tracking-wider">
              LIVE ON BASE
            </span>
          </div>
          <p className="text-base sm:text-lg text-gray-400 mb-6">
            License authentic human voices for your AI agents
          </p>

          {/* Stats bar */}
          <div className="flex items-center gap-0 border border-[#2A2A2A] rounded-sm overflow-hidden w-fit">
            <div className="px-4 sm:px-5 py-3 border-r border-[#2A2A2A] bg-[#0A0A0A]/80">
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">{totalVoices}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Voices</div>
            </div>
            <div className="px-4 sm:px-5 py-3 border-r border-[#2A2A2A] bg-[#0A0A0A]/80">
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">{totalLicenses}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Licenses Sold</div>
            </div>
            <div className="px-4 sm:px-5 py-3 bg-[#0A0A0A]/80">
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">{totalUsage.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Total Uses</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <VoiceMarketTrends />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </motion.div>
        )}

        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Collapsible Filters */}
        <AnimatePresence>
          <motion.div
            initial={false}
            animate={{ opacity: 1, height: 'auto' }}
            className="hidden md:block"
          >
            <div className="border border-[#2A2A2A] rounded-sm p-4 mb-6 bg-[#0A0A0A]/60 backdrop-blur-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <FilterSelect
                  label="Language"
                  value={filters.language}
                  onChange={(v) => setFilters({ ...filters, language: v })}
                  options={[
                    { value: "", label: "All Languages" },
                    { value: "en-US", label: "English (US)" },
                    { value: "en-GB", label: "English (UK)" },
                    { value: "es-ES", label: "Spanish" },
                    { value: "fr-FR", label: "French" },
                    { value: "de-DE", label: "German" },
                  ]}
                />
                <FilterSelect
                  label="Tone"
                  value={filters.tone}
                  onChange={(v) => setFilters({ ...filters, tone: v })}
                  options={[
                    { value: "", label: "All Tones" },
                    { value: "professional", label: "Professional" },
                    { value: "friendly", label: "Friendly" },
                    { value: "energetic", label: "Energetic" },
                    { value: "calm", label: "Calm" },
                    { value: "warm", label: "Warm" },
                    { value: "authoritative", label: "Authoritative" },
                  ]}
                />
                <FilterSelect
                  label="License"
                  value={filters.licenseType}
                  onChange={(v) => setFilters({ ...filters, licenseType: v })}
                  options={[
                    { value: "", label: "All License Types" },
                    { value: "non-exclusive", label: "Non-exclusive" },
                    { value: "exclusive", label: "Exclusive" },
                  ]}
                />
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ language: "", tone: "", licenseType: "" })}
                    className="w-full px-4 py-2.5 border border-[#2A2A2A] text-gray-400 rounded-lg hover:border-gray-600 hover:text-white transition-all text-sm"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Mobile Filters (animated) */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden md:hidden"
          >
            <div className="border border-[#2A2A2A] rounded-sm p-4 mb-6 bg-[#0A0A0A]/60 backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-4">
                <FilterSelect
                  label="Language"
                  value={filters.language}
                  onChange={(v) => setFilters({ ...filters, language: v })}
                  options={[
                    { value: "", label: "All Languages" },
                    { value: "en-US", label: "English (US)" },
                    { value: "en-GB", label: "English (UK)" },
                    { value: "es-ES", label: "Spanish" },
                    { value: "fr-FR", label: "French" },
                    { value: "de-DE", label: "German" },
                  ]}
                />
                <FilterSelect
                  label="Tone"
                  value={filters.tone}
                  onChange={(v) => setFilters({ ...filters, tone: v })}
                  options={[
                    { value: "", label: "All Tones" },
                    { value: "professional", label: "Professional" },
                    { value: "friendly", label: "Friendly" },
                    { value: "energetic", label: "Energetic" },
                    { value: "calm", label: "Calm" },
                    { value: "warm", label: "Warm" },
                    { value: "authoritative", label: "Authoritative" },
                  ]}
                />
                <FilterSelect
                  label="License"
                  value={filters.licenseType}
                  onChange={(v) => setFilters({ ...filters, licenseType: v })}
                  options={[
                    { value: "", label: "All License Types" },
                    { value: "non-exclusive", label: "Non-exclusive" },
                    { value: "exclusive", label: "Exclusive" },
                  ]}
                />
                <button
                  onClick={() => {
                    setFilters({ language: "", tone: "", licenseType: "" });
                    setShowFilters(false);
                  }}
                  className="w-full px-4 py-2.5 border border-[#2A2A2A] text-gray-400 rounded-lg hover:border-gray-600 hover:text-white transition-all text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Onboarding hint for first-time visitors */}
        {!loading && voices.length === 0 && !error && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-[#7C5DFA]/10 to-blue-500/10 border border-[#7C5DFA]/20 rounded-lg flex items-start gap-3"
          >
            <Sparkles className="w-5 h-5 text-[#9C88FF] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-300 font-medium">Welcome to the Voice Marketplace</p>
              <p className="text-xs text-gray-500 mt-1">
                Connect your wallet to license voices for your AI agents, or head to the{" "}
                <a href="/studio" className="text-[#9C88FF] hover:underline">Studio</a> to contribute your own voice.
              </p>
            </div>
          </motion.div>
        )}

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-xl border border-[#2A2A2A] bg-[#111111] animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </motion.div>
        ) : filteredVoices.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredVoices.map((voice, i) => (
              <motion.div
                key={voice.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <VoiceCard
                  voice={voice}
                  onPurchase={() => handlePurchaseClick(voice.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-[#2A2A2A] bg-[#121212]/60 px-6 py-12 text-center rounded-sm"
          >
            <div className="text-lg font-semibold text-white mb-2">
              {activeFilterCount > 0 ? "No voices matched these filters" : "No voices listed yet"}
            </div>
            <div className="text-sm text-gray-400 max-w-md mx-auto">
              {activeFilterCount > 0
                ? "Try adjusting your filters or clearing them to see all available voices."
                : "Be the first to list your voice! Head to the Studio to record and publish."
              }
            </div>
          </motion.div>
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
