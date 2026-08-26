"use client";

/* ─────────────────────────────────────────────────────────────────────────────
 * INSIGHT CARDS — carousel of insight cards with mini visualizations
 *
 * Each card shows a title, numeric value, and a sparkline or bar chart
 * built from SVG. Autoplay yields on first interaction.
 * ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from "react";

type InsightPoint = { time: number; value: number };

function makePoints(values: number[], gap = 6): InsightPoint[] {
  const end = Math.floor(Date.now() / 1000);
  return values.map((value, index) => ({
    time: end - (values.length - 1 - index) * gap,
    value,
  }));
}

function smooth(values: number[], perSegment = 9): number[] {
  if (values.length < 3) return values.slice();
  const out: number[] = [];
  const n = values.length;
  for (let i = 0; i < n - 1; i += 1) {
    const p0 = values[Math.max(0, i - 1)];
    const p1 = values[i];
    const p2 = values[i + 1];
    const p3 = values[Math.min(n - 1, i + 2)];
    for (let s = 0; s < perSegment; s += 1) {
      const t = s / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push(
        0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3),
      );
    }
  }
  out.push(values[n - 1]);
  return out;
}

function formatPercent(v: number) {
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
}
function formatMoney(v: number) {
  return `$${Math.round(v).toLocaleString("en-US")}`;
}

/* ── Sparkline chart (pure SVG) ───────────────────────────────────────────── */

function Sparkline({
  data,
  color,
  height = 60,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 280;
  const pad = 4;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* gradient fill under line */}
      <polyline
        points={`${w},${height} ${points} 0,${height}`}
        fill={color}
        opacity="0.08"
      />
    </svg>
  );
}

/* ── Bar chart with threshold ──────────────────────────────────────────────── */

function BarChart({
  data,
  threshold,
  color,
  height = 60,
}: {
  data: number[];
  threshold: number;
  color: string;
  height?: number;
}) {
  const max = Math.max(...data, threshold) * 1.2;
  const barW = 24;
  const gap = 8;
  const w = data.length * (barW + gap);
  const pad = 4;

  return (
    <svg viewBox={`0 0 ${Math.max(w, 200)} ${height}`} className="w-full" preserveAspectRatio="none">
      {/* threshold line */}
      <line
        x1={0}
        y1={pad + (1 - threshold / max) * (height - pad * 2)}
        x2={w}
        y2={pad + (1 - threshold / max) * (height - pad * 2)}
        stroke="rgb(239,68,68)"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.6"
      />
      {data.map((v, i) => {
        const x = i * (barW + gap);
        const barH = (v / max) * (height - pad * 2);
        const isAbove = v > threshold;
        return (
          <rect
            key={i}
            x={x}
            y={height - pad - barH}
            width={barW}
            height={barH}
            rx={3}
            fill={isAbove ? color : "rgb(75,85,99)"}
            opacity={isAbove ? 0.9 : 0.4}
          />
        );
      })}
    </svg>
  );
}

/* ── Insight data ─────────────────────────────────────────────────────────── */

const INSIGHTS = [
  {
    key: "spend",
    title: "High freezer spend",
    subtitle: "Anomaly detected",
    hero: "$2,112",
    delta: "+$1,834.66 vs 3 months",
    chart: (
      <BarChart
        data={makePoints([274, 289, 264, 307, 331, 1210, 1718, 2112], 7).map((p) => p.value)}
        threshold={600}
        color="#ef4444"
        height={100}
      />
    ),
    action: "Get tips on cutting costs",
  },
  {
    key: "revenue",
    title: "Revenue trend",
    subtitle: "Last 14 days",
    hero: "+$8,420",
    delta: "+12.4% from previous period",
    chart: (
      <Sparkline
        data={smooth([4.2, 4.5, 4.8, 4.6, 5.1, 5.3, 5.0, 5.8, 6.1, 5.9, 6.4, 6.8, 7.2, 8.4])}
        color="#10b981"
        height={100}
      />
    ),
    action: "See full revenue breakdown",
  },
  {
    key: "voices",
    title: "Voice usage",
    subtitle: "Per category",
    hero: "34,892",
    delta: "Pistachio leads at 28%",
    chart: (
      <BarChart
        data={[120, 98, 87, 64, 45, 32]}
        threshold={100}
        color="#7C5DFA"
        height={100}
      />
    ),
    action: "Explore voice categories",
  },
];

/* ── Exported Component ───────────────────────────────────────────────────── */

export default function InsightCards() {
  const [page, setPage] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const move = (direction: -1 | 1) => {
    setPage((current) => (current + direction + INSIGHTS.length) % INSIGHTS.length);
    setAutoPlay(false);
  };

  const insight = INSIGHTS[page];

  // Auto-advance (yields on interaction)
  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => move(1), 6000);
    return () => clearInterval(t);
  }, [autoPlay]);

  return (
    <div className="min-h-[340px] w-full max-w-86 rounded-xl bg-gray-900 p-4 shadow-md">
      {/* pager header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] font-semibold text-white">Insights</span>
          <span className="text-[13px] text-gray-500 tabular-nums">{page + 1} / {INSIGHTS.length}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {(["M9 6l6 6-6 6", "M15 18l-6-6 6-6"] as const).map((d, i) => (
            <button
              key={i}
              aria-label={i === 0 ? "Previous insight" : "Next insight"}
              onClick={() => move(i === 0 ? -1 : 1)}
              className="flex size-6 items-center justify-center rounded-lg text-gray-500 transition-colors duration-100 hover:bg-gray-800 hover:text-white active:scale-95"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d={d} />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* card content */}
      <div className="transition-[opacity,filter] duration-250" style={{ opacity: 1, filter: "blur(0)" }}>
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-[15px] font-semibold tracking-tight text-white tabular-nums">{insight.hero}</span>
          <span className="text-[11px] text-gray-500">{insight.delta}</span>
        </div>
        <div className="mb-2 overflow-hidden rounded-lg bg-gray-800/50 p-2 shadow-inner">
          {insight.chart}
        </div>
        <div className="mb-2 flex items-center gap-1.5">
          <span className="text-[12px] font-medium text-white">{insight.title}</span>
          <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-400">
            {insight.subtitle}
          </span>
        </div>
        <button className="rounded-full bg-gray-800 px-3 py-1.5 text-left text-[12px] text-gray-300 shadow-sm transition-colors duration-100 hover:bg-gray-700">
          {insight.action}
        </button>
      </div>
    </div>
  );
}