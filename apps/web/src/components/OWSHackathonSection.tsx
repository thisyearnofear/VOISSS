import React from 'react';
import { Wallet, Globe, Lock, ShieldCheck, Zap, Coins } from 'lucide-react';

const OWS_TRACKS = [
  {
    id: "01",
    title: "Agentic Storefronts",
    description: "AI agents that run real businesses end-to-end. Our marketplace allows agents with OWS wallets to license voices and pay royalties autonomously via x402.",
    icon: Globe,
    color: "blue"
  },
  {
    id: "02",
    title: "Agent Spend Governance",
    description: "Give agents wallets, not blank checks. We integrate OWS policy engines to enforce spending limits on voice synthesis and licensing calls.",
    icon: Lock,
    color: "purple"
  },
  {
    id: "03",
    title: "Pay-Per-Call Services",
    description: "No API keys, just a wallet. Every voice synthesis call is wrapped in x402 micropayments. No subscriptions, no accounts — pure pay-per-query.",
    icon: Zap,
    color: "yellow"
  },
  {
    id: "04",
    title: "Multi-Agent Systems",
    description: "Agents coordinate and trade voice assets. An orchestrator agent can spawn sub-agents, each with a scoped OWS API key and budget for voice tasks.",
    icon: ShieldCheck,
    color: "green"
  }
];

export default function OWSHackathonSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-6">
            <Wallet className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-blue-400 tracking-wider uppercase">
              OWS Hackathon 2026
            </span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
            Building the <span className="text-blue-500">Autonomous Economy</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            VOISSS is fully integrated with the Open Wallet Standard (OWS) and x402 payment protocol. 
            We are competing across four key tracks to empower AI agents with identity and treasury.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {OWS_TRACKS.map((track) => {
            const Icon = track.icon;
            return (
              <div 
                key={track.id}
                className="group p-8 bg-[#121212] border border-[#222] rounded-2xl hover:border-blue-500/50 transition-all duration-300 relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 p-4 text-8xl font-black text-white/5 pointer-events-none`}>
                  {track.id}
                </div>
                
                <div className={`w-12 h-12 bg-${track.color}-500/10 rounded-xl flex items-center justify-center mb-6 border border-${track.color}-500/20 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 text-${track.color}-400`} />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                  {track.title}
                </h3>
                <p className="text-gray-400 leading-relaxed relative z-10">
                  {track.description}
                </p>
                
                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <Coins className="w-3 h-3" />
                  <span>Powered by x402 & Base</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <a 
            href="/docs/ows-integration" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-semibold hover:bg-white/10 transition-all group"
          >
            Read OWS Implementation Docs
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
