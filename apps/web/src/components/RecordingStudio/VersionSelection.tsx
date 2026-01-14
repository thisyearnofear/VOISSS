import React, { useState } from 'react';
import { AudioVersion } from '@voisss/shared';
import { ChevronRight, Trash2, Zap } from 'lucide-react';
import VersionComparison from './VersionComparison';

interface VersionSelectionProps {
  versions: AudioVersion[];
  selectedVersionIds: Set<string>;
  userTier: string;
  remainingQuota: { saves: number };
  onSelectedVersionIdsChange: (updater: (prev: Set<string>) => Set<string>) => void;
  onSelectForForge: (versionId: string) => void;
  onDeleteVersion: (versionId: string) => void;
}

export default function VersionSelection({
  versions,
  selectedVersionIds,
  userTier,
  remainingQuota,
  onSelectedVersionIdsChange,
  onSelectForForge,
  onDeleteVersion,
}: VersionSelectionProps) {
  const [showComparison, setShowComparison] = useState(false);

  const toggleVersionSelection = (versionId: string) => {
    onSelectedVersionIdsChange((prev) => {
      const updated = new Set(prev);
      if (updated.has(versionId)) {
        updated.delete(versionId);
      } else {
        updated.add(versionId);
      }
      return updated;
    });
  };

  const getVersionIcon = (source: string): string => {
    if (source === 'original') return '🎙️';
    if (source.startsWith('aiVoice-')) return '✨';
    if (source.startsWith('dub-')) return '🌍';
    return '🔗';
  };

  const getVersionTypeColor = (source: string): string => {
    if (source === 'original') return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
    if (source.startsWith('aiVoice-')) return 'bg-purple-500/20 border-purple-500/30 text-purple-300';
    if (source.startsWith('dub-')) return 'bg-green-500/20 border-green-500/30 text-green-300';
    return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
  };

  const getParentVersion = (versionId: string): AudioVersion | undefined => {
    const version = versions.find(v => v.id === versionId);
    if (!version?.parentVersionId) return undefined;
    return versions.find(v => v.id === version.parentVersionId);
  };

  return (
    <div className="mb-6 p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-white font-semibold mb-1 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#7C5DFA]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            Audio Versions ({versions.length})
          </h4>
          <p className="text-gray-400 text-xs">Select versions to save to Base/IPFS</p>
        </div>
        {userTier === 'free' && (
          <div className="text-right text-xs">
            <span className={selectedVersionIds.size > remainingQuota.saves ? 'text-red-400' : 'text-green-400'}>
              {selectedVersionIds.size} of {remainingQuota.saves} saves
            </span>
          </div>
        )}
      </div>

      {/* Version List */}
      <div className="space-y-2 max-h-96 overflow-y-auto lg:max-h-full">
        {versions.map((version) => {
          const isSelected = selectedVersionIds.has(version.id);
          const parent = getParentVersion(version.id);
          const canDelete = version.id !== 'v0'; // Can't delete original

          return (
            <div
              key={version.id}
              className={`p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-[#2A2A2A] border-[#3A3A3A]'
                  : 'bg-[#0F0F0F] border-[#1A1A1A]'
              }`}
            >
              {/* Header Row - Stack on mobile */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleVersionSelection(version.id)}
                  className="w-5 h-5 rounded border-gray-600 text-[#7C5DFA] focus:ring-[#7C5DFA] focus:ring-offset-gray-900"
                />

                {/* Version Info - Mobile responsive */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap animate-in fade-in slide-in-from-left-4 duration-300">
                    <span className="text-lg">{getVersionIcon(version.source)}</span>
                    <span className="text-white font-medium truncate">{version.label}</span>
                    <span className={`text-xs px-2 py-1 rounded border hidden sm:inline-block ${getVersionTypeColor(version.source)}`}>
                      {version.source === 'original' ? 'Original' : 
                       version.source.startsWith('aiVoice-') ? 'Voice Transform' :
                       version.source.startsWith('dub-') ? 'Dubbed' : 'Chain'}
                    </span>
                  </div>

                  {/* Metadata - responsive layout */}
                  <div className="text-xs text-gray-400 mt-1 flex gap-3 flex-wrap sm:gap-4">
                    <span>{(version.metadata.duration || 0).toFixed(1)}s</span>
                    <span className="hidden sm:inline">{(version.metadata.size / 1024).toFixed(0)} KB</span>
                    {version.metadata.language && <span>🌍 {version.metadata.language}</span>}
                    {version.metadata.voiceName && <span>✨ {version.metadata.voiceName}</span>}
                  </div>

                  {/* Parent Link */}
                  {parent && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <span>from:</span>
                      <span>{getVersionIcon(parent.source)} {parent.label}</span>
                    </div>
                  )}

                  {/* Transformation Chain with Progress */}
                  {version.metadata.transformChain.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>Chain:</span>
                        {version.metadata.transformChain.map((step, idx) => (
                          <React.Fragment key={idx}>
                            <span className="px-2 py-0.5 bg-[#2A2A2A] rounded-full text-[10px]">
                              {step}
                            </span>
                            {idx < version.metadata.transformChain.length - 1 && (
                              <span>→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons - responsive */}
                <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto mt-2 sm:mt-0">
                  <button
                    onClick={() => onSelectForForge(version.id)}
                    className="flex-1 sm:flex-none px-3 py-1.5 rounded bg-[#2A2A2A] hover:bg-[#3A3A3A] text-xs text-white transition-colors flex items-center justify-center sm:justify-start gap-1"
                    title="Open in Studio Forge"
                  >
                    <span className="hidden sm:inline">Forge</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  {canDelete && (
                    <button
                      onClick={() => onDeleteVersion(version.id)}
                      className="p-1.5 rounded hover:bg-red-900/20 text-red-400 transition-colors"
                      title="Delete version and descendants"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection Summary */}
      {versions.length > 0 && (
        <div className="p-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-sm space-y-1">
          <div className="flex justify-between text-gray-400">
            <span>Selected for saving:</span>
            <span className="text-white font-medium">{selectedVersionIds.size} of {versions.length}</span>
          </div>
          {userTier === 'free' && selectedVersionIds.size > remainingQuota.saves && (
            <div className="text-red-400 text-xs">
              ⚠️ Exceeds remaining saves ({remainingQuota.saves}). Upgrade to save more versions.
            </div>
          )}
        </div>
      )}

      {versions.length === 0 && (
        <div className="p-4 text-center text-gray-500 text-sm">
          Record and transform audio to create versions
        </div>
      )}

      {/* Compare Button */}
      {versions.length >= 2 && (
        <button
          onClick={() => setShowComparison(true)}
          className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] rounded-lg text-white text-sm font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Compare Versions (A/B)
        </button>
      )}

      {/* Comparison Modal */}
      {showComparison && (
        <VersionComparison
          versions={versions}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
