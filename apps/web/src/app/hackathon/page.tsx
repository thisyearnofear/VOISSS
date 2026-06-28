"use client";

import React from "react";
import {
  Award,
  Bot,
  Database,
  Globe,
  Shield,
  TrendingUp,
  Mic,
  Code2,
  ExternalLink,
  CheckCircle,
  Zap,
  Users,
  DollarSign,
} from "lucide-react";

const AI_SYSTEMS = [
  {
    icon: Bot,
    label: "Autonomous Job Discovery",
    description:
      "ACP Listener scans Virtuals Protocol marketplace for voice/narration jobs, scores them 0–100, and auto-bids. No human reviews bids.",
    color: "purple",
    code: "packages/shared/src/services/acp-listener-service.ts",
  },
  {
    icon: Database,
    label: "Content Analysis (Gemini)",
    description:
      "Google Gemini 3.0 Flash analyzes voice recordings for quality, emotional tone, and humanity verification. Powers AI butler with decentralized memory.",
    color: "blue",
    code: "Google Gemini — GEMINI_API_KEY",
  },
  {
    icon: Mic,
    label: "Voice Generation",
    description:
      "ElevenLabs synthesis with licensed voice library. Generates studio-quality audio in milliseconds. Multi-language support via Gemini translation.",
    color: "pink",
    code: "apps/web/src/app/api/agents/vocalize/route.ts",
  },
  {
    icon: Shield,
    label: "Payment Routing",
    description:
      "x402 protocol + smart contracts. Automatically selects cheapest payment method (credits, tier, x402, or OWS multi-chain) and routes revenue.",
    color: "green",
    code: "packages/shared/src/lib/payment-router.ts",
  },
  {
    icon: TrendingUp,
    label: "Revenue Distribution",
    description:
      "Solidity smart contracts on Base Mainnet enforce 70/30 split. No human approves payments — on-chain and immutable.",
    color: "yellow",
    code: "apps/web/contracts/AgentRegistry.sol",
  },
  {
    icon: Globe,
    label: "Multi-Chain Payments",
    description:
      "OWS (Open Wallet Standard) support for 9 blockchains. Chain-specific pricing multipliers ensure competitive rates on cheaper L2s.",
    color: "cyan",
    code: "docs/AGENT_API.md — OWS Payment Integration",
  },
];

const METRICS = [
  { label: "Voices Licensed", value: "21+", sub: "Professional human voices" },
  { label: "Characters Generated", value: "1M+", sub: "Live production usage" },
  { label: "Revenue Split", value: "70%", sub: "Enforced by smart contract" },
  { label: "Cost Per Character", value: "$0.000001", sub: "No monthly fees" },
  { label: "Payment Methods", value: "5", sub: "Credits, x402, OWS, Stripe, Tier" },
  { label: "Blockchains", value: "9", sub: "Including Base, Solana, Arbitrum" },
];

export default function HackathonPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-16 sm:py-24">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/30 rounded-full mb-6">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">
              Hackathon Submission — Entrepreneurship & Job Creation
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-white">A Voice Marketplace</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Run by AI Agents
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
            VOISSS is a B2B voice licensing marketplace where AI agents are the
            primary customers — discovering, purchasing, and using authentic
            human voices without human intervention.
          </p>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Category: <strong className="text-white">Entrepreneurship & Job Creation</strong>{" "}
            • Google Cloud: <strong className="text-blue-400">Google Gemini 3.0 Flash</strong>{" "}
            • Live: <a href="https://voisss.netlify.app" className="text-purple-400 hover:underline">voisss.netlify.app</a>
          </p>
        </div>

        {/* AI Operations — The Core Submission */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-4">
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                AI-Native Operations
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              What AI Does — End to End
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Every step of the transaction lifecycle is automated. No human
              approves bids, payments, or voice delivery. The business runs
              itself.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {AI_SYSTEMS.map((system) => {
              const Icon = system.icon;
              const colorMap: Record<string, string> = {
                purple: "border-purple-500/20 bg-purple-500/5",
                blue: "border-blue-500/20 bg-blue-500/5",
                pink: "border-pink-500/20 bg-pink-500/5",
                green: "border-green-500/20 bg-green-500/5",
                yellow: "border-yellow-500/20 bg-yellow-500/5",
                cyan: "border-cyan-500/20 bg-cyan-500/5",
              };
              const iconColorMap: Record<string, string> = {
                purple: "text-purple-400",
                blue: "text-blue-400",
                pink: "text-pink-400",
                green: "text-green-400",
                yellow: "text-yellow-400",
                cyan: "text-cyan-400",
              };
              return (
                <div
                  key={system.label}
                  className={`p-5 rounded-xl border ${colorMap[system.color] || colorMap.purple}`}
                >
                  <div className="flex items-start gap-4">
                    <Icon
                      className={`w-6 h-6 mt-0.5 shrink-0 ${iconColorMap[system.color] || "text-purple-400"}`}
                    />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white text-sm mb-1">
                        {system.label}
                      </h3>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {system.description}
                      </p>
                      <p className="text-xs text-gray-600 mt-2 font-mono truncate">
                        {system.code}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* What Humans Do */}
        <div className="max-w-3xl mx-auto mb-20 p-8 bg-[#121212] border border-[#222] rounded-2xl">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            What Humans Do
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-white">Voice Contributors</p>
                <p className="text-sm text-gray-400">
                  Record their voice once. After that, AI handles everything.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-white">Founders</p>
                <p className="text-sm text-gray-400">
                  Strategic decisions, partnerships, and product direction.
                </p>
              </div>
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm mt-6 border-t border-[#222] pt-6">
            The transaction lifecycle — discovery, bidding, payment, delivery,
            revenue split — is <strong className="text-white">fully autonomous</strong>.
          </p>
        </div>

        {/* Google Cloud Integration */}
        <div className="max-w-3xl mx-auto mb-20 p-8 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">
              Google Cloud Integration
            </h2>
          </div>
          <p className="text-gray-400 mb-6">
            Google Gemini is not a bolt-on — it&apos;s foundational to how VOISSS operates:
          </p>
          <div className="space-y-3">
            {[
              "Voice content analysis: quality scoring, emotional tone detection, humanity verification",
              "AI Butler: Gemini-powered conversational assistant with decentralized Arkiv memory",
              "29-language dubbing: Gemini translates text before ElevenLabs voice synthesis",
              "Fallback chain: ACP Compute → Google Gemini → local fallback for resilient inference",
              "Environment variable: GEMINI_API_KEY in apps/web/.env.local",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-300">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Jobs & Economic Opportunities */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-4">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold text-green-300 uppercase tracking-wider">
                Category Impact
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Entrepreneurship & Job Creation
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              VOISSS creates new income streams for voice contributors and enables
              a new generation of AI builders to ship voice-powered products.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 bg-[#121212] border border-[#222] rounded-2xl">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                <Mic className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-bold text-white mb-2">Voice Contributors</h3>
              <p className="text-sm text-gray-400">
                Passive income from every AI agent API call — 70% revenue,
                enforced by smart contract. Mission system, streak rewards, and
                achievement bonuses.
              </p>
            </div>
            <div className="p-6 bg-[#121212] border border-[#222] rounded-2xl">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <Code2 className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-bold text-white mb-2">AI Builders</h3>
              <p className="text-sm text-gray-400">
                Pay-per-character pricing ($0.000001/char) removes the monthly
                subscription barrier. Multi-chain payments, instant API access,
                and no minimum commitment.
              </p>
            </div>
            <div className="p-6 bg-[#121212] border border-[#222] rounded-2xl">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
                <DollarSign className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-bold text-white mb-2">New Roles Created</h3>
              <p className="text-sm text-gray-400">
                Voice Mission Curators, Voice Licensing Agents (autonomous AI
                matching buyers with contributors), and Community Campaign
                Organizers.
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Platform Metrics
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {METRICS.map((metric) => (
              <div
                key={metric.label}
                className="p-4 bg-[#121212] border border-[#222] rounded-xl text-center"
              >
                <p className="text-2xl font-bold text-white">{metric.value}</p>
                <p className="text-xs text-gray-500 mt-1">{metric.sub}</p>
                <p className="text-[10px] text-gray-600 mt-0.5 uppercase tracking-wider">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Links for Judges */}
        <div className="max-w-2xl mx-auto">
          <div className="p-8 bg-gradient-to-br from-amber-500/5 to-purple-500/5 border border-amber-500/20 rounded-2xl text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              For Judges
            </h2>
            <p className="text-gray-400 mb-8 text-sm">
              All evidence, code, and documentation is linked below.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://github.com/thisyearnofear/VOISSS"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1A1A1A] border border-[#2A2A2A] hover:border-white/30 rounded-xl text-white font-semibold text-sm transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                GitHub Repository
              </a>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold text-sm hover:from-purple-500 hover:to-pink-500 transition-all"
              >
                <Zap className="w-4 h-4" />
                Live App
              </a>
              <a
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 rounded-xl text-white font-semibold text-sm hover:bg-blue-500 transition-all"
              >
                <Mic className="w-4 h-4" />
                Interactive Demo
              </a>
            </div>
            <div className="mt-6 text-xs text-gray-600 border-t border-white/5 pt-6">
              <p>GitHub shared with testing@devpost.com and judging@hacker.fund</p>
              <p className="mt-1">
                Video walkthrough, revenue evidence, and expense disclosure
                available upon request
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
