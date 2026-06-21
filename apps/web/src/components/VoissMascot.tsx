"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type Mood = "wave" | "listen" | "talk" | "happy" | "think" | "celebrate";

interface VoissMascotProps {
  mood?: Mood;
  size?: "sm" | "md" | "lg";
  className?: string;
  interactive?: boolean;
  onMoodChange?: (mood: Mood) => void;
}

const sizes = {
  sm: 48,
  md: 80,
  lg: 120,
};

const moodAnimations: Record<Mood, { rotate: number; scale: number; y: number }> = {
  wave: { rotate: -10, scale: 1, y: 0 },
  listen: { rotate: 0, scale: 0.95, y: 0 },
  talk: { rotate: 5, scale: 1.05, y: -2 },
  happy: { rotate: 0, scale: 1.1, y: -4 },
  think: { rotate: 15, scale: 1, y: 0 },
  celebrate: { rotate: 0, scale: 1.15, y: -8 },
};

function MascotSVG({ size, mood }: { size: number; mood: Mood }) {
  const eyeY = size * 0.38;
  const mouthY = size * 0.58;
  const isListening = mood === "listen";

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* Body */}
      <motion.ellipse
        cx={60} cy={65} rx={38} ry={36}
        fill="url(#bodyGrad)"
        animate={{ scaleY: isListening ? 0.95 : 1 }}
        transition={{ duration: 0.3 }}
      />
      {/* Ears */}
      <ellipse cx={22} cy={50} rx={10} ry={14} fill="#2D1B4E" />
      <ellipse cx={98} cy={50} rx={10} ry={14} fill="#2D1B4E" />
      <motion.ellipse
        cx={22} cy={50} rx={6} ry={10} fill="#7C5DFA"
        animate={{ scaleY: isListening ? 1.3 : 1 }}
        transition={{ duration: 0.5, repeat: isListening ? Infinity : 0, repeatType: "reverse" }}
      />
      <motion.ellipse
        cx={98} cy={50} rx={6} ry={10} fill="#7C5DFA"
        animate={{ scaleY: isListening ? 1.3 : 1 }}
        transition={{ duration: 0.5, repeat: isListening ? Infinity : 0, repeatType: "reverse", delay: 0.2 }}
      />
      {/* Eyes */}
      <motion.ellipse
        cx={48} cy={eyeY} rx={6} ry={mood === "happy" ? 4 : 6} fill="white"
        animate={mood === "happy" ? { rx: 6, ry: 4 } : { rx: 6, ry: 6 }}
      />
      <motion.ellipse
        cx={72} cy={eyeY} rx={6} ry={mood === "happy" ? 4 : 6} fill="white"
        animate={mood === "happy" ? { rx: 6, ry: 4 } : { rx: 6, ry: 6 }}
      />
      {/* Pupils */}
      <motion.circle
        cx={48} cy={eyeY + 1} r={3} fill="#0A0A0A"
        animate={mood === "think" ? { cx: 50 } : { cx: 48 }}
      />
      <motion.circle
        cx={72} cy={eyeY + 1} r={3} fill="#0A0A0A"
        animate={mood === "think" ? { cx: 74 } : { cx: 72 }}
      />
      {/* Mouth */}
      <motion.path
        d={mood === "happy" ? "M 45 65 Q 60 78 75 65" : "M 48 65 Q 60 72 72 65"}
        stroke="white" strokeWidth={2.5} strokeLinecap="round" fill="none"
        animate={{
          d: mood === "happy" ? "M 45 65 Q 60 78 75 65" :
              mood === "talk" ? "M 45 62 Q 60 72 75 62" :
              mood === "celebrate" ? "M 42 63 Q 60 82 78 63" :
              "M 48 65 Q 60 72 72 65"
        }}
        transition={{ duration: 0.2 }}
      />
      {/* Blush */}
      {(mood === "happy" || mood === "celebrate") && (
        <>
          <ellipse cx={38} cy={eyeY + 12} rx={6} ry={3} fill="#7C5DFA" opacity={0.3} />
          <ellipse cx={82} cy={eyeY + 12} rx={6} ry={3} fill="#7C5DFA" opacity={0.3} />
        </>
      )}
      {/* Gradients */}
      <defs>
        <radialGradient id="bodyGrad" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#9C88FF" />
          <stop offset="100%" stopColor="#5B3CC4" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export default function VoissMascot({
  mood = "wave",
  size = "md",
  className = "",
  interactive = false,
  onMoodChange,
}: VoissMascotProps) {
  const [currentMood, setCurrentMood] = useState<Mood>(mood);

  const handleClick = () => {
    if (!interactive) return;
    const moods: Mood[] = ["happy", "wave", "think", "celebrate", "listen", "talk"];
    const next = moods[(moods.indexOf(currentMood) + 1) % moods.length];
    setCurrentMood(next);
    onMoodChange?.(next);
  };

  const dim = sizes[size];
  const anim = moodAnimations[currentMood];

  return (
    <motion.button
      onClick={handleClick}
      className={`inline-block cursor-default ${interactive ? "cursor-pointer" : ""} ${className}`}
      whileHover={interactive ? { scale: 1.05 } : {}}
      whileTap={interactive ? { scale: 0.95 } : {}}
      animate={anim}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      aria-label="VOISSS mascot"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMood}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <MascotSVG size={dim} mood={currentMood} />
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
