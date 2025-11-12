import React from 'react';

interface PermissionStatusProps {
  isConnected: boolean;
  permissionActive: boolean;
  isLoadingPermissions: boolean;
  requestPermission: () => Promise<void>;
  setToastType: (type: 'success' | 'error') => void;
  setToastMessage: (message: string | null) => void;
}

export default function PermissionStatus({
  isConnected,
  permissionActive,
  isLoadingPermissions,
  requestPermission,
  setToastType,
  setToastMessage,
}: PermissionStatusProps) {
  if (isConnected && !permissionActive) {
    return (
      <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-blue-200 font-semibold mb-1">One-Time Setup Required</h4>
            <p className="text-blue-300 text-sm mb-3">
              Grant spend permission once for gasless, popup-free saves forever!
            </p>
            <button
              onClick={async () => {
                try {
                  await requestPermission();
                  setToastType('success');
                  setToastMessage('Spend permission granted! You can now save without popups.');
                } catch (error: any) {
                  setToastType('error');
                  setToastMessage(error.message || 'Failed to grant permission');
                }
              }}
              disabled={isLoadingPermissions}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
            >
              {isLoadingPermissions ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Requesting...
                </div>
              ) : (
                '🔓 Grant Permission (One-Time)'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (permissionActive) {
    return (
      <div className="mb-6 p-3 bg-green-900/30 border border-green-500/30 rounded-xl">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-green-200 text-sm font-medium">
            ✨ Gasless saves enabled! No more wallet popups.
          </p>
        </div>
      </div>
    );
  }

  return null;
}