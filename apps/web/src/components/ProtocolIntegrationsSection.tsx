import React from 'react';
import { Wallet, Globe, Lock, ShieldCheck, Zap, Coins } from 'lucide-react';

interface TrackStyle {
  iconBg: string;
  iconBorder: string;
  iconColor: string;
}

const colorStyles: Record<string, TrackStyle> = {
  blue: {
    iconBg: "bg-blue-500/10",
    iconBorder: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
  purple: {
    iconBg: "bg-purple-500/10",
    iconBorder: "border-purple-500/20",
    iconColor: "text-purple-400",
  },
  yellow: {
    iconBg: "bg-yellow-500/10",
    iconBorder: "border-yellow-500/20",
    iconColor: "text-yellow-400",
  },
  green: {
    iconBg: "bg-green-500/10",
    iconBorder: "border-green-500/20",
    iconColor: "text-green-400",
  },
};

const TRACKS = [
  {
    id: "01",
    title: "Agentic Storefronts",
    description: "AI agents that run real businesses end-to-end. Our marketplace allows agents with OWS wallets to license voices and pay royalties autonomously via x402.",
    icon: Globe,
    color: "blue",
  },
  {
    id: "02",
    title: "Agent Spend Governance",
    description: "Give agents wallets, not blank checks. OWS policy engines enforce spending limits on voice synthesis and licensing calls — no subscriptions, no surprises.",
    icon: Lock,
    color: "purple",
  },
  {
    id: "03",
    title: "Pay-Per-Call Services",
    description: "Every voice synthesis call is wrapped in x402 micropayments. No API keys, no accounts — pure pay-per-query with automatic settlement on Base.",
    icon: Zap,
    color: "yellow",
  },
  {
    id: "04",
    title: "Multi-Agent Systems",
    description: "Orchestrator agents can spawn sub-agents, each with a scoped budget and API key for voice tasks. Coordinate and trade voice assets programmatically.",
    icon: ShieldCheck,
    color: "green",
  },
];

export default function ProtocolIntegrationsSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-6">
            <Wallet className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-blue-400 tracking-wider uppercase">
              x402 Agent Commerce
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
            Built for the <span className="text-blue-500">Autonomous Economy</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            VOISSS is fully integrated with the Open Wallet Standard (OWS) and x402 payment protocol.
            AI agents can autonomously license, pay for, and manage voice assets — no human in the loop.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {TRACKS.map((track) => {
            const Icon = track.icon;
            const cs = colorStyles[track.color] || colorStyles.blue;
            return (
              <div
                key={track.id}
                className="group p-8 bg-[#121212] border border-[#222] rounded-2xl hover:border-blue-500/50 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 text-8xl font-black text-white/5 pointer-events-none">
                  {track.id}
                </div>

                <div className={`w-12 h-12 ${cs.iconBg} rounded-xl flex items-center justify-center mb-6 border ${cs.iconBorder} group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${cs.iconColor}`} />
                </div>

                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                  {track.title}
                </h3>
                <p className="text-gray-400 leading-relaxed relative z-10">
                  {track.description}
                </p>

                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <Coins className="w-3 h-3" />
                  <span>Powered by x402 &amp; Base</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <a
            href="/agents"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-semibold hover:bg-white/10 transition-all group"
          >
            Explore Agent APIs
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
