"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mic, Sparkles, Terminal, Zap } from "lucide-react";
import OnboardingRedirect from "../components/OnboardingRedirect";
import HomeStructuredData from "../components/HomeStructuredData";
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

const MATCH_STEPS = [
  {
    step: "01",
    title: "Brief → archetype",
    desc: "Your description maps to a matching archetype — meditation, ad read, narration — with its own target profile.",
  },
  {
    step: "02",
    title: "Scored on 6 dimensions",
    desc: "Every voice is evaluated on neutral acoustic dimensions: energy, pace, expressiveness, warmth, authority, intimacy.",
  },
  {
    step: "03",
    title: "Ranked with reasons",
    desc: "Fit scores decompose into auditable labels — “calm energy · unhurried · warm”. The rubric is versioned and cited.",
  },
];

const AUDIENCES = [
  {
    icon: Zap,
    title: "Need a voice?",
    desc: "Describe it, get ranked matches in under a second, preview instantly, pay per character.",
    href: "/marketplace",
    cta: "Discover voices",
  },
  {
    icon: Mic,
    title: "Have a voice?",
    desc: "Record or import from ElevenLabs, list on the marketplace, earn 70% of every use.",
    href: "/sell",
    cta: "Sell your voice",
  },
  {
    icon: Terminal,
    title: "Building an agent?",
    desc: "One REST call to vocalize. x402 payments, OpenAPI spec, agent wallets that pay for themselves.",
    href: "/developers",
    cta: "Read the docs",
  },
];

export default function Home() {
  const router = useRouter();
  const [brief, setBrief] = useState("");

  const submitBrief = (value: string) => {
    const q = value.trim();
    router.push(q ? `/marketplace?brief=${encodeURIComponent(q)}` : "/marketplace");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <HomeStructuredData />
      <OnboardingRedirect />

      {/* Hero — the intent search IS the pitch */}
      <div className="voisss-container pt-16 sm:pt-24 pb-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#7C5DFA]/30 bg-[#7C5DFA]/10 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#9C88FF]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#C4B5FD]">
              Live marketplace · rubric-explained matching
            </span>
          </div>

          <h1 className="font-syne font-bold leading-[0.95] tracking-[-0.04em] text-[40px] sm:text-[56px] lg:text-[68px]">
            <span className="block text-white">Describe the voice.</span>
            <span className="block voisss-gradient-text">Get ranked matches</span>
            <span className="block text-white/90">with reasons.</span>
          </h1>

          <p className="mt-5 text-[15px] sm:text-[17px] leading-relaxed text-zinc-400 max-w-[36rem]">
            VOISSS is a voice marketplace. Type what you need in plain English —
            every real voice is scored, ranked, and explained in under a second.
            Preview instantly, pay per use.
          </p>

          {/* The search — submits into the live marketplace */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitBrief(brief);
            }}
            className="mt-7 flex flex-col sm:flex-row gap-3 max-w-xl"
          >
            <input
              type="text"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder='"warm narrator for a sleep app, unhurried"'
              className="flex-1 bg-[#111111] border border-[#2A2A2A] focus:border-[#7C5DFA] focus:ring-1 focus:ring-[#7C5DFA]/30 rounded-xl px-4 py-3.5 text-[15px] text-white placeholder:text-zinc-600 outline-none transition-all"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[15px] font-semibold text-black hover:bg-zinc-100 transition-colors shrink-0"
            >
              Match voices <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {EXAMPLE_BRIEFS.map((example) => (
              <button
                key={example}
                onClick={() => submitBrief(example)}
                className="text-[11px] px-2.5 py-1.5 rounded-md bg-[#7C5DFA]/10 text-[#9C88FF] border border-[#7C5DFA]/20 hover:bg-[#7C5DFA]/20 hover:border-[#7C5DFA]/40 transition-all"
              >
                {example}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono tracking-wide text-white/45">
            <span>22 live voices</span>
            <span className="h-3 w-px bg-white/10" aria-hidden />
            <span>~0.4s per match</span>
            <span className="h-3 w-px bg-white/10" aria-hidden />
            <span>6-dimension rubric</span>
            <span className="h-3 w-px bg-white/10" aria-hidden />
            <span>70% → creators</span>
          </div>
        </div>
      </div>

      {/* How matching works */}
      <div className="voisss-container py-12 border-t border-white/[0.06]">
        <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-white/35 mb-2">
              How we match
            </p>
            <h2 className="font-syne text-2xl sm:text-3xl font-bold text-white">
              Explainable by construction
            </h2>
          </div>
          <a
            href="/benchmarks"
            className="text-sm text-[#9C88FF] hover:text-[#C4B5FD] transition-colors flex items-center gap-1"
          >
            See it measured vs GPT-4o-mini <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {MATCH_STEPS.map((s) => (
            <div
              key={s.step}
              className="p-6 rounded-2xl bg-[#111111] border border-[#1E1E1E]"
            >
              <p className="text-[11px] font-mono text-[#9C88FF] mb-3">{s.step}</p>
              <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Three paths */}
      <div className="voisss-container py-12 border-t border-white/[0.06]">
        <div className="grid md:grid-cols-3 gap-4">
          {AUDIENCES.map((a) => (
            <a
              key={a.title}
              href={a.href}
              className="group p-6 rounded-2xl bg-[#111111] border border-[#1E1E1E] hover:border-[#7C5DFA]/40 hover:bg-[#7C5DFA]/[0.04] transition-all"
            >
              <a.icon className="w-6 h-6 text-[#9C88FF] mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{a.title}</h3>
              <p className="text-sm leading-relaxed text-zinc-400 mb-4">{a.desc}</p>
              <span className="text-sm text-[#9C88FF] group-hover:text-[#C4B5FD] transition-colors flex items-center gap-1">
                {a.cta} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="voisss-container mt-16 py-10 border-t border-white/[0.08]">
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
          <a href="https://github.com/thisyearnofear/VOISSS" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
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
