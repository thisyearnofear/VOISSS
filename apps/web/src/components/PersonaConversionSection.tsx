"use client";

import React, { useState } from "react";
import { Mic, Code2, Building2, ArrowRight, Sparkles } from "lucide-react";
import { BuyCreditsModal } from "./payment/BuyCreditsModal";
import { PERSONA_STEPS } from "@voisss/shared";

const PERSONAS = [
  {
    icon: Code2,
    id: "developer" as const,
    title: "I'm building with AI",
    description: "Add voice to your agents, apps, and automations with a single API call.",
    highlight: "Pay $0.000001/char — no subscription",
    cta: "Get API Credits",
    ctaHref: null,
    gradient: "from-blue-500 to-cyan-500",
    bgGlow: "bg-blue-500/10",
    border: "border-blue-500/20",
    steps: PERSONA_STEPS.developer,
  },
  {
    icon: Mic,
    id: "creator" as const,
    title: "I have a voice to share",
    description: "Record your voice once. Earn 70% every time an AI agent uses it.",
    highlight: "Smart contract enforced — always 70%",
    cta: "Start Earning",
    ctaHref: "/studio",
    gradient: "from-purple-500 to-pink-500",
    bgGlow: "bg-purple-500/10",
    border: "border-purple-500/20",
    steps: PERSONA_STEPS.creator,
  },
  {
    icon: Building2,
    id: "enterprise" as const,
    title: "I need enterprise voices",
    description: "Custom voice cloning, exclusive licensing, white-label. $2K+ for your brand.",
    highlight: "Custom model trained on your samples",
    cta: "Contact Us",
    ctaHref: "/contact",
    gradient: "from-amber-500 to-orange-500",
    bgGlow: "bg-amber-500/10",
    border: "border-amber-500/20",
    steps: PERSONA_STEPS.enterprise,
  },
];

export default function PersonaConversionSection() {
  const [showCredits, setShowCredits] = useState(false);

  return (
    <section className="py-24 max-w-5xl mx-auto">
      <div className="mb-12">
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <span className="inline-flex h-5 items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[10px] font-mono font-bold tracking-[0.12em] text-white/60">
            03 — Roles
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-white/30">
            <Sparkles className="w-3 h-3 text-amber-300" /> who is VOISSS for
          </span>
        </div>
        <h2 className="font-syne text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-white">
          Pick your path
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PERSONAS.map((persona) => {
          const Icon = persona.icon;
          return (
            <div
              key={persona.id}
              className={`relative p-6 rounded-2xl border ${persona.border} ${persona.bgGlow} hover:border-white/20 transition-colors duration-200 group`}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${persona.gradient} flex items-center justify-center mb-4 shadow-lg`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {persona.title}
              </h3>
              <p className="text-gray-400 text-sm mb-3">
                {persona.description}
              </p>
              <p
                className={`text-xs font-semibold bg-gradient-to-r ${persona.gradient} bg-clip-text text-transparent mb-4`}
              >
                ✦ {persona.highlight}
              </p>

              <ol className="flex flex-col gap-1.5 mb-6">
                {persona.steps.map((step, i) => (
                  <li key={step} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className={`w-5 h-5 rounded-full bg-gradient-to-br ${persona.gradient} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>

              {persona.ctaHref ? (
                <a
                  href={persona.ctaHref}
                  id={`persona-cta-${persona.id}`}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r ${persona.gradient} text-white font-semibold text-sm transition-opacity hover:opacity-90`}
                >
                  {persona.cta}
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <button
                  onClick={() => setShowCredits(true)}
                  id={`persona-cta-${persona.id}`}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r ${persona.gradient} text-white font-semibold text-sm transition-opacity hover:opacity-90`}
                >
                  {persona.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <BuyCreditsModal isOpen={showCredits} onClose={() => setShowCredits(false)} />
    </section>
  );
}
