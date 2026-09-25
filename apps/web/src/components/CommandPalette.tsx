"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Mic,
  Sparkles,
  Zap,
  Shield,
  ExternalLink,
  Play,
  CreditCard,
  FileText,
  BookOpen,
  Layers,
  Command,
} from "lucide-react";

type Cmd = {
  id: string;
  label: string;
  hint?: string;
  mono?: string;
  icon: React.ReactNode;
  keywords: string[];
  action: () => void;
};

/**
 * CommandPalette — Cmd+K shared by human and agent (WebMCP).
 *
 * The thesis: every human action has an agent twin. This palette lists the
 * same affordances WebMCP exposes as tools, so a human typing "vocalize rachel"
 * and an agent calling `vocalize({ voiceId, text })` meet at the same surface.
 * Powered by the live catalog + a brief → instrument handoff.
 */
export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Global hotkey: Cmd+K / Ctrl+K — also `/` when not typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if ((mod && e.key.toLowerCase() === "k") || (!mod && e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement))) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActive(0);
    // focus next frame so dialog mount finishes
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const cmds: Cmd[] = useMemo(
    () => [
      {
        id: "discover",
        label: "Describe the voice you need",
        hint: "Brief → ranked grid · s/01–04",
        mono: "DISCOVER",
        icon: <Search className="h-3.5 w-3.5" />,
        keywords: ["marketplace", "discover", "brief", "match", "find", "search"],
        action: () => router.push("/marketplace"),
      },
      {
        id: "generate",
        label: "Generate with your script",
        hint: "Workspace · pick voice → preview",
        mono: "VOCALIZE",
        icon: <Mic className="h-3.5 w-3.5" />,
        keywords: ["generate", "workspace", "vocalize", "tts", "preview", "script"],
        action: () => router.push("/generate"),
      },
      {
        id: "developers",
        label: "One POST to vocalize — for agents",
        hint: "/api/agents/vocalize · x402 · 70/30 settle",
        mono: "AGENT",
        icon: <Zap className="h-3.5 w-3.5" />,
        keywords: ["api", "developers", "agent", "vocalize", "x402", "curl"],
        action: () => router.push("/developers"),
      },
      {
        id: "sell",
        label: "Record or import your voice",
        hint: "Studio · Studio-Archiv · 95/5 on x402",
        mono: "SELL",
        icon: <Sparkles className="h-3.5 w-3.5" />,
        keywords: ["sell", "contribute", "record", "studio", "import"],
        action: () => router.push("/sell"),
      },
      {
        id: "voice-rachel",
        label: "Try Rachel — instant demo",
        hint: "Platform voice · pay per use",
        mono: "VOICE",
        icon: <Play className="h-3.5 w-3.5" />,
        keywords: ["rachel", "demo", "voice", "platform", "demo-rachel"],
        action: () => router.push("/generate?voiceId=demo-rachel"),
      },
      {
        id: "benchmarks",
        label: "How matching is measured",
        hint: "Jev vs GPT-4o-mini · six dims",
        mono: "BENCH",
        icon: <Layers className="h-3.5 w-3.5" />,
        keywords: ["benchmark", "rubric", "match", "eval", "jev", "gpt"],
        action: () => router.push("/benchmarks"),
      },
      {
        id: "buy-credits",
        label: "Buy credits for agents",
        hint: "Prepaid vocalize · Base",
        mono: "CREDITS",
        icon: <CreditCard className="h-3.5 w-3.5" />,
        keywords: ["credits", "buy", "pay", "top up"],
        action: () => router.push("/developers#credits"),
      },
      {
        id: "help",
        label: "Help & docs",
        hint: "Pricing · provenance · API",
        mono: "DOCS",
        icon: <BookOpen className="h-3.5 w-3.5" />,
        keywords: ["help", "docs", "guide", "faq"],
        action: () => router.push("/help"),
      },
      {
        id: "provenance",
        label: "Inspect provenance & trust",
        hint: "On-card · TxHash → chain",
        mono: "TRUST",
        icon: <Shield className="h-3.5 w-3.5" />,
        keywords: ["trust", "provenance", "chain", "tx", "hash", "verify"],
        action: () => router.push("/marketplace"),
      },
      {
        id: "llms-txt",
        label: "For agents: /llms.txt",
        hint: "5 tools · list_voices · vocalize",
        mono: "MCP",
        icon: <FileText className="h-3.5 w-3.5" />,
        keywords: ["agent", "mcp", "webmcp", "llm", "tool", "list_voices"],
        action: () => {
          window.open("/llms.txt", "_blank");
        },
      },
    ],
    [router]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return cmds;
    return cmds.filter((c) => {
      const hay = `${c.label} ${c.hint ?? ""} ${c.mono ?? ""} ${c.keywords.join(" ")}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [cmds, q]);

  const run = useCallback(
    (idx: number) => {
      const c = filtered[idx];
      if (!c) return;
      setOpen(false);
      setQ("");
      c.action();
    },
    [filtered]
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1.5 font-mono text-[11px] text-white/70 hover:border-[#D6FF2A]/30 hover:text-white transition-colors"
        aria-label="Open command palette (Cmd+K)"
      >
        <Command className="h-3 w-3" />
        <span className="hidden lg:inline">Cmd</span>K
        <span className="hidden xl:inline text-white/40">·</span>
        <span className="hidden xl:inline text-white/50">ask an agent</span>
      </button>
    );
  }

  return (
    <>
      {/* scrim */}
      <div className="fixed inset-0 z-[80] bg-[#0A0E1A]/60 backdrop-blur-[2px]" onClick={() => setOpen(false)} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="fixed left-1/2 top-[18vh] z-[81] w-[min(640px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#12161F] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        {/* phosphor + scan */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl border border-[#D6FF2A]/10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(214,255,42,0.08),transparent_60%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D6FF2A]/40 to-transparent" aria-hidden />

        <div className="relative flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-white/40" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(filtered.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                run(active);
              }
            }}
            placeholder="Describe the voice, or try “vocalize rachel”… (agent twin lives here)"
            className="min-w-0 flex-1 bg-transparent py-2 text-[14px] text-white placeholder:text-white/40 focus:outline-none"
            aria-label="Search commands"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 font-mono text-[10px] leading-none text-white/60">
            <span className="inline-flex h-3 w-3 items-center justify-center rounded-sm border border-white/20 text-[9px]">⌘</span>K
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="shrink-0 rounded-lg border border-white/10 bg-white/[0.06] px-2 py-1.5 text-xs text-white/60 hover:text-white transition-colors"
          >
            Esc
          </button>
        </div>

        <div className="max-h-[50vh] overflow-auto p-2" role="listbox" aria-label="Commands">
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="font-mono text-xs text-white/50">No twin for “{q}”.</p>
              <p className="mt-1 font-mono text-[11px] text-white/30">Try `brief: “warm narrator…”, voice, vocalize, API, record</p>
            </div>
          ) : (
            filtered.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(i)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  i === active ? "bg-[#D6FF2A] text-[#0A0E1A]" : "text-white hover:bg-white/[0.06]"
                }`}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-white ${
                    i === active ? "border-black/10 bg-black/10" : "border-white/10 bg-white/[0.06]"
                  }`}
                >
                  {c.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-medium leading-tight ${i === active ? "text-[#0A0E1A]" : "text-white"}`}>{c.label}</span>
                  {c.hint && (
                    <span className={`block truncate font-mono text-[11px] ${i === active ? "text-black/60" : "text-white/45"}`}>{c.hint}</span>
                  )}
                </span>
                {c.mono && (
                  <span
                    className={`hidden sm:inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.12em] ${
                      i === active ? "border-black/10 bg-black/[0.06] text-black/70" : "border-white/10 bg-white/[0.05] text-white/70"
                    }`}
                  >
                    {c.mono}
                  </span>
                )}
                {i === active && <ExternalLink className="h-3.5 w-3.5 opacity-60" />}
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[11px] text-white/40">
          <span>
            <span className="text-white/80">Human</span> and <span className="text-white/80">agent</span> twins · same affordances
          </span>
          <span className="hidden sm:inline">↑↓ navigate · ↵ run · WebMCP: 5 tools</span>
        </div>
      </div>
    </>
  );
}
