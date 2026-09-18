"use client";

import { useEffect, useRef } from "react";

/**
 * ScrollLife — makes the whole page breathe, not just the hero.
 *
 * Two jobs, both cheap:
 *  1. Staged reveals. Any element with `data-reveal` (optionally
 *     `data-reveal-delay="1|2|3"`) gets `.is-in` once it enters the viewport,
 *     triggering a pure-CSS masked rise. One IntersectionObserver for the whole
 *     page, unobserved after it fires — no re-renders, no layout thrash.
 *  2. A hairline scroll progress rule — the page telling you it's moving.
 *     rAF-throttled, transform-only, so it never triggers layout.
 *
 * Markup stays server-rendered, so this degrades to plain visible content if
 * JS never arrives. Reduced motion is handled entirely in CSS.
 */
export default function ScrollLife() {
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const revealAll = () => nodes.forEach((n) => n.classList.add("is-in"));

    let io: IntersectionObserver | null = null;
    if (nodes.length > 0) {
      if (reduced || typeof IntersectionObserver === "undefined") {
        revealAll();
      } else {
        io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              entry.target.classList.add("is-in");
              io?.unobserve(entry.target);
            }
          },
          { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
        );
        nodes.forEach((n) => io?.observe(n));

        // Anything already on screen at load reveals immediately (no pop-in).
        requestAnimationFrame(() => {
          nodes.forEach((n) => {
            if (n.getBoundingClientRect().top < window.innerHeight * 0.9) {
              n.classList.add("is-in");
              io?.unobserve(n);
            }
          });
        });
      }
    }

    // ── progress rail ──────────────────────────────────────────────────────
    let frame = 0;
    let ticking = false;

    const paint = () => {
      ticking = false;
      const rail = railRef.current;
      if (!rail) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      rail.style.transform = `scaleX(${progress})`;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      frame = window.requestAnimationFrame(paint);
    };

    if (!reduced) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      paint();
    }

    // ── pointer specular (Sylva's moving rim) ───────────────────────────────
    // Delegated: one listener, writes two CSS vars on the hovered cell only.
    let lastCell: HTMLElement | null = null;
    const onPointerMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const cell = target?.closest<HTMLElement>(".voisss-specular") ?? null;
      if (lastCell && lastCell !== cell) {
        lastCell.style.removeProperty("--mx");
        lastCell.style.removeProperty("--my");
      }
      lastCell = cell;
      if (!cell) return;
      const rect = cell.getBoundingClientRect();
      cell.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      cell.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };

    if (!reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    return () => {
      io?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[60] hidden h-px pointer-events-none sm:block"
    >
      <div
        ref={railRef}
        className="h-full origin-left bg-gradient-to-r from-[#7C5DFA] via-[#9C88FF] to-[#22D3EE]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
