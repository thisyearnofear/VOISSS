import React from 'react';

interface ActionButtonsProps {
  recordingTitle: string;
  isDirectSaving: boolean;
  userTier: string;
  remainingQuota: { saves: number };
  baseRecordingService: any;
  permissionActive: boolean;
  handleDownload: () => void;
  handleSaveSelectedVersions: () => Promise<void>;
  saveRecordingWithGas: (blob: Blob, metadata: any) => Promise<any>;
  audioBlob: Blob | null;
  setToastType: (type: 'success' | 'error') => void;
  setToastMessage: (message: string | null) => void;
}

export default function ActionButtons({
  recordingTitle,
  isDirectSaving,
  userTier,
  remainingQuota,
  baseRecordingService,
  permissionActive,
  handleDownload,
  handleSaveSelectedVersions,
  saveRecordingWithGas,
  audioBlob,
  setToastType,
  setToastMessage,
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
              if (baseRecordingService && permissionActive) {
                await handleSaveSelectedVersions();
              } else {
                await saveRecordingWithGas(audioBlob!, {
                  title: recordingTitle,
                  description: '',
                  isPublic: false,
                  tags: [],
                });
              }

              setToastType('success');
              setToastMessage('Transaction submitted! Waiting for confirmation...');
            } catch (error: any) {
              console.error('Failed to save:', error);
              setToastType('error');
              setToastMessage(error.message || 'Failed to save recording');
            }
          }}
          disabled={isDirectSaving || !hasTitle}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            isDirectSaving || !hasTitle
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : baseRecordingService && permissionActive
              ? userTier === 'premium'
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600'
              : 'bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-500 hover:to-orange-600'
          }`}
        >
          {isDirectSaving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.364-7.364l-2.828 2.828M9.464 9.464L6.636 6.636m12.728 12.728l-2.828-2.828M9.464 14.536l-2.828 2.828"/>
              </svg>
              Saving...
            </>
          ) : baseRecordingService && permissionActive ? (
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
    </>
  );
}