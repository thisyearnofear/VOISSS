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

function useTear() {
  const [tear, setTear] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ active: boolean; startX: number; startY: number; locked: "x" | "y" | null }>({
    active: false,
    startX: 0,
    startY: 0,
    locked: null,
  });

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
      }
    };
    const onPointerUp = () => {
      drag.current.active = false;
      drag.current.locked = null;
      setTear(0);
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
  }, []);

  return { tear, ref };
}

function RibbonCard({
  voice,
  tear,
  top,
  ceremony,
  reasons,
  shortlistButton,
  onPlayed,
}: {
  voice: MarketplaceVoice;
  tear: number;
  top: boolean;
  ceremony: boolean;
  reasons: string[];
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
  const flutter = abs > 0.02;
  const playback = useListeningPlayback();
  const playing = playback.track?.id === `sample:${voice.id}` && playback.status === "playing";

  return (
    <article
      className={
        "lr-card voisss-specular voisss-specular-light relative overflow-hidden" +
        (top ? " lr-card--match" : "") +
        (ceremony ? " lr-card--ceremony" : "")
      }
      style={{ touchAction: "pan-y" }}
    >
      {/* Loom ribbons — behind the content, clipped */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: flutter ? 0.9 : 0.18,
          transition: flutter ? "opacity 120ms ease" : "opacity 220ms ease",
        }}
      >
        {speeds.map((s, i) => {
          const nx = i / (RIBBON_COUNT - 1) - 0.5; // -0.5..0.5
          // SDF-ish: center holds, edge frays — tearZoneRatio 0.26
          const edge = Math.abs(nx) * 2; // 0 center .. 1 edge
          const hold = Math.max(0, 1 - edge / 0.26);
          const dx = tear * s * 44 * (0.3 + edge * 1.2) * (1 - hold * 0.55);
          const y = (i / RIBBON_COUNT) * 100;
          const h = 100 / RIBBON_COUNT;
          const bleach = hold < 0.35 ? abs * 0.18 * (1 - hold) : 0;
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
                willChange: "transform",
                transition: flutter ? "transform 80ms linear" : "transform 420ms cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          );
        })}
      </div>

      <div className="relative">
        <CurveRibbon voice={voice} playing={playing} tear={tear} />
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
        <Disclosure title="Provenance & trust" variant="inline">
          <p className="lr-quiet" style={{ marginTop: "0.5rem" }}>
            {voice.trust?.details || "No additional provenance details."}
          </p>
        </Disclosure>
        {/* Drag hint */}
        <p className="lr-quiet" style={{ fontSize: "0.7rem", opacity: 0.55, marginTop: "0.5rem" }}>
          Drag sideways to pull the weave →
        </p>
      </div>
    </article>
  );
}

export function UnwovenGrid({
  voices,
  topMatchId,
  ceremonyId,
  reasonsById,
  shortlistButton,
  onPlayed,
}: {
  voices: MarketplaceVoice[];
  topMatchId: string | null;
  ceremonyId: string | null;
  reasonsById: Record<string, string[]>;
  shortlistButton: (v: MarketplaceVoice) => React.ReactNode;
  onPlayed: (v: MarketplaceVoice) => void;
}) {
  const { tear, ref } = useTear();

  return (
    <div ref={ref} className="lr-list" style={{ touchAction: "pan-y" }}>
      {voices.map((voice) => (
        <RibbonCard
          key={voice.id}
          voice={voice}
          tear={tear}
          top={voice.id === topMatchId}
          ceremony={voice.id === ceremonyId}
          reasons={reasonsById[voice.id] ?? []}
          shortlistButton={shortlistButton(voice)}
          onPlayed={onPlayed}
        />
      ))}
    </div>
  );
}
