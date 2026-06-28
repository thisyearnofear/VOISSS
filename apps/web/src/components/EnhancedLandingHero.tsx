"use client";

import React, { useState } from "react";
import { Shield, Zap, TrendingUp, Sparkles, Play } from "lucide-react";
import QuickVoicePreview from "./marketplace/QuickVoicePreview";
import VoissMascot from "./VoissMascot";
import OnboardingQuiz from "./OnboardingQuiz";
import { BuyCreditsButton } from "./payment/BuyCreditsModal";

// Type-safe icon wrappers to resolve React 18/19 compatibility issues
const CompatibleShield = Shield as React.ComponentType<{ className?: string }>;
const CompatibleZap = Zap as React.ComponentType<{ className?: string }>;
const CompatibleTrendingUp = TrendingUp as React.ComponentType<{ className?: string }>;

export default function EnhancedLandingHero() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  if (showOnboarding) {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A]" />
        <div className="relative z-10 voisss-container py-8">
          <button
            onClick={() => setShowOnboarding(false)}
            className="text-sm text-gray-400 hover:text-white mb-4 transition-colors"
          >
            &larr; Back to homepage
          </button>
          <OnboardingQuiz />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A]">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 voisss-container py-16 sm:py-24">
        {/* Main Hero Content */}
        <div className="text-center mb-16">
          {/* Mascot */}
          <div className="flex justify-center mb-6">
            <VoissMascot mood="wave" size="lg" interactive />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-full">
              <CompatibleZap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">
                Production Ready • Base Mainnet • Multi-Chain Payments
              </span>
            </div>
            {/* Google Cloud badge — required for hackathon submission */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M14.52 4.25c1.47.44 2.75 1.32 3.71 2.48l-2.05 1.39c-.54-.72-1.28-1.25-2.12-1.54l.46-2.33zM6.32 9.28c.42-1.11 1.17-2.06 2.15-2.75L8 4.02C6.34 5.05 5.03 6.56 4.25 8.37l2.07.91z" fill="#4285F4"/>
                <path d="M18.52 3.67c-1.28-.58-2.68-.88-4.08-.9L13.98 5.1c.88.03 1.72.2 2.5.54l2.04-1.97z" fill="#34A853"/>
                <path d="M8.72 19.85c-1.56-.52-2.92-1.48-3.9-2.44l1.98-1.38c.67.7 1.5 1.24 2.44 1.63l-.52 2.19z" fill="#FBBC05"/>
                <path d="M18.25 13.97a5.95 5.95 0 01-.94 3.9c-.79 1.19-1.94 2.09-3.3 2.58l-1.05-2.08c.82-.3 1.53-.82 2.05-1.51l3.24-2.89z" fill="#EA4335"/>
                <path d="M20.2 8.37c.28.82.42 1.69.42 2.58 0 .94-.16 1.86-.47 2.73l-3.24-2.86c.15-.43.23-.88.23-1.34 0-.43-.07-.85-.2-1.25l3.26-2.86z" fill="#4285F4"/>
              </svg>
              <span className="text-sm font-medium text-blue-300">
                Powered by Google Cloud
              </span>
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-white">Voice Marketplace</span>
            <br />
            <span className="voisss-gradient-text">for AI Agents</span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
            License authentic human voices for your AI agents. Pay-per-character with blockchain provenance.
          </p>
          <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
            ~$0.000001/character • 70% to contributors • Instant API access • No monthly fees
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            {/* Primary: Try Demo — lowest friction entry point */}
            <a
              href="/demo"
              id="hero-try-demo-btn"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white text-lg font-semibold hover:from-purple-500 hover:to-pink-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center gap-3"
            >
              <Play className="w-5 h-5" />
              Try Free Demo
            </a>
            <a
              href="/marketplace"
              id="hero-browse-voices-btn"
              className="px-8 py-4 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] rounded-xl text-white text-lg font-semibold hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 flex items-center gap-3"
            >
              <CompatibleShield className="w-5 h-5" />
              Browse Voices
            </a>
            <BuyCreditsButton variant="ghost" className="px-8 py-4 text-lg" />
          </div>

          {/* Persona Paths */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm mb-16">
            <a href="/studio" className="text-gray-500 hover:text-purple-400 transition-colors flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
              I create voices
            </a>
            <a href="/import" className="text-gray-500 hover:text-green-400 transition-colors flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Import from ElevenLabs
            </a>
            <a href="/marketplace" className="text-gray-500 hover:text-blue-400 transition-colors flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              I need voices for my agent
            </a>
          </div>

          {/* Instant Synthesis Playground (Time-to-Magic) */}
          <div className="max-w-4xl mx-auto px-4 mb-20">
            <QuickVoicePreview />
          </div>
        </div>

        {/* Feature Highlights - Clean and Focused */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CompatibleShield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Licensed Voices
            </h3>
            <p className="text-gray-400">
              Authentic human voices with legal protection and blockchain provenance
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CompatibleZap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Instant API Access
            </h3>
            <p className="text-gray-400">
              Integrate voices into your AI agent with a single API call via x402 payments
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CompatibleTrendingUp className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              70% Revenue Share
            </h3>
            <p className="text-gray-400">
              Voice contributors earn passive income from every AI agent license
            </p>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-400">
              Production Ready • Live on Base
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            The marketplace where AI agents license authentic human voices — with consent, provenance, and fair compensation
          </p>
        </div>
      </div>
    </div>
  );
}
