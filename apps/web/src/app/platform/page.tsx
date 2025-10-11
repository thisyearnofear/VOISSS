"use client";

import CrossPlatformSync from "../../components/CrossPlatformSync";

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Our Platform Ecosystem
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Transform how you capture, organize, and share audio content with our comprehensive three-app ecosystem on Starknet.
          </p>
        </div>

        {/* Three-App Ecosystem */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
          <div className="voisss-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-blue-400 text-base sm:text-lg">
                🌐 Web dApp
              </h3>
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-xs font-medium">
                  Live
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              Next.js + Starknet.js for browser-based recording and community features
            </p>
          </div>

          <div className="voisss-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-[#7C5DFA] text-base sm:text-lg">
                🚀 Flutter Native
              </h3>
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-400 text-xs font-medium">
                  Live
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              Native performance with starknet.dart SDK for optimal mobile experience
            </p>
          </div>

          <div className="voisss-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-orange-400 text-base sm:text-lg">
                📱 React Native
              </h3>
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-orange-400 text-xs font-medium">
                  Coming Soon
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              Cross-platform mobile app with Expo and Starknet integration
            </p>
          </div>
        </div>

        {/* Cross-Platform Sync */}
        <div className="mb-8 sm:mb-10">
          <div className="voisss-card max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">
                Cross-Platform Sync
              </h3>
            </div>
            <p className="text-gray-400 text-sm mb-4 text-center">
              Seamlessly sync your recordings between Web and Flutter apps using Starknet blockchain
            </p>
            <CrossPlatformSync />
          </div>
        </div>

        {/* Technical Details */}
        <div className="voisss-card max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Technical Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-[#7C5DFA] mb-3">Blockchain Layer</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Starknet L2 for scalable storage</li>
                <li>• IPFS for decentralized file hosting</li>
                <li>• Smart contracts for metadata</li>
                <li>• Cross-chain compatibility</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#7C5DFA] mb-3">AI Integration</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• ElevenLabs voice transformation</li>
                <li>• Real-time audio processing</li>
                <li>• Multiple voice models</li>
                <li>• Quality preservation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/studio"
              className="px-6 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white font-semibold rounded-xl hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <path d="M12 18v4" />
                <path d="M8 22h8" />
              </svg>
              Try Recording Now
            </a>
            <a
              href="/missions"
              className="px-6 py-3 bg-[#2A2A2A] border border-[#3A3A3A] text-white font-semibold rounded-xl hover:bg-[#3A3A3A] transition-colors"
            >
              Explore Missions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
