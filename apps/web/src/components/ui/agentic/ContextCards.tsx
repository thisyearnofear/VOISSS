"use client";

/* ─────────────────────────────────────────────────────────────────────────────
 * CONTEXT CARDS — retrieved chunks display
 *
 * Retrieved chunks enter once, then remain available for inspection.
 * Shows title, length, body, and source file badge.
 * ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";

const CHUNKS = [
  {
    title: "Vendor onboarding rule",
    chars: "290 characters",
    body: "Cold-chain certification must be verified before a new dairy can be added to the reorder workflow.",
    source: "Dairy Onboarding SOP.pdf",
    badge: "PDF",
    tone: "bg-red-500",
  },
  {
    title: "Seasonal demand row",
    chars: "1,250 characters",
    body: "Q4 velocity table: pistachio +18%, vanilla +6%, rocky road -11%; retire flavors below 40 scoops weekly.",
    source: "Sales Velocity Export.csv",
    badge: "CSV",
    tone: "bg-green-500",
  },
  {
    title: "Agent licensing terms",
    chars: "840 characters",
    body: "Agents must obtain explicit voice-use consent. Revenue share applies per licensed character block.",
    source: "VOICE_LICENSE.md",
    badge: "MD",
    tone: "bg-blue-500",
  },
];

export default function ContextCards({ limit }: { limit?: number }) {
  const [chipsShown, setChipsShown] = useState(false);
  const displayChunks = limit ? CHUNKS.slice(0, limit) : CHUNKS;

  useEffect(() => {
    const chips = setTimeout(() => setChipsShown(true), 700);
    return () => clearTimeout(chips);
  }, []);

  return (
    <div className="flex w-full max-w-95 flex-col gap-2">
      <div
        className="flex items-center gap-2 px-0.5"
        style={{ animation: "fade-in 400ms ease-out both" }}
      >
        <span className="text-[13px] font-semibold text-white">All chunks</span>
        <span className="inline-flex h-5 items-center rounded-md bg-gray-800 px-1.5 text-[11.5px] font-medium text-gray-400 shadow-sm tabular-nums">
          {CHUNKS.length}
        </span>
      </div>

      {displayChunks.map((chunk, i) => (
        <div
          key={chunk.title}
          className="overflow-hidden rounded-xl bg-gray-900 shadow-md"
          style={{ animation: `fade-up 400ms cubic-bezier(0.23,1,0.32,1) ${i * 100}ms both` }}
        >
          <div className="flex items-center gap-2.5 border-b border-gray-700 px-3 py-2">
            <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-white">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h10" />
              </svg>
              <span className="truncate">{chunk.title}</span>
            </span>
            <span className="ml-auto shrink-0 text-[12px] text-gray-500 tabular-nums">{chunk.chars}</span>
          </div>
          <p className="px-3 pt-2 pb-1 text-[12.5px] leading-relaxed text-gray-400">{chunk.body}</p>
          <div className="px-3 pb-3">
            <span
              className="inline-flex h-6 items-center gap-1.5 rounded-full bg-gray-800 px-2 text-[12px] font-medium text-gray-400 shadow-sm transition-all duration-300 hover:bg-gray-700"
              style={{
                opacity: chipsShown ? 1 : 0,
                transform: chipsShown ? "scale(1)" : "scale(0.95)",
                transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
                transitionDelay: `${i * 80}ms`,
              }}
            >
              <span className={`flex size-3.5 items-center justify-center rounded-[4px] ${chunk.tone} text-[7px] font-bold text-white`}>
                {chunk.badge}
              </span>
              {chunk.source}
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}