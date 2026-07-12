"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, Sparkles, Info, User2, Cpu, ChevronDown, ChevronUp, Check, ArrowRight } from "lucide-react";

/**
 * Side-by-side comparison: real human voice vs. AI-synthesized version
 * of the same sentence. Playback is sequential (human → AI) so visitors
 * can actually hear each source clearly.
 *
 * Audio: pre-rendered MP3s in /public/showcase/, with API fallback if missing.
 * Waveforms use Web Audio API analysers on the actively playing side only.
 */

const SENTENCE =
  "The thousand injuries of Fortunato I had borne as I best could, but when he ventured upon insult, I vowed revenge.";

const SOURCE_TEXT = "The Cask of Amontillado (1846) — Edgar Allan Poe, public domain";
const HUMAN_VOICE_LABEL = "LibriVox narrator";
const HUMAN_VOICE_SUB = "Real human · CC0 source";
const AI_VOICE_LABEL = "ElevenLabs · George";
const AI_VOICE_SUB = "Licensed AI · same sentence";

const AI_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const HUMAN_URL = "/showcase/voice-human.mp3";
const AI_URL = "/showcase/voice-ai.mp3";

const BAR_COUNT = 56;

type Side = "human" | "ai";
type PlaybackPhase = "idle" | "human" | "ai" | "complete";

async function fetchPreviewAudio(text: string, voiceId: string): Promise<string | null> {
  const res = await fetch("/api/agents/vocalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId, preview: true }),
  });
  const data = await res.json();
  return data.success && data.data?.audioUrl ? data.data.audioUrl : null;
}

async function resolveShowcaseSources(): Promise<{ human: string; ai: string }> {
  const humanOk = await fetch(HUMAN_URL, { method: "HEAD" }).then((r) => r.ok).catch(() => false);
  const aiOk = await fetch(AI_URL, { method: "HEAD" }).then((r) => r.ok).catch(() => false);

  if (humanOk && aiOk) {
    return { human: HUMAN_URL, ai: AI_URL };
  }

  const aiUrl = (aiOk ? AI_URL : null) ?? (await fetchPreviewAudio(SENTENCE, AI_VOICE_ID));
  if (!aiUrl) {
    throw new Error("Showcase audio unavailable. Try again in a moment.");
  }

  return {
    human: humanOk ? HUMAN_URL : aiUrl,
    ai: aiUrl,
  };
}

interface AnalyserState {
  audio: HTMLAudioElement;
  context: AudioContext;
  source: MediaElementAudioSourceNode;
  analyser: AnalyserNode;
  dataArray: Uint8Array;
}

function waitForAudio(el: HTMLAudioElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      resolve();
      return;
    }
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onFail = () => {
      cleanup();
      reject(new Error("Showcase audio failed to load"));
    };
    const cleanup = () => {
      el.removeEventListener("canplay", onReady);
      el.removeEventListener("error", onFail);
    };
    el.addEventListener("canplay", onReady);
    el.addEventListener("error", onFail);
    el.load();
  });
}

export default function OriginalVsAiShowcase() {
  const [phase, setPhase] = useState<PlaybackPhase>("idle");
  const [pausedAt, setPausedAt] = useState<PlaybackPhase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [humanSrc, setHumanSrc] = useState(HUMAN_URL);
  const [aiSrc, setAiSrc] = useState(AI_URL);
  const [contextOpen, setContextOpen] = useState(false);
  const [hoverSide, setHoverSide] = useState<Side | null>(null);

  const humanAudioRef = useRef<HTMLAudioElement | null>(null);
  const aiAudioRef = useRef<HTMLAudioElement | null>(null);
  const humanStateRef = useRef<AnalyserState | null>(null);
  const aiStateRef = useRef<AnalyserState | null>(null);
  const rafRef = useRef<number | null>(null);

  const humanCanvasRef = useRef<HTMLCanvasElement>(null);
  const aiCanvasRef = useRef<HTMLCanvasElement>(null);

  const activeSide: Side | null =
    phase === "human" ? "human" : phase === "ai" ? "ai" : null;
  const isPlaying = phase === "human" || phase === "ai";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sources = await resolveShowcaseSources();
        if (cancelled) return;
        setHumanSrc(sources.human);
        setAiSrc(sources.ai);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load showcase audio");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ensureAudioGraph = useCallback(async () => {
    if (humanStateRef.current && aiStateRef.current) return;

    const human = humanAudioRef.current;
    const ai = aiAudioRef.current;
    if (!human || !ai) return;

    const Ctor = (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
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
      return { audio: el, context: ctx, source, analyser, dataArray: new Uint8Array(analyser.frequencyBinCount) };
    };

    humanStateRef.current = buildSide(human);
    aiStateRef.current = buildSide(ai);
  }, []);

  const stopAll = useCallback(() => {
    humanAudioRef.current?.pause();
    aiAudioRef.current?.pause();
  }, []);

  const resetAll = useCallback(() => {
    if (humanAudioRef.current) humanAudioRef.current.currentTime = 0;
    if (aiAudioRef.current) aiAudioRef.current.currentTime = 0;
  }, []);

  const playSide = useCallback(
    async (side: Side) => {
      const human = humanAudioRef.current;
      const ai = aiAudioRef.current;
      if (!human || !ai) return;

      stopAll();
      if (side === "human") {
        human.currentTime = 0;
        await waitForAudio(human);
        setPhase("human");
        await human.play();
      } else {
        ai.currentTime = 0;
        await waitForAudio(ai);
        setPhase("ai");
        await ai.play();
      }

      const ctx = humanStateRef.current?.context;
      if (ctx?.state === "suspended") await ctx.resume();
    },
    [stopAll]
  );

  const startSequence = useCallback(async () => {
    setError(null);
    setPausedAt(null);
    try {
      await ensureAudioGraph();
      resetAll();
      await playSide("human");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Playback failed");
      setPhase("idle");
      stopAll();
    }
  }, [ensureAudioGraph, playSide, resetAll, stopAll]);

  const pause = useCallback(() => {
    if (phase === "human" || phase === "ai") {
      setPausedAt(phase);
    }
    stopAll();
    setPhase("idle");
  }, [phase, stopAll]);

  const resume = useCallback(async () => {
    const resumePhase = pausedAt;
    if (!resumePhase || resumePhase === "complete") {
      await startSequence();
      return;
    }
    setError(null);
    try {
      await ensureAudioGraph();
      const ctx = humanStateRef.current?.context;
      if (ctx?.state === "suspended") await ctx.resume();
      setPhase(resumePhase);
      if (resumePhase === "human") {
        await humanAudioRef.current?.play();
      } else {
        await aiAudioRef.current?.play();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Playback failed");
      setPhase("idle");
    }
  }, [ensureAudioGraph, pausedAt, startSequence]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else if (pausedAt) {
      void resume();
    } else {
      void startSequence();
    }
  }, [isPlaying, pause, pausedAt, resume, startSequence]);

  // Human ends → auto-play AI
  useEffect(() => {
    const human = humanAudioRef.current;
    if (!human) return;

    const onHumanEnded = () => {
      void (async () => {
        try {
          await playSide("ai");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Playback failed");
          setPhase("idle");
        }
      })();
    };

    human.addEventListener("ended", onHumanEnded);
    return () => human.removeEventListener("ended", onHumanEnded);
  }, [playSide]);

  // AI ends → complete
  useEffect(() => {
    const ai = aiAudioRef.current;
    if (!ai) return;

    const onAiEnded = () => {
      stopAll();
      setPausedAt(null);
      setPhase("complete");
    };

    ai.addEventListener("ended", onAiEnded);
    return () => ai.removeEventListener("ended", onAiEnded);
  }, [stopAll]);

  const draw = useCallback(() => {
    rafRef.current = requestAnimationFrame(draw);

    const drawSide = (
      canvas: HTMLCanvasElement | null,
      state: AnalyserState | null,
      side: Side,
      color: { from: string; to: string }
    ) => {
      if (!canvas || !state) return;
      const live = activeSide === side;
      if (live) {
        state.analyser.getByteFrequencyData(state.dataArray);
      }

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
        let sum = 0;
        for (let j = 0; j < step; j++) sum += state.dataArray[i * step + j] || 0;
        const avg = sum / step / 255;
        const amp = live ? avg : 0.04;
        const h = Math.max(2, amp * (cssH * 0.92));
        const x = i * barWidth + gap / 2;
        ctx.fillRect(x, center - h / 2, barWidth - gap, h);
      }
    };

    drawSide(humanCanvasRef.current, humanStateRef.current, "human", {
      from: "#7C5DFA",
      to: "#C084FC",
    });
    drawSide(aiCanvasRef.current, aiStateRef.current, "ai", {
      from: "#3B82F6",
      to: "#60A5FA",
    });
  }, [activeSide]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  useEffect(() => {
    return () => {
      try {
        humanStateRef.current?.context.close();
      } catch {
        /* ignore */
      }
      humanStateRef.current = null;
      aiStateRef.current = null;
    };
  }, []);

  const quoteWords = useMemo(() => SENTENCE.split(" "), []);

  const statusHint = useMemo(() => {
    if (isLoading) return "Loading audio…";
    if (phase === "human") return "Step 1 · Real human narrator";
    if (phase === "ai") return "Step 2 · Licensed AI voice";
    if (phase === "complete") return "Comparison complete · Tap to replay";
    if (pausedAt) return "Paused · Tap to resume";
    return "Tap to hear human, then licensed AI";
  }, [isLoading, phase, pausedAt]);

  const humanCardState = useMemo(() => {
    if (phase === "human") return { status: "Playing", live: true, dimmed: false, done: false };
    if (phase === "ai" || phase === "complete") return { status: "Original", live: false, dimmed: false, done: true };
    if (phase === "idle" && pausedAt === "human") return { status: "Paused", live: false, dimmed: false, done: false };
    if (phase === "idle" && !pausedAt) return { status: "Step 1", live: false, dimmed: false, done: false };
    return { status: "Waiting", live: false, dimmed: true, done: false };
  }, [phase, pausedAt]);

  const aiCardState = useMemo(() => {
    if (phase === "ai") return { status: "Playing", live: true, dimmed: false, done: false };
    if (phase === "complete") return { status: "Licensed", live: false, dimmed: false, done: true };
    if (phase === "human") return { status: "Up next", live: false, dimmed: true, done: false };
    if (phase === "idle" && pausedAt === "ai") return { status: "Paused", live: false, dimmed: false, done: false };
    return { status: "Step 2", live: false, dimmed: true, done: false };
  }, [phase, pausedAt]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto mb-24 px-4"
    >
      <audio
        ref={humanAudioRef}
        src={humanSrc}
        preload="auto"
        crossOrigin={humanSrc.startsWith("/") ? undefined : "anonymous"}
      />
      <audio
        ref={aiAudioRef}
        src={aiSrc}
        preload="auto"
        crossOrigin={aiSrc.startsWith("/") ? undefined : "anonymous"}
      />

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
          Hear the same line twice — first from a real narrator, then from a
          licensed AI voice. One at a time, so the difference is clear.
        </p>
      </div>

      <div className="bg-[#0F0F0F]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl">
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

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-5 text-[10px] uppercase tracking-widest font-medium">
          <span className={phase === "human" || humanCardState.done ? "text-purple-300" : "text-gray-600"}>
            1 · Human
          </span>
          <span className="text-gray-700">→</span>
          <span className={phase === "ai" || phase === "complete" ? "text-blue-300" : "text-gray-600"}>
            2 · Licensed AI
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7">
          <ShowcaseCard
            side="human"
            label={HUMAN_VOICE_LABEL}
            subtitle={HUMAN_VOICE_SUB}
            status={humanCardState.status}
            isLive={humanCardState.live}
            isDone={humanCardState.done}
            dimmed={humanCardState.dimmed}
            isHighlighted={activeSide === "human" || hoverSide === "human"}
            onHoverChange={setHoverSide}
            canvasRef={humanCanvasRef}
            accent="purple"
            icon={<User2 className="w-4 h-4" />}
          />
          <ShowcaseCard
            side="ai"
            label={AI_VOICE_LABEL}
            subtitle={AI_VOICE_SUB}
            status={aiCardState.status}
            isLive={aiCardState.live}
            isDone={aiCardState.done}
            dimmed={aiCardState.dimmed}
            isHighlighted={activeSide === "ai" || hoverSide === "ai"}
            onHoverChange={setHoverSide}
            canvasRef={aiCanvasRef}
            accent="blue"
            icon={<Cpu className="w-4 h-4" />}
          />
        </div>

        <div className="flex flex-col items-center gap-3 mt-7">
          <button
            onClick={toggle}
            disabled={!!error || isLoading}
            aria-label={isPlaying ? "Pause comparison" : "Hear the difference"}
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
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium text-center">
            {statusHint}
          </p>
          {phase === "complete" && (
            <>
              <p className="text-xs text-gray-400 text-center max-w-sm">
                Same voice identity — one recorded by a person, one licensed for AI agents.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-sm">
                <a
                  href="/demo?from=showcase"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white text-sm font-semibold hover:from-purple-500 hover:to-blue-500 transition-all"
                >
                  Try it yourself
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <a
                  href="/marketplace"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-semibold hover:bg-white/10 transition-all"
                >
                  Browse voices
                </a>
              </div>
            </>
          )}
          {error && (
            <p className="text-xs text-red-400 max-w-md text-center">{error}</p>
          )}
        </div>

        <div className="mt-6 border-t border-white/5 pt-4">
          <button
            onClick={() => setContextOpen((v) => !v)}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mx-auto"
            aria-expanded={contextOpen}
          >
            <Info className="w-3.5 h-3.5" />
            Why two waveforms?
            {contextOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
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
                    We play each side separately so you can actually hear the difference.
                    The left is a real human narrator (LibriVox, CC0). The right is the
                    same sentence via a licensed AI voice.
                  </p>
                  <p>
                    VOISSS exists because the best AI voices aren&apos;t synthetic —
                    they&apos;re <em>licensed</em>. Contributors earn{" "}
                    <a
                      href="/studio"
                      className="text-purple-300 underline underline-offset-2 hover:text-purple-200 transition-colors font-medium"
                    >
                      70% of every character
                    </a>{" "}
                    an AI agent speaks in their voice.
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
  status: string;
  isLive: boolean;
  isDone: boolean;
  dimmed: boolean;
  isHighlighted: boolean;
  onHoverChange: (s: Side | null) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  accent: "purple" | "blue";
  icon: React.ReactNode;
}

function ShowcaseCard({
  side,
  label,
  subtitle,
  status,
  isLive,
  isDone,
  dimmed,
  isHighlighted,
  onHoverChange,
  canvasRef,
  accent,
  icon,
}: ShowcaseCardProps) {
  const borderActive =
    accent === "purple"
      ? "border-purple-500/50 shadow-purple-500/15"
      : "border-blue-500/50 shadow-blue-500/15";
  const borderIdle =
    accent === "purple" ? "border-purple-500/20" : "border-blue-500/20";
  const dotColor = accent === "purple" ? "bg-purple-400" : "bg-blue-400";
  const labelColor = accent === "purple" ? "text-purple-300" : "text-blue-300";

  return (
    <div
      onMouseEnter={() => onHoverChange(side)}
      onMouseLeave={() => onHoverChange(null)}
      tabIndex={0}
      className={`relative rounded-xl border bg-[#0A0A0A]/60 p-4 transition-all duration-500 ${
        isHighlighted ? borderActive + " shadow-lg" : borderIdle
      } ${dimmed ? "opacity-45" : "opacity-100"}`}
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
          {isDone ? (
            <Check className={`w-3.5 h-3.5 ${labelColor}`} />
          ) : (
            <div
              className={`w-1.5 h-1.5 rounded-full ${dotColor} ${
                isLive ? "animate-pulse" : "opacity-50"
              }`}
            />
          )}
          <span className={`text-[10px] uppercase tracking-widest font-medium ${isLive ? labelColor : "text-gray-500"}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="h-24 sm:h-28 w-full">
        <canvas ref={canvasRef} className="w-full h-full block" aria-label={`${label} waveform`} />
      </div>
    </div>
  );
}
