"use client";

import React, { useEffect, useState } from "react";
import { Shield, Zap, TrendingUp, Sparkles, Play } from "lucide-react";
import QuickVoicePreview from "./marketplace/QuickVoicePreview";
import { useMascotContext, publishMoodEvent } from "./VoissMascot";
import VoissMascotMark from "./VoissMascotMark";
import OnboardingQuiz from "./OnboardingQuiz";
import { BuyCreditsButton } from "./payment/BuyCreditsModal";
import VoiceTerrain from "./VoiceTerrain";
import { PRODUCT_TAGLINE, PRODUCT_TAGLINE_SHORT } from "@voisss/shared";

function HeroMascot() {
  useMascotContext();
  useEffect(() => {
    publishMoodEvent("wave", "page-load");
  }, []);
  return null;
}

const CompatibleShield = Shield as React.ComponentType<{ className?: string }>;
const CompatibleZap = Zap as React.ComponentType<{ className?: string }>;
const CompatibleTrendingUp = TrendingUp as React.ComponentType<{ className?: string }>;

export default function EnhancedLandingHero() {
  return (
    <>
      <HeroMascot />
      <Inner />
    </>
  );
}

function Inner() {
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
    <div className="pb-2">
      {/* ── Editorial frame — the only place VoiceTerrain lives (sandboxed) ── */}
      <div className="voisss-frame voisss-corner-diagonals voisss-corner-ticks relative overflow-hidden">
        {/* Sylva-lite: procedural pointer-reactive field — one loop, DPR 2, reduced-motion static */}
        <VoiceTerrain />
        <div className="voisss-progressive-blur" aria-hidden />

        <div className="relative z-10">
          {/* Wireframe index — editorial-tech */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 lg:px-7 py-3 border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-[0.14em] text-white/45">
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex h-5 items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[10px] font-bold tracking-[0.12em] text-white/70">
                01 — Licensed Signal
              </span>
              <span className="hidden sm:inline truncate">Voice IP on Base · 0xBE85 · 0x32BD</span>
              <span className="sm:hidden">Base 8453</span>
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="hidden md:inline">$0.000001 / char</span>
              <span className="hidden md:inline h-3 w-px bg-white/10" aria-hidden />
              <span className="inline-flex items-center gap-1.5 text-white/60">
                <span className="hidden sm:inline">70%</span>
                <span className="sm:hidden">70%</span>
                <span className="text-white/35">→</span>
                <span>contributor</span>
              </span>
            </span>
          </div>

          {/* Main grid — split-layout-technical */}
          <div className="grid lg:grid-cols-[1.08fr_0.92fr] gap-6 lg:gap-8 px-4 sm:px-6 lg:px-7 py-7 sm:py-9 lg:py-10 items-start">
            {/* Left — editorial copy */}
            <div className="min-w-0">
              {/* Eyebrow — kis mascot + pill */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full voisss-border-gradient">
                  <VoissMascotMark variant="head" size={20} alt="" className="w-5 h-5 rounded-full" />
                  <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-white/75">
                    {PRODUCT_TAGLINE_SHORT}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-white/35">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
                  Live on Base · x402 gasless
                </span>
              </div>

              {/* H1 — masked-reveal, no second gradient blob */}
              <h1 className="font-syne font-bold leading-[0.88] tracking-[-0.045em] text-[34px] sm:text-[46px] lg:text-[56px] xl:text-[62px]">
                <span className="voisss-masked-reveal block text-white">Voice marketplace</span>
                <span className="voisss-masked-reveal voisss-masked-reveal-delay-1 block text-white/92">
                  for agents that
                </span>
                <span className="voisss-masked-reveal voisss-masked-reveal-delay-2 block voisss-gradient-text">
                  pay themselves.
                </span>
              </h1>

              <div className="voisss-editorial-rule mt-5 max-w-[36rem]" aria-hidden />

              <p className="mt-4 text-[15px] sm:text-[16px] leading-relaxed text-zinc-300 max-w-[38rem]">
                {PRODUCT_TAGLINE}
              </p>

              {/* Mono spec line — number-details */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono tracking-wide text-white/55">
                <span className="voisss-number-detail text-white">
                  $0.000001<span className="text-white/40">/char</span>
                </span>
                <span className="h-3 w-px bg-white/10" aria-hidden />
                <span className="text-white">70% → contributor</span>
                <span className="h-3 w-px bg-white/10 hidden sm:block" aria-hidden />
                <span className="hidden sm:inline text-white/40">Instant API · No subscription</span>
              </div>

              {/* CTAs — one beam-glow primary */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
                <a
                  href="/demo"
                  id="hero-try-demo-btn"
                  className="voisss-beam-glow inline-flex items-center justify-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold tracking-[-0.01em] text-black shadow-[0_10px_30px_rgba(255,255,255,0.12)] hover:bg-zinc-50 transition-colors"
                >
                  <Play className="w-[18px] h-[18px] fill-black" />
                  Try free demo
                  <span className="hidden sm:inline text-black/40 font-mono text-xs tracking-wide">· no wallet</span>
                </a>
                <a
                  href="/marketplace"
                  id="hero-browse-voices-btn"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] backdrop-blur px-6 py-3.5 text-[14px] font-semibold text-white hover:bg-white/[0.07] hover:border-white/16 transition-colors"
                >
                  <CompatibleShield className="w-4 h-4 text-white/70" />
                  Browse voices
                </a>
                <BuyCreditsButton
                  variant="ghost"
                  className="rounded-xl border border-white/10 bg-transparent px-5 py-3.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/[0.04] hover:border-white/15 !shadow-none"
                />
              </div>

              <p className="mt-2.5 text-[11px] leading-relaxed text-white/35 max-w-[34rem]">
                Agent decides → Dynamic wallet signs x402 on Base → 70% settles to contributor. One frame, two tracks: Bankr Grand Prize is automatic · Dynamic is <code className="rounded bg-white/[0.06] border border-white/10 px-1 py-0.5 font-mono text-[10px] text-white/65">X-DYNAMIC-WALLET: 1</code>
              </p>

              {/* Persona paths — editorial pills, not loose dots */}
              <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <a
                  href="/studio"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-white/70 hover:text-white hover:border-white/15 hover:bg-white/[0.05] transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9C88FF]" />I create voices
                </a>
                <a
                  href="/import"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-white/70 hover:text-white hover:border-white/15 hover:bg-white/[0.05] transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Import from ElevenLabs
                </a>
                <a
                  href="/for-agents"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-white/70 hover:text-white hover:border-white/15 hover:bg-white/[0.05] transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />I need voices for my agent
                </a>
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-white/55 hover:text-white hover:border-white/15 hover:bg-white/[0.05] transition-colors"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  Help me get started
                </button>
              </div>
            </div>

            {/* Right — terrain caption + mascot figure (lets VoiceTerrain breathe) */}
            <div className="voisss-terrain-bg relative min-h-[280px] sm:min-h-[320px] lg:min-h-[420px] rounded-2xl overflow-hidden border border-white/[0.06]">
              {/* Mascot — anchored, not centered blob. Smaller, editorial. */}
              <div className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
                <div className="relative">
                  <div className="absolute inset-0 -z-10 bg-[#7C5DFA]/18 blur-[42px] rounded-full scale-[1.45]" aria-hidden />
                  <VoissMascotMark
                    priority
                    size={220}
                    className="w-[148px] h-[148px] sm:w-[176px] sm:h-[176px] lg:w-[200px] lg:h-[200px] drop-shadow-[0_18px_40px_rgba(124,93,250,0.28)]"
                  />
                </div>
              </div>

              {/* Terrain key — sits on progressive-blur so text stays legible */}
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                <div className="rounded-xl border border-white/10 bg-[#0A0A0A]/72 backdrop-blur-xl p-3 sm:p-3.5 flex items-start gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-black shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold tracking-[0.12em] uppercase text-white">Voice terrain</div>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                      Move your pointer — the field <span className="text-white">parts around it</span> and drops pollen on
                      fast strokes. When an agent licenses, the terrain settles and the{" "}
                      <span className="text-white">70/30</span> split glints along one ribbon.
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-white/45">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1">900 grains</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1">12 ribbons</span>
                      <span className="hidden sm:inline rounded-full border border-white/10 bg-white/[0.04] px-2 py-1">
                        DPR≤2 · one loop
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-center text-[10px] font-mono uppercase tracking-widest text-white/25">
                  One obsessive detail — like Sylva moss, but for voice
                </p>
              </div>
            </div>
          </div>

          {/* Bottom proof strip — inside frame, editorial-tech */}
          <div className="border-t border-white/[0.06] bg-[#0A0A0A]/55 backdrop-blur px-4 sm:px-6 lg:px-7 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="inline-flex flex-wrap items-center gap-2 sm:gap-3 text-white/55">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="font-mono text-white/75">Production Ready</span>
                <span className="text-white/25">·</span>
                <span>Live on Base</span>
              </span>
              <span className="hidden sm:inline h-3 w-px bg-white/10" aria-hidden />
              <span className="hidden sm:inline text-white/40">Consent · provenance · fair pay — by default</span>
            </span>
            <a
              href="https://runtime.nyc/handbook"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-white/45 hover:text-white transition-colors font-mono text-[11px] uppercase tracking-widest"
            >
              Handbook <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* Synthesis playground — keep below frame so hero stays scannable; now framed */}
      <div className="mt-6 sm:mt-7">
        <div className="rounded-2xl voisss-container-lines bg-[#0F0F0F]/60 backdrop-blur p-3 sm:p-4 lg:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-white/60">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-white text-black">
                <Play className="w-3 h-3 fill-black" />
              </span>
              Instant synthesis — try before you wallet
            </span>
            <span className="text-[11px] font-mono text-white/30">0xBE85 · 0x32BD · Gasless preview</span>
          </div>
          <QuickVoicePreview />
        </div>
      </div>

      {/* Feature highlights — framed cells, not floating cards */}
      <div className="mt-6 sm:mt-7 grid md:grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            Icon: CompatibleShield,
            title: "Licensed voices",
            desc: "Human voices with legal cover and on-chain provenance. Not scraped.",
            accent: "from-[#7C5DFA] to-[#9C88FF]",
          },
          {
            Icon: CompatibleZap,
            title: "Agent-native API",
            desc: "One POST to /api/agents/vocalize. Dynamic wallet can pay itself — no human click.",
            accent: "from-sky-500 to-cyan-400",
          },
          {
            Icon: CompatibleTrendingUp,
            title: "70% to contributors",
            desc: "Programmatic royalty. Smart-contract split on Base — withdraw when you want.",
            accent: "from-emerald-500 to-teal-400",
          },
        ].map(({ Icon, title, desc, accent }) => (
          <div
            key={title}
            className="voisss-container-lines rounded-2xl bg-[#0F0F0F]/70 p-5 sm:p-6 flex gap-4 items-start"
          >
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm`}>
              <Icon className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-syne text-[15px] font-bold tracking-[-0.02em] text-white">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-[11px] leading-relaxed tracking-wide text-white/30 max-w-2xl mx-auto">
        The marketplace where AI agents license <span className="text-white/60">authentic human voices</span> — with consent,
        provenance, and fair compensation. Built on Base.
      </p>
    </div>
  );
}
