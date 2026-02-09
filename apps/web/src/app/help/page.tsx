"use client";

import { useCallback } from 'react';
import { Sparkles, MessageCircle, Mic, Zap } from 'lucide-react';
import { useAssistant } from '../../contexts/AssistantContext';

const QUICK_QUESTIONS = [
  { question: "How do I transform my voice?", icon: "🎭", action: "transform" },
  { question: "What languages can I dub to?", icon: "🌍", action: "dub" },
  { question: "How does blockchain storage work?", icon: "⛓️", action: "storage" },
  { question: "What are AI insights?", icon: "✨", action: "insights" },
  { question: "How do I create a transcript video?", icon: "📝", action: "transcript" },
  { question: "Is VOISSS free to use?", icon: "💰", action: "pricing" },
];

export default function HelpPage() {
  const { openWithQuestion } = useAssistant();

  // Handle actions from assistant (for future deep integration)
  const handleAction = useCallback((action: string) => {
    // Navigate to relevant pages based on action
    switch (action) {
      case 'studio':
        window.location.href = '/studio';
        break;
      case 'transcript':
        window.location.href = '/studio?mode=transcript';
        break;
      case 'features':
        window.location.href = '/features';
        break;
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-8 sm:py-12">
        {/* Header with Voice Assistant CTA */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Powered by Gemini AI + ElevenLabs</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Voice-Powered Help
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-6">
            Ask questions using your voice or text. Get instant, intelligent answers.
          </p>

          {/* Primary CTA - Talk to Assistant */}
          <button
            onClick={() => openWithQuestion("Hello, what can you help me with?")}
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className="relative">
              <Mic className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
            <span>Talk to VOISSS Assistant</span>
            <MessageCircle className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* Quick Questions Grid - Now functional! */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-2 text-center">Quick Questions</h2>
          <p className="text-gray-400 text-sm text-center mb-6">
            Click any question to get an instant answer
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {QUICK_QUESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => openWithQuestion(item.question)}
                className="flex items-center gap-3 p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl hover:border-purple-500/50 hover:bg-[#222] transition-all duration-200 text-left group"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                  {item.question}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action-first - Studio Links */}
        <div className="voisss-card max-w-3xl mx-auto mb-10">
          <div className="flex items-center gap-2 mb-2 justify-center">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Try It Yourself</h2>
          </div>
          <p className="text-gray-300 text-sm text-center mb-4">
            The fastest way to learn is by doing. Jump into the Studio and experiment!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/studio" className="voisss-btn-primary text-center">
              Open Studio
            </a>
            <a
              href="/studio?mode=transcript"
              className="px-4 py-2 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-sm hover:bg-[#3A3A3A] text-center"
            >
              Transcript Composer
            </a>
            <a
              href="/agents"
              className="px-4 py-2 rounded-lg bg-[#2A2A2A] border border-[#3A3A3A] text-white text-sm hover:bg-[#3A3A3A] text-center"
            >
              Discover Agents
            </a>
          </div>
        </div>

        {/* Support Channels - Simplified */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <a
            href="mailto:support@voisss.netlify.app"
            className="voisss-card text-center hover:border-blue-500/50 transition-colors group"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/30 transition-colors">
              <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-1">Email</h3>
            <p className="text-gray-400 text-sm">support@voisss.netlify.app</p>
          </a>

          <a
            href="https://discord.gg/voisss"
            target="_blank"
            rel="noopener noreferrer"
            className="voisss-card text-center hover:border-purple-500/50 transition-colors group"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-500/30 transition-colors">
              <div className="text-purple-300 font-bold">D</div>
            </div>
            <h3 className="font-semibold text-white mb-1">Discord</h3>
            <p className="text-gray-400 text-sm">Community help</p>
          </a>

          <a
            href="https://twitter.com/voisss_app"
            target="_blank"
            rel="noopener noreferrer"
            className="voisss-card text-center hover:border-blue-400/50 transition-colors group"
          >
            <div className="w-12 h-12 bg-blue-400/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-400/30 transition-colors">
              <div className="text-blue-300 font-bold">X</div>
            </div>
            <h3 className="font-semibold text-white mb-1">X</h3>
            <p className="text-gray-400 text-sm">Updates & support</p>
          </a>
        </div>

        {/* Hackathon Badge */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/20 rounded-lg text-gray-400 text-xs">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Built for AI Partner Catalyst Hackathon</span>
            <span className="text-gray-600">•</span>
            <span>Google Cloud + ElevenLabs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
