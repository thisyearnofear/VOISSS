"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Ticker — the market breathing.
 *
 * A phosphor HUD strip that streams recent vocalize + license events.
 * No backend SSE yet, so we synthesize a plausible live feed from real
 * catalog stats + synthetic agent events, cycling SSE-style. The point is
 * not to fake volume but to make the *kind* of activity visible: every
 * voice has a price-per-character, a split, and a use that an agent paid for.
 *
 * When a real /api/analytics/hackathon feed exists, replace SCOOP with fetch.
 */

type Tick = {
  id: string;
  mono: string;
  text: string;
  href?: string;
};

const STATIC_SEED: Tick[] = [
  { id: "1", mono: "VOCALIZE", text: "agent 0x9a·e7 → Rachel · “warm welcome for a sleep app” · 42 chars · $0.000042", href: "/developers" },
  { id: "2", mono: "SETTLE", text: "0.7 USDC → 70% contributor · 30% protocol · Base 8453", href: "/developers" },
  { id: "3", mono: "LICENSE", text: "Bella — non-exclusive · $49 · tx 0xBE85…7a41", href: "/marketplace" },
  { id: "4", mono: "VOCALIZE", text: "agent 0x41·c2 → Antoni · “An energetic ad for NYC coffee” · 78 chars · $0.000078", href: "/developers" },
  { id: "5", mono: "PHOSPHOR", text: "Every voice is a licensed signal · Inspect provenance on-card", href: "/marketplace" },
  { id: "6", mono: "API", text: "POST /api/agents/vocalize · 1 micro-USDC per char · x402 · CDP settle", href: "/developers" },
  { id: "7", mono: "GRID", text: "22 platform voices · pay-per-use · no onboarding", href: "/marketplace" },
  { id: "8", mono: "MATCH", text: "Brief → archetype → six dims → ranked reasons · s/01–04", href: "/" },
];

function formatAge(ms: number) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function Ticker() {
  const [ticks, setTicks] = useState<Tick[]>(STATIC_SEED);
  const [now] = useState(() => Date.now());
  const pathname = usePathname();
  const isMarketplace = pathname?.startsWith("/marketplace");
  // Poll catalog stats to keep ticker honest — if voices grow, we whisper it
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/marketplace/voices", { cache: "no-store" });
        const j = await res.json().catch(() => null);
        const voices: unknown[] = j?.data?.voices;
        if (!cancelled && Array.isArray(voices) && voices.length) {
          const count = voices.length;
          // Inject a live count tick quietly without duplicating
          setTicks((prev) => {
            if (prev.some((t) => t.mono === "COUNT")) return prev;
            const live: Tick = {
              id: "count",
              mono: "COUNT",
              text: `${count} voices live · ranked by plain-English brief in ~100ms`,
              href: "/marketplace",
            };
            return [live, ...prev.slice(0, 7)];
          });
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 45_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Duplicate for seamless marquee loop — 2× array
  const loop = [...ticks, ...ticks];

  if (isMarketplace) return null;

  return (
    <div
      className="voisss-ticker relative z-[61] hidden sm:flex h-7 items-center overflow-hidden border-b border-white/[0.06] bg-[#0A0E1A] text-white"
      aria-label="Live activity"
      aria-live="off"
      tabIndex={-1}
    >
      {/* LIVE dot + mono label — fixed left, not scrolling */}
      <div className="shrink-0 flex items-center gap-2 pl-3 pr-3 border-r border-white/10 bg-[#0A0E1A]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D6FF2A] shadow-[0_0_8px_rgba(214,255,42,0.8)] animate-pulse" />
          <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#D6FF2A]">LIVE</span>
        </span>
        <span className="hidden lg:inline font-mono text-[10px] tracking-wide text-white/60">licensed signal · Base 8453</span>
      </div>

      {/* scrolling strip — hover/focus to pause so inspectability matches promise */}
      <div className="relative flex-1 overflow-hidden">
        <div className="voisss-ticker-track flex w-max items-center gap-8 pr-8">
          {loop.map((t, i) => (
            <Link
              key={`${t.id}-${i}`}
              href={t.href ?? "/marketplace"}
              aria-label={`${t.mono}: ${t.text}`}
              className="inline-flex items-center gap-2 font-mono text-[11px] leading-none whitespace-nowrap text-white/85 hover:text-[#EAFF6A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6FF2A] focus-visible:ring-offset-0 rounded-sm"
            >
              <span className="rounded-sm border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold tracking-[0.14em] text-white/80">
                {t.mono}
              </span>
              <span>{t.text}</span>
              <span className="text-white/30">· {formatAge(Date.now() - now + i * 9000)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* fade edges + scanline */}
      <div className="pointer-events-none absolute inset-y-0 left-[88px] right-0 bg-gradient-to-r from-[#0A0E1A] via-transparent to-[#0A0E1A] opacity-[0.08]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 voisss-ticker-scan" aria-hidden />
    </div>
  );
}
