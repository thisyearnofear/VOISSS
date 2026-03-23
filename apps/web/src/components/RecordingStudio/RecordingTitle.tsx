import React from 'react';
import { Bot, Tags, DollarSign, Lock, BadgeCheck, Mic2 } from 'lucide-react';
import { AgentCategory } from '@voisss/shared/types';

interface RecordingTitleProps {
  recordingTitle: string;
  onTitleChange: (title: string) => void;
  // Agent mode props
  isAgentMode?: boolean;
  onAgentModeChange?: (isAgent: boolean) => void;
  category?: AgentCategory;
  onCategoryChange?: (category: AgentCategory) => void;
  x402Price?: string;
  onX402PriceChange?: (price: string) => void;
  listOnMarketplace?: boolean;
  onListOnMarketplaceChange?: (enabled: boolean) => void;
  marketplacePrice?: string;
  onMarketplacePriceChange?: (price: string) => void;
  marketplaceExclusive?: boolean;
  onMarketplaceExclusiveChange?: (exclusive: boolean) => void;
  humanityCertificateBadge?: string | null;
  // Verification
  isVerifiedAgent?: boolean;
}

const CATEGORIES: { value: AgentCategory; label: string; color: string }[] = [
  { value: 'defi', label: 'DeFi', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'governance', label: 'Governance', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'alpha', label: 'Alpha', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'memes', label: 'Memes', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  { value: 'general', label: 'General', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
];

export default function RecordingTitle({
  recordingTitle,
  onTitleChange,
  isAgentMode = false,
  onAgentModeChange,
  category = 'general',
  onCategoryChange,
  x402Price = '0',
  onX402PriceChange,
  listOnMarketplace = false,
  onListOnMarketplaceChange,
  marketplacePrice = '49',
  onMarketplacePriceChange,
  marketplaceExclusive = false,
  onMarketplaceExclusiveChange,
  humanityCertificateBadge,
  isVerifiedAgent = false,
}: RecordingTitleProps) {
  return (
    <div className="space-y-4">
      {/* Title Input */}
      <div>
        <label
          htmlFor="title"
          className="block text-lg font-bold text-[#7C5DFA] mb-2 text-center"
        >
          Recording Title
        </label>
        <input
          type="text"
          id="title"
          value={recordingTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Give your recording a memorable name..."
          className="voisss-input w-full border-purple-500 focus:ring-purple-500 placeholder-gray-400"
        />
      </div>

      {/* Mode Selector - User vs Agent */}
      {onAgentModeChange && (
        <div className="pt-4 border-t border-[#2A2A2A]">
          <div className="bg-[#1A1A1A] rounded-xl p-1.5 border border-[#2A2A2A]">
            <div className="flex gap-1">
              <button
                onClick={() => onAgentModeChange(false)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                  !isAgentMode
                    ? 'bg-[#2A2A2A] text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-[#252525]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium text-sm">Personal</span>
              </button>
              <button
                onClick={() => isVerifiedAgent && onAgentModeChange?.(true)}
                disabled={!isVerifiedAgent}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isAgentMode
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                    : isVerifiedAgent
                      ? 'text-gray-400 hover:text-indigo-300 hover:bg-[#252525]'
                      : 'text-gray-600 cursor-not-allowed'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span className="font-medium text-sm">Agent Mode</span>
                {!isVerifiedAgent && <Lock className="w-3 h-3" />}
                {isAgentMode && (
                  <span className="ml-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* Agent Mode Options */}
          {isAgentMode && (
            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
              {/* Category Selector */}
              {onCategoryChange && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                    <Tags className="w-4 h-4" />
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => onCategoryChange(cat.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          category === cat.value
                            ? cat.color
                            : 'bg-[#2A2A2A] text-gray-400 border-[#3A3A3A] hover:border-[#4A4A4A]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* x402 Price Input */}
              {onX402PriceChange && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                    <DollarSign className="w-4 h-4" />
                    Access Price (USDC)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={x402Price}
                      onChange={(e) => onX402PriceChange(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 voisss-input bg-[#2A2A2A] border-[#3A3A3A] text-white placeholder-gray-500"
                    />
                    <span className="text-sm text-gray-500">USDC</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Set to 0 for free access. x402 payments enable micropayments.
                  </p>
                </div>
              )}
            </div>
          )}
          {!isVerifiedAgent && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Agent Mode requires registration in the Agent Registry.{" "}
              <a href="/agents" className="text-indigo-400 hover:text-indigo-300">Learn more</a>
            </p>
          )}
        </div>
      )}

      {onListOnMarketplaceChange && (
        <div className="pt-4 border-t border-[#2A2A2A]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
                <Mic2 className="w-4 h-4 text-cyan-400" />
                List This Voice on Marketplace
              </label>
              <p className="text-xs text-gray-500">
                Publish the saved recording as a licensable voice immediately after anchoring it on Base.
              </p>
              {humanityCertificateBadge && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  <BadgeCheck className="w-3 h-3" />
                  {humanityCertificateBadge}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onListOnMarketplaceChange(!listOnMarketplace)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                listOnMarketplace ? 'bg-cyan-500' : 'bg-[#2A2A2A]'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  listOnMarketplace ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {listOnMarketplace && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
              {onMarketplacePriceChange && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
                    <DollarSign className="w-4 h-4" />
                    Marketplace Price (USDC / month)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={marketplacePrice}
                    onChange={(e) => onMarketplacePriceChange(e.target.value)}
                    className="w-full voisss-input bg-[#2A2A2A] border-[#3A3A3A] text-white placeholder-gray-500"
                  />
                </div>
              )}

              {onMarketplaceExclusiveChange && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    License Mode
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onMarketplaceExclusiveChange(false)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-all ${
                        !marketplaceExclusive
                          ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                          : 'border-[#3A3A3A] bg-[#2A2A2A] text-gray-400'
                      }`}
                    >
                      Non-exclusive
                    </button>
                    <button
                      type="button"
                      onClick={() => onMarketplaceExclusiveChange(true)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-all ${
                        marketplaceExclusive
                          ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
                          : 'border-[#3A3A3A] bg-[#2A2A2A] text-gray-400'
                      }`}
                    >
                      Exclusive
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
