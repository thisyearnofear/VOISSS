"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowRight, Command, Zap } from "lucide-react";
import HomeStructuredData from "../components/HomeStructuredData";
import SplitBar from "../components/SplitBar";
import VoiceTerrain from "../components/VoiceTerrain";
import AsciiField from "../components/hero/AsciiField";
import HomePipelineScrub from "../components/home/HomePipelineScrub";
import { SignalRibbon } from "../components/listening/SignalRibbon";
import { VoiceAuditionRow } from "../components/listening/VoiceAuditionRow";
import { Button, Chip, Disclosure } from "../components/ui";
import { useListeningPlayback, useListeningRoom } from "../contexts/ListeningRoomContext";
import { useVoiceCatalog } from "../hooks/useVoiceCatalog";
import { pulseVoice } from "../lib/terrain-bus";
import { initTelemetry, flushNow } from "../lib/telemetry";

if (typeof window !== "undefined") {
  initTelemetry();
  window.addEventListener("popstate", flushNow);
}

const EXAMPLE_BRIEFS = ["Calm narration", "A warm welcome", "An energetic ad"];

export default function Home() {
  const router = useRouter();
  const { draft, updateDraft } = useListeningRoom();
  const playback = useListeningPlayback();
  const { query, voices } = useVoiceCatalog();
  const sampleVoices = voices.filter((v) => Boolean(v.sampleUrl)).slice(0, 3);
  const rippleTimer = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (rippleTimer.current) window.clearTimeout(rippleTimer.current);
    };
  }, []);
  const onBriefChange = (value: string) => {
    updateDraft({ brief: value.slice(0, 500) });
    if (rippleTimer.current) window.clearTimeout(rippleTimer.current);
    rippleTimer.current = window.setTimeout(() => pulseVoice("lift"), 550);
  };
  const goDiscover = (value: string) => {
    const q = value.trim();
    updateDraft({ brief: q });
    router.push(q ? `/marketplace?brief=${encodeURIComponent(q)}` : "/marketplace");
  };

  return (
    <main id="listening-main" className="lr-home">
      <HomeStructuredData />

      {/* ── Hero — the field itself. Pinned instrument: ascii + terrain + console ───── */}
      <section className="lr-home-hero lr-dark voisss-frame voisss-terrain-bg">
        <AsciiField word="VOISSS" density={0.44} />
        <VoiceTerrain />
        <div className="lr-hero-scrim" aria-hidden />
        {/* phosphor scan + lime hairline */}
        <div className="pointer-events-none absolute inset-0 rounded-[24px] border border-white/[0.06]" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D6FF2A]/40 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-0 rounded-[24px] opacity-[0.035]" style={{ background: "repeating-linear-gradient(to bottom, transparent 0 2px, rgba(255,255,255,0.9) 2px 3px)" }} aria-hidden />

        <div className="lr-hero-inner">
          <div className="lr-home-copy">
            <small className="lr-eyebrow voisss-masked-reveal inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6FF2A]/20 bg-[#D6FF2A]/10 px-2 py-1 font-mono text-[10px] font-bold tracking-[0.14em] text-[#0A0E1A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0A0E1A] animate-pulse" /> LICENSED SIGNAL
              </span>
              <span className="hidden sm:inline font-mono text-[11px] tracking-wide text-white/45">· Base 8453 · 70/30 on-chain</span>
            </small>
            <h1 className="lr-h1 voisss-masked-reveal voisss-masked-reveal-delay-1">
              Find the voice your project needs.
            </h1>
            <p className="lr-lede voisss-masked-reveal voisss-masked-reveal-delay-2">
              Describe the sound. Hear the options. Try your words.
              <span className="hidden sm:inline"> Every action has an agent twin (</span>
              <span className="hidden sm:inline font-mono text-xs text-white/50">Cmd+K</span>
              <span className="hidden sm:inline">).</span>
            </p>

            <form
              className="lr-hero-console voisss-masked-reveal voisss-masked-reveal-delay-3 voisss-specular"
              onSubmit={(e) => {
                e.preventDefault();
                goDiscover(draft.brief);
              }}
            >
              <label htmlFor="home-brief" className="lr-label">
                What should it sound like?
              </label>
              <div className="lr-hero-console-row">
                <input
                  id="home-brief"
                  type="text"
                  className="lr-input"
                  value={draft.brief}
                  onChange={(e) => onBriefChange(e.target.value)}
                  placeholder="warm narrator for a sleep app, unhurried"
                  maxLength={500}
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button type="submit">
                  Find a voice <ArrowRight className="w-4 h-4" aria-hidden />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[10px] tracking-wide text-white/30">try</span>
                {EXAMPLE_BRIEFS.map((example) => (
                  <Chip key={example} onClick={() => goDiscover(example)}>
                    {example}
                  </Chip>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("pipeline-scrub");
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-white/60 hover:text-white transition-colors"
                >
                  <Command className="h-3 w-3" />K for agents
                </button>
              </div>
            </form>

            <p className="lr-quiet">Listen to catalog samples. No account needed. <span className="voisss-phosphor text-xs">70/30</span> split is on-chain.</p>
          </div>

          <section
            className="lr-audition lr-hero-audition voisss-masked-reveal voisss-masked-reveal-delay-2 voisss-container-lines"
            aria-label="Listen to voices"
          >
            <header className="lr-audition-head">
              <h2>Start by listening</h2>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D6FF2A] shadow-[0_0_8px_rgba(214,255,42,0.6)] animate-pulse" />
                Catalog samples
              </span>
            </header>
            <SignalRibbon playing={playback.status === "playing"} />
            {query.isLoading && <p className="lr-quiet" role="status">Loading voices…</p>}
            {query.isError && (
              <p className="lr-error-text" role="status">
                Voices could not be loaded. <Chip onClick={() => void query.refetch()}>Retry</Chip>
              </p>
            )}
            {!query.isLoading && !query.isError && sampleVoices.length === 0 && (
              <p className="lr-quiet">No catalog samples are available right now.</p>
            )}
            {sampleVoices.map((voice) => (
              <VoiceAuditionRow key={voice.id} voice={voice} />
            ))}
            <p className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-white/30">
              <Zap className="h-3 w-3 text-[#D6FF2A]" /> every preview lifts the field — <span className="text-white/50">terrain_bus → pulseVoice(‘lift’)</span>
            </p>
          </section>
        </div>
      </section>

      {/* ── Scroll instrument: s/01→04 scrub (300vh sticky) ─────────────── */}
      <div id="pipeline-scrub">
        <HomePipelineScrub />
      </div>

      <div className="lr-wrap">
        <section className="lr-home-proof" data-reveal>
          <h2>Find the fit. Keep the context.</h2>
          <div className="lr-entries">
            <Link className="lr-entry voisss-specular voisss-specular-light" href="/marketplace" data-reveal data-reveal-delay="1">
              <h3>For your next project</h3>
              <p>Describe the voice in plain English, hear ranked matches with reasons, then carry your pick into the workspace to try your own words. Drag cards past 60% to inspect chain.</p>
              <span className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-[#0A0E1A] bg-[#D6FF2A] rounded-full px-2.5 py-1">Open the loom →</span>
            </Link>
            <Link className="lr-entry voisss-specular voisss-specular-light" href="/developers" data-reveal data-reveal-delay="2">
              <h3>For your application</h3>
              <p>One POST to /api/agents/vocalize. OpenAPI spec, x402 micropayments, and voices licensed for programmatic use. Cmd+K is the human twin of WebMCP.</p>
              <span className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-white/70 border border-white/10 rounded-full px-2.5 py-1">API · 1 micro-USDC/char →</span>
            </Link>
          </div>
          <p className="lr-quiet">
            Have a voice worth licensing? <Link href="/sell" style={{ color: "var(--lr-accent)" }}>Contributors record or import in the Studio →</Link>
          </p>
        </section>

        <Disclosure title="On-chain economics" data-reveal>
          <div className="lr-legacy-inset voisss-hud-frame">
            <div className="pointer-events-none absolute inset-0 rounded-[16px] opacity-[0.35]" style={{ background: "repeating-linear-gradient(to bottom, transparent 0 2px, rgba(255,255,255,0.25) 2px 3px)" }} aria-hidden />
            <div className="relative grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4" data-reveal>
                <h4 className="font-display font-bold text-white">License purchases</h4>
                <SplitBar variant="license" />
                <p className="mt-2 font-mono text-xs leading-relaxed text-white/50">Split at purchase time, on-chain. The proportion is a contract constant — <span className="voisss-phosphor">platformFeeBps 3000</span> — not a promise.</p>
                <p className="mt-2 font-mono text-[11px] text-white/30">verify: VoiceLicenseMarket.sol · Base 8453 · <span className="voisss-phosphor">70/30</span></p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4" data-reveal data-reveal-delay="1">
                <h4 className="font-display font-bold text-white">x402 recording sales</h4>
                <SplitBar variant="x402" />
                <p className="mt-2 font-mono text-xs leading-relaxed text-white/50">The better deal for creators — <span className="voisss-phosphor">platformFeePercent 5</span> in VoiceRecords.sol, so 95% of every access payment is theirs.</p>
                <p className="mt-2 font-mono text-[11px] text-white/30">settle pulse: <span className="text-white/60">pulseVoice(‘settle’) sweeps field 70/30</span></p>
              </div>
            </div>
          </div>
        </Disclosure>

        <footer className="lr-home-footer">
          <Link href="/help">Help</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/sell">Contributors</Link>
          <Link href="/developers">Developers</Link>
          <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 font-mono text-xs text-white/30">
            <Command className="h-3 w-3" />K — agent + human palette
          </span>
        </footer>
      </div>
    </main>
  );
}
