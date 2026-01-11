import React, { useState } from 'react';
import { generateRecordingInsights } from '../../app/actions';
import {
  Sparkles,
  Loader2,
  Check,
  Tag,
  MessageSquare,
  FileText,
  Zap,
  Globe
} from 'lucide-react';

interface GeminiInsightsPanelProps {
  audioBlob: Blob | null;
  onApplyInsights: (data: { title: string; summary: string; tags: string[] }) => void;
  isVisible: boolean;
}

interface InsightsData {
  title: string;
  summary: string[];
  tags: string[];
  actionItems: string[]; // These will now be platform captions
}

export default function GeminiInsightsPanel({ audioBlob, onApplyInsights, isVisible }: GeminiInsightsPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isVisible) return null;

  const handleGenerateInsights = async () => {
    if (!audioBlob) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      const result = await generateRecordingInsights(formData);

      if (result.success && result.data) {
        setInsights(result.data);
      } else {
        throw new Error(result.error || 'The AI service is temporarily busy. Please try again in a moment.');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try a different recording.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (insights) {
      onApplyInsights({
        title: insights.title,
        summary: insights.summary.join('\n'), // Join bullet points
        tags: insights.tags
      });
    }
  };

  return (
    <div className="bg-[#111111] rounded-2xl p-6 mb-8 border border-purple-500/20 shadow-[0_0_50px_rgba(124,93,250,0.1)] relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/10 blur-[100px] pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Publishing Strategy
            </h3>
            <p className="text-xs text-gray-500 font-medium">AI-optimized metadata and platform captions</p>
          </div>
        </div>
        {!insights && (
          <button
            onClick={handleGenerateInsights}
            disabled={isLoading || !audioBlob}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Audio...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 group-hover:animate-pulse" />
                Analyze Version
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="text-red-400 text-sm mb-6 bg-red-900/10 border border-red-900/20 p-4 rounded-xl flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      )}

      {insights && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
          {/* Title & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-gray-900/30 p-5 rounded-2xl border border-white/5">
              <h4 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <FileText className="w-3 h-3" /> Suggested Viral Title
              </h4>
              <p className="text-white text-xl font-bold leading-tight">{insights.title}</p>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                {insights.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded-lg border border-purple-500/20">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/30 p-5 rounded-2xl border border-white/5">
              <h4 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                <Globe className="w-3 h-3" /> Summary
              </h4>
              <ul className="space-y-2">
                {insights.summary.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300 text-xs leading-relaxed">
                    <div className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social Captions */}
          <div className="bg-gradient-to-br from-indigo-900/10 to-purple-900/10 p-6 rounded-2xl border border-indigo-500/10">
            <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <MessageSquare className="w-3 h-3" /> Social Platform Captions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.actionItems[0] && (
                <div className="bg-black/20 p-3 rounded-lg border border-white/5 group/caption relative">
                  <span className="absolute top-2 right-2 text-[8px] font-bold text-gray-600 group-hover/caption:text-sky-400 transition-colors">X / FARCASTER</span>
                  <p className="text-gray-300 text-xs italic">"{insights.actionItems[0]}"</p>
                </div>
              )}
              {insights.actionItems[1] && (
                <div className="bg-black/20 p-3 rounded-lg border border-white/5 group/caption relative">
                  <span className="absolute top-2 right-2 text-[8px] font-bold text-gray-600 group-hover/caption:text-pink-400 transition-colors">TIKTOK / REELS</span>
                  <p className="text-gray-300 text-xs italic">"{insights.actionItems[1]}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex justify-between items-center pt-2">
            <p className="text-[10px] text-gray-600 font-medium">Strategy generated based on current audio version.</p>
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 border border-green-500/20"
            >
              <Check className="w-4 h-4" />
              Apply to Metadata
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
