"use client";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Help</h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Fastest path to a fix is always an action: reproduce in Studio.
          </p>
        </div>

        {/* Action-first */}
        <div className="voisss-card max-w-3xl mx-auto mb-10">
          <h2 className="text-xl font-bold text-white mb-2 text-center">Start here</h2>
          <p className="text-gray-300 text-sm text-center mb-4">
            Open Studio, record a short clip, and use the Transcript Composer to confirm permissions, playback, and export.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/studio" className="voisss-btn-primary text-center">Open Studio</a>
            <a
              href="/studio?mode=transcript"
              className="px-4 py-2 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-sm hover:bg-[#3A3A3A] text-center"
            >
              Open Transcript Composer
            </a>
          </div>
        </div>

        {/* Top fixes (utility-first) */}
        <div className="max-w-4xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Top fixes</h2>
          <p className="text-gray-300 text-sm text-center mb-6">Common issues and the fastest resolution steps.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="voisss-card">
              <div className="text-white font-semibold mb-1">Microphone not working</div>
              <div className="text-sm text-gray-300">
                Ensure browser microphone permission is enabled, refresh, and try again in Studio.
              </div>
            </div>
            <div className="voisss-card">
              <div className="text-white font-semibold mb-1">No audio on playback</div>
              <div className="text-sm text-gray-300">
                Check system output device, unmute the tab, and verify the preview player in Studio.
              </div>
            </div>
            <div className="voisss-card">
              <div className="text-white font-semibold mb-1">AI transform/dub failed</div>
              <div className="text-sm text-gray-300">
                Try a shorter clip, ensure stable network, and retry. If it persists, use the support links below.
              </div>
            </div>
            <div className="voisss-card">
              <div className="text-white font-semibold mb-1">Transcript timing looks off</div>
              <div className="text-sm text-gray-300">
                Use “Transcribe audio (accurate)” for word-level timestamps and avoid editing words heavily afterward.
              </div>
            </div>
          </div>
        </div>

        {/* Support Channels (kept) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="mailto:support@voisss.com"
            className="voisss-card text-center hover:border-blue-500/50 transition-colors"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Email</h3>
            <p className="text-gray-400 text-sm">support@voisss.com</p>
          </a>

          <a
            href="https://discord.gg/voisss"
            target="_blank"
            rel="noopener noreferrer"
            className="voisss-card text-center hover:border-purple-500/50 transition-colors"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="text-purple-300 font-bold">D</div>
            </div>
            <h3 className="font-semibold text-white mb-2">Discord</h3>
            <p className="text-gray-400 text-sm">Community help</p>
          </a>

          <a
            href="https://twitter.com/voisss_app"
            target="_blank"
            rel="noopener noreferrer"
            className="voisss-card text-center hover:border-blue-400/50 transition-colors"
          >
            <div className="w-12 h-12 bg-blue-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="text-blue-300 font-bold">X</div>
            </div>
            <h3 className="font-semibold text-white mb-2">X</h3>
            <p className="text-gray-400 text-sm">Updates & support</p>
          </a>
        </div>
      </div>
    </div>
  );
}
