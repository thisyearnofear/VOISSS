import React from 'react';

interface SaveMetadata {
  title: string;
  description: string;
  tags: string[];
  isPublic: boolean;
}

interface SaveResult {
  ipfsHash: string;
  txHash: string;
}

interface SaveOptionsProps {
  previewUrl: string | null;
  audioBlob: Blob | null;
  recordingTitle: string;
  remainingQuota: { saves: number };
  userTier: string;
  isDirectSaving: boolean;
  hasSubAccount: boolean;
  setToastType: (type: 'success' | 'error') => void;
  setToastMessage: (message: string | null) => void;
  setRecordingTitle: (title: string) => void;
  handleDownload: () => void;
  handleSaveSelectedVersions: () => Promise<void>;
  saveRecordingWithGas: (blob: Blob, metadata: SaveMetadata) => Promise<SaveResult>;
  formatFileSize: (bytes: number) => string;
}

export default function SaveOptions({
  previewUrl,
  audioBlob,
  recordingTitle,
  remainingQuota,
  userTier,
  isDirectSaving,
  hasSubAccount,
  setToastType,
  setToastMessage,
  setRecordingTitle,
  handleDownload,
  handleSaveSelectedVersions,
  saveRecordingWithGas,
  formatFileSize,
}: SaveOptionsProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4 text-center">
        Save Recording
      </h3>

      {/* Audio Preview */}
      {previewUrl && (
        <div className="mb-6 p-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-white font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 text-[#7C5DFA]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Preview Recording
              </h4>
              <p className="text-gray-400 text-sm">Listen to your recorded audio</p>
            </div>
            {audioBlob && (
              <span className="text-xs text-gray-500">{formatFileSize(audioBlob.size)}</span>
            )}
          </div>
          <audio controls src={previewUrl} className="w-full h-8" />
        </div>
      )}

      {/* Permission Status - will be handled by PermissionStatus component */}

      {/* Recording Title */}
      <div className="mb-6">
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
          onChange={(e) => setRecordingTitle(e.target.value)}
          placeholder="Give your recording a memorable name..."
          className="voisss-input w-full border-purple-500 focus:ring-purple-500 placeholder-gray-400"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="voisss-btn-primary flex-1"
        >
          📥 Download (Free)
        </button>
        <button
          onClick={async () => {
            if (!recordingTitle.trim()) {
              setToastType('error');
              setToastMessage('Please enter a recording title');
              return;
            }

            try {
              // Try gasless Sub Account save first if available, otherwise use direct gas payment
              if (hasSubAccount) {
                await handleSaveSelectedVersions();
              } else {
                // This would need to be updated to handle selected versions
                await saveRecordingWithGas(audioBlob!, {
                  title: recordingTitle,
                  description: '',
                  isPublic: false,
                  tags: [],
                });
              }

              setToastType('success');
              setToastMessage('Transaction submitted! Waiting for confirmation...');
            } catch (error) {
              console.error('Failed to save:', error);
              setToastType('error');
              const errorMessage = error instanceof Error ? error.message : 'Failed to save recording';
              setToastMessage(errorMessage);
            }
          }}
          disabled={isDirectSaving || !recordingTitle.trim()}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isDirectSaving || !recordingTitle.trim()
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : hasSubAccount
              ? userTier === 'premium'
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600'
              : 'bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-500 hover:to-orange-600'
            }`}
        >
          {isDirectSaving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.364-7.364l-2.828 2.828M9.464 9.464L6.636 6.636m12.728 12.728l-2.828-2.828M9.464 14.536l-2.828 2.828" />
              </svg>
              Saving...
            </>
          ) : hasSubAccount ? (
            userTier === 'premium' ?
              `💾 Save Selected (∞ Gasless)` :
              `💾 Save Selected (${remainingQuota.saves} free, gasless)`
          ) : (
            '💾 Save Onchain'
          )}
        </button>
      </div>
      {userTier === 'free' && remainingQuota.saves <= 2 && (
        <p className="text-xs text-yellow-400 text-center mt-2">
          ⚠️ {remainingQuota.saves} free saves remaining this week
        </p>
      )}
    </div>
  );
}