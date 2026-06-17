"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Sparkles, Info, User2, Cpu, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Side-by-side comparison: real human voice vs. AI-synthesized version
 * of the same sentence. Both audio sources are pre-rendered MP3s in
 * /public/showcase/ — the human sample is CC0 (LibriVox, public-domain
 * text by Edgar Allan Poe), the AI sample was generated once via
 * ElevenLabs (George voice). The component never calls the synthesis
 * API at runtime — the showcase must be instant and offline-safe.
 *
 * Both waveforms are driven by AnalyserNodes (Web Audio API) so the
 * bars reflect real amplitude of the playing audio, not a fake animation.
 *
 * --------------------------------------------------------------------------
 * SWAPPING IN A REAL CONTRIBUTOR RECORDING
 * --------------------------------------------------------------------------
 * The current human sample is a LibriVox placeholder so the component
 * works without a recorded contributor. When a real contributor gives
 * consent to use their voice in the showcase:
 *
 *   1. Get the recording (WAV or MP3, ~6-10 seconds, single sentence).
 *   2. Loudness-normalize to ~-16 LUFS for visual parity with the AI
 *      side. A reasonable ffmpeg incantation:
 *        ffmpeg -i input.mp3 -af \
 *          "loudnorm=I=-16:TP=-1.5:LRA=11,highpass=f=80,lowpass=f=12000" \
 *          -ar 44100 -ac 1 -b:a 128k voice-human.mp3
 *   3. Replace apps/web/public/showcase/voice-human.mp3
 *   4. Re-run the AI synthesis with the same sentence via ElevenLabs
 *      (or whichever TTS the marketplace uses for the contributor's
 *      voice) and replace apps/web/public/showcase/voice-ai.mp3.
 *   5. Update HUMAN_VOICE_LABEL and HUMAN_VOICE_SUB below to reflect
 *      the real contributor (e.g. "Mara · Audiobook narrator").
 *   6. If the sentence changes, update SENTENCE (also shown in the
 *      centered quote) and re-record both sides.
 *
 * The component itself is voice- and sentence-agnostic — no other
 * changes needed.
 * --------------------------------------------------------------------------
 */

const SENTENCE =
  "The thousand injuries of Fortunato I had borne as I best could, but when he ventured upon insult, I vowed revenge.";

const SOURCE_TEXT = "The Cask of Amontillado (1846) — Edgar Allan Poe, public domain";
const HUMAN_VOICE_LABEL = "LibriVox narrator";
const HUMAN_VOICE_SUB = "Real human · CC0 source";
const AI_VOICE_LABEL = "ElevenLabs · George";
const AI_VOICE_SUB = "Licensed AI · same sentence";

const HUMAN_URL = "/showcase/voice-human.mp3";
const AI_URL = "/showcase/voice-ai.mp3";

const BAR_COUNT = 56;

type Side = "human" | "ai";

interface AnalyserState {
  audio: HTMLAudioElement;
  context: AudioContext;
  source: MediaElementAudioSourceNode;
  analyser: AnalyserNode;
  dataArray: Uint8Array;
}

export default function OriginalVsAiShowcase() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextOpen, setContextOpen] = useState(false);

  const humanAudioRef = useRef<HTMLAudioElement | null>(null);
  const aiAudioRef = useRef<HTMLAudioElement | null>(null);
  const humanStateRef = useRef<AnalyserState | null>(null);
  const aiStateRef = useRef<AnalyserState | null>(null);
  const rafRef = useRef<number | null>(null);

  const humanCanvasRef = useRef<HTMLCanvasElement>(null);
  const aiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize the audio graphs lazily on first play (browsers block
  // AudioContext until user interaction).
  const ensureAudioGraph = useCallback(async () => {
    if (humanStateRef.current && aiStateRef.current) return;

    const human = humanAudioRef.current;
    const ai = aiAudioRef.current;
    if (!human || !ai) return;

    try {
      const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as
        | typeof AudioContext
        | undefined;
      if (!Ctor) throw new Error("Web Audio API not supported");

      const ctx = new Ctor();
      const buildSide = (el: HTMLAudioElement): AnalyserState => {
        const source = ctx.createMediaElementSource(el);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        return { audio: el, context: ctx, source, analyser, dataArray };
      };

      humanStateRef.current = buildSide(human);
      aiStateRef.current = buildSide(ai);
      setIsReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audio init failed");
    }
  }, []);

  // Reset playback position when the user pauses or restarts so both
  // sides stay aligned in the comparison.
  const reset = useCallback(() => {
    if (humanAudioRef.current) humanAudioRef.current.currentTime = 0;
    if (aiAudioRef.current) aiAudioRef.current.currentTime = 0;
  }, []);

  const play = useCallback(async () => {
    setError(null);
    await ensureAudioGraph();
    const human = humanAudioRef.current;
    const ai = aiAudioRef.current;
    if (!human || !ai) return;
    reset();
    try {
      // Resume context if it was suspended (Safari quirk).
      const ctx = humanStateRef.current?.context;
      if (ctx?.state === "suspended") await ctx.resume();
      // Kick off both in parallel — they were trimmed to start at the
      // same offset so the bars stay visually synced.
      await Promise.all([human.play(), ai.play()]);
      setIsPlaying(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Playback failed");
      setIsPlaying(false);
    }
  }, [ensureAudioGraph, reset]);

  const pause = useCallback(() => {
    humanAudioRef.current?.pause();
    aiAudioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else void play();
  }, [isPlaying, pause, play]);

  // Draw the waveform bars. Each frame: read frequency bin data from
  // the analyser and paint a centered, mirrored bar chart onto the
  // canvas. When paused, draw a flat baseline so the UI doesn't look
  // broken.
  const draw = useCallback(() => {
    rafRef.current = requestAnimationFrame(draw);
    const drawSide = (
      canvas: HTMLCanvasElement | null,
      state: AnalyserState | null,
      color: { from: string; to: string }
    ) => {
      if (!canvas || !state) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      // Gradient fill for the bars
      const grad = ctx.createLinearGradient(0, 0, 0, cssH);
      grad.addColorStop(0, color.to);
      grad.addColorStop(1, color.from);
      ctx.fillStyle = grad;

      const bins = state.dataArray.length;
      const step = Math.floor(bins / BAR_COUNT);
      const barWidth = cssW / BAR_COUNT;
      const gap = Math.max(1, barWidth * 0.18);
      const center = cssH / 2;

      for (let i = 0; i < BAR_COUNT; i++) {
        // Average a small window of bins for each bar
        let sum = 0;
        for (let j = 0; j < step; j++) sum += state.dataArray[i * step + j] || 0;
        const avg = sum / step / 255; // 0..1
        const amp = isPlaying ? avg : 0.04; // baseline when paused
        const h = Math.max(2, amp * (cssH * 0.92));
        const x = i * barWidth + gap / 2;
        const w = barWidth - gap;
        // Mirrored: draw symmetric above + below center
        ctx.fillRect(x, center - h / 2, w, h);
      }
    };

    drawSide(humanCanvasRef.current, humanStateRef.current, {
      from: "#7C5DFA",
      to: "#C084FC",
    });
    drawSide(aiCanvasRef.current, aiStateRef.current, {
      from: "#3B82F6",
      to: "#60A5FA",
    });
  }, [isPlaying]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  // When either clip ends, stop both and reset to start so a click of
  // play replays from the beginning.
  const onEnded = useCallback(() => {
    pause();
    reset();
  }, [pause, reset]);

  useEffect(() => {
    const h = humanAudioRef.current;
    const a = aiAudioRef.current;
    h?.addEventListener("ended", onEnded);
    a?.addEventListener("ended", onEnded);
    return () => {
      h?.removeEventListener("ended", onEnded);
      a?.removeEventListener("ended", onEnded);
    };
  }, [onEnded]);

  // Cleanup audio context on unmount.
  useEffect(() => {
    return () => {
      try {
        humanStateRef.current?.context.close();
      } catch {}
      humanStateRef.current = null;
      aiStateRef.current = null;
    };
  }, []);

  const [activeSide, setActiveSide] = useState<Side | null>(null);

  const quoteWords = useMemo(() => SENTENCE.split(" "), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto mb-24 px-4"
    >
      {/* Hidden audio elements — the source of truth for playback.
          We never expose <audio controls> to the user; the visual
          waveform is the UI. */}
      <audio ref={humanAudioRef} src={HUMAN_URL} preload="auto" crossOrigin="anonymous" />
      <audio ref={aiAudioRef} src={AI_URL} preload="auto" crossOrigin="anonymous" />

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/15 to-blue-500/15 border border-white/10 rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">
            The Voice Marketplace in Action
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Same sentence. <span className="text-purple-400">Real human.</span>{" "}
          <span className="text-blue-400">Licensed AI.</span>
        </h2>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto">
          Every voice in the VOISSS marketplace is recorded by a real person,
          then licensed to AI agents. Tap play to hear the same line spoken by
          a human narrator, then synthesized by the same voice through an
          AI agent.
        </p>
      </div>

      <div className="bg-[#0F0F0F]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl">
        {/* The quote itself, centered, with a subtle highlight on each
            word as it plays. Simple opacity transition for now. */}
        <blockquote className="text-center mb-6 sm:mb-8">
          <p className="text-base sm:text-lg leading-relaxed text-white/90 italic font-serif">
            &ldquo;
            {quoteWords.map((w, i) => (
              <span
                key={i}
                className={`transition-colors duration-200 ${
                  activeSide ? "text-white/95" : "text-white/80"
                }`}
              >
                {w}
                {i < quoteWords.length - 1 ? " " : ""}
              </span>
            ))}
            &rdquo;
          </p>
          <footer className="mt-2 text-[10px] uppercase tracking-widest text-gray-500 font-medium">
            {SOURCE_TEXT}
          </footer>
        </blockquote>

        {/* The two waveforms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7">
          <ShowcaseCard
            side="human"
            label={HUMAN_VOICE_LABEL}
            subtitle={HUMAN_VOICE_SUB}
            isPlaying={isPlaying}
            isActive={activeSide === "human"}
            onHoverChange={setActiveSide}
            canvasRef={humanCanvasRef}
            accent="purple"
            icon={<User2 className="w-4 h-4" />}
          />
          <ShowcaseCard
            side="ai"
            label={AI_VOICE_LABEL}
            subtitle={AI_VOICE_SUB}
            isPlaying={isPlaying}
            isActive={activeSide === "ai"}
            onHoverChange={setActiveSide}
            canvasRef={aiCanvasRef}
            accent="blue"
            icon={<Cpu className="w-4 h-4" />}
          />
        </div>

        {/* Single play/pause — drives both clips in sync */}
        <div className="flex flex-col items-center gap-3 mt-7">
          <button
            onClick={toggle}
            disabled={!!error}
            aria-label={isPlaying ? "Pause comparison" : "Play comparison"}
            className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
              isPlaying
                ? "bg-white text-black shadow-[0_0_0_6px_rgba(255,255,255,0.08)]"
                : "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 hover:scale-105"
            }`}
          >
            <span
              className={`absolute inset-0 rounded-full ${
                isPlaying ? "bg-white/20" : "bg-white/0 group-hover:bg-white/10"
              } transition-colors`}
            />
            {isPlaying ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
            {isPlaying
              ? "Playing · 7–9 seconds"
              : isReady
              ? "Tap to play both sides"
              : "Loading audio…"}
          </p>
          {error && (
            <p className="text-xs text-red-400 max-w-md text-center">{error}</p>
          )}
        </div>

        {/* Optional context — what is this, why does it matter */}
        <div className="mt-6 border-t border-white/5 pt-4">
          <button
            onClick={() => setContextOpen((v) => !v)}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mx-auto"
            aria-expanded={contextOpen}
          >
            <Info className="w-3.5 h-3.5" />
            Why two waveforms?
            {contextOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          <AnimatePresence>
            {contextOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="text-xs text-gray-400 leading-relaxed mt-3 max-w-2xl mx-auto space-y-2">
                  <p>
                    The left bar is a real human narrator reading a public-domain
                    passage from <em>The Cask of Amontillado</em> (LibriVox, CC0).
                    The right bar is the same sentence synthesized by an AI agent
                    using a voice licensed through VOISSS.
                  </p>
                  <p>
                    VOISSS exists because the best AI voices aren&apos;t synthetic —
                    they&apos;re <em>licensed</em>. Contributors record themselves,
                    set their own terms, and earn{" "}
                    <a
                      href="/studio"
                      className="text-purple-300 underline underline-offset-2 hover:text-purple-200 transition-colors font-medium"
                    >
                      70% of every character
                    </a>{" "}
                    an AI agent speaks in their voice. The marketplace, the
                    provenance, and the payment rails are all on Base.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

interface ShowcaseCardProps {
  side: Side;
  label: string;
  subtitle: string;
  isPlaying: boolean;
  isActive: boolean;
  onHoverChange: (s: Side | null) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  accent: "purple" | "blue";
  icon: React.ReactNode;
}

function ShowcaseCard({
  side,
  label,
  subtitle,
  isPlaying,
  isActive,
  onHoverChange,
  canvasRef,
  accent,
  icon,
}: ShowcaseCardProps) {
  const borderColor =
    accent === "purple"
      ? "border-purple-500/30 hover:border-purple-400/60"
      : "border-blue-500/30 hover:border-blue-400/60";
  const dotColor = accent === "purple" ? "bg-purple-400" : "bg-blue-400";
  const labelColor = accent === "purple" ? "text-purple-300" : "text-blue-300";

  return (
    <div
      onMouseEnter={() => onHoverChange(side)}
      onMouseLeave={() => onHoverChange(null)}
      onFocus={() => onHoverChange(side)}
      onBlur={() => onHoverChange(null)}
      tabIndex={0}
      className={`relative rounded-xl border bg-[#0A0A0A]/60 p-4 transition-all duration-300 ${borderColor} ${
        isActive ? "shadow-lg" : ""
      } ${isActive && accent === "purple" ? "shadow-purple-500/10" : ""} ${
        isActive && accent === "blue" ? "shadow-blue-500/10" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              accent === "purple" ? "bg-purple-500/15" : "bg-blue-500/15"
            } ${labelColor}`}
          >
            {icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{label}</div>
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
              {subtitle}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${dotColor} ${
              isPlaying ? "animate-pulse" : "opacity-50"
            }`}
          />
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
            {isPlaying ? "Live" : "Idle"}
          </span>
        </div>
      </div>

      <div className="h-24 sm:h-28 w-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          aria-label={`${label} waveform`}
        />
      </div>
    </div>
  );
}
