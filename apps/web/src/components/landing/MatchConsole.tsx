"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import rubric from "@/lib/matching/rubric.v1.json";
import { pulseVoice } from "@/lib/terrain-bus";

/**
 * MatchConsole — the landing page performs a match instead of describing one.
 *
 * Runs the exact scoring math from /api/marketplace/voice-match — weighted
 * distance to the detected archetype's target profile, decomposed into the
 * same auditable reason_labels — but deterministically, in the browser, on a
 * labeled demo roster. No Jev round-trip, no cost, no latency lottery: the
 * live marketplace runs this rubric per request; this panel replays it so the
 * promise is visible before the first click.
 */

type DimKey = keyof typeof rubric.dimensions;
type ArchetypeKey = keyof typeof rubric.archetypes;

const DIMENSIONS = Object.keys(rubric.dimensions) as DimKey[];

const DIM_SHORT: Record<DimKey, string> = {
  arousal: "energy",
  pace: "pace",
  expressiveness: "express",
  warmth: "warmth",
  authority: "authority",
  intimacy: "intimacy",
};

/** Demo roster — profiles chosen to span the rubric space so every archetype
 *  produces a visibly different ranking. Clearly labeled demo, never passed
 *  off as live listings. */
const DEMO_ROSTER: { id: string; title: string; role: string; profile: Record<DimKey, number> }[] = [
  {
    id: "demo-meadow",
    title: "Low Meadow",
    role: "sleep & calm",
    profile: { arousal: 0.12, pace: 0.18, expressiveness: 0.3, warmth: 0.82, authority: 0.32, intimacy: 0.85 },
  },
  {
    id: "demo-rally",
    title: "Studio Rally",
    role: "promo & launch",
    profile: { arousal: 0.84, pace: 0.68, expressiveness: 0.76, warmth: 0.5, authority: 0.6, intimacy: 0.28 },
  },
  {
    id: "demo-anchor",
    title: "Anchor North",
    role: "docs & news",
    profile: { arousal: 0.45, pace: 0.5, expressiveness: 0.5, warmth: 0.45, authority: 0.8, intimacy: 0.4 },
  },
  {
    id: "demo-neighbor",
    title: "Neighbor FM",
    role: "host & chat",
    profile: { arousal: 0.52, pace: 0.55, expressiveness: 0.6, warmth: 0.78, authority: 0.42, intimacy: 0.7 },
  },
];

// Order is priority: a "sleep story narrator" brief should resolve to
// meditation before narration, so wellness wins the earlier test.
const ARCHETYPE_HINTS: [ArchetypeKey, RegExp][] = [
  ["meditation", /sleep|calm|meditat|relax|soothe|wellness|unhurried|asmr|gentle|slow/i],
  ["advertising", /\bads?\b|promo|drop|launch|spot\b|commercial|urgent|hype|sell/i],
  ["narration", /audiobook|narrat|documentar|stor(y|ies)|chapter|longform|book/i],
  ["assistant", /assistant|ivr|onboard|app\b|product|ux\b|concierge|brand voice/i],
  ["character", /game|character|npc|animation|villain|hero\b|creature|cartoon/i],
  ["podcast", /podcast|host|interview|conversation|show\b|co-?host|chat/i],
];

const DEFAULT_BRIEF = "warm narrator for a sleep app, unhurried";

interface Ranked {
  id: string;
  title: string;
  role: string;
  score: number;
  reasons: string[];
  profile: Record<DimKey, number>;
}

interface MatchResult {
  archetype: ArchetypeKey;
  ranked: Ranked[];
  ms: number;
}

/** Mirrors the route's rubric pass: level vs archetype target, weighted by
 *  dimension weights; closeness ≥ 0.7 with a clear side becomes a reason. */
function runMatch(brief: string): MatchResult {
  const started = performance.now();
  const text = brief.trim() || DEFAULT_BRIEF;

  let archetype: ArchetypeKey = rubric.fallback_archetype as ArchetypeKey;
  let bestHits = 0;
  for (const [key, re] of ARCHETYPE_HINTS) {
    const hits = (text.match(new RegExp(re.source, "gi")) ?? []).length;
    if (hits > bestHits) {
      bestHits = hits;
      archetype = key;
    }
  }
  const target = rubric.archetypes[archetype];

  const ranked = DEMO_ROSTER.map((voice) => {
    let weightedDistance = 0;
    let totalWeight = 0;
    const matched: { closeness: number; weight: number; label: string }[] = [];

    for (const dim of DIMENSIONS) {
      const level = voice.profile[dim];
      const weight = target.weights[dim] ?? 0;
      if (weight <= 0) continue;
      const distance = Math.abs(level - (target.targets[dim] ?? 0.5));
      weightedDistance += weight * distance;
      totalWeight += weight;

      const closeness = 1 - distance;
      if (closeness >= 0.7) {
        const side = level < 0.4 ? "low" : level > 0.6 ? "high" : null;
        const label = side ? rubric.reason_labels[dim]?.[side as "low" | "high"] : undefined;
        if (label) matched.push({ closeness, weight, label });
      }
    }

    return {
      id: voice.id,
      title: voice.title,
      role: voice.role,
      score: totalWeight > 0 ? 1 - weightedDistance / totalWeight : 0,
      reasons: matched
        .sort((a, b) => b.weight * b.closeness - a.weight * a.closeness)
        .slice(0, 3)
        .map((m) => m.label),
      profile: voice.profile,
    };
  }).sort((a, b) => b.score - a.score);

  return { archetype, ranked, ms: Math.max(0.1, performance.now() - started) };
}

export default function MatchConsole({ brief }: { brief: string }) {
  // ms starts at 0: performance.now() differs between server and client
  // renders, so a measured value in first render breaks hydration. The
  // effect's first re-run supplies the real number.
  const [result, setResult] = useState<MatchResult>(() => ({ ...runMatch(""), ms: 0 }));
  const [sweepKey, setSweepKey] = useState(0);
  const [activeId, setActiveId] = useState<string>(result.ranked[0]?.id ?? "");
  const firstRun = useRef(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setResult(runMatch(brief));
      setSweepKey((k) => k + 1);
      if (!firstRun.current) pulseVoice("lift");
      firstRun.current = false;
    }, firstRun.current ? 500 : 260);
    return () => window.clearTimeout(timer);
  }, [brief]);

  const active = useMemo(
    () => result.ranked.find((r) => r.id === activeId) ?? result.ranked[0],
    [result, activeId]
  );
  const archetype = rubric.archetypes[result.archetype];

  return (
    <div className="voisss-container-lines voisss-corner-ticks voisss-specular relative overflow-hidden rounded-2xl bg-[#0A0A0A]/72 backdrop-blur-xl">
      {/* scan sweep — remounted per match so the instrument visibly re-reads */}
      <div key={sweepKey} className="voisss-scan-line" aria-hidden />

      {/* header — instrument identification, honest about the replay */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-white/[0.07] px-4 py-2.5">
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white/60">
          Match readout
        </span>
        <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.12em] text-white/40">
          <span>rubric v{rubric.version}</span>
          <span className="h-3 w-px bg-white/10" aria-hidden />
          <span className="text-[#EAFF6A]">archetype: {result.archetype}</span>
        </span>
      </div>

      <div className="px-4 pt-3 pb-1.5">
        <p className="text-[11px] leading-snug text-white/50">
          <span className="text-white/80">{archetype.label}</span>
          <span className="text-white/35"> — target: {archetype.outcome}</span>
        </p>
      </div>

      {/* six dimensions — the active voice's profile drawn against the target */}
      <div className="px-4 py-2.5 space-y-[7px]" role="img"
        aria-label={`${active.title} scored on six rubric dimensions against the ${result.archetype} target profile`}>
        {DIMENSIONS.map((dim) => {
          const level = active.profile[dim];
          const t = archetype.targets[dim] ?? 0.5;
          const w = archetype.weights[dim] ?? 0;
          return (
            <div key={dim} className="flex items-center gap-2.5">
              <span className="w-[74px] shrink-0 truncate text-[10px] font-mono uppercase tracking-[0.1em] text-white/45">
                {DIM_SHORT[dim]}
              </span>
              <div className="relative h-[5px] min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="voisss-dim-fill absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-[#D6FF2A] to-[#EAFF6A]"
                  style={{ transform: `scaleX(${level})`, opacity: 0.35 + w * 2.2 }}
                />
                <span
                  className="absolute inset-y-[-3px] w-px bg-white/45"
                  style={{ left: `${t * 100}%` }}
                  aria-hidden
                />
              </div>
              <span className="voisss-number-detail w-8 shrink-0 text-right text-[10px] font-mono text-white/55">
                {level.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      {/* ranked — the explainable part: score + auditable reason labels */}
      <ol className="border-t border-white/[0.06]">
        {result.ranked.slice(0, 3).map((v, i) => (
          <li key={v.id}>
            <button
              type="button"
              onMouseEnter={() => setActiveId(v.id)}
              onFocus={() => setActiveId(v.id)}
              onClick={() => setActiveId(v.id)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                active.id === v.id ? "bg-white/[0.045]" : "hover:bg-white/[0.025]"
              }`}
            >
              <span className="voisss-number-detail w-5 shrink-0 text-[10px] font-mono text-white/35">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-white">
                  {v.title}
                  <span className="ml-1.5 text-[10px] font-normal text-white/40">{v.role}</span>
                </span>
                <span className="mt-0.5 block truncate text-[10px] font-mono tracking-wide text-[#EAFF6A]">
                  {v.reasons.length ? v.reasons.join(" · ") : "partial fit"}
                </span>
              </span>
              <span className="voisss-number-detail shrink-0 text-[13px] font-mono text-white/85">
                {v.score.toFixed(2)}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {/* footer — honest provenance + measured in-browser latency */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-white/[0.07] px-4 py-2.5 text-[10px] font-mono uppercase tracking-[0.11em]">
        <span className="text-white/35">
          demo roster · {result.ms > 0 ? `scored in ${result.ms.toFixed(1)}ms` : "scored"} in-browser
        </span>
        <a
          href="/marketplace"
          className="inline-flex items-center gap-1 text-white/55 transition-colors hover:text-white"
        >
          live scoring <ArrowRight className="h-3 w-3" aria-hidden />
        </a>
      </div>
    </div>
  );
}
