"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import rubric from "@/lib/matching/rubric.v1.json";

type DimKey = keyof typeof rubric.dimensions;

const DIMS = Object.keys(rubric.dimensions) as DimKey[];
const SHORT: Record<DimKey, string> = {
  arousal: "energy",
  pace: "pace",
  expressiveness: "express",
  warmth: "warmth",
  authority: "authority",
  intimacy: "intimacy",
};

// Demo profiles to visualize scrub — same roster as MatchConsole but scrubbed
const DEMO = [
  { id: "meadow", title: "Low Meadow", role: "sleep & calm", p: { arousal: 0.12, pace: 0.18, expressiveness: 0.3, warmth: 0.82, authority: 0.32, intimacy: 0.85 } as Record<DimKey, number> },
  { id: "rally", title: "Studio Rally", role: "promo", p: { arousal: 0.84, pace: 0.68, expressiveness: 0.76, warmth: 0.5, authority: 0.6, intimacy: 0.28 } as Record<DimKey, number> },
  { id: "anchor", title: "Anchor North", role: "docs", p: { arousal: 0.45, pace: 0.5, expressiveness: 0.5, warmth: 0.45, authority: 0.8, intimacy: 0.4 } as Record<DimKey, number> },
];

const STAGES = [
  {
    id: "s/01",
    title: "Brief",
    desc: "Plain English — “warm narrator for a sleep app, unhurried”. No taxonomy to learn.",
    mono: "HUMAN →",
  },
  {
    id: "s/02",
    title: "Archetype",
    desc: "The brief resolves to a matching archetype — meditation, ad read, narration — each with its own target profile.",
    mono: "RESOLVE",
  },
  {
    id: "s/03",
    title: "Six dimensions",
    desc: "Every voice is scored on neutral acoustic dimensions: energy, pace, express, warmth, authority, intimacy.",
    mono: "SCORE",
  },
  {
    id: "s/04",
    title: "Ranked + reasons",
    desc: "Fit decomposes into auditable labels — “calm energy · unhurried · warm”. The rubric is versioned and cited.",
    mono: "RANK",
  },
];

function useScrubProgress(ref: React.RefObject<HTMLDivElement | null>) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (m) {
      setProgress(1);
      return;
    }
    let raf = 0;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      raf = requestAnimationFrame(() => {
        ticking = false;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // progress is 0 when top at bottom of viewport, 1 when bottom past top
        const total = rect.height - vh;
        const scrolled = Math.min(Math.max(-rect.top, 0), total);
        setProgress(total > 0 ? scrolled / total : 0);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);
  return progress;
}

export default function HomePipelineScrub() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const progress = useScrubProgress(wrapRef);
  const active = Math.min(3, Math.floor(progress * 4 * 0.99 + 0.01 * (progress > 0 ? 1 : 0)));
  const archetype = rubric.archetypes[STAGES[active]?.id === "s/02" ? "meditation" : active >= 2 ? "meditation" : "meditation"] as unknown as { label: string; outcome: string; targets: Record<string, number>; weights: Record<string, number> };
  // For s/03 we show meditation targets vs Low Meadow profile; for s/04 we show ranked
  const meadow = DEMO[0];
  const targets = (rubric.archetypes.meditation as unknown as { targets: Record<string, number>; weights: Record<string, number> }).targets;

  return (
    <section
      ref={wrapRef}
      className="voisss-scrub-wrap relative overflow-x-clip h-[180vh] sm:h-[300vh] sm:max-h-[2200px]"
      aria-label="How a match is made — scrub through"
    >
      <div className="sticky top-0 h-screen overflow-x-clip overflow-y-hidden flex flex-col">
        {/* HUD chrome — desktop only so mobile stays clean */}
        <div className="pointer-events-none absolute inset-0 border border-white/[0.06] rounded-[24px] mx-[clamp(20px,4vw,64px)] my-4 hidden sm:block" aria-hidden />
        <div className="pointer-events-none absolute inset-x-[clamp(20px,4vw,64px)] top-4 h-px bg-gradient-to-r from-transparent via-[#D6FF2A]/40 to-transparent hidden sm:block" aria-hidden />
        {/* scanline — lowered, desktop only */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.02] hidden sm:block" style={{ background: "repeating-linear-gradient(to bottom, transparent 0 2px, rgba(255,255,255,0.5) 2px 3px)" }} aria-hidden />

        <div className="lr-wrap w-full flex-1 flex flex-col justify-center py-8 sm:py-0">
          {/* header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6" data-reveal>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              How a match is made
            </h2>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 font-mono text-[11px] tracking-wide text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D6FF2A] shadow-[0_0_8px_rgba(214,255,42,0.7)] animate-pulse" />
              scrub to play · 4 stages
              <span className="hidden sm:inline text-white/30">· scroll</span>
            </span>
          </div>

          {/* progress VU */}
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/[0.06] border border-white/[0.06]">
            <div
              className="h-full origin-left bg-gradient-to-r from-[#D6FF2A] via-[#EAFF6A] to-[#22D3EE] transition-transform duration-100"
              style={{ transform: `scaleX(${progress})` }}
              aria-hidden
            />
          </div>

          <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.05fr_1.2fr] items-center">
            {/* Left: stage copy — crossfade via active */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-3 font-mono text-[11px] tracking-[0.18em] text-white/40">
                <span className="rounded-sm border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-white/70">{STAGES[active].id}</span>
                <span className="text-[#D6FF2A]">{STAGES[active].mono}</span>
                <span className="hidden sm:inline">rubric v{rubric.version} · view-timeline scrub</span>
              </div>

              <h3 className="font-display text-[28px] sm:text-[36px] font-bold tracking-tight text-white leading-none">
                {STAGES[active].title}
              </h3>
              <p className="mt-3 max-w-[34rem] text-[15px] leading-relaxed text-white/70">
                {STAGES[active].desc}
              </p>

              {/* mini stage nav — desktop clicks jump progress */}
              <div className="mt-5 flex flex-wrap gap-1.5">
                {STAGES.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-current={i === active ? "true" : undefined}
                    onClick={() => {
                      const el = wrapRef.current;
                      if (!el) return;
                      const rect = el.getBoundingClientRect();
                      const total = el.offsetHeight - window.innerHeight;
                      const target = (i + 0.5) / 4;
                      window.scrollTo({ top: window.scrollY + rect.top + total * target, behavior: "smooth" });
                    }}
                    className={`rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold tracking-wide transition-colors ${
                      i === active
                        ? "border-[#D6FF2A]/30 bg-[#D6FF2A] text-[#0A0E1A]"
                        : i < active
                          ? "border-white/10 bg-white/[0.08] text-white/70 hover:border-white/15"
                          : "border-white/10 bg-transparent text-white/45 hover:text-white/70"
                    }`}
                  >
                    {s.id} · {s.title}
                  </button>
                ))}
              </div>

              <p className="mt-5 font-mono text-[11px] text-white/30">
                Scroll to scrub · <Link href="/benchmarks" className="text-white/50 hover:text-white underline decoration-white/20 underline-offset-4">measured vs GPT-4o-mini →</Link>
              </p>
            </div>

            {/* Right: instrument — morphs per stage */}
            <div className="voisss-hud-frame p-4 sm:p-5 min-h-[280px] flex flex-col justify-center">
              {/* subtle lime glow */}
              <div className="pointer-events-none absolute inset-0 rounded-[16px] bg-[radial-gradient(60%_60%_at_80%_10%,rgba(214,255,42,0.08),transparent_60%)]" aria-hidden />

              {active === 0 && (
                <div className="relative">
                  <div className="font-mono text-[10px] tracking-[0.16em] text-white/40 mb-2">s/01 · BRIEF · HUMAN</div>
                  <div className="rounded-xl border border-white/10 bg-[#0A0E1A] px-4 py-3 flex items-center gap-3">
                    <span className="hidden sm:inline-flex h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs">✦</span>
                    <span className="flex-1 font-mono text-sm text-white/85 truncate">warm narrator for a sleep app, unhurried</span>
                    <span className="h-5 w-0.5 bg-[#D6FF2A] animate-pulse" aria-hidden />
                  </div>
                  <p className="mt-3 font-mono text-xs text-white/45">No taxonomy. Plain English resolves to an archetype.</p>
                </div>
              )}

              {active === 1 && (
                <div className="relative">
                  <div className="font-mono text-[10px] tracking-[0.16em] text-white/40 mb-2">s/02 · ARCHETYPE · RESOLVE</div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#D6FF2A]/30 bg-[#D6FF2A]/10 px-3 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#D6FF2A] shadow-[0_0_10px_rgba(214,255,42,0.9)]" />
                    <span className="font-mono text-xs font-bold tracking-wide text-[#0A0E1A]">meditation</span>
                    <span className="hidden sm:inline font-mono text-[11px] text-black/60">· {rubric.archetypes.meditation.label}</span>
                  </div>
                  <p className="mt-3 font-mono text-xs text-white/45">{rubric.archetypes.meditation.label} · target: {(rubric.archetypes.meditation as unknown as { outcome: string }).outcome}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[11px]">
                    {Object.entries(targets).slice(0, 4).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5">
                        <span className="text-white/45">{k}</span>
                        <span className="text-white/80 tabular-nums">{(v as number).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {active === 2 && (
                <div className="relative">
                  <div className="font-mono text-[10px] tracking-[0.16em] text-white/40 mb-2">s/03 · SIX DIMS · SCORE</div>
                  <div className="space-y-2.5">
                    {DIMS.map((dim) => {
                      const level = meadow.p[dim] ?? 0.5;
                      const target = (targets[dim] as number) ?? 0.5;
                      return (
                        <div key={dim} className="flex items-center gap-2">
                          <span className="w-[72px] shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-white/45 truncate">{SHORT[dim]}</span>
                          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#D6FF2A] to-[#EAFF6A] transition-[width] duration-300" style={{ width: `${level * 100}%`, opacity: 0.9 }} />
                            <span className="absolute inset-y-[-2px] w-px bg-white/50" style={{ left: `${target * 100}%` }} aria-hidden />
                          </div>
                          <span className="w-9 text-right font-mono text-[11px] tabular-nums text-white/55">{level.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 font-mono text-[11px] text-white/35">Low Meadow · vs meditation target · <span className="text-white/60">vertical line = target</span></p>
                </div>
              )}

              {active === 3 && (
                <div className="relative">
                  <div className="font-mono text-[10px] tracking-[0.16em] text-white/40 mb-2">s/04 · RANKED · REASONS</div>
                  <ol className="space-y-2">
                    {[
                      { n: "01", title: "Low Meadow", score: "0.89", reasons: "calm energy · unhurried · warm" },
                      { n: "02", title: "Neighbor FM", score: "0.62", reasons: "warm · intimate" },
                      { n: "03", title: "Anchor North", score: "0.48", reasons: "partial fit" },
                    ].map((r) => (
                      <li key={r.n} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                        <span className="font-mono text-[11px] tabular-nums text-white/30">{r.n}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-white truncate">{r.title}</span>
                          <span className="block font-mono text-[11px] tracking-wide text-[#EAFF6A] truncate">{r.reasons}</span>
                        </span>
                        <span className="font-mono text-sm tabular-nums text-white/80">{r.score}</span>
                      </li>
                    ))}
                  </ol>
                  <Link href="/marketplace" className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-white/60 hover:text-white transition-colors">
                    live scoring <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* bottom mono rule */}
          <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-[11px] text-white/25">
            <span className="voisss-phosphor text-[11px]">70/30</span>
            <span>on-chain split · platformFeeBps 3000 ·</span>
            <span className="hidden sm:inline">rubric v{rubric.version} · cites Rodero 2022 · Belin 2017 · Klofstad 2012</span>
            <Link href="/developers" className="ml-auto inline-flex items-center gap-1 text-white/40 hover:text-white">
              API <span className="hidden sm:inline">· POST /api/agents/vocalize</span> <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
