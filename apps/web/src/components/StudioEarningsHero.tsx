"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mic, ListChecks, Coins, ArrowRight, Sparkles, Store } from "lucide-react";

/**
 * "Earn 70%" hero for the /studio page.
 *
 * Closes the click-through from the homepage showcase
 * (OriginalVsAiShowcase links "70% of every character" to /studio
 * with no context). This hero answers the visitor's first three
 * questions in under five seconds:
 *   1. What is this?      → Earn 70% of every character an AI speaks.
 *   2. How does it work?   → Record → List → Earn (3 steps).
 *   3. What do I do now?   → "Start recording" scrolls to the
 *                            recording tool that's already on this page.
 *
 * The recording section is mounted by the page below; we link to it
 * with a fragment href so the user lands straight on the tool.
 */
export default function StudioEarningsHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0F0F0F] via-[#14101F] to-[#0A0A0A] mb-10">
      {/* Subtle ambient blobs — same vocabulary as the homepage hero
          so the two pages feel related, not duplicated. */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative px-6 sm:px-10 py-10 sm:py-14">
        {/* Eyebrow pill */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/15 to-blue-500/15 border border-white/10 rounded-full mb-5"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">
            For voice contributors
          </span>
        </motion.div>

        {/* Headline — split so "70%" can carry the gradient pop */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="text-3xl sm:text-5xl font-bold text-white max-w-3xl leading-tight"
        >
          Earn{" "}
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            70%
          </span>{" "}
          of every character an AI agent speaks in your voice.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-4 text-base sm:text-lg text-gray-300 max-w-2xl"
        >
          Record your voice once. License it to AI agents on the marketplace.
          Get paid automatically every time they speak — on Base, with smart
          contract-enforced revenue splits.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center"
        >
          <a
            href="#recording-section"
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl text-white font-semibold transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
          >
            <Mic className="w-4 h-4" />
            Start recording
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a
            href="/marketplace"
            className="group inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 hover:border-white/20 rounded-xl text-gray-200 hover:text-white text-sm font-medium transition-all"
          >
            <Store className="w-4 h-4" />
            See the marketplace first
          </a>
        </motion.div>

        {/* 3-step strip — Record → List → Earn */}
        <motion.ol
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-3xl"
        >
          <Step
            n={1}
            icon={<Mic className="w-4 h-4" />}
            title="Record"
            body="Use the studio below to capture clean samples. Pick from curated scripts or read your own."
            accent="purple"
          />
          <Step
            n={2}
            icon={<ListChecks className="w-4 h-4" />}
            title="List"
            body="Set your own terms — usage rights, rate per character, exclusivity. Your call."
            accent="blue"
          />
          <Step
            n={3}
            icon={<Coins className="w-4 h-4" />}
            title="Earn"
            body="Every time an AI agent uses your voice, you receive 70% — settled instantly on Base."
            accent="green"
          />
        </motion.ol>
      </div>
    </section>
  );
}

interface StepProps {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
  accent: "purple" | "blue" | "green";
}

function Step({ n, icon, title, body, accent }: StepProps) {
  const tone =
    accent === "purple"
      ? "bg-purple-500/15 text-purple-300 border-purple-500/20"
      : accent === "blue"
        ? "bg-blue-500/15 text-blue-300 border-blue-500/20"
        : "bg-green-500/15 text-green-300 border-green-500/20";

  return (
    <li className="relative rounded-xl border border-white/5 bg-black/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-7 h-7 rounded-lg border flex items-center justify-center ${tone}`}
        >
          {icon}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Step {n}
        </div>
      </div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <p className="mt-1 text-xs text-gray-400 leading-relaxed">{body}</p>
    </li>
  );
}
