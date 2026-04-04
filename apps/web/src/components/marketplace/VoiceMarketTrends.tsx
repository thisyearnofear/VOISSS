"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, Globe, Briefcase, Info, RefreshCw, BarChart3, Tag } from "lucide-react";
import { MarketTrendResult, MarketTrend } from "@/lib/ai-inference";

export function VoiceMarketTrends() {
  const [trends, setTrends] = useState<MarketTrendResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrends = async (force = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`/api/marketplace/trends${force ? "?refresh=true" : ""}`);
      const data = await response.json();

      if (data.success) {
        setTrends(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch market trends:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-8 mb-8 animate-pulse">
        <div className="h-6 w-48 bg-[#2A2A2A] rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!trends) return null;

  return (
    <div className="bg-[#0D0D0D] border border-[#222222] rounded-2xl p-8 mb-10 relative overflow-hidden group">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[100px] pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Market Intelligence</h2>
          </div>
          <p className="text-gray-400 text-sm max-w-xl">
            Real-time "In-Demand" data scraped from global job boards. Adjust your voice profile to match current trends.
          </p>
        </div>
        <button
          onClick={() => fetchTrends(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A] rounded-xl text-xs font-bold text-gray-300 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Intelligence"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Left: Primary Trends */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Trending Vocal Styles</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trends.trends.map((trend, idx) => (
              <div 
                key={idx} 
                className="p-5 bg-[#151515] border border-white/[0.03] rounded-2xl hover:border-cyan-500/30 transition-all group/card"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-white group-hover/card:text-cyan-400 transition-colors">
                    {trend.title}
                  </h3>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    trend.demandLevel === 'High' ? 'bg-red-500/10 text-red-400' : 
                    trend.demandLevel === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 
                    'bg-blue-500/10 text-blue-400'
                  }`}>
                    {trend.demandLevel} Demand
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  {trend.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {trend.topTags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-white/[0.03] border border-white/[0.05] rounded-md text-[9px] text-gray-400 font-medium">
                      #{tag}
                    </span>
                  ))}
                  <span className="ml-auto text-[10px] font-black text-emerald-400">
                    {trend.growth}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick Stats */}
        <div className="lg:col-span-4 space-y-6">
          {/* Summary Box */}
          <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-purple-600/10 border border-white/[0.05] rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Market Insight</span>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed italic">
              "{trends.summary}"
            </p>
          </div>

          {/* Languages & Categories */}
          <div className="space-y-4">
            <div className="p-5 bg-[#151515] border border-white/[0.03] rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">High-Demand Languages</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trends.topLanguages.map(lang => (
                  <span key={lang} className="px-3 py-1.5 bg-[#1A1A1A] border border-white/[0.05] rounded-lg text-xs text-gray-300 font-medium">
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-5 bg-[#151515] border border-white/[0.03] rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Top Categories</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trends.topCategories.map(cat => (
                  <span key={cat} className="px-3 py-1.5 bg-[#1A1A1A] border border-white/[0.05] rounded-lg text-xs text-gray-300 font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-8 pt-6 border-t border-white/[0.03] flex items-center justify-between opacity-50">
        <div className="flex items-center gap-2">
          <Tag className="w-3 h-3 text-cyan-400" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Powered by Firecrawl + Gemini AI</span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Analysis updated {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
