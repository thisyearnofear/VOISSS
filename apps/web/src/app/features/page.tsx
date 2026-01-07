"use client";

import { DEFAULT_VOISSS_TEMPLATES, type TranscriptTemplate } from '@voisss/shared/types/transcript';
import { VoisssKaraokeLine } from '../../components/RecordingStudio/voisss-karaoke';

function aspectLabel(aspect: TranscriptTemplate['aspect']) {
  return aspect === 'portrait' ? '9:16' : aspect === 'square' ? '1:1' : '16:9';
}

function TemplatePreview({ template }: { template: TranscriptTemplate }) {
  // 6 words for a concise preview
  const words = ["Transform", "your", "voice", "with", "AI", "Pulse"].map((w, i) => ({
    word: w,
    startMs: i * 400,
    endMs: (i + 1) * 400,
  }));

  return (
    <div
      className="h-full w-full flex items-center justify-center p-4 overflow-hidden relative select-none pointer-events-none"
      style={{
        background: template.background.type === 'gradient'
          ? `linear-gradient(135deg, ${template.background.colors.join(', ')})`
          : (template.background.colors[0] || '#0A0A0A'),
      }}
    >
      <div
        style={{
          fontFamily: template.typography.fontFamily,
          fontSize: template.typography.fontSizePx * 0.45, // Scaled down for card
          fontWeight: template.typography.fontWeight,
          lineHeight: template.typography.lineHeight,
          textAlign: 'center',
          maxWidth: '90%'
        }}
      >
        <VoisssKaraokeLine
          words={words}
          activeWordIndex={2} // "voice"
          activeFill={0.7}
          highlightColor={template.typography.highlightColor}
          mutedColor={template.typography.mutedColor}
          pastColor={template.typography.mutedColor}
        />
      </div>

      {/* Subtle overlay to make it look like a video frame */}
      <div className="absolute inset-x-4 bottom-3 flex items-center justify-between opacity-40">
        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        <div className="text-[8px] font-mono text-white/60">00:04</div>
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Features</h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            VOISSS is action-first. Choose a utility and ship a shareable output.
          </p>
        </div>

        {/* Primary CTAs */}
        <div className="voisss-card max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Make a shareable transcript</h2>
          <p className="text-gray-300 text-sm text-center mb-6">
            Record audio, generate a word-timed transcript, and export for socials.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/studio?mode=transcript" className="voisss-btn-primary text-center">
              Open Transcript Composer
            </a>
            <a
              href="/studio"
              className="px-4 py-2 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-sm hover:bg-[#3A3A3A] text-center"
            >
              Open Studio
            </a>
            <a
              href="/missions"
              className="px-4 py-2 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-sm hover:bg-[#3A3A3A] text-center"
            >
              Explore Missions
            </a>
          </div>
        </div>

        {/* Transcript Template Gallery */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Transcript Templates</h2>
          <p className="text-gray-300 text-sm text-center mb-6">
            Pick a VOISSS template and jump straight into Studio with it preselected.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEFAULT_VOISSS_TEMPLATES.map((t: TranscriptTemplate) => (
              <a
                key={t.id}
                href={`/studio?mode=transcript&templateId=${encodeURIComponent(t.id)}`}
                className="voisss-card hover:border-[#7C5DFA]/40 transition-colors"
              >
                <div
                  className="rounded-xl border border-white/5 overflow-hidden mb-3"
                  style={{ height: 140 }}
                >
                  <TemplatePreview template={t} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">{t.name}</div>
                    <div className="text-xs text-gray-400">
                      {aspectLabel(t.aspect)} • {t.highlightMode} highlight
                    </div>
                  </div>
                  <div className="text-xs px-2 py-1 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-gray-200">
                    Use
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Utilities */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Utilities</h2>
          <p className="text-gray-300 text-sm text-center mb-6">Pick an action and ship an output.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/studio" className="voisss-card hover:border-[#7C5DFA]/40 transition-colors">
              <div className="text-white font-semibold mb-1">Record</div>
              <div className="text-xs text-gray-400 mb-3">High quality voice capture with preview.</div>
              <div className="text-xs px-2 py-1 inline-block rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-gray-200">
                Go
              </div>
            </a>

            <a href="/studio" className="voisss-card hover:border-[#7C5DFA]/40 transition-colors">
              <div className="text-white font-semibold mb-1">AI Voice Transform</div>
              <div className="text-xs text-gray-400 mb-3">Transform voices (ElevenLabs powered).</div>
              <div className="text-xs px-2 py-1 inline-block rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-gray-200">
                Go
              </div>
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/studio"
              className="px-6 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white font-semibold rounded-xl hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-200"
            >
              Start in Studio
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
