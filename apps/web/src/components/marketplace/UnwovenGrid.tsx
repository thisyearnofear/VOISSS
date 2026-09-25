"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import Link from "next/link";
import type { MarketplaceVoice } from "@/lib/marketplace-indexer";
import { VoiceAuditionRow, voiceDisplayName } from "@/components/listening/VoiceAuditionRow";
import { Badge, Chip, Disclosure } from "@/components/ui";
import { CurveRibbon } from "@/components/marketplace/CurveRibbon";
import { useListeningPlayback } from "@/contexts/ListeningRoomContext";

/**
 * UnwovenGrid — clementgrellier/unwoven lineage
 *
 * Each card is 26 ribbons; each ribbon has its own escape speed. At center =
 * solid card; drag across center → ribbons splay/flutter/bleach with low SDF
 * tearZoneRatio 0.26, then re-weave. The grid drag is a single pointer capture
 * on the section; cards lerp to their tear offset. No per-card listeners.
 *
 * Cheap to fake: translateX per ribbon, shared geometry, no BufferGeometry.
 * Touch: horizontal swipe = loom. Vertical scroll is preserved until horizontal
 * intent wins (threshold 14px).
 */

const RIBBON_COUNT = 18;
const UNWOVEN_THRESHOLD = 0.6; // tear must cross 60% to commit disclose — functional loom

function useTear(onThreshold?: () => void) {
  const [tear, setTear] = useState(0);
  const [committed, setCommitted] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ active: boolean; startX: number; startY: number; locked: "x" | "y" | null }>({
    active: false,
    startX: 0,
    startY: 0,
    locked: null,
  });
  const committedRef = useRef<string | null>(null);

  // Keep dwell long enough to read the TxHash; reduced-motion users never see ribbons
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onPointerDown = (e: PointerEvent) => {
      drag.current = { active: true, startX: e.clientX, startY: e.clientY, locked: null };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.startX;
      const dy = e.clientY - drag.current.startY;
      if (!drag.current.locked) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        drag.current.locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (drag.current.locked === "y") {
          drag.current.active = false;
          return;
        }
      }
      if (drag.current.locked === "x") {
        e.preventDefault();
        const w = el.clientWidth || 1;
        const t = Math.max(-1, Math.min(1, dx / (w * 0.38)));
        setTear(t);
        // Functional threshold: when tear crosses 60%, the card under cursor commits provenance
        if (Math.abs(t) >= UNWOVEN_THRESHOLD) {
          const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-voice-id]");
          const voiceId = target?.getAttribute("data-voice-id");
          if (voiceId && committedRef.current !== voiceId) {
            committedRef.current = voiceId;
            setCommitted(voiceId);
            onThreshold?.();
          }
        }
      }
    };
    const onPointerUp = () => {
      drag.current.active = false;
      drag.current.locked = null;
      setTear(0);
      window.setTimeout(() => {
        committedRef.current = null;
        setCommitted(null);
      }, 3200);
    };
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: false } as any);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove as any);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [onThreshold]);

  return { tear, committed, ref, prefersReducedMotion };
}

function ProvenancePeek({ voice, open }: { voice: MarketplaceVoice; open: boolean }) {
  if (!open) return null;
  const hash = voice.provenance?.listingTxHash;
  const href = hash ? `https://basescan.org/tx/${hash}` : voice.provenance?.contractAddress ? `https://basescan.org/address/${voice.provenance.contractAddress}` : null;
  return (
    <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5" role="region" aria-label="Provenance for this voice">
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/50">source: {voice.provenance?.source ?? "catalog"}</span>
        {voice.trust?.badge && <span className="rounded-full border border-[#D6FF2A]/20 bg-[#D6FF2A]/10 px-2 py-0.5 text-[#0A0E1A] font-bold">{voice.trust.badge}</span>}
        {hash ? (
          <a href={href!} target="_blank" rel="noopener noreferrer" className="voisss-phosphor rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 hover:bg-amber-500/15 transition-colors">
            Tx {hash.slice(0, 8)}…{hash.slice(-4)} ↗
          </a>
        ) : href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-white/60 hover:text-white transition-colors">
            Contract ↗
          </a>
        ) : null}
      </div>
      <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-white/50 line-clamp-2">{voice.trust?.details || "No additional provenance details."}</p>
    </div>
  );
}

function LoomHandle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Hide chain provenance" : "Inspect chain provenance"}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[10px] font-bold tracking-[0.08em] leading-none transition-colors ${isOpen ? "border-amber-500/30 bg-amber-500/10 text-amber-200" : "border-white/10 bg-white/[0.06] text-white/60 hover:border-white/15 hover:text-white/80"}`}
      >
        <span aria-hidden className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm border border-current opacity-60" style={{ background: "repeating-linear-gradient(to bottom, currentColor 0 1px, transparent 1px 3px)" }} />
          ↔
        </span>
        {isOpen ? "Hide chain" : "Drag to inspect"}
      </button>
      <span className="hidden sm:inline font-mono text-[10px] tracking-wide text-white/25" aria-hidden>
        or pull past 60% ·
      </span>
      <span className={`font-mono text-[10px] tracking-wide ${isOpen ? "text-amber-300/80" : "text-white/30"}`} aria-hidden>
        {isOpen ? "provenance open" : "60% threshold"}
      </span>
    </div>
  );
}

function RibbonCard({
  voice,
  tear,
  top,
  ceremony,
  reasons,
  dimensionLevels,
  committed,
  onCommit,
  prefersReducedMotion,
  shortlistButton,
  onPlayed,
}: {
  voice: MarketplaceVoice;
  tear: number;
  top: boolean;
  ceremony: boolean;
  reasons: string[];
  dimensionLevels?: Record<string, number>;
  committed: string | null;
  onCommit: (id: string | null) => void;
  prefersReducedMotion: boolean;
  shortlistButton: React.ReactNode;
  onPlayed: (v: MarketplaceVoice) => void;
}) {
  // Per-ribbon speeds — seeded by card id so the loom has memory
  const speeds = useMemo(() => {
    let h = 0;
    for (let i = 0; i < voice.id.length; i++) h = (h * 31 + voice.id.charCodeAt(i)) >>> 0;
    const r = (n: number) => {
      h = (h * 1664525 + 1013904223) >>> 0;
      return (h & 0xffff) / 0xffff;
    };
    return Array.from({ length: RIBBON_COUNT }, () => 0.55 + r(0) * 0.95);
  }, [voice.id]);

  const abs = Math.abs(tear);
  const flutter = !prefersReducedMotion && abs > 0.02;
  const playback = useListeningPlayback();
  const playing = playback.track?.id === `sample:${voice.id}` && playback.status === "playing";

  const isCommitted = committed === voice.id;
  return (
    <article
      data-voice-id={voice.id}
      className={
        "lr-card voisss-specular voisss-specular-light relative overflow-hidden" +
        (top ? " lr-card--match" : "") +
        (ceremony ? " lr-card--ceremony" : "") +
        (isCommitted ? " ring-1 ring-amber-500/30" : "")
      }
      style={{ touchAction: "pan-y" }}
    >
      {/* Loom ribbons — behind the content, clipped; disabled under reduced-motion */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: prefersReducedMotion ? 0.1 : flutter ? 0.9 : 0.18,
          transition: prefersReducedMotion ? "none" : flutter ? "opacity 120ms ease" : "opacity 220ms ease",
        }}
      >
        {speeds.map((s, i) => {
          const nx = i / (RIBBON_COUNT - 1) - 0.5; // -0.5..0.5
          // SDF-ish: center holds, edge frays — tearZoneRatio 0.26
          const edge = Math.abs(nx) * 2; // 0 center .. 1 edge
          const hold = Math.max(0, 1 - edge / 0.26);
          const dx = prefersReducedMotion ? 0 : tear * s * 44 * (0.3 + edge * 1.2) * (1 - hold * 0.55);
          const y = (i / RIBBON_COUNT) * 100;
          const h = 100 / RIBBON_COUNT;
          const bleach = prefersReducedMotion ? 0 : hold < 0.35 ? abs * 0.18 * (1 - hold) : 0;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${y}%`,
                height: `${h}%`,
                transform: `translateX(${dx}px)`,
                background: `linear-gradient(to right, transparent, rgba(214,255,42,${0.035 + bleach}) 32%, rgba(255,255,255,${0.04 + bleach * 0.5}) 52%, transparent)`,
                borderTop: "1px solid rgba(255,255,255,0.04)",
                willChange: prefersReducedMotion ? "auto" : "transform",
                transition: prefersReducedMotion ? "none" : flutter ? "transform 80ms linear" : "transform 420ms cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          );
        })}
      </div>

      <div className="relative">
        <LoomHandle isOpen={isCommitted} onToggle={() => onCommit(isCommitted ? null : voice.id)} />
        <CurveRibbon voice={voice} playing={playing} tear={prefersReducedMotion ? 0 : tear} />
        <VoiceAuditionRow voice={voice} onPlayed={onPlayed} actions={shortlistButton} />
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}>
          <Badge>
            {voice.source === "platform" ? "Platform · Pay per use" : `Listing · ${voice.licenseType}`}
          </Badge>
          {top && (
            <Badge style={{ borderColor: "var(--lr-accent)", color: "var(--lr-accent)" }}>Best match</Badge>
          )}
          <Link
            href={`/marketplace/voices/${encodeURIComponent(voice.id)}`}
            className="lr-nav-link"
            style={{ minHeight: 44, padding: 0 }}
          >
            Voice details
          </Link>
          {voice.source !== "platform" && <Chip onClick={() => {}}>License</Chip>}
        </div>
        {reasons.length > 0 && (
          <Disclosure title="Why this match?" variant="inline">
            <ul className="lr-reasons">
              {reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </Disclosure>
        )}
        {dimensionLevels && Object.keys(dimensionLevels).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {([["arousal", "energy"], ["pace", "pace"], ["expressiveness", "express"], ["warmth", "warmth"], ["authority", "authority"], ["intimacy", "intimacy"]] as const).map(([dim, short]) => {
              const v = dimensionLevels[dim];
              if (v == null) return null;
              return (
                <span key={dim} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px]">
                  <span className="text-white/40">{short}</span>
                  <span className="tabular-nums text-white/75">{Math.round(v * 100)}</span>
                </span>
              );
            })}
          </div>
        )}
        <ProvenancePeek voice={voice} open={isCommitted} />
        <Disclosure title="Provenance & trust" variant="inline">
          <p className="lr-quiet" style={{ marginTop: "0.5rem" }}>
            {voice.trust?.details || "No additional provenance details."}
          </p>
        </Disclosure>
      </div>
    </article>
  );
}

export function UnwovenGrid({
  voices,
  topMatchId,
  ceremonyId,
  reasonsById,
  dimensionLevelsById,
  shortlistButton,
  onPlayed,
}: {
  voices: MarketplaceVoice[];
  topMatchId: string | null;
  ceremonyId: string | null;
  reasonsById: Record<string, string[]>;
  dimensionLevelsById?: Record<string, Record<string, number>>;
  shortlistButton: (v: MarketplaceVoice) => React.ReactNode;
  onPlayed: (v: MarketplaceVoice) => void;
}) {
  const { tear, committed, ref, prefersReducedMotion } = useTear();
  const [manual, setManual] = useState<string | null>(null);
  const committedId = committed ?? manual;
  const handleCommit = (id: string | null) => {
    setManual(id);
    if (id) window.setTimeout(() => setManual((cur) => (cur === id ? null : cur)), 6000);
  };
  useEffect(() => { if (committed) setManual(null); }, [committed]);

  // FLIP spring-reorder — the brief re-weaves the fabric. Stagger per index,
  // translate-only, will-change, reduced-motion skips the translation.
  const positions = useRef<Map<string, DOMRect>>(new Map());
  const listRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = (el: HTMLDivElement | null) => {
    (ref as any).current = el;
    listRef.current = el;
  };
  const prevOrder = useRef<string[]>([]);
  const orderKey = voices.map((v) => v.id).join("|");
  useEffect(() => {
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { prevOrder.current = voices.map((v) => v.id); return; }
    const prev = prevOrder.current;
    const next = voices.map((v) => v.id);
    const moved = prev.length && prev.join("|") !== next.join("|");
    if (!moved) { prevOrder.current = next; return; }
    const root = listRef.current;
    if (!root) { prevOrder.current = next; return; }
    const els = new Map<string, HTMLElement>();
    root.querySelectorAll<HTMLElement>("[data-voice-id]").forEach((n) => {
      const id = n.getAttribute("data-voice-id");
      if (id) els.set(id, n);
    });
    const first = new Map<string, DOMRect>();
    for (const id of prev) {
      const el = els.get(id);
      if (el && positions.current.has(id)) first.set(id, positions.current.get(id)!);
      else if (el) first.set(id, el.getBoundingClientRect());
    }
    // next frame: measure last, invert
    requestAnimationFrame(() => {
      const anims: Animation[] = [];
      for (let i = 0; i < next.length; i++) {
        const id = next[i];
        const el = els.get(id);
        const f = first.get(id);
        if (!el || !f) continue;
        const last = el.getBoundingClientRect();
        const dy = f.top - last.top;
        if (Math.abs(dy) < 1) continue;
        el.style.willChange = "transform";
        const anim = el.animate(
          [{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }],
          { duration: 420, delay: Math.min(i * 28, 180), easing: "cubic-bezier(0.22,1,0.36,1)", fill: "both" }
        );
        anim.onfinish = () => { el.style.willChange = ""; };
        anims.push(anim);
      }
      // update positions for next reorder
      for (const [id, el] of els) positions.current.set(id, el.getBoundingClientRect());
      void anims;
    });
    prevOrder.current = next;
  }, [orderKey, voices]);
  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const m = new Map<string, DOMRect>();
    root.querySelectorAll<HTMLElement>("[data-voice-id]").forEach((n) => {
      const id = n.getAttribute("data-voice-id");
      if (id) m.set(id, n.getBoundingClientRect());
    });
    positions.current = m;
  }, [voices.length]);

  return (
    <div ref={mergedRef} className="voisss-warp" style={{ touchAction: "pan-y" }}>
      {voices.map((voice) => (
        <RibbonCard
          key={voice.id}
          voice={voice}
          tear={tear}
          top={voice.id === topMatchId}
          ceremony={voice.id === ceremonyId}
          reasons={reasonsById[voice.id] ?? []}
          dimensionLevels={dimensionLevelsById?.[voice.id]}
          committed={committedId}
          onCommit={handleCommit}
          prefersReducedMotion={prefersReducedMotion}
          shortlistButton={shortlistButton(voice)}
          onPlayed={onPlayed}
        />
      ))}
    </div>
  );
}
