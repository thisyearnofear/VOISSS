"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────────
 * VOISSS MASCOT — Head-based avatar with a signature waveform halo
 *
 * Unique identifier: an arc of vertical bars above the head that behaves like
 * a sound-wave visualiser — bars rise when listening or talking, pulse when
 * thinking, and glow when happy / celebrating.
 *
 * Inspired by:
 *   • bible-strong-avatar — head geometry + path morphing + expression system
 *   • ip-as-logo-skill     — 2-3 semantic colours, bold silhouette, 32px
 *                           recognisability
 *
 * Events: the mascot reacts to app-level events via the MoodContext.
 *
 * Mood states:
 *   wave          — default idle; bars settle, one ear twinkle
 *   listen        — bars sweep left→right, body breathes
 *   talk          — bars burst outward, mouth opens wide
 *   happy         — bars glow purple, soft bounce
 *   think         — bars dim, one eye looks up
 *   celebrate     — bars flash gold, body jumps
 * ────────────────────────────────────────────────────────────────────────────── */

// ── Types ────────────────────────────────────────────────────────────────────

export type MascotMood =
  | "wave"
  | "listen"
  | "talk"
  | "happy"
  | "think"
  | "celebrate";

export type MascotSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface VoissMascotProps {
  mood?: MascotMood;
  size?: MascotSize;
  className?: string;
  interactive?: boolean;
  onMoodChange?: (mood: MascotMood) => void;
  /** When true, the mascot cycles through moods on click. */
  cycle?: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const SIZE_MAP: Record<MascotSize, number> = {
  xs: 28,
  sm: 48,
  md: 80,
  lg: 120,
  xl: 160,
};

const BAR_COUNT = 7;

const MOOD_ORDER: MascotMood[] = [
  "wave",
  "listen",
  "talk",
  "happy",
  "think",
  "celebrate",
];

// ── Context for event-driven moods ──────────────────────────────────────────

const MoodDispatch = /* @__PURE__ */ new Set<
  (mood: MascotMood, reason?: string) => void
>();

/** Publish an event that the mascot should react to. */
export function publishMoodEvent(
  mood: MascotMood,
  reason?: string,
): void {
  for (const fn of MoodDispatch) fn(mood, reason);
}

/** Consume the mascot's native event bus. Call once per app lifecycle. */
export function useMascotContext(): {
  currentMood: MascotMood;
  moodReason: string | null;
} {
  const [mood, setMood] = useState<MascotMood>("wave");
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const fn = (m: MascotMood, r?: string) => {
      setMood(m);
      setReason(r ?? null);
    };
    MoodDispatch.add(fn);
    return () => {
      MoodDispatch.delete(fn);
    };
  }, []);

  return { currentMood: mood, moodReason: reason };
}

// ── Waveform bars (the VOISSS signature) ─────────────────────────────────────

/** Normalised bar height (0 → ~1.15) for a given mood/bar/time. */
function barLevel(mood: MascotMood, i: number, t: number): number {
  switch (mood) {
    case "listen":
      return (Math.sin(t * 3 + i * 0.7) * 0.5 + 0.5) * 0.95;
    case "talk":
      return (Math.sin(t * 5 + i * 0.4) * 0.35 + 0.65) * 1.1;
    case "happy":
      return 0.7;
    case "think":
      return 0.25;
    case "celebrate":
      return (Math.sin(t * 8 + i * 1.2) >= 0 ? 1.0 : 0.5) * 1.15;
    default: // wave
      return (Math.sin(i * 0.6 + t * 1.2) * 0.3 + 0.5) * 0.7;
  }
}

function barColor(mood: MascotMood): string {
  if (mood === "celebrate") return "#FBBF24"; // amber-400
  if (mood === "happy") return "#C084FC"; // purple-400
  if (mood === "think") return "#6B7280"; // gray-500
  return "#9C88FF"; // voiss purple
}

function WaveformBars({ mood, size }: { mood: MascotMood; size: number }) {
  // Everything scales with `size` so the halo reads the same at every dimension.
  const cx = size * 0.5; // centre on the head, not a hard-coded constant
  const cy = size * 0.12; // centre of the halo arc, above the crown
  const barW = size * 0.032;
  const gap = size * 0.019;
  const barMaxH = size * 0.2;
  const totalW = BAR_COUNT * barW + (BAR_COUNT - 1) * gap;
  const startX = cx - totalW / 2;

  const seed = () =>
    Array.from({ length: BAR_COUNT }, (_, i) =>
      barLevel(mood, i, 0) * barMaxH,
    );

  const [bars, setBars] = useState<number[]>(seed);
  const rafRef = useRef<number>();

  useEffect(() => {
    // Respect reduced-motion: render a static frame, no rAF loop.
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setBars(Array.from({ length: BAR_COUNT }, (_, i) => barLevel(mood, i, 0) * barMaxH));
      return;
    }
    const loop = () => {
      const t = Date.now() / 1000;
      setBars(Array.from({ length: BAR_COUNT }, (_, i) => barLevel(mood, i, t) * barMaxH));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, size]);

  const fill = barColor(mood);
  const opacity = mood === "think" ? 0.5 : mood === "celebrate" ? 0.95 : 0.85;

  return (
    <g aria-hidden>
      {bars.map((h, i) => (
        <rect
          key={i}
          x={startX + i * (barW + gap)}
          y={cy - h / 2}
          width={barW}
          height={h}
          rx={barW / 2}
          fill={fill}
          opacity={opacity}
        />
      ))}
    </g>
  );
}

// ── Head geometry (path-based morphing) ──────────────────────────────────────

function HeadGeometry({
  mood,
  size,
}: {
  mood: MascotMood;
  size: number;
}) {
  // Round "Halo Orb" body — headphone-wearing character.
  const cx = size * 0.5;
  const cy = size * 0.56;
  const rx = size * 0.35;
  const ry = size * 0.37;

  // Mouth path per mood
  const mouthPath = (() => {
    const my = cy + ry * 0.28;
    switch (mood) {
      case "happy":
        return `M ${cx - rx * 0.32} ${my} Q ${cx} ${my + ry * 0.34} ${cx + rx * 0.32} ${my} Z`;
      case "celebrate":
        return `M ${cx - rx * 0.34} ${my - ry * 0.02} Q ${cx} ${my + ry * 0.42} ${cx + rx * 0.34} ${my - ry * 0.02} Z`;
      case "talk":
        return `M ${cx - rx * 0.2} ${my} Q ${cx} ${my + ry * 0.28} ${cx + rx * 0.2} ${my} Z`;
      case "think":
        return `M ${cx - rx * 0.14} ${my} L ${cx + rx * 0.14} ${my}`;
      default:
        return `M ${cx - rx * 0.22} ${my} Q ${cx} ${my + ry * 0.2} ${cx + rx * 0.22} ${my}`;
    }
  })();
  const mouthFilled = mood === "happy" || mood === "celebrate" || mood === "talk";

  // Eye openness per mood
  const eyeH = mood === "happy" ? 0.55 : mood === "celebrate" ? 0.85 : 1;
  const eyeCy =
    mood === "think" ? cy - ry * 0.24 : cy - ry * 0.12; // look up when thinking
  const eyeDX = rx * 0.34;
  const eyeRx = rx * 0.13;
  const eyeRy = rx * 0.18 * eyeH;

  // Headphone geometry
  const cupCY = cy - ry * 0.02;
  const cupDX = rx * 0.98;
  const cupRx = rx * 0.3;
  const cupRy = rx * 0.4;
  const bandY = cupCY - cupRy * 0.7;
  const bandPath = `M ${cx - cupDX} ${bandY} Q ${cx} ${cy - ry * 1.2} ${cx + cupDX} ${bandY}`;

  const Eye = ({ side }: { side: -1 | 1 }) => (
    <g>
      <motion.ellipse
        cx={cx + side * eyeDX}
        cy={eyeCy}
        rx={eyeRx}
        ry={eyeRy}
        fill="#241245"
        animate={
          mood === "celebrate"
            ? { cy: [eyeCy, eyeCy - ry * 0.04, eyeCy] }
            : {}
        }
        transition={{ duration: 0.35, repeat: mood === "celebrate" ? Infinity : 0 }}
      />
      {/* highlight */}
      {eyeH > 0.6 && (
        <circle
          cx={cx + side * eyeDX - eyeRx * 0.35}
          cy={eyeCy - eyeRy * 0.4}
          r={eyeRx * 0.4}
          fill="white"
          opacity={0.9}
        />
      )}
    </g>
  );

  const Cup = ({ side }: { side: -1 | 1 }) => (
    <g>
      {/* outer ear-cup shell */}
      <ellipse
        cx={cx + side * cupDX}
        cy={cupCY}
        rx={cupRx}
        ry={cupRy}
        fill="#FFFFFF"
      />
      {/* inner disc — pulses when listening */}
      <motion.ellipse
        cx={cx + side * cupDX}
        cy={cupCY}
        rx={cupRx * 0.55}
        ry={cupRy * 0.55}
        fill="#7C5DFA"
        style={{ originX: `${cx + side * cupDX}px`, originY: `${cupCY}px` }}
        animate={
          mood === "listen"
            ? { scale: [1, 1.18, 1] }
            : mood === "wave"
              ? { opacity: [0.85, 1, 0.85] }
              : {}
        }
        transition={{
          duration: mood === "listen" ? 0.6 : 2,
          delay: side === 1 ? 0.15 : 0,
          repeat: mood === "listen" || mood === "wave" ? Infinity : 0,
          repeatType: "reverse",
        }}
      />
    </g>
  );

  return (
    <g>
      {/* ── Round body ── */}
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="url(#voiss-body-grad)"
        animate={
          mood === "listen"
            ? { rx: rx * 1.02, ry: ry * 0.98 }
            : mood === "celebrate"
              ? { ry: ry * 1.05 }
              : {}
        }
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
      />

      {/* ── Headphones: band behind cups ── */}
      <path
        d={bandPath}
        stroke="#FFFFFF"
        strokeWidth={size * 0.05}
        strokeLinecap="round"
        fill="none"
      />
      <Cup side={-1} />
      <Cup side={1} />

      {/* ── Eyes ── */}
      <Eye side={-1} />
      <Eye side={1} />

      {/* ── Blush (happy / celebrate) ── */}
      <AnimatePresence>
        {(mood === "happy" || mood === "celebrate") && (
          <>
            <motion.ellipse
              cx={cx - rx * 0.46}
              cy={cy + ry * 0.12}
              rx={rx * 0.13}
              ry={ry * 0.07}
              fill="#C084FC"
              opacity={0.35}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
            />
            <motion.ellipse
              cx={cx + rx * 0.46}
              cy={cy + ry * 0.12}
              rx={rx * 0.13}
              ry={ry * 0.07}
              fill="#C084FC"
              opacity={0.35}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── Mouth ── */}
      <motion.path
        d={mouthPath}
        stroke="#241245"
        strokeWidth={size * 0.02}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={mouthFilled ? "#241245" : "none"}
        animate={{ d: mouthPath }}
        transition={{ duration: 0.2 }}
      />
    </g>
  );
}

// ── Main SVG Component ───────────────────────────────────────────────────────

function MascotSVG({
  size,
  mood,
  interactive,
}: {
  size: number;
  mood: MascotMood;
  interactive: boolean;
}) {
  const vw = size;
  const vh = size;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${vw} ${vh}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`VOISSS mascot in ${mood} mood`}
    >
      {/* Defs */}
      <defs>
        <radialGradient id="voiss-body-grad" cx="40%" cy="30%">
          <stop offset="0%" stopColor="#9C88FF" />
          <stop offset="100%" stopColor="#5B3CC4" />
        </radialGradient>
      </defs>

      {/* Waveform halo — the signature VOISSS identifier */}
      <WaveformBars mood={mood} size={size} />

      {/* Head geometry */}
      <HeadGeometry mood={mood} size={size} />
    </svg>
  );
}

// ── Exported Component ───────────────────────────────────────────────────────

export default function VoissMascot({
  mood = "wave",
  size = "md",
  className = "",
  interactive = false,
  cycle = false,
  onMoodChange,
}: VoissMascotProps) {
  const [currentMood, setCurrentMood] = useState<MascotMood>(mood);

  // Respect controlled mood prop
  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  const isInteractive = interactive || cycle;
  const dim = SIZE_MAP[size];

  const handleClick = () => {
    if (!isInteractive) return;
    const next =
      MOOD_ORDER[(MOOD_ORDER.indexOf(currentMood) + 1) % MOOD_ORDER.length];
    setCurrentMood(next);
    onMoodChange?.(next);
  };

  // Non-interactive: render a plain wrapper so it isn't a focusable no-op button.
  if (!isInteractive) {
    return (
      <span className={`inline-block ${className}`}>
        <MascotSVG size={dim} mood={currentMood} interactive={false} />
      </span>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      className={`inline-block cursor-pointer ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      aria-label="VOISSS mascot — click to change mood"
    >
      <MascotSVG size={dim} mood={currentMood} interactive />
    </motion.button>
  );
}