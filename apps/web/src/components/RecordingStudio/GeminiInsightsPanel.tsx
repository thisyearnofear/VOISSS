import React, { useState } from 'react';
import { generateRecordingInsights } from '../../app/actions';
import { Sparkles, Loader2, Check, Tag, ListTodo, FileText } from 'lucide-react';

interface GeminiInsightsPanelProps {
  audioBlob: Blob | null;
  onApplyInsights: (data: { title: string; summary: string; tags: string[] }) => void;
  isVisible: boolean;
}

interface InsightsData {
  title: string;
  summary: string[];
  tags: string[];
  actionItems: string[];
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
        throw new Error(result.error || 'Failed to generate insights');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to analyze audio. Please try again.');
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
    <div className="bg-gray-800/50 rounded-lg p-6 mb-6 border border-purple-500/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">
            Gemini AI Insights
          </h3>
        </div>
        {!insights && (
          <button
            onClick={handleGenerateInsights}
            disabled={isLoading || !audioBlob}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze Recording
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="text-red-400 text-sm mb-4 bg-red-900/20 p-3 rounded">
          {error}
        </div>
      )}

      {insights && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Title */}
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h4 className="text-gray-400 text-sm font-medium mb-1">Suggested Title</h4>
            <p className="text-white text-lg font-medium">{insights.title}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Summary */}
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h4 className="text-gray-400 text-sm font-medium">Summary</h4>
              </div>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                {insights.summary.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>

            {/* Action Items */}
            {insights.actionItems && insights.actionItems.length > 0 && (
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <ListTodo className="w-4 h-4 text-green-400" />
                  <h4 className="text-gray-400 text-sm font-medium">Action Items</h4>
                </div>
                <ul className="space-y-1 text-gray-300 text-sm">
                  {insights.actionItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 text-gray-400 text-sm mr-2">
              <Tag className="w-4 h-4" />
              <span>Tags:</span>
            </div>
            {insights.tags.map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-purple-900/30 text-purple-300 text-xs rounded-full border border-purple-500/30">
                #{tag}
              </span>
            ))}
          </div>

          {/* Apply Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              Apply Insights
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
