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
const BAR_MAX_H = 14; // in viewBox units

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

function WaveformBars({ mood, viewBoxH }: { mood: MascotMood; viewBoxH: number }) {
  const cy = viewBoxH * 0.12; // centre of the halo arc

  // Bar heights per mood — the "waveform" visualiser
  const heights: number[] = (() => {
    const t = Date.now() / 1000;
    const wave = (i: number) =>
      Math.sin(t * 3 + i * 0.7) * 0.5 + 0.5; // 0 → 1 cycle
    const burst = (i: number) =>
      Math.sin(t * 5 + i * 0.4) * 0.35 + 0.65;
    const pulse = (i: number) =>
      Math.sin(t * 1.5 + i * 0.3) * 0.3 + 0.7;
    const flash = (i: number) =>
      Math.sin(t * 8 + i * 1.2) >= 0 ? 1.0 : 0.5;

    switch (mood) {
      case "listen":
        return Array.from({ length: BAR_COUNT }, (_, i) =>
          wave(i) * BAR_MAX_H,
        );
      case "talk":
        return Array.from({ length: BAR_COUNT }, (_, i) =>
          burst(i) * BAR_MAX_H * 1.1,
        );
      case "happy":
        return Array.from({ length: BAR_COUNT }, () =>
          0.6 * BAR_MAX_H + Math.random() * 0.2,
        );
      case "think":
        return Array.from({ length: BAR_COUNT }, () => 0.25 * BAR_MAX_H);
      case "celebrate":
        return Array.from({ length: BAR_COUNT }, (_, i) =>
          flash(i) * BAR_MAX_H * 1.15,
        );
      default: // wave
        return Array.from({ length: BAR_COUNT }, (_, i) =>
          (Math.sin(i * 0.6 + t * 1.2) * 0.3 + 0.5) * BAR_MAX_H * 0.7,
        );
    }
  })();

  // Animate with requestAnimationFrame for smooth waveform
  const [bars, setBars] = useState<number[]>(heights);
  const rafRef = useRef<number>();
  const loop = () => {
    const t = Date.now() / 1000;
    const gen = (i: number) => {
      const wave = Math.sin(t * 3 + i * 0.7) * 0.5 + 0.5;
      const burst = Math.sin(t * 5 + i * 0.4) * 0.35 + 0.65;
      const pulse = Math.sin(t * 1.5 + i * 0.3) * 0.3 + 0.7;
      const flash = Math.sin(t * 8 + i * 1.2) >= 0 ? 1.0 : 0.5;
      switch (mood) {
        case "listen":
          return wave * BAR_MAX_H;
        case "talk":
          return burst * BAR_MAX_H * 1.1;
        case "happy":
          return 0.7 * BAR_MAX_H;
        case "think":
          return 0.25 * BAR_MAX_H;
        case "celebrate":
          return flash * BAR_MAX_H * 1.15;
        default:
          return (Math.sin(i * 0.6 + t * 1.2) * 0.3 + 0.5) * BAR_MAX_H * 0.7;
      }
    };
    setBars(Array.from({ length: BAR_COUNT }, (_, i) => gen(i)));
    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mood]);

  const barW = 2.5;
  const gap = 1.5;
  const totalW = BAR_COUNT * barW + (BAR_COUNT - 1) * gap;
  const startX = 60 - totalW / 2;

  return (
    <g aria-hidden>
      {bars.map((h, i) => {
        const x = startX + i * (barW + gap);
        const y = cy - h / 2;
        return (
          <motion.rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={h}
            rx={1}
            fill={
              mood === "celebrate"
                ? "#FBBF24" // amber-400
                : mood === "happy"
                  ? "#C084FC" // purple-400
                  : mood === "think"
                    ? "#6B7280" // gray-500
                    : "#9C88FF" // voiss purple
            }
            opacity={
              mood === "think" ? 0.5 : mood === "celebrate" ? 0.95 : 0.85
            }
            animate={{
              y: y + (mood === "celebrate" ? -1 : 0),
            }}
            transition={{
              duration: 0.1,
              repeat: Infinity,
              repeatType: "reverse",
              repeatDelay: mood === "celebrate" ? 0.05 : 0.15,
            }}
          />
        );
      })}
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
  const cx = size * 0.5;
  const cy = size * 0.55;
  const rx = size * 0.38;
  const ry = size * 0.42;

  // Mouth path per mood
  const mouthPath = (() => {
    const my = cy + ry * 0.45;
    switch (mood) {
      case "happy":
        return `M ${cx - rx * 0.45} ${my} Q ${cx} ${my + ry * 0.3} ${cx + rx * 0.45} ${my}`;
      case "celebrate":
        return `M ${cx - rx * 0.5} ${my - 2} Q ${cx} ${my + ry * 0.35} ${cx + rx * 0.5} ${my - 2} Z`;
      case "talk":
        return `M ${cx - rx * 0.35} ${my} Q ${cx} ${my + ry * 0.2} ${cx + rx * 0.35} ${my}`;
      case "think":
        return `M ${cx - rx * 0.2} ${my} L ${cx + rx * 0.2} ${my}`;
      default:
        return `M ${cx - rx * 0.3} ${my} Q ${cx} ${my + ry * 0.15} ${cx + rx * 0.3} ${my}`;
    }
  })();

  // Eye openness per mood
  const eyeH = mood === "happy" ? 0.7 : mood === "celebrate" ? 0.9 : 1;

  // Ear twinkle — only when in wave mood
  const earTwinkle = mood === "wave";

  return (
    <g>
      {/* ── Body / head silhouette ── */}
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="url(#voiss-body-grad)"
        animate={
          mood === "listen"
            ? { rx: rx * 1.02, ry: ry * 0.97 }
            : mood === "celebrate"
              ? { ry: ry * 1.04 }
              : {}
        }
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
      />

      {/* ── Ear shells (VOISSS phone-ear silhouette) ── */}
      <ellipse cx={cx - rx * 0.95} cy={cy - ry * 0.15} rx={rx * 0.22} ry={ry * 0.35} fill="#2D1B4E" />
      <ellipse cx={cx + rx * 0.95} cy={cy - ry * 0.15} rx={rx * 0.22} ry={ry * 0.35} fill="#2D1B4E" />
      {/* Inner ear — purple, pulses when listening */}
      <motion.ellipse
        cx={cx - rx * 0.95}
        cy={cy - ry * 0.15}
        rx={rx * 0.12}
        ry={ry * 0.2}
        fill="#7C5DFA"
        animate={
          earTwinkle
            ? { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }
            : mood === "listen"
              ? { scaleY: [1, 1.25, 1] }
              : {}
        }
        transition={{
          duration: earTwinkle ? 2 : 0.5,
          repeat: earTwinkle ? Infinity : mood === "listen" ? Infinity : 0,
          repeatType: "reverse",
        }}
      />
      <motion.ellipse
        cx={cx + rx * 0.95}
        cy={cy - ry * 0.15}
        rx={rx * 0.12}
        ry={ry * 0.2}
        fill="#7C5DFA"
        animate={
          earTwinkle
            ? { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }
            : mood === "listen"
              ? { scaleY: [1, 1.25, 1] }
              : {}
        }
        transition={{
          duration: earTwinkle ? 2 : 0.5,
          delay: earTwinkle ? 0 : 0.2,
          repeat: earTwinkle ? Infinity : mood === "listen" ? Infinity : 0,
          repeatType: "reverse",
        }}
      />

      {/* ── Eyes ── */}
      <ellipse
        cx={cx - rx * 0.32}
        cy={cy - ry * 0.2}
        rx={rx * 0.12}
        ry={ry * 0.14 * eyeH}
        fill="white"
      />
      <ellipse
        cx={cx + rx * 0.32}
        cy={cy - ry * 0.2}
        rx={rx * 0.12}
        ry={ry * 0.14 * eyeH}
        fill="white"
      />
      {/* Pupils */}
      <motion.circle
        cx={cx - rx * 0.3}
        cy={cy - ry * 0.18}
        r={rx * 0.06}
        fill="#0A0A0A"
        animate={
          mood === "think"
            ? { cy: cy - ry * 0.28 }
            : mood === "celebrate"
              ? { cy: [cy - ry * 0.18, cy - ry * 0.22, cy - ry * 0.18] }
              : {}
        }
        transition={{ duration: 0.3 }}
      />
      <motion.circle
        cx={cx + rx * 0.34}
        cy={cy - ry * 0.18}
        r={rx * 0.06}
        fill="#0A0A0A"
        animate={
          mood === "think"
            ? { cy: cy - ry * 0.28 }
            : mood === "celebrate"
              ? { cy: [cy - ry * 0.18, cy - ry * 0.22, cy - ry * 0.18] }
              : {}
        }
        transition={{ duration: 0.3 }}
      />

      {/* ── Blush (only on happy / celebrate) ── */}
      <AnimatePresence>
        {(mood === "happy" || mood === "celebrate") && (
          <>
            <motion.ellipse
              cx={cx - rx * 0.5}
              cy={cy + ry * 0.05}
              rx={rx * 0.14}
              ry={ry * 0.07}
              fill="#7C5DFA"
              opacity={0.25}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              exit={{ opacity: 0 }}
            />
            <motion.ellipse
              cx={cx + rx * 0.5}
              cy={cy + ry * 0.05}
              rx={rx * 0.14}
              ry={ry * 0.07}
              fill="#7C5DFA"
              opacity={0.25}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              exit={{ opacity: 0 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* ── Mouth (path morphing) ── */}
      <motion.path
        d={mouthPath}
        stroke="white"
        strokeWidth={size * 0.022}
        strokeLinecap="round"
        fill={mood === "celebrate" ? "white" : "none"}
        animate={{ d: mouthPath }}
        transition={{ duration: 0.2 }}
      />

      {/* ── Subtle microphone icon on chest ── */}
      <g opacity={0.35}>
        <rect
          x={cx - size * 0.05}
          y={cy + ry * 0.25}
          width={size * 0.1}
          height={size * 0.16}
          rx={size * 0.05}
          fill="none"
          stroke="white"
          strokeWidth={1}
        />
        <path
          d={`M ${cx - size * 0.09} ${cy + ry * 0.38} A ${size * 0.09} ${size * 0.09} 0 0 0 ${cx + size * 0.09} ${cy + ry * 0.38}`}
          fill="none"
          stroke="white"
          strokeWidth={1}
        />
      </g>
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
      <WaveformBars mood={mood} viewBoxH={vh} />

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
  const [isControlled, setIsControlled] = useState(true);

  // Respect controlled mood prop
  useEffect(() => {
    setIsControlled(mood !== "wave" || true); // always start controlled
    setCurrentMood(mood);
  }, [mood]);

  const handleClick = () => {
    if (!interactive && !cycle) return;
    const next =
      MOOD_ORDER[(MOOD_ORDER.indexOf(currentMood) + 1) % MOOD_ORDER.length];
    setCurrentMood(next);
    onMoodChange?.(next);
  };

  const dim = SIZE_MAP[size];

  // Hover / tap micro-animations
  const hoverScale = interactive || cycle ? 1.05 : 1;
  const tapScale = interactive || cycle ? 0.95 : 1;

  return (
    <motion.button
      onClick={handleClick}
      className={`inline-block ${interactive || cycle ? "cursor-pointer" : "cursor-default"} ${className}`}
      whileHover={interactive || cycle ? { scale: hoverScale } : undefined}
      whileTap={interactive || cycle ? { scale: tapScale } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      aria-label="VOISSS mascot"
    >
      <MascotSVG size={dim} mood={currentMood} interactive={interactive || cycle} />
    </motion.button>
  );
}