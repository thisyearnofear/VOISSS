"use client";

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Platform
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            VOISSS is action-first. The web app is the fastest path from voice → shareable output.
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
              Next.js + Base for browser-based recording and community features
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
              Native performance with Base integration for optimal mobile experience
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
              Cross-platform mobile app with Expo and Base integration
            </p>
          </div>
        </div>

        {/* Utility hub */}
        <div className="mb-8 sm:mb-10">
          <div className="voisss-card max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Utilities</h2>
            <p className="text-gray-300 text-sm text-center mb-6">
              Jump to the actions that produce shareable outputs.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a href="/studio" className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white font-semibold text-center">
                Open Studio
              </a>
              <a href="/features" className="px-4 py-3 rounded-xl bg-[#2A2A2A] border border-[#3A3A3A] text-white font-semibold text-center hover:bg-[#3A3A3A]">
                Choose transcript template
              </a>
              <a href="/missions" className="px-4 py-3 rounded-xl bg-[#2A2A2A] border border-[#3A3A3A] text-white font-semibold text-center hover:bg-[#3A3A3A]">
                Explore missions
              </a>
              <a href="/farcaster-miniapp/player" className="px-4 py-3 rounded-xl bg-[#2A2A2A] border border-[#3A3A3A] text-white font-semibold text-center hover:bg-[#3A3A3A]">
                Open player
              </a>
            </div>
          </div>
        </div>

        {/* Minimal technical details (kept concise to prevent bloat) */}
        <div className="voisss-card max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Under the hood</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-[#7C5DFA] mb-2">Storage</h3>
              <p className="text-gray-300 text-sm">
                Recordings are stored on IPFS with metadata anchored on Base.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#7C5DFA] mb-2">AI</h3>
              <p className="text-gray-300 text-sm">
                Voice transformation and dubbing are powered by ElevenLabs; transcripts can be generated with word-level timestamps.
              </p>
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
