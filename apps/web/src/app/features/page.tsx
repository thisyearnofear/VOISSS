"use client";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Features & Capabilities
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Discover the powerful features that make VOISSS the ultimate decentralized voice recording platform.
          </p>
        </div>

        {/* Core Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="voisss-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                  <path d="M12 18v4" />
                  <path d="M8 22h8" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">High-Quality Recording</h3>
            </div>
            <ul className="space-y-2 text-gray-300">
              <li>• 44.1kHz sample rate audio capture</li>
              <li>• Real-time waveform visualization</li>
              <li>• Noise suppression & echo cancellation</li>
              <li>• Pause/resume functionality</li>
            </ul>
          </div>

          <div className="voisss-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">AI Voice Transformation</h3>
            </div>
            <ul className="space-y-2 text-gray-300">
              <li>• ElevenLabs voice cloning technology</li>
              <li>• Multiple voice styles & personalities</li>
              <li>• Real-time preview capabilities</li>
              <li>• Quality preservation algorithms</li>
            </ul>
          </div>

          <div className="voisss-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Multi-Language Dubbing</h3>
            </div>
            <ul className="space-y-2 text-gray-300">
              <li>• 29+ supported languages</li>
              <li>• Auto source language detection</li>
              <li>• Native accent preservation</li>
              <li>• Real-time audio comparison</li>
            </ul>
          </div>

          <div className="voisss-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Decentralized Storage</h3>
            </div>
            <ul className="space-y-2 text-gray-300">
              <li>• IPFS permanent file storage</li>
              <li>• Starknet blockchain metadata</li>
              <li>• Immutable recording history</li>
              <li>• Censorship-resistant access</li>
            </ul>
          </div>

          <div className="voisss-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">SocialFi Missions</h3>
            </div>
            <ul className="space-y-2 text-gray-300">
              <li>• Earn STRK tokens for recordings</li>
              <li>• Topic-based mission system</li>
              <li>• Community-driven content</li>
              <li>• Reputation & rewards tracking</li>
            </ul>
          </div>
        </div>

        {/* Freemium vs Premium */}
        <div className="voisss-card mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Freemium vs Premium</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Free Experience
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>✅ High-quality recording</li>
                <li>✅ 1 free AI voice transformation</li>
                <li>✅ 1 free dubbing per session</li>
                <li>✅ 3 voice options</li>
                <li>✅ Preview AI variants</li>
                <li>✅ Download original recordings</li>
                <li>❌ Save AI variants</li>
                <li>❌ Unlimited transformations</li>
                <li>❌ Full voice library</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#7C5DFA] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Premium (Wallet Connected)
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>✅ Everything in Free</li>
                <li>✅ Unlimited AI transformations</li>
                <li>✅ Unlimited dubbing</li>
                <li>✅ Full voice library access</li>
                <li>✅ Save AI variants to IPFS</li>
                <li>✅ Starknet blockchain storage</li>
                <li>✅ SocialFi mission rewards</li>
                <li>✅ Cross-platform sync</li>
                <li>✅ Advanced voice controls</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="voisss-card mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Technical Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-[#7C5DFA] mb-3">Audio Quality</h3>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Sample Rate: 44.1kHz</li>
                <li>• Format: WebM/Opus</li>
                <li>• Bitrate: Variable</li>
                <li>• Channels: Mono/Stereo</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#7C5DFA] mb-3">Blockchain</h3>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Network: Starknet L2</li>
                <li>• Storage: IPFS</li>
                <li>• Contracts: Cairo</li>
                <li>• Wallets: ArgentX, Braavos</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#7C5DFA] mb-3">AI Processing</h3>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Provider: ElevenLabs</li>
                <li>• Models: Multiple</li>
                <li>• Latency: ~5-10s</li>
                <li>• Quality: High-fidelity</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-6 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white font-semibold rounded-xl hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <path d="M12 18v4" />
                <path d="M8 22h8" />
              </svg>
              Start Recording
            </a>
            <a
              href="/platform"
              className="px-6 py-3 bg-[#2A2A2A] border border-[#3A3A3A] text-white font-semibold rounded-xl hover:bg-[#3A3A3A] transition-colors"
            >
              View Platform
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
