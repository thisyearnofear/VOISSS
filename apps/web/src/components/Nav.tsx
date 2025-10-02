"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "@starknet-react/core";
import WalletModal from "./WalletModal";

export default function Nav() {
  const { isConnected } = useAccount();
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  return (
    <nav className="border-b border-[#2A2A2A] bg-[#0A0A0A]/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="voisss-container">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="font-bold text-2xl voisss-gradient-text hover:opacity-80 transition-opacity">
            VOISSS
          </Link>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-6">
              <Link 
                href="/platform" 
                className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                Platform
              </Link>
              <Link 
                href="/features" 
                className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                Features
              </Link>
              <Link 
                href="/missions" 
                className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                Missions
              </Link>
              <Link 
                href="/help" 
                className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                Help
              </Link>
            </div>
            
            {!isConnected && (
              <div className="flex items-center gap-3">
                <Link 
                  href="/#recording-section" 
                  className="px-3 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                >
                  Try Free
                </Link>
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] rounded-lg text-white text-sm font-medium hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Connect
                </button>
              </div>
            )}
            
            {isConnected && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-xs font-medium">Connected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        title="Connect Your Starknet Wallet"
        subtitle="Unlock unlimited AI transformations and decentralized storage"
      />
    </nav>
  );
}
