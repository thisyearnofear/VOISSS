"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mic, Sparkles, Terminal, Zap } from "lucide-react";
import OnboardingRedirect from "../components/OnboardingRedirect";
import HomeStructuredData from "../components/HomeStructuredData";
import VoiceTerrain from "../components/VoiceTerrain";
import SplitBar from "../components/SplitBar";
import TerrainBand from "../components/marketplace/TerrainBand";
import QuickVoicePreview from "../components/marketplace/QuickVoicePreview";
import MatchConsole from "../components/landing/MatchConsole";
import { pulseVoice } from "../lib/terrain-bus";
import { initTelemetry, flushNow } from "../lib/telemetry";

if (typeof window !== "undefined") {
  initTelemetry();
  window.addEventListener("popstate", flushNow);
}

const EXAMPLE_BRIEFS = [
  "calm meditation narrator",
  "urgent ad read for a product drop",
  "friendly podcast host",
];

const PIPELINE = [
  {
    stage: "s/01",
    title: "Brief",
    desc: "Plain English — “warm narrator for a sleep app, unhurried”. No taxonomy to learn.",
  },
  {
    stage: "s/02",
    title: "Archetype",
    desc: "The brief resolves to a matching archetype — meditation, ad read, narration — each with its own target profile.",
  },
  {
    stage: "s/03",
    title: "Six dimensions",
    desc: "Every voice is scored on neutral acoustic dimensions: energy, pace, express, warmth, authority, intimacy.",
  },
  {
    stage: "s/04",
    title: "Ranked + reasons",
    desc: "Fit decomposes into auditable labels — “calm energy · unhurried · warm”. The rubric is versioned and cited.",
  },
];

const PATHS = [
  {
    icon: Zap,
    title: "Discover voices",
    desc: "Describe it in plain English — ranked matches with reasons, instant preview, pay per character.",
    href: "/marketplace",
    cta: "marketplace",
  },
  {
    icon: Mic,
    title: "Sell your voice",
    desc: "Record in the studio or import from ElevenLabs. 70% of every license settles to you on Base.",
    href: "/sell",
    cta: "start selling",
  },
  {
    icon: Terminal,
    title: "Build with the API",
    desc: "One POST to /api/agents/vocalize. x402 micropayments, OpenAPI spec, agent wallets that pay for themselves.",
    href: "/developers",
    cta: "read the docs",
  },
];

export default function Home() {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const [voiceCount, setVoiceCount] = useState<number | null>(null);

  // Live catalog size for the wireframe index — honest number, quiet fallback.
  useEffect(() => {
    fetch("/api/marketplace/voices?limit=1")
      .then((r) => r.json())
      .then((d) => {
        const t = d?.data?.total;
        if (typeof t === "number" && t > 0) setVoiceCount(t);
      })
      .catch(() => {});
  }, []);

  const submitBrief = (value: string) => {
    const q = value.trim();
    pulseVoice("lift");
    router.push(q ? `/marketplace?brief=${encodeURIComponent(q)}` : "/marketplace");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <HomeStructuredData />
      <OnboardingRedirect />

      {/* ── Hero — the instrument frame. The page performs the match. ──────── */}
      <div className="voisss-container pt-6 sm:pt-10">
        <div className="voisss-frame voisss-corner-diagonals voisss-corner-ticks relative overflow-hidden">
          {/* Licensed Signal — procedural field, pointer-reactive, one rAF */}
          <VoiceTerrain />
          <div className="voisss-progressive-blur" aria-hidden />

          <div className="relative z-10">
            {/* Wireframe index */}
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 lg:px-7 py-3 border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-[0.14em] text-white/45">
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="inline-flex h-5 items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[10px] font-bold tracking-[0.12em] text-white/70">
                  01 — Licensed Signal
                </span>
                <span className="hidden sm:inline truncate">Voice IP · settled on Base</span>
                <span className="sm:hidden">Base 8453</span>
              </span>
              <span className="flex items-center gap-2.5 shrink-0">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" aria-hidden />
                  {voiceCount !== null ? `${voiceCount} voices live` : "voices live"}
                </span>
                <span className="hidden md:inline h-3 w-px bg-white/10" aria-hidden />
                <span className="hidden md:inline">$0.000001/char</span>
                <span className="hidden sm:inline h-3 w-px bg-white/10" aria-hidden />
                <span className="hidden sm:inline">70% → contributor</span>
              </span>
            </div>

            {/* Main grid — copy + instrument */}
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-7 lg:gap-9 px-4 sm:px-6 lg:px-7 py-7 sm:py-9 lg:py-11 items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <span className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full voisss-border-gradient">
                    <Sparkles className="w-3.5 h-3.5 text-[#9C88FF]" aria-hidden />
                    <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-white/75">
                      Live marketplace · rubric-explained matching
                    </span>
                  </span>
                </div>

                <h1 className="font-syne font-bold leading-[0.92] tracking-[-0.045em] text-[36px] sm:text-[48px] lg:text-[56px] xl:text-[60px]" data-reveal>
                  <span className="voisss-masked-reveal block text-white">Describe the voice.</span>
                  <span className="voisss-masked-reveal voisss-masked-reveal-delay-1 block voisss-gradient-text">
                    Get ranked matches
                  </span>
                  <span className="voisss-masked-reveal voisss-masked-reveal-delay-2 block text-white/90">
                    with reasons.
                  </span>
                </h1>

                <div className="voisss-editorial-rule mt-5 max-w-[36rem]" data-reveal data-reveal-delay="1" aria-hidden />

                <p className="mt-4 text-[15px] sm:text-[16px] leading-relaxed text-zinc-300 max-w-[38rem]" data-reveal data-reveal-delay="1">
                  Type what you need in plain English — every real voice is scored,
                  ranked, and explained in under a second. Preview instantly, pay per use.
                </p>

                {/* The search — demonstrates the match here, submits into the live marketplace */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitBrief(brief);
                  }}
                  className="mt-6 flex flex-col sm:flex-row gap-3 max-w-xl"
                  data-reveal
                  data-reveal-delay="2"
                >
                  <input
                    type="text"
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder='"warm narrator for a sleep app, unhurried"'
                    aria-label="Describe the voice you need"
                    className="flex-1 bg-[#0A0A0A]/70 backdrop-blur border border-white/15 focus:border-[#7C5DFA] focus:ring-1 focus:ring-[#7C5DFA]/30 rounded-xl px-4 py-3.5 text-[15px] text-white placeholder:text-zinc-600 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    className="voisss-beam-glow inline-flex items-center justify-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold tracking-[-0.01em] text-black shadow-[0_10px_30px_rgba(255,255,255,0.12)] hover:bg-zinc-50 transition-colors shrink-0"
                  >
                    Match voices <ArrowRight className="w-4 h-4" aria-hidden />
                  </button>
                </form>

                <div className="mt-3 flex flex-wrap gap-1.5" data-reveal data-reveal-delay="2">
                  {EXAMPLE_BRIEFS.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setBrief(example)}
                      className="text-[11px] px-2.5 py-1.5 rounded-md bg-[#7C5DFA]/10 text-[#9C88FF] border border-[#7C5DFA]/20 hover:bg-[#7C5DFA]/20 hover:border-[#7C5DFA]/40 transition-all"
                    >
                      {example}
                    </button>
                  ))}
                </div>

                <div
                  className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-mono tracking-wide text-white/50"
                  data-reveal
                  data-reveal-delay="3"
                >
                  <span className="voisss-number-detail text-white/80">
                    $0.000001<span className="text-white/40">/char</span>
                  </span>
                  <span className="h-3 w-px bg-white/10" aria-hidden />
                  <span>x402 on Base</span>
                  <span className="h-3 w-px bg-white/10" aria-hidden />
                  <span className="text-white/40">agent wallets settle themselves</span>
                </div>
              </div>

              {/* The instrument — a real rubric match, replayed in-browser */}
              <div className="min-w-0" data-reveal data-reveal-delay="2">
                <MatchConsole brief={brief} />
                <p className="mt-2.5 text-center text-[10px] font-mono uppercase tracking-[0.12em] text-white/30">
                  the page performs the match — the marketplace keeps it
                </p>
              </div>
            </div>

            {/* Bottom proof strip */}
            <div className="border-t border-white/[0.06] bg-[#0A0A0A]/55 backdrop-blur px-4 sm:px-6 lg:px-7 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="inline-flex flex-wrap items-center gap-2 sm:gap-3 text-white/55">
                <span className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                  <span className="font-mono text-white/75">Production ready</span>
                  <span className="text-white/25">·</span>
                  <span>Live on Base</span>
                </span>
                <span className="hidden sm:inline h-3 w-px bg-white/10" aria-hidden />
                <span className="hidden sm:inline text-white/40">consent · provenance · fair pay</span>
              </span>
              <span className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => pulseVoice("settle")}
                  className="inline-flex items-center gap-1.5 text-white/45 hover:text-white transition-colors font-mono text-[11px] uppercase tracking-widest"
                  title="Animate the 70/30 contributor split across the voice terrain"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9C88FF]" aria-hidden />
                  Preview 70/30 settle
                </button>
                <span className="text-white/15" aria-hidden>·</span>
                <a
                  href="/benchmarks"
                  className="inline-flex items-center gap-1.5 text-white/45 hover:text-white transition-colors font-mono text-[11px] uppercase tracking-widest"
                >
                  Benchmarks <span aria-hidden>↗</span>
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pipeline — the match, anatomised ─────────────────────────────── */}
      <div className="voisss-container py-14 sm:py-16">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-7" data-reveal>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/40 mb-2">
              How a match is made
            </p>
            <h2 className="font-syne text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-white">
              Explainable by construction
            </h2>
          </div>
          <a
            href="/benchmarks"
            className="text-sm text-[#9C88FF] hover:text-[#C4B5FD] transition-colors flex items-center gap-1"
          >
            Measured vs GPT-4o-mini <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PIPELINE.map((s, i) => (
            <div
              key={s.stage}
              data-reveal
              data-reveal-delay={String(Math.min(i + 1, 4))}
              className="voisss-container-lines voisss-specular relative rounded-xl bg-[#0F0F0F]/70 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono tracking-[0.14em] text-[#9C88FF]">{s.stage}</span>
                <span className="text-[10px] font-mono text-white/25" aria-hidden>
                  {i < PIPELINE.length - 1 ? "→" : "◼"}
                </span>
              </div>
              <h3 className="font-syne text-[15px] font-bold tracking-[-0.01em] text-white mb-1.5">{s.title}</h3>
              <p className="text-[13px] leading-relaxed text-zinc-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Hear it — playback energizes the field ───────────────────────── */}
      <div className="voisss-container pb-14 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-4 items-stretch">
          <div className="min-w-0" data-reveal>
            <QuickVoicePreview />
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <div data-reveal data-reveal-delay="1">
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/40 mb-2">
                The signature
              </p>
              <h2 className="font-syne text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-white">
                Press play — the field wakes.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-zinc-400 max-w-md">
                Voices are heard, not read. Every preview anywhere on the site drives
                the terrain through one shared bus — browsing becomes using.
              </p>
            </div>
            <TerrainBand
              readyLabel="Idle — press play and the field wakes"
              heightClass="flex-1 min-h-[180px]"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* ── Economics — the split, drawn not claimed ─────────────────────── */}
      <div className="voisss-container pb-14 sm:pb-16">
        <div className="mb-7" data-reveal>
          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/40 mb-2">
            On-chain economics
          </p>
          <h2 className="font-syne text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-white">
            The split, drawn.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div
            className="voisss-container-lines voisss-specular rounded-2xl bg-[#0F0F0F]/70 p-5 sm:p-6"
            data-reveal
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne text-[15px] font-bold text-white">License purchases</h3>
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-white/35">marketplace</span>
            </div>
            <SplitBar variant="license" />
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-400">
              Split at purchase time, on-chain. The proportion is a contract
              constant — <span className="text-white/70">platformFeeBps 3000</span> — not a promise.
            </p>
          </div>
          <div
            className="voisss-container-lines voisss-specular rounded-2xl bg-[#0F0F0F]/70 p-5 sm:p-6"
            data-reveal
            data-reveal-delay="1"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne text-[15px] font-bold text-white">x402 recording sales</h3>
              <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-white/35">agent-native</span>
            </div>
            <SplitBar variant="x402" />
            <p className="mt-4 text-[13px] leading-relaxed text-zinc-400">
              The better deal for creators — <span className="text-white/70">platformFeePercent 5</span> in
              VoiceRecords.sol, so 95% of every access payment is theirs.
            </p>
          </div>
        </div>
      </div>

      {/* ── Three paths ──────────────────────────────────────────────────── */}
      <div className="voisss-container pb-16 sm:pb-20">
        <div className="grid md:grid-cols-3 gap-3">
          {PATHS.map((p, i) => (
            <a
              key={p.title}
              href={p.href}
              data-reveal
              data-reveal-delay={String(Math.min(i + 1, 4))}
              className="group voisss-container-lines voisss-specular voisss-corner-ticks rounded-2xl bg-[#0F0F0F]/70 p-5 sm:p-6 hover:border-white/20 transition-colors"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/[0.04] text-[#9C88FF] mb-4">
                <p.icon className="w-5 h-5" aria-hidden />
              </span>
              <h3 className="font-syne text-[16px] font-bold tracking-[-0.01em] text-white mb-2">{p.title}</h3>
              <p className="text-[13px] leading-relaxed text-zinc-400 mb-4">{p.desc}</p>
              <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#9C88FF] group-hover:text-[#C4B5FD] transition-colors inline-flex items-center gap-1.5">
                {p.cta} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="voisss-container py-10 border-t border-white/[0.08]">
        <div className="flex flex-wrap gap-x-10 gap-y-3 text-xs font-bold uppercase tracking-[0.14em]">
          <a href="/marketplace" className="text-white hover:text-purple-400 transition-colors">
            Discover
          </a>
          <a href="/generate" className="text-zinc-400 hover:text-white transition-colors">
            Generate
          </a>
          <a href="/sell" className="text-zinc-400 hover:text-white transition-colors">
            Sell
          </a>
          <a href="/developers" className="text-zinc-400 hover:text-white transition-colors">
            API
          </a>
          <a href="/benchmarks" className="text-zinc-400 hover:text-white transition-colors">
            Benchmarks
          </a>
          <a
            href="https://github.com/thisyearnofear/VOISSS"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
        <p className="mt-10 text-zinc-600 text-[10px] tracking-widest uppercase">
          © 2026 VOISSS. Built on Base • Open Source • MIT License
        </p>
      </div>
    </div>
  );
}
