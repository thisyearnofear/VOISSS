import React from 'react';

interface VersionSelectionProps {
  selectedVersions: {
    original: boolean;
    aiVoice: boolean;
    dubbed: boolean;
  };
  audioBlob: Blob | null;
  variantBlobFree: Blob | null;
  dubbedBlob: Blob | null;
  selectedVoiceFree: string;
  dubbedLanguage: string;
  userTier: string;
  remainingQuota: { saves: number };
  onSelectedVersionsChange: (versions: {
    original: boolean;
    aiVoice: boolean;
    dubbed: boolean;
  }) => void;
}

export default function VersionSelection({
  selectedVersions,
  audioBlob,
  variantBlobFree,
  dubbedBlob,
  selectedVoiceFree,
  dubbedLanguage,
  userTier,
  remainingQuota,
  onSelectedVersionsChange,
}: VersionSelectionProps) {
  return (
    <div className="mb-6 p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
      <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-[#7C5DFA]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        Select Versions to Save
      </h4>
      <p className="text-gray-400 text-xs mb-4">
        Choose which versions you want to save to Base/IPFS
      </p>

      <div className="space-y-3">
        {/* Original Version */}
        <label className="flex items-center gap-3 p-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg cursor-pointer hover:border-[#3A3A3A] transition-colors">
          <input
            type="checkbox"
            checked={selectedVersions.original}
            onChange={(e) => onSelectedVersionsChange({ 
              ...selectedVersions, 
              original: e.target.checked 
            })}
            className="w-5 h-5 rounded border-gray-600 text-[#7C5DFA] focus:ring-[#7C5DFA] focus:ring-offset-gray-900"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-white font-medium">Original Recording</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Your original voice recording</p>
          </div>
          {audioBlob && (
            <span className="text-xs text-gray-500">{(audioBlob.size / 1024).toFixed(0)} KB</span>
          )}
        </label>

        {/* AI Voice Version */}
        <label className={`flex items-center gap-3 p-3 bg-[#0F0F0F] border rounded-lg transition-colors ${
          variantBlobFree
            ? 'border-[#2A2A2A] cursor-pointer hover:border-[#3A3A3A]'
            : 'border-[#1A1A1A] opacity-50 cursor-not-allowed'
        }`}>
          <input
            type="checkbox"
            checked={selectedVersions.aiVoice}
            onChange={(e) => onSelectedVersionsChange({ 
              ...selectedVersions, 
              aiVoice: e.target.checked 
            })}
            disabled={!variantBlobFree}
            className="w-5 h-5 rounded border-gray-600 text-[#7C5DFA] focus:ring-[#7C5DFA] focus:ring-offset-gray-900 disabled:opacity-50"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span className="text-white font-medium">AI Voice Transform</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {variantBlobFree ? `AI voice using ${selectedVoiceFree}` : 'Generate AI voice first'}
            </p>
          </div>
          {variantBlobFree && (
            <span className="text-xs text-gray-500">{(variantBlobFree.size / 1024).toFixed(0)} KB</span>
          )}
        </label>

        {/* Dubbed Version */}
        <label className={`flex items-center gap-3 p-3 bg-[#0F0F0F] border rounded-lg transition-colors ${
          dubbedBlob
            ? 'border-[#2A2A2A] cursor-pointer hover:border-[#3A3A3A]'
            : 'border-[#1A1A1A] opacity-50 cursor-not-allowed'
        }`}>
          <input
            type="checkbox"
            checked={selectedVersions.dubbed}
            onChange={(e) => onSelectedVersionsChange({ 
              ...selectedVersions, 
              dubbed: e.target.checked 
            })}
            disabled={!dubbedBlob}
            className="w-5 h-5 rounded border-gray-600 text-[#7C5DFA] focus:ring-[#7C5DFA] focus:ring-offset-gray-900 disabled:opacity-50"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-white font-medium">Dubbed Version</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {dubbedBlob ? `Dubbed in ${dubbedLanguage}` : 'Generate dubbed version first'}
            </p>
          </div>
          {dubbedBlob && (
            <span className="text-xs text-gray-500">{(dubbedBlob.size / 1024).toFixed(0)} KB</span>
          )}
        </label>
      </div>

      {/* Selection Summary */}
      <div className="mt-4 p-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Selected versions:</span>
          <span className="text-white font-medium">
            {Object.values(selectedVersions).filter(Boolean).length} of {[audioBlob, variantBlobFree, dubbedBlob].filter(Boolean).length} available
          </span>
        </div>
        {userTier === 'free' && (
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-[#2A2A2A]">
            <span className="text-gray-400">Will use:</span>
            <span className={`font-medium ${
              Object.values(selectedVersions).filter(Boolean).length > remainingQuota.saves
                ? 'text-red-400'
                : 'text-green-400'
            }`}>
              {Object.values(selectedVersions).filter(Boolean).length} of {remainingQuota.saves} saves remaining
            </span>
          </div>
        )}
      </div>
    </div>
  );
}