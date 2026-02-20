import React from 'react';

interface SaveMetadata {
  title: string;
  description: string;
  tags: string[];
  isPublic: boolean;
}

interface SaveResult {
  ipfsHash: string;
  txHash?: string;
}

interface ActionButtonsProps {
  recordingTitle: string;
  isDirectSaving: boolean;
  userTier: string;
  remainingQuota: { saves: number };
  hasSubAccount: boolean;
  handleDownload: () => void;
  handleSaveSelectedVersions: () => Promise<void>;
  saveRecordingWithGas: (blob: Blob, metadata: SaveMetadata) => Promise<SaveResult>;
  audioBlob: Blob | null;
  setToastType: (type: 'success' | 'error') => void;
  setToastMessage: (message: string | null) => void;
  activeMode: string;
}

export default function ActionButtons({
  recordingTitle,
  isDirectSaving,
  userTier,
  remainingQuota,
  hasSubAccount,
  handleDownload,
  handleSaveSelectedVersions,
  saveRecordingWithGas,
  audioBlob,
  setToastType,
  setToastMessage,
  activeMode,
}: ActionButtonsProps) {
  const hasTitle = recordingTitle.trim().length > 0;

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="voisss-btn-primary flex-1"
        >
          📥 Download (Free)
        </button>
        <button
          onClick={async () => {
            if (!hasTitle) {
              setToastType('error');
              setToastMessage('Please enter a recording title');
              return;
            }

            try {
               // Now we always use handleSaveSelectedVersions as it handles the logic for both gasless and gas
               await handleSaveSelectedVersions();
               setToastType('success');
               setToastMessage('Transaction submitted! Waiting for confirmation...');
             } catch (error) {
               console.error('Failed to save:', error);
               setToastType('error');
               const errorMessage = error instanceof Error ? error.message : 'Failed to save recording';
               setToastMessage(errorMessage);
             }
          }}
          disabled={isDirectSaving || !hasTitle}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isDirectSaving || !hasTitle
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
            activeMode === 'ghost' ?
              `👤 Ghost Save (Anonymous)` :
              userTier === 'premium' ?
                `💾 Save Selected (∞ Gasless)` :
                `💾 Save Selected (${remainingQuota.saves} free, gasless)`
          ) : (
            '💾 Save Onchain (Self-Funded)'
          )}
        </button>
      </div>
      {userTier === 'free' && remainingQuota.saves <= 2 && activeMode !== 'ghost' && (
        <p className="text-xs text-yellow-500/80 text-center mt-3 font-medium">
          ⚠️ {remainingQuota.saves} free saves remaining this week
        </p>
      )}

      {activeMode === 'ghost' && (
        <div className="mt-4 p-3 bg-gray-900/40 border border-gray-800 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-500">
          <div className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] text-gray-400">i</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-tight">
            <span className="text-gray-200 font-bold block mb-0.5">Ghost Mode Privacy Notice</span>
            This recording will be relayed anonymously via Sub Account.
          </p>
        </div>
      )}
    </>
  );
}