"use client";

import React, { useState } from 'react';
import DubbingPanel from './dubbing/DubbingPanel';

export default function SimpleDubbingDemo() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioBlob(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto voisss-card shadow-2xl p-6">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">
        🌍 Global Dubbing Demo
      </h2>

      {!audioBlob ? (
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            Upload an audio file to try dubbing
          </p>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="voisss-input"
          />
        </div>
      ) : (
        <DubbingPanel
          audioBlob={audioBlob}
          freeDubbingCounter={1}
          onWalletModalOpen={() => setShowWalletModal(true)}
        />
      )}

      {showWalletModal && (
        <div className="mt-4 p-4 bg-blue-900 border border-blue-700 rounded-md">
          <p className="text-blue-200 text-center">
            Wallet modal would open here for premium features
          </p>
          <button
            onClick={() => setShowWalletModal(false)}
            className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}